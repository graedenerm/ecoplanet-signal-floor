-- Adds:
--   1. public.rumors table for the anonymous rumor wall
--   2. public.public_rumors() RPC that returns rumors WITHOUT posted_by,
--      so non-admin users can read but never see who wrote what
--   3. public.recent_activity() RPC that returns the last N trades joined
--      with display_name and market title, for the Pulse feed
--
-- Run this once in Supabase SQL Editor. Idempotent — safe to re-run.

-- ---------- rumors table ----------

create table if not exists public.rumors (
  id         uuid primary key default gen_random_uuid(),
  body       text not null check (char_length(body) between 5 and 500),
  posted_by  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists rumors_created_at_idx on public.rumors (created_at desc);

alter table public.rumors enable row level security;

drop policy if exists "Authenticated users can post rumors" on public.rumors;
create policy "Authenticated users can post rumors"
  on public.rumors for insert
  to authenticated
  with check (posted_by = auth.uid());

-- Non-admins go through public_rumors() RPC, which hides posted_by.
-- Direct SELECT is admin-only so author identity stays hidden.
drop policy if exists "Admins can view rumor authors" on public.rumors;
create policy "Admins can view rumor authors"
  on public.rumors for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can update rumors" on public.rumors;
create policy "Admins can update rumors"
  on public.rumors for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can delete rumors" on public.rumors;
create policy "Admins can delete rumors"
  on public.rumors for delete
  to authenticated
  using (public.current_user_is_admin());

grant select, insert on public.rumors to authenticated;

-- ---------- public_rumors() RPC ----------

create or replace function public.public_rumors(p_limit int default 50)
returns table (
  id         uuid,
  body       text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select id, body, created_at
  from public.rumors
  order by created_at desc
  limit greatest(1, least(p_limit, 200));
$$;

grant execute on function public.public_rumors(int) to authenticated;

-- ---------- recent_activity() RPC ----------

create or replace function public.recent_activity(p_limit int default 30)
returns table (
  trade_id     uuid,
  user_id      uuid,
  display_name text,
  avatar_seed  text,
  market_id    uuid,
  market_title text,
  side         public.trade_side,
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
    t.side,
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
