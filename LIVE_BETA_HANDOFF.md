# Signal Floor Live Beta Handoff

## Current Architecture

Signal Floor is a lightweight static frontend deployed as plain HTML/CSS/JavaScript.

- `index.html`: app shell, account dialog, market/trade/slot dialogs
- `styles.css`: ecoplanet-flavored UI styling
- `app.js`: frontend state, rendering, Supabase client calls, trading UX
- `scripts/build-config.cjs`: creates `config.js` from environment variables for deploys
- `vercel.json`: Vercel static deployment config and basic security headers
- `package.json`: build/check/smoke scripts

Backend:

- Supabase Auth for username/password accounts
- Supabase Postgres for profiles, markets, market history, positions, trades, ledger, suggestions
- Supabase RPCs for profile setup, trading, resolution, leaderboard, and slot rewards
- Row Level Security enabled on app tables

The app still keeps some UI-only gamification state in `localStorage`:

- XP
- streaks
- badges
- mission claim display state

Token-changing live actions should be Supabase-backed.

## Supabase URL And Settings

Project URL:

```txt
https://dzvhpswsykgatbofaqzi.supabase.co
```

Frontend uses the Supabase publishable key only. Never expose the service-role key in browser code or Vercel frontend variables.

Dashboard settings:

- Enable Data API: on
- Automatically expose new tables and functions: off
- Enable automatic RLS: on
- Authentication -> Providers -> Email: on
- Authentication -> Providers -> Email -> Confirm email: off for Live Beta speed

Username handling:

- Users type a username.
- App converts it to an internal email: `<username>@signalfloor.local`.
- Users only see username/display name/avatar in the UI.

## SQL Files And Run Order

For the existing partially initialized project, use this order:

1. `supabase-repair.sql`
2. `supabase-health-check.sql`
3. `supabase-reseed-markets.sql` only if you want to reset markets/trades/positions/history
4. `supabase-seed-suggestions.sql`

Do not rerun `supabase-schema.sql` against the current project unless you intentionally start from an empty database.

Important RPCs:

- `create_profile_for_current_user(text)`
- `update_my_profile(text, text)`
- `public_leaderboard()`
- `claim_slot_reward()`
- `place_trade(uuid, trade_side, numeric)`
- `resolve_market(uuid, resolution_result)`

## Known Product Decisions

- Live Beta v1 is play-money only.
- The company wants competitiveness and leaderboard dynamics.
- The app should feel sleek, simple, and fun, not like a finance terminal.
- Users create username/password accounts and pick a display name plus avatar.
- You are the only admin.
- Admin can see the user desk list.
- Normal users see the leaderboard through a controlled RPC, not by querying the full profiles table directly.
- Founders should not get privileged identity visibility unless you intentionally make them admins.
- Spicy/company-rumor markets are allowed in the game, but admin must be able to resolve, void, and clean up bad markets.
- Slack/Notion market generation remains paste-based for now; real connectors require a separate privacy review.

## Deployment Steps

1. Create a GitHub repository, recommended name: `signal-floor`.
2. Push this repo to GitHub.
3. Create a Vercel project from the GitHub repo.
4. Use:

```txt
Framework Preset: Other
Build Command: npm run build
Output Directory: .
```

5. Add Vercel environment variables:

```txt
SIGNAL_FLOOR_MODE=live
SIGNAL_FLOOR_SUPABASE_URL=https://dzvhpswsykgatbofaqzi.supabase.co
SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN=signalfloor.local
```

6. Run `supabase-repair.sql` in Supabase SQL Editor.
7. Run `supabase-health-check.sql` and confirm all function/table checks return true.
8. Create your new username/password account in the app.
9. In Supabase SQL Editor, make that profile admin:

```sql
update public.profiles
set is_admin = true
where display_name = '<your display name>';
```

10. Add the Vercel production URL to Supabase Auth allowed redirect/site URLs if you later add password reset or OAuth.

## GitHub Repo Setup

Recommended first commit flow:

```bash
git branch -M main
git add .
git commit -m "Prepare Signal Floor live beta"
git remote add origin https://github.com/<org-or-user>/signal-floor.git
git push -u origin main
```

Suggested repo settings:

- Private repository for now
- Default branch: `main`
- Require pull requests before merging once the first live deploy is stable
- Enable GitHub Actions
- Protect `main` after the initial push

## Security And RLS Notes

Current posture:

- RLS is enabled on all main app tables.
- Normal users can read markets, market history, suggestions, and their own private rows.
- Admin users can read the full profiles table.
- Normal users cannot directly query all profiles.
- Leaderboard data is exposed through `public_leaderboard()`.
- Trades run through `place_trade()`.
- Market resolution runs through `resolve_market()` and checks `current_user_is_admin()`.
- Slot rewards run through `claim_slot_reward()` so the server decides the reward.

Remaining hardening before a wider rollout:

- Add password reset flow.
- Add invite-code gate if the URL might leak outside the company.
- Move XP, streaks, badges, and missions into Supabase.
- Add admin audit log UI for trades, payouts, resolutions, and profile changes.
- Add admin market moderation: hide, edit, close, void, and feature markets.
- Add rate limits for market creation and slot reward attempts.
- Review every security-definer RPC before real-money discussions.

## Next Roadmap

Live Beta v1:

- Deploy on Vercel.
- Finish Supabase repair/health check.
- Make your new account admin.
- Invite 5-8 friendly internal users.
- Watch auth, trading, leaderboard, and market creation for one day.

Live Beta v1.1:

- Server-side XP/streaks/badges.
- Admin moderation dashboard.
- Password reset.
- Market activity feed.
- Better onboarding copy for non-betting users.

Live Beta v2:

- Approval queue for sensitive markets.
- Slack/Notion proposal ingestion with explicit scope and privacy rules.
- Analytics dashboard for engagement and unresolved market quality.
- Optional weekly play-money budgets managed by admin.
