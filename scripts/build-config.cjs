const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const localEnvPath = path.join(root, ".env.local");

function loadLocalEnv() {
  if (!fs.existsSync(localEnvPath)) return;
  const lines = fs.readFileSync(localEnvPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [rawKey, ...rawValue] = trimmed.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function env(...keys) {
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }
  return "";
}

loadLocalEnv();

const config = {
  mode: env("SIGNAL_FLOOR_MODE", "APP_MODE") || "demo",
  supabaseUrl: env("SIGNAL_FLOOR_SUPABASE_URL", "SUPABASE_URL", "VITE_SUPABASE_URL"),
  supabasePublishableKey: env(
    "SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY"
  ),
  authEmailDomain: env("SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN") || "signalfloor.local",
};

if (config.mode === "live" && (!config.supabaseUrl || !config.supabasePublishableKey)) {
  throw new Error("Live mode requires SIGNAL_FLOOR_SUPABASE_URL and SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY.");
}

const output = `window.SIGNAL_FLOOR_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(path.join(root, "config.js"), output);
console.log(`Wrote config.js for ${config.mode} mode.`);
