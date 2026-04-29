function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function signup(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }

  const supabaseUrl = process.env.SIGNAL_FLOOR_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authEmailDomain = process.env.SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN || "signalfloor.local";

  if (!supabaseUrl || !serviceRoleKey) {
    json(res, 500, { error: "Signup endpoint is missing Supabase server environment variables." });
    return;
  }

  let payload;
  try {
    payload = await readBody(req);
  } catch {
    json(res, 400, { error: "Invalid request body." });
    return;
  }

  const username = normalizeUsername(payload.username);
  const password = String(payload.password || "");
  const displayName = String(payload.displayName || username || "Signal Desk").trim().slice(0, 40);
  const avatar = String(payload.avatar || "?").trim().slice(0, 4);

  if (username.length < 3) {
    json(res, 400, { error: "Pick a username with at least 3 characters." });
    return;
  }

  if (password.length < 6) {
    json(res, 400, { error: "Password needs at least 6 characters." });
    return;
  }

  const email = `${username}@${authEmailDomain}`;

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        display_name: displayName,
        avatar_seed: avatar,
      },
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = result.msg || result.message || result.error || "Could not create account.";
    json(res, response.status, {
      error:
        /already|registered|exists/i.test(message)
          ? "This username already exists. Switch to Log in, or delete the test user in Supabase Authentication -> Users."
          : message,
    });
    return;
  }

  json(res, 200, { email, username });
};
