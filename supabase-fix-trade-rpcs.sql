-- Fixes "column reference 'market_id' is ambiguous" error.
--
-- Root cause: place_trade() and resolve_market() declared parameters named
-- market_id / side / amount / result, which collide with column names on
-- positions, trades, ledger_entries, and market_history. plpgsql refuses to
-- guess in places like ON CONFLICT(...) where the names must resolve to
-- columns.
--
-- Fix: rename parameters with the p_ prefix (consistent with other RPCs in
-- this project: p_display_name, p_avatar_seed). Drop and recreate so the
-- old signature is fully replaced.
--
-- Run this once in the Supabase SQL Editor. Idempotent — safe to re-run.

drop function if exists public.place_trade(uuid, public.trade_side, numeric);
drop function if exists public.resolve_market(uuid, public.resolution_result);

create or replace function public.place_trade(
  p_market_id uuid,
  p_side public.trade_side,
  p_amount numeric
)
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

  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select * into trader
  from public.profiles
  where id = auth.uid()
  for update;

  if trader.id is null then
    raise exception 'profile missing';
  end if;

  if trader.wallet_balance < p_amount then
    raise exception 'insufficient balance';
  end if;

  select * into market
  from public.markets
  where id = p_market_id
  for update;

  if market.id is null then
    raise exception 'market not found';
  end if;

  if market.status <> 'open' or market.close_at <= now() then
    raise exception 'market is closed';
  end if;

  trade_price := case
    when p_side = 'yes' then market.yes_pool / (market.yes_pool + market.no_pool)
    else market.no_pool / (market.yes_pool + market.no_pool)
  end;
  trade_price := greatest(0.05, least(0.95, trade_price));
  trade_shares := p_amount / trade_price;

  update public.profiles
  set wallet_balance = wallet_balance - p_amount
  where id = auth.uid();

  update public.markets
  set
    yes_pool = case when p_side = 'yes' then yes_pool + p_amount else yes_pool end,
    no_pool  = case when p_side = 'no'  then no_pool  + p_amount else no_pool  end,
    volume   = volume + p_amount
  where id = p_market_id
  returning * into market;

  insert into public.trades (user_id, market_id, side, amount, shares, price)
  values (auth.uid(), p_market_id, p_side, p_amount, trade_shares, trade_price)
  returning * into created_trade;

  insert into public.positions (user_id, market_id, side, shares, cost)
  values (auth.uid(), p_market_id, p_side, trade_shares, p_amount)
  on conflict (user_id, market_id, side) do update
    set
      shares = positions.shares + excluded.shares,
      cost   = positions.cost   + excluded.cost;

  insert into public.ledger_entries (user_id, amount, reason, market_id, trade_id, note)
  values (auth.uid(), -p_amount, 'trade', p_market_id, created_trade.id, 'Trade placed');

  insert into public.market_history (market_id, probability)
  values (p_market_id, public.market_probability(market));

  return created_trade;
end;
$$;

create or replace function public.resolve_market(
  p_market_id uuid,
  p_result    public.resolution_result
)
returns public.markets
language plpgsql
security definer
set search_path = public
as $$
declare
  market public.markets;
  pos    record;
  payout numeric;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  select * into market
  from public.markets
  where id = p_market_id
  for update;

  if market.id is null then
    raise exception 'market not found';
  end if;

  if market.status <> 'open' then
    raise exception 'market already closed';
  end if;

  update public.markets
  set
    status      = case when p_result = 'void' then 'void'::public.market_status else 'resolved'::public.market_status end,
    resolution  = p_result,
    resolved_at = now(),
    resolved_by = auth.uid()
  where id = p_market_id
  returning * into market;

  for pos in
    select * from public.positions
    where market_id = p_market_id
      and shares > 0
    for update
  loop
    payout := 0;
    if p_result = 'void' then
      payout := pos.cost;
    elsif pos.side::text = p_result::text then
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
        case when p_result = 'void' then 'refund'::public.ledger_reason else 'payout'::public.ledger_reason end,
        p_market_id,
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

grant execute on function public.place_trade(uuid, public.trade_side, numeric) to authenticated;
grant execute on function public.resolve_market(uuid, public.resolution_result) to authenticated;

notify pgrst, 'reload schema';
