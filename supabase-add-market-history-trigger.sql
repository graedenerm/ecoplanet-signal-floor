-- Adds a trigger so every newly inserted market gets one initial row in
-- public.market_history at its starting probability. Without this, markets
-- created from the app (rather than the seed SQL) had zero history rows and
-- their sparkline never drew a line until the first trade.
--
-- Also backfills any existing markets that are missing an initial row.
--
-- Run once in Supabase SQL Editor. Idempotent — safe to re-run.

create or replace function public.market_inserted_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.market_history (market_id, probability)
  values (new.id, public.market_probability(new));
  return new;
end;
$$;

drop trigger if exists markets_init_history on public.markets;
create trigger markets_init_history
after insert on public.markets
for each row execute function public.market_inserted_history();

-- Backfill: every existing market that has no history row gets one,
-- timestamped at the market's creation time.
insert into public.market_history (market_id, probability, created_at)
select m.id, public.market_probability(m), m.created_at
from public.markets m
where not exists (
  select 1 from public.market_history mh where mh.market_id = m.id
);

notify pgrst, 'reload schema';
