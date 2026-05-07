-- Phase B: real multi-choice (N-option) markets, parallel to existing binary.
--
-- Adds:
--   1. markets.market_type ('binary' | 'multiple') + options jsonb + winning_option_id
--   2. trades.option_id, positions.option_id, market_history.option_id
--   3. place_option_trade() RPC for multi-choice trades
--   4. resolve_multi_market() RPC for admin resolution / void on multi markets
--   5. Updated markets_init_history trigger so multi markets seed one
--      history row per option instead of one bogus binary-shaped row
--
-- Idempotent. Run after supabase-schema.sql, supabase-fix-trade-rpcs.sql,
-- and supabase-add-market-history-trigger.sql.

-- ---------- 1. markets columns ----------

alter table public.markets
  add column if not exists market_type text not null default 'binary',
  add column if not exists options jsonb not null default '[]'::jsonb,
  add column if not exists winning_option_id text;

alter table public.markets
  drop constraint if exists markets_market_type_check;
alter table public.markets
  add constraint markets_market_type_check check (market_type in ('binary', 'multiple'));

create index if not exists markets_market_type_idx on public.markets (market_type);

-- ---------- 2. trades / positions / market_history option_id ----------

alter table public.trades
  add column if not exists option_id text;

alter table public.positions
  add column if not exists option_id text not null default '';

-- The original positions table has unique(user_id, market_id, side). For multi
-- we need (user_id, market_id, side, option_id). Binary positions keep
-- option_id='' so the new unique constraint subsumes the old one.
-- We drop the 3-column unique by lookup so we are robust to constraint-name drift.
do $$
declare
  con_rec record;
begin
  for con_rec in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.positions'::regclass
      and c.contype  = 'u'
      and array_length(c.conkey, 1) = 3
  loop
    execute format('alter table public.positions drop constraint %I', con_rec.conname);
  end loop;
end $$;

alter table public.positions
  drop constraint if exists positions_user_id_market_id_side_option_id_key;
alter table public.positions
  add constraint positions_user_id_market_id_side_option_id_key
  unique (user_id, market_id, side, option_id);

alter table public.market_history
  add column if not exists option_id text;

create index if not exists market_history_option_idx on public.market_history (market_id, option_id, created_at);

-- ---------- 3. place_option_trade RPC ----------

create or replace function public.place_option_trade(
  p_market_id uuid,
  p_option_id text,
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
  option_row    jsonb;
  option_pool   numeric;
  total_pool    numeric;
  trade_price   numeric;
  trade_shares  numeric;
  new_options   jsonb;
  created_trade public.trades;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  select * into trader from public.profiles where id = auth.uid() for update;
  if trader.id is null then
    raise exception 'profile missing';
  end if;
  if trader.wallet_balance < p_amount then
    raise exception 'insufficient balance';
  end if;

  select * into market from public.markets where id = p_market_id for update;
  if market.id is null then
    raise exception 'market not found';
  end if;
  if market.market_type <> 'multiple' then
    raise exception 'not a multi-choice market';
  end if;
  if market.status <> 'open' or market.close_at <= now() then
    raise exception 'market is closed';
  end if;

  -- Find the target option in the jsonb array
  select opt into option_row
  from jsonb_array_elements(market.options) opt
  where (opt ->> 'id') = p_option_id;
  if option_row is null then
    raise exception 'option not found';
  end if;

  -- Total pool = sum of all option pools
  select sum((opt ->> 'pool')::numeric) into total_pool
  from jsonb_array_elements(market.options) opt;
  if total_pool is null or total_pool <= 0 then
    raise exception 'invalid pool state';
  end if;

  option_pool  := (option_row ->> 'pool')::numeric;
  trade_price  := option_pool / total_pool;
  trade_price  := greatest(0.02, least(0.98, trade_price));
  trade_shares := p_amount / trade_price;

  -- Debit user
  update public.profiles
  set wallet_balance = wallet_balance - p_amount
  where id = auth.uid();

  -- Update options jsonb: increment chosen option's pool by amount
  select jsonb_agg(
    case when (opt ->> 'id') = p_option_id
      then jsonb_set(opt, '{pool}', to_jsonb(round(((opt ->> 'pool')::numeric + p_amount)::numeric, 2)))
      else opt
    end
  ) into new_options
  from jsonb_array_elements(market.options) opt;

  update public.markets
  set options = new_options, volume = volume + p_amount
  where id = p_market_id;

  -- Insert trade (side='yes' as placeholder; option_id discriminates for multi)
  insert into public.trades (user_id, market_id, side, option_id, amount, shares, price)
  values (auth.uid(), p_market_id, 'yes'::trade_side, p_option_id, p_amount, trade_shares, trade_price)
  returning * into created_trade;

  -- Upsert position keyed on (user, market, side, option_id)
  insert into public.positions (user_id, market_id, side, option_id, shares, cost)
  values (auth.uid(), p_market_id, 'yes'::trade_side, p_option_id, trade_shares, p_amount)
  on conflict (user_id, market_id, side, option_id) do update
    set
      shares = positions.shares + excluded.shares,
      cost   = positions.cost   + excluded.cost;

  -- Ledger entry
  insert into public.ledger_entries (user_id, amount, reason, market_id, trade_id, note)
  values (auth.uid(), -p_amount, 'trade'::ledger_reason, p_market_id, created_trade.id, 'Multi-choice trade');

  -- Market history: one row per option at the post-trade probability
  insert into public.market_history (market_id, option_id, probability)
  select p_market_id,
         opt ->> 'id',
         greatest(0.02, least(0.98, ((opt ->> 'pool')::numeric / (total_pool + p_amount))))
  from jsonb_array_elements(new_options) opt;

  return created_trade;
end;
$$;

grant execute on function public.place_option_trade(uuid, text, numeric) to authenticated;

-- ---------- 4. resolve_multi_market RPC ----------

create or replace function public.resolve_multi_market(
  p_market_id          uuid,
  p_winning_option_id  text,
  p_void               boolean default false
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

  select * into market from public.markets where id = p_market_id for update;
  if market.id is null then
    raise exception 'market not found';
  end if;
  if market.market_type <> 'multiple' then
    raise exception 'not a multi-choice market';
  end if;
  if market.status <> 'open' then
    raise exception 'market already closed';
  end if;

  if p_void then
    update public.markets
    set status      = 'void'::market_status,
        resolution  = 'void'::resolution_result,
        resolved_at = now(),
        resolved_by = auth.uid()
    where id = p_market_id
    returning * into market;

    for pos in
      select * from public.positions
      where positions.market_id = p_market_id and shares > 0
      for update
    loop
      payout := pos.cost;
      if payout > 0 then
        update public.profiles
        set wallet_balance = wallet_balance + payout
        where id = pos.user_id;

        insert into public.ledger_entries (user_id, amount, reason, market_id, note)
        values (pos.user_id, payout, 'refund'::ledger_reason, p_market_id, 'Multi market void');
      end if;

      update public.positions set shares = 0 where id = pos.id;
    end loop;
  else
    if not exists (
      select 1 from jsonb_array_elements(market.options) opt
      where (opt ->> 'id') = p_winning_option_id
    ) then
      raise exception 'winning option not found in market';
    end if;

    -- resolution = 'yes' is a placeholder to satisfy the original
    -- markets check constraint. winning_option_id is the source of truth
    -- for multi-choice resolutions; the JS branches on market_type.
    update public.markets
    set status             = 'resolved'::market_status,
        resolution         = 'yes'::resolution_result,
        winning_option_id  = p_winning_option_id,
        resolved_at        = now(),
        resolved_by        = auth.uid()
    where id = p_market_id
    returning * into market;

    for pos in
      select * from public.positions
      where positions.market_id = p_market_id and shares > 0
      for update
    loop
      payout := 0;
      if pos.option_id = p_winning_option_id then
        payout := pos.shares;
      end if;

      if payout > 0 then
        update public.profiles
        set wallet_balance = wallet_balance + payout
        where id = pos.user_id;

        insert into public.ledger_entries (user_id, amount, reason, market_id, note)
        values (pos.user_id, payout, 'payout'::ledger_reason, p_market_id, 'Multi market payout');
      end if;

      update public.positions set shares = 0 where id = pos.id;
    end loop;
  end if;

  return market;
end;
$$;

grant execute on function public.resolve_multi_market(uuid, text, boolean) to authenticated;

-- ---------- 5. Updated markets_init_history trigger ----------

create or replace function public.market_inserted_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  total numeric;
begin
  if new.market_type = 'multiple' then
    select sum((opt ->> 'pool')::numeric) into total
    from jsonb_array_elements(new.options) opt;

    if total is null or total <= 0 then
      return new;
    end if;

    insert into public.market_history (market_id, option_id, probability)
    select new.id,
           opt ->> 'id',
           greatest(0.02, least(0.98, ((opt ->> 'pool')::numeric / total)))
    from jsonb_array_elements(new.options) opt;
  else
    insert into public.market_history (market_id, probability)
    values (new.id, public.market_probability(new));
  end if;
  return new;
end;
$$;

-- Trigger itself unchanged; the function it calls is what we updated.

-- ---------- 6. recent_activity now includes option_id ----------
-- Pulse feed reads this RPC; client resolves option_id -> label from
-- state.markets (which already carries the options jsonb).

drop function if exists public.recent_activity(int);

create or replace function public.recent_activity(p_limit int default 30)
returns table (
  trade_id     uuid,
  user_id      uuid,
  display_name text,
  avatar_seed  text,
  market_id    uuid,
  market_title text,
  market_type  text,
  side         public.trade_side,
  option_id    text,
  amount       numeric,
  shares       numeric,
  price        numeric,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.user_id,
    p.display_name,
    p.avatar_seed,
    t.market_id,
    m.title,
    m.market_type,
    t.side,
    t.option_id,
    t.amount,
    t.shares,
    t.price,
    t.created_at
  from public.trades t
  join public.profiles p on p.id = t.user_id
  join public.markets  m on m.id = t.market_id
  order by t.created_at desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.recent_activity(int) to authenticated;

notify pgrst, 'reload schema';
