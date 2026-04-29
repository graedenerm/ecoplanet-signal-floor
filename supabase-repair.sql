-- Signal Floor Supabase repair script.
-- Run this when the project is partially initialized and errors include:
-- - type "market_category" already exists
-- - permission denied for table markets
-- - function public.market_probability(markets) does not exist
-- - function public.update_my_profile(text, text) does not exist
--
-- This script is designed to be safe to run multiple times.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'market_category' and typnamespace = 'public'::regnamespace) then
    create type public.market_category as enum ('business', 'rumor', 'fun', 'people');
  end if;

  if not exists (select 1 from pg_type where typname = 'market_status' and typnamespace = 'public'::regnamespace) then
    create type public.market_status as enum ('open', 'resolved', 'void');
  end if;

  if not exists (select 1 from pg_type where typname = 'trade_side' and typnamespace = 'public'::regnamespace) then
    create type public.trade_side as enum ('yes', 'no');
  end if;

  if not exists (select 1 from pg_type where typname = 'resolution_result' and typnamespace = 'public'::regnamespace) then
    create type public.resolution_result as enum ('yes', 'no', 'void');
  end if;

  if not exists (select 1 from pg_type where typname = 'ledger_reason' and typnamespace = 'public'::regnamespace) then
    create type public.ledger_reason as enum ('initial_grant', 'airdrop', 'trade', 'payout', 'refund', 'admin_adjustment');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_seed text not null default encode(gen_random_bytes(6), 'hex'),
  is_admin boolean not null default false,
  wallet_balance numeric(12, 2) not null default 1000 check (wallet_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 10 and 220),
  criteria text not null check (char_length(criteria) between 20 and 1400),
  category public.market_category not null default 'business',
  close_at timestamptz not null,
  status public.market_status not null default 'open',
  resolution public.resolution_result,
  creator_id uuid references public.profiles(id) on delete set null,
  yes_pool numeric(12, 2) not null default 500 check (yes_pool > 0),
  no_pool numeric(12, 2) not null default 500 check (no_pool > 0),
  volume numeric(12, 2) not null default 0 check (volume >= 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.market_history (
  id bigint generated always as identity primary key,
  market_id uuid not null references public.markets(id) on delete cascade,
  probability numeric(6, 5) not null check (probability > 0 and probability < 1),
  created_at timestamptz not null default now()
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  side public.trade_side not null,
  shares numeric(14, 4) not null default 0 check (shares >= 0),
  cost numeric(12, 2) not null default 0 check (cost >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, market_id, side)
);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  side public.trade_side not null,
  amount numeric(12, 2) not null check (amount > 0),
  shares numeric(14, 4) not null check (shares > 0),
  price numeric(6, 5) not null check (price > 0 and price < 1),
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12, 2) not null,
  reason public.ledger_reason not null,
  market_id uuid references public.markets(id) on delete set null,
  trade_id uuid references public.trades(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.invite_codes (
  code text primary key,
  label text,
  max_uses int,
  use_count int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.market_suggestions (
  id text primary key,
  suggestion_type text not null check (suggestion_type in ('binary', 'multiple', 'spicy')),
  category public.market_category not null default 'business',
  title text not null check (char_length(title) between 10 and 220),
  criteria text not null check (char_length(criteria) between 20 and 1400),
  resolves_on date not null,
  options jsonb not null default '[]'::jsonb,
  hr_approved boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists markets_status_close_idx on public.markets (status, close_at);
create index if not exists trades_market_idx on public.trades (market_id, created_at desc);
create index if not exists trades_user_idx on public.trades (user_id, created_at desc);
create index if not exists positions_user_idx on public.positions (user_id);
create index if not exists ledger_user_idx on public.ledger_entries (user_id, created_at desc);
create index if not exists market_history_market_idx on public.market_history (market_id, created_at);
create index if not exists market_suggestions_active_idx on public.market_suggestions (is_active, suggestion_type);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists positions_touch_updated_at on public.positions;
create trigger positions_touch_updated_at
before update on public.positions
for each row execute function public.touch_updated_at();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.create_profile_for_current_user(p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  created_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.profiles (id, display_name)
  values (auth.uid(), p_display_name)
  on conflict (id) do update
    set display_name = excluded.display_name
  returning * into created_profile;

  insert into public.ledger_entries (user_id, amount, reason, note)
  select auth.uid(), 1000, 'initial_grant', 'Starting allocation'
  where not exists (
    select 1
    from public.ledger_entries
    where user_id = auth.uid()
      and reason = 'initial_grant'
  );

  return created_profile;
end;
$$;

create or replace function public.market_probability(target_market public.markets)
returns numeric
language sql
stable
as $$
  select target_market.yes_pool / (target_market.yes_pool + target_market.no_pool);
$$;

create or replace function public.update_my_profile(p_display_name text, p_avatar_seed text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles
  set
    display_name = p_display_name,
    avatar_seed = p_avatar_seed
  where id = auth.uid()
  returning * into updated_profile;

  if updated_profile.id is null then
    raise exception 'profile missing';
  end if;

  return updated_profile;
end;
$$;

create or replace function public.public_leaderboard()
returns table (
  id uuid,
  display_name text,
  avatar_seed text,
  wallet_balance numeric,
  is_admin boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    profiles.id,
    profiles.display_name,
    profiles.avatar_seed,
    profiles.wallet_balance,
    profiles.is_admin,
    profiles.created_at
  from public.profiles
  order by profiles.wallet_balance desc, profiles.created_at asc
  limit 100;
$$;

create or replace function public.claim_slot_reward()
returns numeric
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  roll numeric := random() * 100;
  reward numeric := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if roll < 35 then
    reward := 0;
  elsif roll < 65 then
    reward := 25;
  elsif roll < 85 then
    reward := 50;
  elsif roll < 95 then
    reward := 100;
  else
    reward := 250;
  end if;

  if reward > 0 then
    update public.profiles
    set wallet_balance = wallet_balance + reward
    where id = auth.uid();
  end if;

  insert into public.ledger_entries (user_id, amount, reason, note)
  values (auth.uid(), reward, 'airdrop', 'Idle slot reward');

  return reward;
end;
$$;

create or replace function public.place_trade(market_id uuid, side public.trade_side, amount numeric)
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  trader public.profiles;
  market public.markets;
  trade_price numeric;
  trade_shares numeric;
  created_trade public.trades;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select * into trader
  from public.profiles
  where id = auth.uid()
  for update;

  if trader.id is null then
    raise exception 'profile missing';
  end if;

  if trader.wallet_balance < amount then
    raise exception 'insufficient balance';
  end if;

  select * into market
  from public.markets
  where id = market_id
  for update;

  if market.id is null then
    raise exception 'market not found';
  end if;

  if market.status <> 'open' or market.close_at <= now() then
    raise exception 'market is closed';
  end if;

  trade_price := case
    when side = 'yes' then market.yes_pool / (market.yes_pool + market.no_pool)
    else market.no_pool / (market.yes_pool + market.no_pool)
  end;
  trade_price := greatest(0.05, least(0.95, trade_price));
  trade_shares := amount / trade_price;

  update public.profiles
  set wallet_balance = wallet_balance - amount
  where id = auth.uid();

  update public.markets
  set
    yes_pool = case when side = 'yes' then yes_pool + amount else yes_pool end,
    no_pool = case when side = 'no' then no_pool + amount else no_pool end,
    volume = volume + amount
  where id = market_id
  returning * into market;

  insert into public.trades (user_id, market_id, side, amount, shares, price)
  values (auth.uid(), market_id, side, amount, trade_shares, trade_price)
  returning * into created_trade;

  insert into public.positions (user_id, market_id, side, shares, cost)
  values (auth.uid(), market_id, side, trade_shares, amount)
  on conflict (user_id, market_id, side) do update
    set
      shares = positions.shares + excluded.shares,
      cost = positions.cost + excluded.cost;

  insert into public.ledger_entries (user_id, amount, reason, market_id, trade_id, note)
  values (auth.uid(), -amount, 'trade', market_id, created_trade.id, 'Trade placed');

  insert into public.market_history (market_id, probability)
  values (market_id, public.market_probability(market));

  return created_trade;
end;
$$;

create or replace function public.resolve_market(market_id uuid, result public.resolution_result)
returns public.markets
language plpgsql
security definer
set search_path = public
as $$
declare
  market public.markets;
  pos record;
  payout numeric;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  select * into market
  from public.markets
  where id = market_id
  for update;

  if market.id is null then
    raise exception 'market not found';
  end if;

  if market.status <> 'open' then
    raise exception 'market already closed';
  end if;

  update public.markets
  set
    status = case when result = 'void' then 'void'::public.market_status else 'resolved'::public.market_status end,
    resolution = result,
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = market_id
  returning * into market;

  for pos in
    select * from public.positions
    where positions.market_id = resolve_market.market_id
      and shares > 0
    for update
  loop
    payout := 0;
    if result = 'void' then
      payout := pos.cost;
    elsif pos.side::text = result::text then
      payout := pos.shares;
    end if;

    if payout > 0 then
      update public.profiles
      set wallet_balance = wallet_balance + payout
      where id = pos.user_id;

      insert into public.ledger_entries (user_id, amount, reason, market_id, note)
      values (
        pos.user_id,
        payout,
        case when result = 'void' then 'refund'::public.ledger_reason else 'payout'::public.ledger_reason end,
        market_id,
        'Market resolution'
      );
    end if;

    update public.positions
    set shares = 0
    where id = pos.id;
  end loop;

  return market;
end;
$$;

alter table public.profiles enable row level security;
alter table public.markets enable row level security;
alter table public.market_history enable row level security;
alter table public.positions enable row level security;
alter table public.trades enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.invite_codes enable row level security;
alter table public.market_suggestions enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_seed) on public.profiles to authenticated;
grant select, insert on public.markets to authenticated;
grant update on public.markets to authenticated;
grant select on public.market_history to authenticated;
grant select on public.positions to authenticated;
grant select on public.trades to authenticated;
grant select on public.ledger_entries to authenticated;
grant select on public.market_suggestions to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.create_profile_for_current_user(text) to authenticated;
grant execute on function public.market_probability(public.markets) to authenticated;
grant execute on function public.update_my_profile(text, text) to authenticated;
grant execute on function public.public_leaderboard() to authenticated;
grant execute on function public.claim_slot_reward() to authenticated;
grant execute on function public.place_trade(uuid, public.trade_side, numeric) to authenticated;
grant execute on function public.resolve_market(uuid, public.resolution_result) to authenticated;

drop policy if exists "Profiles are visible to signed-in users" on public.profiles;
drop policy if exists "Users can view own profile, admins can view all" on public.profiles;
create policy "Users can view own profile, admins can view all"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can update their own display name" on public.profiles;
create policy "Users can update their own display name"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Markets are visible to signed-in users" on public.markets;
create policy "Markets are visible to signed-in users"
on public.markets for select
to authenticated
using (true);

drop policy if exists "Signed-in users can create markets" on public.markets;
create policy "Signed-in users can create markets"
on public.markets for insert
to authenticated
with check (
  creator_id = auth.uid()
  and status = 'open'
  and resolution is null
);

drop policy if exists "Only admins can update markets directly" on public.markets;
create policy "Only admins can update markets directly"
on public.markets for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Market history is visible to signed-in users" on public.market_history;
create policy "Market history is visible to signed-in users"
on public.market_history for select
to authenticated
using (true);

drop policy if exists "Users can view their own positions" on public.positions;
create policy "Users can view their own positions"
on public.positions for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can view their own trades" on public.trades;
create policy "Users can view their own trades"
on public.trades for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Users can view their own ledger" on public.ledger_entries;
create policy "Users can view their own ledger"
on public.ledger_entries for select
to authenticated
using (user_id = auth.uid() or public.current_user_is_admin());

drop policy if exists "Only admins can view invite codes" on public.invite_codes;
create policy "Only admins can view invite codes"
on public.invite_codes for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "Only admins can manage invite codes" on public.invite_codes;
create policy "Only admins can manage invite codes"
on public.invite_codes for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Suggestions are visible to signed-in users" on public.market_suggestions;
create policy "Suggestions are visible to signed-in users"
on public.market_suggestions for select
to authenticated
using (is_active = true);

drop policy if exists "Only admins can manage suggestions" on public.market_suggestions;
create policy "Only admins can manage suggestions"
on public.market_suggestions for all
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

notify pgrst, 'reload schema';
