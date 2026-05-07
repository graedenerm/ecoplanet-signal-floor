-- Hotfix for Phase B: the multi-choice migration widened the positions
-- unique constraint to (user_id, market_id, side, option_id), but the
-- binary place_trade RPC still references ON CONFLICT (user_id, market_id, side).
-- That mismatch made every binary trade fail with "no unique constraint
-- matching ON CONFLICT specification".
--
-- This file rewrites place_trade so the ON CONFLICT clause matches the
-- new constraint. Binary trades pass option_id = '' so they keep falling
-- into the same row as before.
--
-- Idempotent. Run in Supabase SQL Editor after supabase-multi-choice-markets.sql.

create or replace function public.place_trade(
  p_market_id uuid,
  p_side      public.trade_side,
  p_amount    numeric
)
returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  trader        public.profiles;
  market        public.markets;
  trade_price   numeric;
  trade_shares  numeric;
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

  if market.market_type = 'multiple' then
    raise exception 'use place_option_trade for multi-choice markets';
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

  insert into public.trades (user_id, market_id, side, option_id, amount, shares, price)
  values (auth.uid(), p_market_id, p_side, '', p_amount, trade_shares, trade_price)
  returning * into created_trade;

  -- ON CONFLICT now matches the widened unique constraint
  -- (user_id, market_id, side, option_id). Binary positions all share
  -- option_id = '', so they still aggregate into one row per side.
  insert into public.positions (user_id, market_id, side, option_id, shares, cost)
  values (auth.uid(), p_market_id, p_side, '', trade_shares, p_amount)
  on conflict (user_id, market_id, side, option_id) do update
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

grant execute on function public.place_trade(uuid, public.trade_side, numeric) to authenticated;

notify pgrst, 'reload schema';
