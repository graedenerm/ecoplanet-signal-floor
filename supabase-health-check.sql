-- Signal Floor Supabase health check.
-- Run after supabase-repair.sql to verify the pieces the browser needs.

select
  to_regclass('public.profiles') is not null as has_profiles_table,
  to_regclass('public.markets') is not null as has_markets_table,
  to_regclass('public.market_history') is not null as has_market_history_table,
  to_regprocedure('public.create_profile_for_current_user(text)') is not null as has_profile_rpc,
  to_regprocedure('public.update_my_profile(text, text)') is not null as has_profile_update_rpc,
  to_regprocedure('public.public_leaderboard()') is not null as has_leaderboard_rpc,
  to_regprocedure('public.claim_slot_reward()') is not null as has_slot_reward_rpc,
  to_regprocedure('public.market_probability(public.markets)') is not null as has_probability_rpc,
  to_regprocedure('public.place_trade(uuid, public.trade_side, numeric)') is not null as has_trade_rpc,
  to_regprocedure('public.resolve_market(uuid, public.resolution_result)') is not null as has_resolve_rpc;

select
  table_name,
  privilege_type
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_schema = 'public'
  and table_name in (
    'profiles',
    'markets',
    'market_history',
    'positions',
    'trades',
    'ledger_entries',
    'market_suggestions'
  )
order by table_name, privilege_type;

select
  routine_name,
  privilege_type
from information_schema.role_routine_grants
where grantee = 'authenticated'
  and routine_schema = 'public'
  and routine_name in (
    'create_profile_for_current_user',
    'update_my_profile',
    'public_leaderboard',
    'claim_slot_reward',
    'market_probability',
    'place_trade',
    'resolve_market'
  )
order by routine_name, privilege_type;
