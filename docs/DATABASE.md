# Signal Floor — Database reference

Supabase Postgres. RLS is enabled on every public table. Privileged operations go through SECURITY DEFINER RPCs. Frontend uses the publishable (anon) key only; the service-role key lives server-side in `/api/signup`.

---

## SQL files and run order

There is **no migration runner.** The user runs SQL files manually in the Supabase SQL Editor. Files are designed to be idempotent — safe to re-run.

### For a fresh project
1. `supabase-schema.sql` — the original full schema. Use only if starting from an empty database.

### For an already-initialized project (Michaela's actual flow)
Run in this order. Each is idempotent and additive.

| Order | File | What it does |
|---|---|---|
| 1 | `supabase-repair.sql` | Idempotent recreation of types, tables, functions, grants, policies. Run after most schema changes. |
| 2 | `supabase-fix-trade-rpcs.sql` | Renames `place_trade` and `resolve_market` parameters with `p_` prefix to fix "column reference 'market_id' is ambiguous". |
| 3 | `supabase-add-admin-airdrop.sql` | `admin_weekly_airdrop()` RPC. |
| 4 | `supabase-add-rumors-and-activity.sql` | `rumors` table, `public_rumors()` RPC, `recent_activity()` RPC. |
| 5 | `supabase-add-suggestion-blocklist.sql` | `suggestion_blocklist` table. |
| 6 | `supabase-add-market-history-trigger.sql` | `markets_init_history` trigger + backfill so user-created markets get their initial history row. |
| 7 | `supabase-security-hardening.sql` | Adds `search_path` to `touch_updated_at` and `market_probability` (Supabase Security Advisor warnings). |

Optional / situational:
- `supabase-reseed-markets.sql` — wipe and reseed seed markets. Destructive (clears markets, positions, trades, history). Use only during prototype setup.
- `supabase-seed-suggestions.sql` — seeds the `market_suggestions` table (the table is mostly unused since the frontend reads from a JS constant; keep for future migration).
- `supabase-fix-profile-rpc.sql` — narrow fix for `create_profile_for_current_user` if it goes missing.
- `supabase-health-check.sql` — read-only sanity check. Returns `true` rows when the schema is healthy.

---

## Tables

### `profiles`
One row per auth user. Created via `create_profile_for_current_user(p_display_name)` on first sign-in.
- `id uuid pk` references `auth.users(id)`
- `display_name text 2..40 chars` — *not unique*, two users can pick the same name
- `avatar_seed text` — emoji or short string used as the avatar
- `is_admin boolean default false` — only Michaela has this set
- `wallet_balance numeric(12,2) default 1000`
- `created_at`, `updated_at`

### `markets`
One row per bet.
- `id uuid pk default gen_random_uuid()`
- `title text 10..220`
- `criteria text 20..1400`
- `category market_category enum` ('business', 'rumor', 'fun', 'people')
- `close_at timestamptz`
- `status market_status enum` ('open', 'resolved', 'void')
- `resolution resolution_result enum` ('yes', 'no', 'void')
- `creator_id uuid → profiles`
- `yes_pool, no_pool numeric` — AMM pools, default 500 each
- `volume numeric` — running total of trade amounts
- `resolved_at, resolved_by`

### `market_history`
Time-series of probability snapshots. Used to draw the sparkline.
- `id bigint pk identity`
- `market_id uuid → markets`
- `probability numeric(6,5)` strictly in (0, 1)
- `created_at`

Inserted by:
- The `markets_init_history` trigger on every new market.
- `place_trade()` RPC on every trade.

### `positions`
Holdings per `(user, market, side)`. Upsert-on-conflict.
- `(user_id, market_id, side)` unique
- `shares numeric(14,4)` — accumulated
- `cost numeric(12,2)` — total credits spent on this side

### `trades`
Audit log. One row per trade.
- `user_id, market_id, side, amount, shares, price, created_at`

### `ledger_entries`
Wallet history. Every change to `wallet_balance` should also add a ledger row (initial grant, trade, payout, refund, airdrop, admin_adjustment).
- `user_id, amount` (signed), `reason ledger_reason enum`, `market_id?, trade_id?, note, created_at`

### `invite_codes`
Unused at present (admin-only RLS). Available for future invite-gating.

### `market_suggestions`
Mostly unused — the frontend reads suggestions from the `MARKET_SUGGESTIONS` JS constant in `app.js`. Kept for future migration.

### `rumors`
Anonymous wall.
- `id uuid pk`
- `body text 5..500`
- `posted_by uuid → profiles` — visible only to admin via direct SELECT (RLS); non-admin reads go through `public_rumors()` RPC which omits this column.
- `created_at`

### `suggestion_blocklist`
Suggestion IDs (text) that the admin has hidden. Everyone can SELECT; only admin can INSERT/DELETE.

---

## RPCs (functions callable via PostgREST)

All `security definer`, all `set search_path = public`.

| RPC | Caller | What it does |
|---|---|---|
| `current_user_is_admin()` | any auth | Returns `profiles.is_admin` for the current user. Used in policies. |
| `create_profile_for_current_user(p_display_name)` | auth | Upsert profile row + initial_grant ledger entry. |
| `update_my_profile(p_display_name, p_avatar_seed)` | auth | Updates own profile. |
| `market_probability(market)` | any auth | Pure pool ratio `yes_pool / total`. |
| `public_leaderboard()` | any auth | Top 100 profiles by wallet_balance. Returns `(id, display_name, avatar_seed, wallet_balance, is_admin, created_at)`. |
| `claim_slot_reward()` | auth | Rolls a reward (0/25/50/100/250) and credits wallet. **No server-side cooldown.** |
| `place_trade(p_market_id, p_side, p_amount)` | auth | Atomically deducts wallet, updates pools, upserts position, inserts trade and history rows. |
| `resolve_market(p_market_id, p_result)` | admin | Pays out winners or refunds on void. |
| `admin_weekly_airdrop()` | admin | Pays every profile with rank-based bonuses. Returns total credits distributed. |
| `public_rumors(p_limit)` | any auth | Returns `(id, body, created_at)` only — hides `posted_by`. |
| `recent_activity(p_limit)` | any auth | Last N trades joined with display name and market title. Used by the Pulse feed. |

---

## RLS policies (simplified)

- **profiles** — read own + admin reads all. Update own display_name + avatar_seed.
- **markets** — auth can SELECT all and INSERT (with creator_id = auth.uid()). Only admin UPDATE.
- **market_history** — auth SELECT all.
- **positions** — auth SELECT own + admin SELECT all.
- **trades** — auth SELECT own + admin SELECT all.
- **ledger_entries** — auth SELECT own + admin SELECT all.
- **invite_codes** — admin only.
- **market_suggestions** — auth SELECT where `is_active`. Admin manages.
- **rumors** — auth INSERT (with posted_by = auth.uid()). Admin only SELECT/UPDATE/DELETE. Public reads go through `public_rumors()`.
- **suggestion_blocklist** — auth SELECT all (so the filter works for everyone). Admin only INSERT/DELETE.

---

## Triggers

- `profiles_touch_updated_at` — `before update`, sets `updated_at = now()`.
- `positions_touch_updated_at` — same.
- `markets_init_history` — `after insert on markets`, inserts the initial `market_history` row using `market_probability(new)`.

---

## Things to NOT do

- Don't enable email confirmation in the Auth dashboard. The fake `*.local` emails can't receive mail.
- Don't enforce display-name uniqueness — owner explicitly accepted duplicates.
- Don't migrate suggestions to load from the table without checking; the frontend constant is the source of truth.
- Don't add direct SELECT on `rumors` for non-admins — that's how anonymity is enforced.
- Don't add a server-side cooldown to `claim_slot_reward` unless asked.
