-- Fix missing/stale create_profile_for_current_user RPC.
-- Run this in Supabase SQL Editor if the app says:
-- "Could not find the function public.create_profile_for_current_user(...) in the schema cache"

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

grant execute on function public.create_profile_for_current_user(text) to authenticated;

-- Force PostgREST/Supabase Data API to refresh its function cache.
notify pgrst, 'reload schema';

