# Signal Floor — Claude orientation

This file is auto-loaded by Claude Code when started in this folder. Read it first; it gets you running on this codebase.

## What this project is

**Signal Floor** is an internal play-money prediction market for ecoplanet — about 30–50 colleagues betting credits on questions ("Will the SDR team book 10+ discos this week?"). 
Originally built in Codex as a Live Beta v1, deployed via Vercel + Supabase. Personal project, not corporate, owned by Michaela.

It's a **fun company tool, not a financial product.** Read the priorities section below before "improving" anything.

## User priorities (load-bearing — do not ignore)

- **FUN > correctness > security.** The project owner has explicitly chosen this trade-off. Don't push back on math precision (the AMM mints small amounts of credits), attack-surface concerns, or theoretical exploits. ~30–50 trusted colleagues.
- **Easygoing UX is sacred.** Confusing UI = bad. Don't treat this as a financial product in code reviews.
- **Confetti is sacred.** Two effects exist: `launchMarketConfetti` (celebration on bet creation) and `launchExitSadness` (falling emoji on `mouseleave` / `beforeunload`). The owner calls *both* "confetti" and treats them as core delight, not engagement-bait. Do not remove either.
- **Ship fast, iterate often.** Owner pushes to `main` after each batch and tests live. Long planning passes are not welcomed; small, visible changes are.

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS — no framework, no build step (except `scripts/build-config.cjs` which writes `config.js` from env vars).
- **`app.js` is one ~3000-line file.** State management, rendering, Supabase calls, animations all interleaved. The owner is aware; we have not refactored it.
- **Supabase** Postgres with RLS for everything. Auth uses synthetic emails `<username>@signalfloor.local` (the user types only a username; the `/api/signup` Vercel endpoint creates the auth user with `email_confirm: true` via the admin API). Frontend uses the **publishable** key only.
- **Vercel** serves the static frontend and a single `/api/signup` serverless function. `SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY` is server-only.
- **CDN-loaded Supabase JS client** — see `<script src="...supabase-js@2">` at bottom of `index.html`.

## File layout (the bits that matter)

| Path | What |
|---|---|
| `index.html` | All views and dialogs. Single page. |
| `app.js` | All client logic. Includes Supabase calls, render functions, gamification, confetti. |
| `styles.css` | Single stylesheet. CSS variables in `:root` define the dark theme. |
| `api/signup.js` | Only server endpoint. Creates auth users with service role key. |
| `scripts/build-config.cjs` | Reads env vars, writes `config.js` for browser. |
| `scripts/smoke-test.cjs` | Optional Playwright smoke test — not in CI. |
| `supabase-*.sql` | Migrations. **Run order matters** — see `docs/DATABASE.md`. |
| `config.js` | Generated. Gitignored. |
| `.env.local` | Gitignored. Has Supabase URL + publishable key. |
| `docs/FEATURES.md` | Feature-by-feature reference. |
| `docs/DATABASE.md` | Schema, RLS policies, RPCs, SQL run order. |
| `docs/DEPLOYMENT.md` | Git → Vercel + how to apply SQL changes. |
| `README.md` | Brief human-facing overview. |
| `SUPABASE_SETUP.md`, `LIVE_BETA_HANDOFF.md` | Older setup notes — useful but partly superseded by docs/. |

## How to ship a change

1. Edit code (HTML/CSS/JS).
2. `npm run check` — syntax-checks `app.js` and `api/signup.js`.
3. `git add` + commit + push to `main`. **Vercel auto-deploys** within ~1–2 min.
4. If your change adds/modifies a Supabase RPC or table, write a new `supabase-<name>.sql` file. **Tell the user to paste it into the Supabase SQL Editor and run it** — there is no migration runner. SQL files are designed to be idempotent (`create or replace function`, `if not exists`, `drop policy if exists`).

**Order matters:** when a change touches both JS calls and a SQL function (e.g., renaming RPC params), tell the user to run the SQL *before* you push the JS, otherwise live trades break in the meantime.

## Quirks worth knowing about

- **Trade math is not LMSR.** It's a constant-pool AMM with hard 5%/95% price clamps. Buying YES on a 0.50 market pushes the price up to ~0.55, which means your shares are immediately "worth" more than you paid. This shows as a positive net-worth bump after every trade. **It's not a bug.** The owner knows; the FAQ in the tutorial explains it for end users.
- **`market_history` rows** are written by a trigger on insert + by `place_trade`. Do not synthesize history points client-side — that bug existed before and caused the chart to zigzag. `remoteMarketToLocal` returns `history: []`; bootstrap appends real rows.
- **Display names are not unique.** Two users can both pick "ela". The Pulse feed shows avatar + display_name + a `(you)` badge for current-user trades. Do not enforce display-name uniqueness — the owner explicitly accepted the ambiguity.
- **localStorage state** holds gamification (XP, streaks, badges, claimed missions, slot history), the `signal-floor-intro-hidden` default-tab flag, and per-user `netWorthHistory`. Demo-mode state also lives there. Live-mode users' positions/trades come from Supabase but XP is local-only.
- **Slot machine** triggers on 60s of inactivity. Server-side reward via `claim_slot_reward()` RPC. There's *no* server-side cooldown — the 60s client throttle is the only rate limit. The owner explicitly accepted this.
- **Admin tab** is hidden for non-admins in live mode. Currently only Michaela has `is_admin = true`.
- **OneDrive + node_modules** lives in this folder. If the user reports weird build issues, this can be the cause.

## How the user works with you

- They want short, concrete updates — not long planning prose.
- Don't run code reviews unless asked. Don't audit security unless asked. Don't propose Next.js rewrites.
- "Got it, push" usually means: edit, commit, push. They iterate fast.
- They run SQL manually in the Supabase SQL Editor when you tell them which file. Always say which file.
- They will ping you with screenshots / specific contrast issues / "this colleague said X". Treat the colleague's report as ground truth and look for the literal CSS/JS line that's broken — usually a leftover light-theme value (`white`, `#ffffff`, `var(--ink)` used as a *background*).
- They love tooltips, dark mode, pill-style filter buttons, quick-action cards on the Start view.
- The intro on the Start tab can be dismissed via the `×` in the corner. After dismissal the default tab becomes Overview (`data-view="list"`); Start stays accessible and still shows the intro.

## Memory hygiene

If you want to leave notes for the *next* Claude session in this folder, append them to this CLAUDE.md or add files under `docs/`. Don't put session-specific TODOs here — those go in tasks. This file is for durable orientation only.
