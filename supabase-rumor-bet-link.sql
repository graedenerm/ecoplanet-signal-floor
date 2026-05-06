-- Links a rumor to the bet it spawned, so the UI can show
-- "View bet ->" instead of "Make this a bet" once a conversion
-- has happened. Prevents accidental duplicates.
--
-- Adds:
--   1. rumors.market_id column (nullable FK to markets.id)
--   2. public_rumors() RPC now returns market_id
--   3. link_rumor_to_market() RPC so the market creator can
--      write the link without needing UPDATE on rumors
--
-- Idempotent. Run after supabase-add-rumors-and-activity.sql.

alter table public.rumors
  add column if not exists market_id uuid references public.markets(id) on delete set null;

-- Return type changed (added market_id), so the old function must be dropped
-- before recreating. CREATE OR REPLACE cannot alter return-type signatures.
drop function if exists public.public_rumors(int);

create or replace function public.public_rumors(p_limit int default 50)
returns table (
  id         uuid,
  body       text,
  created_at timestamptz,
  market_id  uuid
)
language sql
stable
security definer
set search_path = public
as $$
  select id, body, created_at, market_id
  from public.rumors
  order by created_at desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.public_rumors(int) to authenticated;

create or replace function public.link_rumor_to_market(p_rumor_id uuid, p_market_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  market_creator uuid;
begin
  select creator_id into market_creator
  from public.markets
  where id = p_market_id;

  if market_creator is null or market_creator <> auth.uid() then
    raise exception 'Only the market creator can link a rumor to it';
  end if;

  update public.rumors
  set market_id = p_market_id
  where id = p_rumor_id and market_id is null;
end;
$$;

grant execute on function public.link_rumor_to_market(uuid, uuid) to authenticated;
