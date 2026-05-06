-- Addresses common Supabase Security Advisor warnings without changing
-- any application behaviour. Idempotent — safe to re-run.
--
-- Specifically:
--   1. "Function Search Path Mutable" — every function in the public
--      schema should set an explicit search_path so a malicious schema
--      with the same name can't shadow public.* references. Two of the
--      original schema functions (touch_updated_at, market_probability)
--      were missing this; the rest were already set.
--   2. Belt-and-suspenders ENABLE ROW LEVEL SECURITY on every app table
--      (it should already be on, but this catches anything that drifted).
--
-- Run once in Supabase SQL Editor.

-- ---------- 1. Re-create functions with explicit search_path ----------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.market_probability(target_market public.markets)
returns numeric
language sql
immutable
set search_path = public
as $$
  select target_market.yes_pool / (target_market.yes_pool + target_market.no_pool);
$$;

-- ---------- 2. Confirm RLS on every public table ----------

alter table public.profiles            enable row level security;
alter table public.markets             enable row level security;
alter table public.market_history      enable row level security;
alter table public.positions           enable row level security;
alter table public.trades              enable row level security;
alter table public.ledger_entries      enable row level security;
alter table public.invite_codes        enable row level security;
alter table public.market_suggestions  enable row level security;
alter table public.rumors              enable row level security;
alter table public.suggestion_blocklist enable row level security;

notify pgrst, 'reload schema';
