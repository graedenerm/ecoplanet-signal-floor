# Signal Floor Supabase Setup

## Project

- Project URL: `https://dzvhpswsykgatbofaqzi.supabase.co`
- Publishable key: stored in `.env.local`

The publishable key is safe for frontend usage. Do not paste the service role key into browser code.

## Dashboard Settings

Use these settings:

- Enable Data API: on
- Automatically expose new tables and functions: off
- Enable automatic RLS: on

Also enable anonymous auth:

1. Go to Authentication.
2. Open Providers.
3. Enable Anonymous Sign-ins.

For username/password accounts:

1. Go to Authentication.
2. Open Providers, then Email.
3. Enable Email provider.
4. Disable Confirm email for the prototype so new users can log in immediately.

The app turns a username like `rumor_queen` into an internal auth email like `rumor_queen@signalfloor.local`. Users never need to see or type the email.

## Vercel Environment

Add these variables in Vercel Project Settings -> Environment Variables:

```txt
SIGNAL_FLOOR_MODE=live
SIGNAL_FLOOR_SUPABASE_URL=https://dzvhpswsykgatbofaqzi.supabase.co
SIGNAL_FLOOR_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SIGNAL_FLOOR_AUTH_EMAIL_DOMAIN=signalfloor.local
```

Never put the Supabase service-role key in Vercel frontend variables.

## Database

1. Open Supabase SQL Editor.
2. For a fresh empty project, paste all of `supabase-schema.sql`.
3. Run it.

This creates the production tables, RLS policies, trading RPCs, admin resolution RPC, seed markets, and one invite code.

## Repair A Partial Setup

If Supabase is already partly initialized, do not keep rerunning the full schema. Run:

```sql
-- Paste and run supabase-repair.sql
```

Use this when you see errors like:

- `type "market_category" already exists`
- `permission denied for table markets`
- `function public.market_probability(markets) does not exist`
- `Could not find the function public.create_profile_for_current_user(...)`

The repair script is idempotent: it creates missing pieces, replaces broken RPCs, grants table/function permissions, restores RLS policies, and reloads the Supabase API schema cache.

It also adds Live Beta RPCs for:

- `public.update_my_profile`
- `public.public_leaderboard`
- `public.claim_slot_reward`

To verify the repair, run:

```sql
-- Paste and run supabase-health-check.sql
```

The first row should show all `true`, and the grants result should include `SELECT` on `markets` for `authenticated`.

## Replace Seed Markets

If the old generic prototype markets already exist in Supabase, run:

```sql
-- Paste and run supabase-reseed-markets.sql
```

Run `supabase-repair.sql` first if the project was partially initialized. Use reseeding only during prototype setup. It clears existing markets, positions, trades, and market history, but keeps profiles.

## Seed Suggestions

The full Suggestions queue lives separately from published markets.

Run:

```sql
-- Paste and run supabase-seed-suggestions.sql
```

This fills `public.market_suggestions` with the binary, multiple-choice, fun, and HR Spicy suggestion queue.

## Make Yourself Admin

After you join the app once and create a profile, find your user id:

```sql
select id, display_name, created_at
from public.profiles
order by created_at desc;
```

Then run:

```sql
update public.profiles
set is_admin = true
where id = '<your-profile-id>';
```

Only that profile should have `is_admin = true`.

## Fix Missing Profile RPC

If the app shows:

```txt
Could not find the function public.create_profile_for_current_user(...)
```

Run:

```sql
-- Paste and run supabase-fix-profile-rpc.sql
```

Then reload the app.

## Intended Account Model

- Normal employees: anonymous Supabase Auth user plus pseudonymous profile.
- Founders: same as normal employees.
- You: one pseudonymous profile with `is_admin = true`.
- No one can switch into other users in production.

## Next Implementation Step

The current app is still a static local prototype. The next code step is to migrate the UI to a Supabase-backed app:

- sign in anonymously
- create/load one profile
- read markets from Supabase
- place trades via `public.place_trade`
- resolve markets via `public.resolve_market` only for admin
