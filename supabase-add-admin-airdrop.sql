-- Adds public.admin_weekly_airdrop() — admin-only RPC that pays out the
-- weekly play-money drop to every profile, with a rank-based bonus on top.
-- Returns the total tokens distributed.
--
-- Layout:
--   Rank 1        : 250 base + 150 bonus = 400
--   Ranks 2 and 3 : 250 base +  75 bonus = 325
--   Everyone else : 250 base +  50 bonus = 300
--
-- Run this once in Supabase SQL Editor. Idempotent — safe to re-run.

create or replace function public.admin_weekly_airdrop()
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  rank_pos integer := 0;
  bonus numeric;
  per_user_payout numeric;
  payout_total numeric := 0;
  ledger_note text;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin only';
  end if;

  for rec in
    select id, display_name, wallet_balance
    from public.profiles
    order by wallet_balance desc, created_at asc
  loop
    rank_pos := rank_pos + 1;
    bonus := case
      when rank_pos = 1 then 150
      when rank_pos <= 3 then 75
      else 50
    end;
    per_user_payout := 250 + bonus;
    payout_total := payout_total + per_user_payout;

    update public.profiles
    set wallet_balance = wallet_balance + per_user_payout
    where id = rec.id;

    ledger_note := case
      when rank_pos = 1 then 'Weekly token drop + rank 1 bonus'
      when rank_pos <= 3 then 'Weekly token drop + rank ' || rank_pos || ' bonus'
      else 'Weekly token drop'
    end;

    insert into public.ledger_entries (user_id, amount, reason, note)
    values (rec.id, per_user_payout, 'airdrop', ledger_note);
  end loop;

  return payout_total;
end;
$$;

grant execute on function public.admin_weekly_airdrop() to authenticated;

notify pgrst, 'reload schema';
