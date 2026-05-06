# Signal Floor — Feature reference

Every user-facing feature, what it does, where it lives in code, and the data it touches. Use this as a lookup; jump to the section for whatever you're editing.

---

## Auth

Username + password. Internally stored as `<username>@signalfloor.local` in `auth.users.email`. Users never see the email.

- **Signup flow:** UI → `POST /api/signup` (server endpoint, uses service-role key) → calls Supabase admin API to create user with `email_confirm: true` → frontend then `signInWithPassword` → `create_profile_for_current_user` RPC creates the row in `public.profiles` with starting bankroll 1000 and an `initial_grant` ledger entry.
- **Login:** standard `signInWithPassword`.
- **Sign out:** `auth.signOut()` + `window.location.reload()`. Toasts errors if it fails.
- **Header buttons** swap based on auth state: Account (signed-out) / Sign out (signed-in) / New persona (demo only) / How it works / Create bet.
- **No password reset.** Lost passwords = admin deletes the user in Supabase Auth dashboard and the user signs up again.

Code: `app.js:bootstrapSupabase`, `app.js:handleAuthSubmit`, `app.js:signOut`, `api/signup.js`.

---

## Bets (formerly "markets" — the rename was UI-only)

Each bet is one yes/no question with a constant-pool AMM. **Internal code still calls them `markets`** (table names, column names, RPC names, JS variable names like `state.markets`). Only user-facing strings say "bet".

### Browse

- **Bets tab** (`marketsView`) — full cards with sparkline, current YES%, your position, BUY YES / BUY NO buttons. Renders via `renderMarketCard`.
- **Overview tab** (`listView`) — compact rows, tap to open the market-detail modal. Renders via `renderCompactList`. Search input + pill-style category filter buttons (All / Business / Rumor / Fun / People), each with its own active colour.

### Trade

- Click BUY YES / BUY NO on a card → opens `tradeDialog` → enter amount → confirm → calls `place_trade(p_market_id, p_side, p_amount)` RPC.
- The RPC: locks the market and the user row (`for update`), validates open status + bankroll, computes `trade_price = pool_ratio` clamped to 5–95%, decrements wallet, increments pool, upserts the position (one row per `(user, market, side)`), inserts a `trades` row, inserts a `market_history` row.
- After success, `refreshSupabaseData()` reloads profile, leaderboard, markets+history, user positions+trades, activity, hidden suggestions, and records a net-worth snapshot.

### Create

- Header **Create bet** button → opens `marketDialog` → user fills title, criteria, category, close date, initial YES %, liquidity → frontend validates lengths and future close date → direct `from("markets").insert(...)` (RLS check: creator_id = auth.uid()).
- A trigger (`markets_init_history`) inserts the initial `market_history` row automatically so the chart works on day zero.

### Resolve (admin)

- Admin tab (visible only with `profiles.is_admin = true`) lists every market with Resolve YES / NO / Void buttons.
- Calls `resolve_market(p_market_id, p_result)` RPC. YES/NO pays each winning share 1 credit. Void refunds everyone their original stake. Confirm dialog before submission.

### Market detail modal

Opened from the Overview compact list. Shows title, criteria, current YES%, sparkline, your position, Buy YES / Buy NO buttons that hand off to the existing trade dialog.

---

## Pulse — live activity feed

`radarView`. Shows the last 30 trades across the whole floor (everyone, not just you). Loaded via `recent_activity(p_limit)` RPC which joins `trades`, `profiles`, `markets`. Each row shows avatar + display name + `(you)` badge for your own trades + market title + price + time-ago.

Click a row → jumps to the Bets tab and scrolls to that market.

Fetched on bootstrap, after each trade refresh, and on tab activation.

---

## Rumors — anonymous wall

`rumorsView`. Pseudonymous wall for office whispers.

- Textarea + "Post anonymously" button. 5–500 chars.
- `rumors` table: `body`, `posted_by` (only the admin can read this column via RLS — non-admins go through the `public_rumors()` RPC which omits `posted_by`).
- Reverse-chrono list of rumors, no name shown.
- "Make this a bet" button on each rumor → pre-fills the create-bet dialog using `questionFromText()` to phrase it as a question.

Fetched on bootstrap and on tab activation.

---

## Suggestions

`suggestionsView`. A queue of preset bet ideas (loaded from a JS constant `MARKET_SUGGESTIONS`, *not* from `market_suggestions` table — that mismatch is intentional for v1). Filter by type (binary / multiple / spicy). Click "Launch bet" → calls `createMarket()` with the suggestion's pre-set title / criteria / close date.

**Admin can hide suggestions** via the Admin tab. Hidden suggestions go into `suggestion_blocklist` table (everyone can read, only admin can insert/delete). `filteredSuggestions()` filters them out everywhere.

---

## Start view (overview tab)

The landing tab. Shows:

1. **Intro hero** — welcome message + "Learn the rules" / "See bets" buttons. **`×` close button** in the top-right: clicking it sets `localStorage.signal-floor-intro-hidden=true` and switches the user to Overview. The Start tab itself stays available and intact; only the default-tab preference changes.
2. **01 / 02 / 03 strip** — explainer cards.
3. **Quick actions** — four big clickable cards: Create a bet, Post a rumor, Browse all bets, Floor activity. Wired via `[data-quick]` click handler.
4. **Closing soon** — top 5 open bets sorted by close date. Tap a row → jumps to that bet on the Bets tab.

`renderOverview()` populates "Current office consensus" (% YES + bet title) from the highest-volume open bet.

---

## Tutorial & FAQ

`tutorialView`. **Reachable via the "How it works" header button**, not via a top tab (the user wanted it less prominent). Visual walkthrough cards, example timeline, good-bets recipe, starter-bet click-to-launch buttons, FAQ accordion.

The FAQ explains the AMM math (a YES share at 0.60 pays 1.00 on YES resolution), pseudonymity, the slot machine, and the rumor wall.

---

## Portfolio

`portfolioView`. Shows:

1. **Net-worth chart** — line chart of the user's net worth over time. Samples are recorded in `localStorage` (per-user-id) on bootstrap and every refresh, throttled to 30s + same-value dedup. Renders via `drawNetWorthChart()`. Shows green if up vs the 1000 starting baseline, red if down. Fills in over time; new users see a "Place a few bets and your net-worth chart will fill in" placeholder until 2+ samples exist.
2. **Open positions list** — one row per `(market, side)` you hold. Shows market title, YES/NO tag, "Bet X · worth Y now", coloured P&L delta. Closed bets show "awaiting resolution".

---

## Wallet panel (sidebar)

- **Big number:** wallet balance.
- **In play:** current value of open positions at today's prices. Mark-to-market.
- **Net worth:** wallet + in play. Same number the leaderboard ranks by.
- Both have `?` info tooltips with hover explanations.
- **Weekly token drop button:** hidden for non-admins in live mode. Admin click → confirms → `admin_weekly_airdrop()` RPC pays everyone (rank 1 → 400, ranks 2–3 → 325, others → 300).

---

## Leaderboard (sidebar)

`renderLeaderboard()`. Ranks all profiles by `netWorth(user) = wallet + portfolio_value`. In live mode, the user list is sourced from `public_leaderboard()` RPC (top 100 by wallet_balance). The `#1` row shows "Momentum leader"; others show no subtitle.

---

## Slot machine ("idle bonus")

Triggers when no input event for **60 seconds** (`IDLE_BONUS_MS`). Skipped if any dialog is already open. Shows `idleBonusDialog` with a 3-reel slot UI.

- "Spin once" → reels animate → `claim_slot_reward()` RPC returns the actual reward → reels stop on a combo that visually matches (`finalSlotSymbols(reward)`).
- Server-side reward distribution: 0 (35%), 25 (30%), 50 (20%), 100 (10%), 250 (5%).
- **No server-side cooldown.** Theoretically exploitable, intentionally accepted.
- Reward credits the wallet; ledger entry uses reason `airdrop`.

---

## Confetti

Two effects, both treated as "confetti" by the owner. Do not remove.

- **`launchMarketConfetti()`** — celebration burst on bet creation, slot machine win, weekly drop. Coloured rectangles fall from the top.
- **`launchExitSadness()`** — falling emoji 👎 ☹️ 😢 💔 nooo on `mouseleave` (top edge) and `beforeunload`. Animation is fast enough (~900ms duration) that the emojis read as motion rather than legibly sad.
- **`scheduleRandomMobileConfetti()`** — every 30–90s when the layout is mobile (max-width: 768px), randomly fires one of the two effects (70% celebration / 30% emoji rain), skipped while a dialog is open.

---

## Gamification (client-side only)

XP, streaks, badges, daily missions. All in `localStorage` via `state.gamification`. Survives page reload because `bootstrapSupabase` copies the previous local game state onto the freshly-fetched profile.

- **Daily missions** are *hidden in live mode* (toggling the panel and claim button via `.hidden`). The plan was to move payouts to the server but it's not built yet.
- **Badges** still render. Examples: `rumor_hunter`, `market_maker` (now labelled "Bet maker"), etc.

---

## Hide-intro / default-tab preference

`localStorage.signal-floor-intro-hidden = "true"` does *one* thing: makes Overview the default tab on bootstrap (`activateView("list")`). The intro panel and quick-action strip on Start stay visible if the user navigates to Start. Set by clicking the `×` in the intro hero.

---

## Admin features

Visible only when `profiles.is_admin = true`.

- **Admin tab** — appears in nav. Shows: user-desk list (all profiles + balances), every market with Resolve YES / NO / Void buttons, and every active suggestion with a Delete button.
- **Weekly token drop** — replaces the disabled-in-live-mode airdrop button. Calls `admin_weekly_airdrop()` RPC.
- **Resolve confirmation** — every Resolve action prompts the admin first.
- **Hide suggestion** — adds a row to `suggestion_blocklist`. Hidden globally for everyone.
