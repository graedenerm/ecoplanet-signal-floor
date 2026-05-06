# Signal Floor — Deployment

## How code reaches production

1. `git push` to `main` on GitHub.
2. **Vercel auto-deploys** — connected to the GitHub repo. ~1–2 minutes.
3. Build runs `npm run build`, which is `node scripts/build-config.cjs`. That writes `config.js` from environment variables.
4. Output directory is `.` — Vercel serves the static files directly.
5. `/api/signup.js` runs as a serverless function on every POST.

There's no test gate, no CI checks. `npm run check` (Node `--check` syntax-only) is for local sanity.

## Vercel environment variables (production)

Set under **Project Settings → Environment Variables**, scoped to Production / Preview / Development.

| Variable | What |
|---|---|
| `SIGNAL_FLOOR_MODE=live` | Switches the frontend out of demo mode. |
| `SIGNAL_FLOOR_SUPABASE_URL` | The Supabase project URL. Public. |
| `SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY` | Public anon key. Embedded in `config.js`. Safe in the browser. |
| `SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY` | **Server-only.** Never exposed to the browser. Used only inside `/api/signup.js`. |
| `SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN=signalfloor.local` | Synthetic email domain for username-based auth. |

After changing any env var, **trigger a redeploy** — env changes don't apply to existing deployments.

## How database changes reach production

Supabase has no migration runner in this project. SQL files in the repo root are run manually:

1. Open Supabase dashboard → **SQL Editor**.
2. Paste the contents of the `.sql` file.
3. Run.

All SQL files are idempotent — safe to re-run. See `docs/DATABASE.md` for the canonical run order.

**When a code change requires a SQL change** (e.g., new RPC, renamed parameter), the deploy order matters:
- If the JS calls a function that doesn't exist yet, trades fail.
- If the SQL is run but the JS still uses the old signature, trades fail differently.
- **Tell the user to run the SQL first, then push the JS.** Or the other way round if the change is JS-only-tolerant.

## Local development

You can open `index.html` directly from disk (`file:///`), but `/api/signup` won't work — it needs a server. For full local testing:

```bash
npm install        # only needed for the smoke-test playwright dep
npm run build      # writes config.js from .env.local
# then open index.html
```

`scripts/smoke-test.cjs` and `scripts/slot-smoke-test.cjs` are Playwright smoke tests for the create-bet dialog and the slot dialog. Optional. They expect Chrome at `C:/Program Files/Google/Chrome/Application/chrome.exe` — adjust if running elsewhere. They are NOT in CI.

## Domains and URLs

The deployed app is on a Vercel URL (`*.vercel.app`). If you set up a custom domain, update **Supabase → Authentication → URL Configuration → Site URL** and **Redirect URLs** so future password-reset / OAuth flows resolve correctly. Currently neither is wired up.

## Rolling back

Vercel deployments are versioned. If a push breaks production:
1. Vercel dashboard → **Deployments** → previous good build → **Promote to Production**.
2. Or `git revert <bad-commit>` + push.

Database changes are **not** automatically rolled back. If a SQL file caused damage, write a remediation SQL file and run it in the editor.

## Secrets and the `.gitignore`

`.gitignore` excludes:
- `.env.*` (except `.env.local.example`)
- `config.js` — generated at build time
- `node_modules/`, `.next/`, `dist/`, `.vercel/`

**Never commit** `.env.local`, `config.js` with the service-role key, or any file containing the service-role key. The publishable key is safe to commit if you ever needed to.
