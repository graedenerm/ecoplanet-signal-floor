-- Adds public.suggestion_blocklist — a small admin-managed table that
-- tracks which suggestion IDs have been "deleted" by the admin. The
-- frontend reads it on bootstrap and filters them out of the Suggestions
-- tab. (Suggestions themselves still come from the JS constant; this is
-- the simplest persistent way to give admin a delete button.)
--
-- Run this once in Supabase SQL Editor. Idempotent — safe to re-run.

create table if not exists public.suggestion_blocklist (
  suggestion_id text primary key,
  hidden_by     uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.suggestion_blocklist enable row level security;

-- Everyone can read (so the filter works for non-admin users too).
drop policy if exists "Block list visible to all authenticated" on public.suggestion_blocklist;
create policy "Block list visible to all authenticated"
  on public.suggestion_blocklist for select
  to authenticated
  using (true);

drop policy if exists "Only admins can manage block list" on public.suggestion_blocklist;
create policy "Only admins can manage block list"
  on public.suggestion_blocklist for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

grant select on public.suggestion_blocklist to authenticated;
grant insert, delete on public.suggestion_blocklist to authenticated;

notify pgrst, 'reload schema';
