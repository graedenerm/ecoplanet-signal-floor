# Signal Floor

Signal Floor is ecoplanet's internal play-money prediction market for company questions, business signals, rumors, and fun bets.

This repo is now shaped for **Live Beta v1**:

- Static frontend deployable on Vercel
- Supabase Auth username/password accounts
- Server-side username signup endpoint for already-confirmed Supabase Auth users
- Supabase Postgres tables, RLS policies, and RPCs
- Admin-only resolution queue and user desk list
- Public play-money leaderboard via a controlled RPC
- Server-backed market trades, market creation, resolution, and slot rewards

## Local Run

Open `index.html` directly for a quick local check, or generate the runtime config first:

```bash
npm run build
```

Then open `index.html`.

## Vercel Deploy

Use Vercel with the repository connected to GitHub.

Required environment variables:

```txt
SIGNAL_FLOOR_MODE=live
SIGNAL_FLOOR_SUPABASE_URL=https://dzvhpswsykgatbofaqzi.supabase.co
SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN=signalfloor.local
```

`SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY` must be added as a Vercel server environment variable only. It is used by `/api/signup` to create username/password users without email confirmation.

Build command:

```bash
npm run build
```

Output directory:

```txt
.
```

## Supabase

Supabase project details, SQL run order, and auth settings live in `SUPABASE_SETUP.md`.

For an already initialized project, run:

1. `supabase-repair.sql`
2. `supabase-health-check.sql`
3. `supabase-reseed-markets.sql` only if you want to reset markets
4. `supabase-seed-suggestions.sql`

## Repo Hygiene

Recommended first GitHub setup:

```bash
git branch -M main
git add .
git commit -m "Prepare Signal Floor live beta"
git remote add origin https://github.com/<org-or-user>/signal-floor.git
git push -u origin main
```

Keep `.env.local` local only. Do not commit service-role keys.

## Product Guardrails

- Play-money only for v1
- Company-internal only
- Admin resolves markets and can see the user desk list
- Normal users use public display names and avatars
- Trades and token-changing rewards should happen through Supabase RPCs, not browser-only math
- Sensitive markets should remain admin-reviewable and voidable
