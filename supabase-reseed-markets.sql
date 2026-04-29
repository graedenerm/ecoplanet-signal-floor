-- Replace prototype markets with ecoplanet-specific seed markets.
-- If your Supabase project was partially initialized, run supabase-repair.sql first.
-- Use only while the app is still in prototype/beta setup.
-- This clears existing markets, trades, positions, and market history.
-- It does not delete profiles or change user wallet balances.

delete from public.market_history;
delete from public.trades;
delete from public.positions;
delete from public.markets;

insert into public.markets (title, criteria, category, close_at, yes_pool, no_pool, volume)
values
  (
    'Will the SDR team book at least 120 discos in May 2026?',
    'YES if #discos-booked contains at least 120 valid new discovery-call posts between May 1 and May 31, 2026. Valid means HubSpot URL plus future meeting date.',
    'business',
    '2026-06-01 18:00:00+00',
    1456,
    1144,
    0
  ),
  (
    'Will any single disco booked in May feature at least 1 TWh consumption?',
    'YES if any #discos-booked post in May 2026 mentions at least 1,000 GWh or at least 1 TWh total consumption.',
    'business',
    '2026-06-01 18:00:00+00',
    396,
    1404,
    0
  ),
  (
    'Will Pure Battery Technologies convert to SQL within 14 days of its May 4 disco?',
    'YES if Pure Battery Technologies GmbH moves to SQL in HubSpot by May 18, 2026.',
    'business',
    '2026-05-18 18:00:00+00',
    672,
    728,
    0
  ),
  (
    'Will May 2026 demo-to-SQL conversion land over 70%?',
    'YES if RevOps reports May demo-to-SQL conversion above 70% in the official end-of-month reporting.',
    'business',
    '2026-06-05 18:00:00+00',
    1364,
    836,
    0
  ),
  (
    'Will any HUGO BOSS, Miele, Rolls-Royce, Amcor, Outokumpu, or KION account close in H1?',
    'YES if any listed trophy account is marked closed-won in HubSpot by June 30, 2026.',
    'business',
    '2026-06-30 18:00:00+00',
    816,
    1584,
    0
  ),
  (
    'Will Lucas Wos close more enterprise accounts than Max Dekorsy in Q2?',
    'YES if HubSpot closed-won count for accounts over 25 GWh in Q2 2026 is Lucas Wos greater than Max Dekorsy.',
    'business',
    '2026-07-01 18:00:00+00',
    924,
    1176,
    0
  ),
  (
    'Will the 100 demos from Clay-Leads milestone double to 200 by end of Q2?',
    'YES if cumulative demos generated from Clay-Leads reaches at least 200 by June 30, 2026, per Kevin Erhart or RevOps tracking.',
    'business',
    '2026-06-30 18:00:00+00',
    918,
    882,
    0
  ),
  (
    'Will the next database migration retry succeed?',
    'YES if the next announced database migration retry completes without rollback and stays stable for seven days.',
    'business',
    '2026-06-12 18:00:00+00',
    1005,
    495,
    0
  ),
  (
    'Will the Q2 objectives dashboard be all green by end of June?',
    'YES if q2-objectives status shows all green, or equivalent leadership confirmation, by June 30, 2026.',
    'business',
    '2026-06-30 18:00:00+00',
    464,
    1136,
    0
  ),
  (
    'Will the soccer-ball celebration appear more than 50 times in #discos-booked in May?',
    'YES if the soccer-ball celebration emoji is used more than 50 times in #discos-booked during May 2026.',
    'fun',
    '2026-06-01 18:00:00+00',
    696,
    504,
    0
  ),
  (
    'Will Doenerstag happen at least once in May?',
    'YES if a Doener Tag, Doenerstag, or equivalent office lunch mention happens in May 2026.',
    'fun',
    '2026-06-01 18:00:00+00',
    836,
    264,
    0
  ),
  (
    'Will this prediction market still be running on July 1?',
    'YES if at least one market has received a trade during the seven days before July 1, 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    2130,
    870,
    0
  ),
  (
    'Will Henry send a Bissle ruhig heute style nudge at least 3 times in May?',
    'YES if Henry sends at least three visible low-volume nudges in #discos-booked or an adjacent sales channel during May 2026.',
    'fun',
    '2026-06-01 18:00:00+00',
    832,
    468,
    0
  ),
  (
    'Will the Max-bot emoji be used more than 10 times in Q2?',
    'YES if the Max-bot emoji appears more than 10 times across public company Slack channels in Q2 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    684,
    516,
    0
  ),
  (
    'Will anyone repeat the 50 percent contact rate, 100 percent booking rate joke at least 3 times in Q2?',
    'YES if the joke or a clearly equivalent version appears at least three times in public Slack channels during Q2 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    451,
    649,
    0
  ),
  (
    'Will a single SDR post earn more than 5 champagne reactions in Q2?',
    'YES if any SDR disco post receives more than five champagne-style celebration reactions before July 1, 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    863,
    387,
    0
  ),
  (
    'Will Olivia top the Moss missing-receipts board in May?',
    'YES if Olivia is ranked number one on any final or official May Moss missing-receipts report.',
    'fun',
    '2026-06-01 18:00:00+00',
    330,
    670,
    0
  ),
  (
    'Will the kitchen get called out as chaos more than once in Q2?',
    'YES if public office Slack messages call out kitchen chaos, dishes, dishwasher issues, or similar more than once in Q2 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    962,
    338,
    0
  ),
  (
    'Will the company poker night finally materialize before end of Q2?',
    'YES if a company poker night is scheduled and actually happens before July 1, 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    243,
    657,
    0
  ),
  (
    'Will the Berlin office move complete by end of Q2?',
    'YES if the Berlin coworking or office move is publicly confirmed as complete before July 1, 2026.',
    'business',
    '2026-07-01 18:00:00+00',
    520,
    480,
    0
  ),
  (
    'Will a Burkhard vs ecoplanet bot exchange happen in Q2?',
    'YES if a public Slack thread contains a playful exchange between Burkhard and an ecoplanet AI/bot account before July 1, 2026.',
    'fun',
    '2026-07-01 18:00:00+00',
    380,
    620,
    0
  ),
  (
    'Will any ecoplanet LinkedIn post cross 100 likes in Q2?',
    'YES if a public LinkedIn post by an ecoplanet employee or company account reaches at least 100 likes before July 1, 2026.',
    'business',
    '2026-07-01 18:00:00+00',
    644,
    756,
    0
  ),
  (
    'Will a new customer logo be announced before the next all-hands?',
    'YES if a new customer logo is shared in all-hands, Slack, CRM, or another official internal source before the next all-hands.',
    'business',
    '2026-05-19 18:00:00+00',
    928,
    672,
    0
  ),
  (
    'Will the slot machine pay a 250-credit jackpot to anyone this week?',
    'YES if any user reports or the app records a 250-credit Energy Slot payout within the next seven days.',
    'fun',
    '2026-05-05 18:00:00+00',
    279,
    621,
    0
  );

insert into public.market_history (market_id, probability)
select id, yes_pool / (yes_pool + no_pool)
from public.markets;
