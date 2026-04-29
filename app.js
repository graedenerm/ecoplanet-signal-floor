const STORAGE_KEY = "signal-floor-v1";
const IDLE_BONUS_MS = 15000;
const PUBLIC_CONFIG = window.SIGNAL_FLOOR_CONFIG || {};
const APP_MODE = PUBLIC_CONFIG.mode || "demo";
const IS_LIVE_BETA = APP_MODE === "live";
const DEMO_FALLBACK_ENABLED = PUBLIC_CONFIG.demoFallbackEnabled !== false && !IS_LIVE_BETA;
const SUPABASE_URL = PUBLIC_CONFIG.supabaseUrl || "https://dzvhpswsykgatbofaqzi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = PUBLIC_CONFIG.supabasePublishableKey || "sb_publishable_ZtLFI5jhROuBcgkhzZJDHA_IIUCuL8w";
const SEED_VERSION = 3;
const AUTH_EMAIL_DOMAIN = PUBLIC_CONFIG.authEmailDomain || "signalfloor.local";
const AVATAR_OPTIONS = ["⚡", "💎", "🍒", "🌴", "🍋", "🍀", "🔥", "🏆", "🧠", "🪩", "🚀", "👀"];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const names = [
  "Alpha Desk",
  "Blue Thesis",
  "Conviction Desk",
  "Quiet Carry",
  "Signal Baron",
  "Bayes Boss",
  "Upside Intern",
  "Rumor Quant",
  "Edge Lord",
  "Thesis Machine",
];

const MARKET_SEEDS = [
  {
    title: "Will the SDR team book at least 120 discos in May 2026?",
    criteria: "YES if #discos-booked contains at least 120 valid new discovery-call posts between May 1 and May 31, 2026. Valid means HubSpot URL plus future meeting date.",
    category: "business",
    probability: 0.56,
    liquidity: 2600,
    days: 34,
  },
  {
    title: "Will any single disco booked in May feature at least 1 TWh consumption?",
    criteria: "YES if any #discos-booked post in May 2026 mentions at least 1,000 GWh or at least 1 TWh total consumption.",
    category: "business",
    probability: 0.22,
    liquidity: 1800,
    days: 34,
  },
  {
    title: "Will Pure Battery Technologies convert to SQL within 14 days of its May 4 disco?",
    criteria: "YES if Pure Battery Technologies GmbH moves to SQL in HubSpot by May 18, 2026.",
    category: "business",
    probability: 0.48,
    liquidity: 1400,
    days: 20,
  },
  {
    title: "Will May 2026 demo-to-SQL conversion land over 70%?",
    criteria: "YES if RevOps reports May demo-to-SQL conversion above 70% in the official end-of-month reporting.",
    category: "business",
    probability: 0.62,
    liquidity: 2200,
    days: 38,
  },
  {
    title: "Will any HUGO BOSS, Miele, Rolls-Royce, Amcor, Outokumpu, or KION account close in H1?",
    criteria: "YES if any listed trophy account is marked closed-won in HubSpot by June 30, 2026.",
    category: "business",
    probability: 0.34,
    liquidity: 2400,
    days: 63,
  },
  {
    title: "Will Lucas Wos close more enterprise accounts than Max Dekorsy in Q2?",
    criteria: "YES if HubSpot closed-won count for accounts over 25 GWh in Q2 2026 is Lucas Wos greater than Max Dekorsy.",
    category: "business",
    probability: 0.44,
    liquidity: 2100,
    days: 64,
  },
  {
    title: "Will the 100 demos from Clay-Leads milestone double to 200 by end of Q2?",
    criteria: "YES if cumulative demos generated from Clay-Leads reaches at least 200 by June 30, 2026, per Kevin Erhart or RevOps tracking.",
    category: "business",
    probability: 0.51,
    liquidity: 1800,
    days: 63,
  },
  {
    title: "Will the next database migration retry succeed?",
    criteria: "YES if the next announced database migration retry completes without rollback and stays stable for seven days.",
    category: "business",
    probability: 0.67,
    liquidity: 1500,
    days: 45,
  },
  {
    title: "Will the Q2 objectives dashboard be all green by end of June?",
    criteria: "YES if q2-objectives status shows all green, or equivalent leadership confirmation, by June 30, 2026.",
    category: "business",
    probability: 0.29,
    liquidity: 1600,
    days: 63,
  },
  {
    title: "Will the soccer-ball celebration appear more than 50 times in #discos-booked in May?",
    criteria: "YES if the soccer-ball celebration emoji is used more than 50 times in #discos-booked during May 2026.",
    category: "fun",
    probability: 0.58,
    liquidity: 1200,
    days: 34,
  },
  {
    title: "Will Doenerstag happen at least once in May?",
    criteria: "YES if a Doener Tag, Doenerstag, or equivalent office lunch mention happens in May 2026.",
    category: "fun",
    probability: 0.76,
    liquidity: 1100,
    days: 34,
  },
  {
    title: "Will this prediction market still be running on July 1?",
    criteria: "YES if at least one market has received a trade during the seven days before July 1, 2026.",
    category: "fun",
    probability: 0.71,
    liquidity: 3000,
    days: 64,
  },
  {
    title: "Will Henry send a 'Bissle ruhig heute' style nudge at least 3 times in May?",
    criteria: "YES if Henry sends at least three visible low-volume nudges in #discos-booked or an adjacent sales channel during May 2026.",
    category: "fun",
    probability: 0.64,
    liquidity: 1300,
    days: 34,
  },
  {
    title: "Will the Max-bot emoji be used more than 10 times in Q2?",
    criteria: "YES if the Max-bot emoji appears more than 10 times across public company Slack channels in Q2 2026.",
    category: "fun",
    probability: 0.57,
    liquidity: 1200,
    days: 64,
  },
  {
    title: "Will anyone repeat the '50% contact rate, 100% booking rate' joke at least 3 times in Q2?",
    criteria: "YES if the joke or a clearly equivalent version appears at least three times in public Slack channels during Q2 2026.",
    category: "fun",
    probability: 0.41,
    liquidity: 1100,
    days: 64,
  },
  {
    title: "Will a single SDR post earn more than 5 champagne reactions in Q2?",
    criteria: "YES if any SDR disco post receives more than five champagne-style celebration reactions before July 1, 2026.",
    category: "fun",
    probability: 0.69,
    liquidity: 1250,
    days: 64,
  },
  {
    title: "Will Olivia top the Moss missing-receipts board in May?",
    criteria: "YES if Olivia is ranked number one on any final or official May Moss missing-receipts report.",
    category: "fun",
    probability: 0.33,
    liquidity: 1000,
    days: 34,
  },
  {
    title: "Will the kitchen get called out as chaos more than once in Q2?",
    criteria: "YES if public office Slack messages call out kitchen chaos, dishes, dishwasher issues, or similar more than once in Q2 2026.",
    category: "fun",
    probability: 0.74,
    liquidity: 1300,
    days: 64,
  },
  {
    title: "Will the company poker night finally materialize before end of Q2?",
    criteria: "YES if a company poker night is scheduled and actually happens before July 1, 2026.",
    category: "fun",
    probability: 0.27,
    liquidity: 900,
    days: 64,
  },
  {
    title: "Will the Berlin office move complete by end of Q2?",
    criteria: "YES if the Berlin coworking or office move is publicly confirmed as complete before July 1, 2026.",
    category: "business",
    probability: 0.52,
    liquidity: 1000,
    days: 64,
  },
  {
    title: "Will a Burkhard vs ecoplanet bot exchange happen in Q2?",
    criteria: "YES if a public Slack thread contains a playful exchange between Burkhard and an ecoplanet AI/bot account before July 1, 2026.",
    category: "fun",
    probability: 0.38,
    liquidity: 1000,
    days: 64,
  },
  {
    title: "Will any ecoplanet LinkedIn post cross 100 likes in Q2?",
    criteria: "YES if a public LinkedIn post by an ecoplanet employee or company account reaches at least 100 likes before July 1, 2026.",
    category: "business",
    probability: 0.46,
    liquidity: 1400,
    days: 64,
  },
  {
    title: "Will a new customer logo be announced before the next all-hands?",
    criteria: "YES if a new customer logo is shared in all-hands, Slack, CRM, or another official internal source before the next all-hands.",
    category: "business",
    probability: 0.58,
    liquidity: 1600,
    days: 21,
  },
  {
    title: "Will the slot machine pay a 250-credit jackpot to anyone this week?",
    criteria: "YES if any user reports or the app records a 250-credit Energy Slot payout within the next seven days.",
    category: "fun",
    probability: 0.31,
    liquidity: 900,
    days: 7,
  },
];

const MARKET_SUGGESTIONS = [
  {
    id: "sdr_top_may",
    type: "multiple",
    category: "business",
    title: "Who will be top SDR for May 2026?",
    criteria: "Count #discos-booked posts where the SDR posts a new disco in May 2026. Tiebreaker: total GWh booked.",
    resolves: "2026-06-01",
    options: ["Moritz Hoffmann", "Luis Feldhaeuser", "Martin Ortiz Lopez", "Chiara Lageveen", "Field"],
  },
  {
    id: "hypothesis_tag_may",
    type: "multiple",
    category: "business",
    title: "Most popular hypothesis tag in May 2026",
    criteria: "Count H1 and H2 tags in #discos-booked during May 2026. Treat H1&H2 as 0.5 each.",
    resolves: "2026-06-01",
    options: ["H1", "H2", "Tie"],
  },
  {
    id: "may_gwh_bucket",
    type: "multiple",
    category: "business",
    title: "Total GWh booked in May 2026",
    criteria: "Sum all GWh figures posted in #discos-booked during May 2026.",
    resolves: "2026-06-01",
    options: ["Under 500 GWh", "500-1000 GWh", "1000-2000 GWh", "Over 2000 GWh"],
  },
  {
    id: "arr_may_bucket",
    type: "multiple",
    category: "business",
    title: "Total ARR of new closed-won deals in May 2026",
    criteria: "Use official HubSpot or #full-team closed-won announcements for May 2026.",
    resolves: "2026-06-01",
    options: ["Under EUR 50k", "EUR 50-100k", "EUR 100-200k", "Over EUR 200k"],
  },
  {
    id: "production_incidents_q2",
    type: "multiple",
    category: "business",
    title: "Number of production incident announcements in Q2",
    criteria: "Count production incident announcements in #product-important in Q2 2026.",
    resolves: "2026-07-01",
    options: ["0", "1-2", "3-5", "6+"],
  },
  {
    id: "moss_receipts_may",
    type: "multiple",
    category: "fun",
    title: "Total missing receipts on the last May Moss report",
    criteria: "Use the final May Moss report and sum all missing receipts listed.",
    resolves: "2026-05-30",
    options: ["Under 80", "80-120", "120-180", "Over 180"],
  },
  {
    id: "sdr_120",
    type: "binary",
    category: "business",
    title: "Will the SDR team book at least 150 discos in May 2026?",
    criteria: "YES if #discos-booked contains at least 150 valid new discovery-call posts between May 1 and May 31, 2026.",
    resolves: "2026-06-01",
  },
  {
    id: "linked_in_shoutout",
    type: "binary",
    category: "business",
    title: "Will any customer publicly post about ecoplanet on LinkedIn in May?",
    criteria: "YES if a customer account or named customer employee posts a public ecoplanet-related LinkedIn shoutout in May 2026.",
    resolves: "2026-06-01",
  },
  {
    id: "series_b",
    type: "binary",
    category: "rumor",
    title: "Will ecoplanet announce a Series B by end of 2026?",
    criteria: "YES if a Series B financing announcement is publicly made by December 31, 2026.",
    resolves: "2026-12-31",
  },
  {
    id: "hundred_employees",
    type: "binary",
    category: "business",
    title: "Will ecoplanet cross 100 employees by end of 2026?",
    criteria: "YES if official headcount reaches at least 100 by December 31, 2026.",
    resolves: "2026-12-31",
  },
  {
    id: "dance_floor_first",
    type: "multiple",
    category: "fun",
    title: "Who will be first on the dance floor at the next company party?",
    criteria: "Resolve by first clearly visible dancing moment at the next company party, using public photos, videos, or witness consensus.",
    resolves: "2026-07-01",
    options: ["Henry", "Lukas", "Erin", "Basti", "Field"],
  },
  {
    id: "negroni_count",
    type: "multiple",
    category: "fun",
    title: "How many Negronis will be consumed by the core crew at the next party?",
    criteria: "Resolve by honest post-party self-report or visible drink count from the group. Keep it playful and do not shame anyone.",
    resolves: "2026-07-01",
    options: ["0-3", "4-7", "8-12", "13+"],
  },
  {
    id: "moss_top_may",
    type: "multiple",
    category: "fun",
    title: "Who tops the May Moss wall of shame?",
    criteria: "Use the final public May Moss report. If the named options do not win, Field wins.",
    resolves: "2026-05-30",
    options: ["Olivia", "Basti", "Max", "Lukas", "Field"],
  },
  {
    id: "kitchen_incident",
    type: "multiple",
    category: "fun",
    title: "Most dramatic kitchen incident of Q2",
    criteria: "Community vote at end of Q2 among incidents that were publicly visible in office channels.",
    resolves: "2026-07-01",
    options: ["Dishwasher drama", "Frat-house rant", "Oil bottle incident", "New contender"],
  },
  {
    id: "doenerstag_count",
    type: "multiple",
    category: "fun",
    title: "How many Doenerstag sightings happen in May?",
    criteria: "Count public Slack mentions of Doener Tag, Doenerstag, or equivalent office lunch sightings in May.",
    resolves: "2026-06-01",
    options: ["0", "1", "2-3", "4+"],
  },
  {
    id: "champagne_reactions",
    type: "multiple",
    category: "fun",
    title: "Highest champagne reactions on one SDR post in May",
    criteria: "Count champagne-style celebration reactions on the top single #discos-booked post in May.",
    resolves: "2026-06-01",
    options: ["0-3", "4-5", "6-8", "9+"],
  },
  {
    id: "max_self_thanks",
    type: "binary",
    category: "fun",
    title: "Will Max publicly thank himself in Q2?",
    criteria: "YES if Max posts a clearly self-congratulatory or self-thanking message in a public company Slack channel during Q2.",
    resolves: "2026-07-01",
  },
  {
    id: "bot_war",
    type: "binary",
    category: "fun",
    title: "Will a Burkhard vs ecoplanet bot exchange happen in Q2?",
    criteria: "YES if a public Slack thread contains a playful exchange between Burkhard and an ecoplanet AI/bot account before July 1.",
    resolves: "2026-07-01",
  },
  {
    id: "schneckenrennen",
    type: "binary",
    category: "fun",
    title: "Will Schneckenrennen be used to roast a slow project in Q2?",
    criteria: "YES if someone uses snail race / Schneckenrennen language for a slow project in a public Slack channel during Q2.",
    resolves: "2026-07-01",
  },
  {
    id: "almdudler",
    type: "binary",
    category: "fun",
    title: "Will Almdudler keep going strong in Q2?",
    criteria: "YES if Almdudler is referenced again in a public company channel before July 1.",
    resolves: "2026-07-01",
  },
  {
    id: "dizzy_daisy",
    type: "binary",
    category: "fun",
    title: "Will Dizzy Daisy be mentioned before the next party?",
    criteria: "YES if Dizzy Daisy appears in a public party-planning or office-life Slack message before the next company party.",
    resolves: "2026-07-01",
  },
  {
    id: "slot_jackpot",
    type: "binary",
    category: "fun",
    title: "Will anyone hit the 250-credit Energy Slot jackpot this week?",
    criteria: "YES if any user reports or the app records a 250-credit slot-machine payout within seven days of market launch.",
    resolves: "2026-05-05",
  },
  {
    id: "clay_credit",
    type: "binary",
    category: "business",
    title: "Will Max Jagi get public Clay-Leads credit at least once in May?",
    criteria: "YES if Max Jagi is publicly credited or thanked for Clay-Leads work in #discos-booked or adjacent channels during May.",
    resolves: "2026-06-01",
  },
  {
    id: "customer_praise",
    type: "binary",
    category: "business",
    title: "Will any prospect say 'geile Software' or equivalent praise in Q2?",
    criteria: "YES if a prospect/customer quote with equivalent strong praise appears in a public Slack channel before July 1.",
    resolves: "2026-07-01",
  },
  {
    id: "ronaldo_gif",
    type: "binary",
    category: "fun",
    title: "Will the Ronaldo gif become the canonical #discos-booked celebration?",
    criteria: "YES if the Ronaldo gif or a clearly equivalent reference appears at least three more times in #discos-booked during Q2.",
    resolves: "2026-07-01",
  },
  {
    id: "q2_party_outcome",
    type: "multiple",
    category: "fun",
    title: "What will be the most discussed next-party aftermath?",
    criteria: "Resolve by Monday-after Slack consensus and visible public mentions.",
    resolves: "2026-07-01",
    options: ["Dance floor", "Drinks", "Lost item", "Founder quote", "Unexpected hero"],
  },
  {
    id: "office_treats",
    type: "multiple",
    category: "fun",
    title: "How many cake or treat announcements happen in May?",
    criteria: "Count public office messages offering cake, sweets, slices, snacks, or treats during May.",
    resolves: "2026-06-01",
    options: ["0-2", "3-5", "6-10", "11+"],
  },
  {
    id: "first_big_arr",
    type: "binary",
    category: "business",
    title: "Will any closed-won deal cross EUR 100k ARR in 2026?",
    criteria: "YES if any official closed-won deal reaches at least EUR 100k ARR by December 31, 2026.",
    resolves: "2026-12-31",
  },
  {
    id: "office_customer_spotting",
    type: "binary",
    category: "fun",
    title: "Will someone spot a customer on the streets of Munich in May?",
    criteria: "YES if a public #muc-office or equivalent message reports a real customer sighting in Munich during May.",
    resolves: "2026-06-01",
  },
  {
    id: "burkhard_pun",
    type: "binary",
    category: "fun",
    title: "Will Burkhard include a light-bulb or spark pun in May?",
    criteria: "YES if Burkhard's weekly recap includes a light, bulb, spark, energy, or similar pun during May.",
    resolves: "2026-06-01",
  },
  {
    id: "public_departure_q2",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will any current employee publicly announce a departure in Q2?",
    criteria: "YES if a current employee publicly announces their own departure in an official or broadly visible company channel during Q2. Already-announced exits do not count.",
    resolves: "2026-07-01",
  },
  {
    id: "lilly_only_departure_q2",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Lilly be the only publicly announced departure in Q2?",
    criteria: "YES if Lilly remains the only pseudonymous/persona departure announced in broadly visible company channels during Q2. Already-announced Lilly exit counts as the baseline.",
    resolves: "2026-07-01",
  },
  {
    id: "lilly_sendoff_speech",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Lilly's farewell speech become a top-3 Slack moment of the week?",
    criteria: "YES if Lilly's farewell speech or sendoff gets one of the three highest reaction counts in public company Slack during that week.",
    resolves: "2026-07-01",
  },
  {
    id: "erin_wedding_next_event",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Erin's wedding be the next big company celebration topic?",
    criteria: "YES if Erin's wedding or wedding-adjacent celebration becomes the most discussed non-work celebration topic in public company channels before year-end.",
    resolves: "2026-12-31",
  },
  {
    id: "next_wedding_character",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Whose wedding becomes the next company lore moment?",
    criteria: "Resolve by public company-channel mentions and reactions. Names are treated as anonymized in-game handles from the source file.",
    resolves: "2026-12-31",
    options: ["Erin", "Henry", "Lukas", "Max", "Field"],
  },
  {
    id: "customer_bankruptcy_public",
    type: "spicy",
    category: "business",
    hrApproved: true,
    title: "Will any customer publicly file for insolvency before end of 2026?",
    criteria: "YES only if insolvency is confirmed by a public legal filing or official public company statement. Rumors do not count.",
    resolves: "2026-12-31",
  },
  {
    id: "customer_bankruptcy_trophy_bucket",
    type: "spicy",
    category: "business",
    hrApproved: true,
    title: "Which customer bucket has the first public insolvency scare?",
    criteria: "YES outcome is the bucket containing the first customer/prospect with public legal filing, official insolvency statement, or equivalent public distress confirmation before year-end. Rumors do not count.",
    resolves: "2026-12-31",
    options: ["Trophy accounts", "Manufacturing", "Healthcare", "Logistics", "No one"],
  },
  {
    id: "who_gets_roasted_next_allhands",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Who gets playfully roasted at the next all-hands?",
    criteria: "Resolve by public all-hands or Slack consensus. Only good-natured, work-context jokes count.",
    resolves: "2026-06-01",
    options: ["Sales", "Product", "Finance", "Founders", "No one dares"],
  },
  {
    id: "founder_quote_afterparty",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will a founder quote become the post-party meme?",
    criteria: "YES if a founder quote from the next party is referenced at least three times in public Slack within one week after the event.",
    resolves: "2026-07-01",
  },
  {
    id: "most_likely_to_vanish_after_party",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Which team vanishes first after the next party?",
    criteria: "Resolve by public party consensus. This is team-level only, no named individuals.",
    resolves: "2026-07-01",
    options: ["Sales", "Product", "Finance", "People", "Founders"],
  },
  {
    id: "flo_still_around",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Flo's farewell-but-still-around vibe persist in May?",
    criteria: "YES if Flo posts in a public company Slack channel at least once in May after his farewell moment.",
    resolves: "2026-06-01",
  },
  {
    id: "max_public_self_thanks",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Max publicly thank himself again in Q2?",
    criteria: "YES if Max posts a clearly self-thanking or self-crediting message in a public company channel during Q2.",
    resolves: "2026-07-01",
  },
  {
    id: "lukas_finance_wrong",
    type: "spicy",
    category: "people",
    hrApproved: true,
    title: "Will Lukas publicly admit a Finance forecast was wrong in Q2?",
    criteria: "YES if Lukas publicly states or jokes that a Finance forecast, runway estimate, or planning number was wrong during Q2.",
    resolves: "2026-07-01",
  },
];

const state = migrateState(loadState());
let tradeIntent = null;
let idleTimer = null;
let bonusSpinLocked = false;
let supabaseClient = null;
let supabaseMode = false;
let authMode = "login";
let selectedAvatar = AVATAR_OPTIONS[0];

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

function todayISO(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function dayKey(time = Date.now()) {
  return new Date(time).toISOString().slice(0, 10);
}

function money(value) {
  return Math.round(value).toLocaleString("en-US");
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const users = Array.from({ length: 5 }, (_, index) => ({
    id: uid("user"),
    name: names[index],
    avatar: AVATAR_OPTIONS[index % AVATAR_OPTIONS.length],
    createdAt: Date.now() - index * 86400000,
    wallet: 1000,
    ledger: [{ at: Date.now(), amount: 1000, reason: "Starting allocation" }],
  }));

  const markets = createSeedMarkets();

  const trades = [];
  const positions = {};

  const fresh = {
    currentUserId: users[0].id,
    users,
    adminProfiles: [],
    markets,
    trades,
    positions,
    gamification: {
      viewedRadar: {},
      claimedMissions: {},
    },
    seedVersion: SEED_VERSION,
    createdAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function migrateState(loaded) {
  if (loaded.seedVersion !== SEED_VERSION) {
    loaded.markets = createSeedMarkets();
    loaded.trades = [];
    loaded.positions = {};
    loaded.seedVersion = SEED_VERSION;
  }
  loaded.gamification ||= {};
  loaded.gamification.viewedRadar ||= {};
  loaded.gamification.claimedMissions ||= {};
  loaded.gamification.lastIdleBonusAt ||= {};
  loaded.gamification.idleBonusSpins ||= {};
  loaded.gamification.lastIdleBonusReward ||= {};
  loaded.gamification.lastIdleBonusCombo ||= {};
  loaded.adminProfiles ||= [];
  loaded.users.forEach((user) => ensureUserShape(user));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
  return loaded;
}

function createSeedMarkets() {
  return MARKET_SEEDS.map((market) =>
    seedMarket(market.title, market.criteria, market.category, market.probability, market.liquidity, market.days)
  );
}

function ensureUserGame(user) {
  user.game ||= {};
  user.game.xp ||= 0;
  user.game.streak ||= 0;
  user.game.lastActiveDay ||= null;
  user.game.badges ||= [];
}

function seedMarket(title, criteria, category, probability, liquidity, days) {
  const yesPool = liquidity * probability;
  const noPool = liquidity * (1 - probability);
  const now = Date.now();
  const history = Array.from({ length: 8 }, (_, index) => {
    const wobble = Math.sin(index * 1.2 + probability) * 0.045 + (Math.random() - 0.5) * 0.035;
    return {
      at: now - (7 - index) * 3600000 * 8,
      probability: clamp(probability + wobble, 0.05, 0.95),
    };
  });
  history.push({ at: now, probability });
  return {
    id: uid("market"),
    title,
    criteria,
    category,
    yesPool,
    noPool,
    createdAt: now - Math.random() * 86400000 * 4,
    closeDate: todayISO(days),
    status: "open",
    resolution: null,
    volume: Math.round(liquidity * (0.5 + Math.random())),
    creatorId: null,
    history,
  };
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setConnectionStatus(status, message) {
  const pill = $("#connectionPill");
  if (!pill) return;
  pill.classList.toggle("live", status === "live");
  pill.classList.toggle("error", status === "error");
  pill.textContent = message;
}

function normalizeUsername(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

function usernameToEmail(username) {
  return `${normalizeUsername(username)}@${AUTH_EMAIL_DOMAIN}`;
}

function parseAuthIdentity(value) {
  const raw = value.trim();
  if (raw.includes("@")) {
    throw new Error("Use a simple username only. No email needed here.");
  }

  const username = normalizeUsername(raw);
  if (username.length < 3) throw new Error("Pick a username with at least 3 characters.");
  return {
    email: usernameToEmail(username),
    username,
  };
}

function profileAvatar(user) {
  return user?.avatar || "?";
}

function isSupabaseSignedIn() {
  return Boolean(supabaseClient && supabaseMode);
}

function remoteMarketToLocal(market) {
  return {
    id: market.id,
    title: market.title,
    criteria: market.criteria,
    category: market.category,
    yesPool: Number(market.yes_pool),
    noPool: Number(market.no_pool),
    createdAt: new Date(market.created_at).getTime(),
    closeDate: market.close_at.slice(0, 10),
    status: market.status === "open" ? "open" : "resolved",
    resolution: market.resolution,
    volume: Number(market.volume || 0),
    creatorId: market.creator_id,
    history: [{ at: new Date(market.created_at).getTime(), probability: Number(market.yes_pool) / (Number(market.yes_pool) + Number(market.no_pool)) }],
  };
}

function remoteProfileToLocal(profile) {
  return {
    id: profile.id,
    name: profile.display_name,
    avatar: profile.avatar_seed || "?",
    createdAt: new Date(profile.created_at).getTime(),
    wallet: Number(profile.wallet_balance || 0),
    ledger: [{ at: Date.now(), amount: Number(profile.wallet_balance || 0), reason: "Supabase wallet" }],
    isAdmin: Boolean(profile.is_admin),
    game: { xp: 0, streak: 0, lastActiveDay: null, badges: [] },
  };
}

async function bootstrapSupabase() {
  if (!window.supabase?.createClient) {
    setConnectionStatus("error", IS_LIVE_BETA ? "Backend missing" : "Demo mode");
    if (IS_LIVE_BETA) toast("Live Beta needs the Supabase client to load.");
    return;
  }

  try {
    setConnectionStatus("demo", "Connecting...");
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    let { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
      supabaseMode = false;
      setConnectionStatus("error", "Sign in");
      renderAuthDialog();
      $("#authDialog").showModal();
      return;
    }

    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) throw userError;

    const userMeta = userData.user?.user_metadata || {};
    const preferredName = userMeta.display_name || currentUser()?.name || "Signal Desk";
    const { data: profile, error: profileError } = await supabaseClient.rpc("create_profile_for_current_user", {
      p_display_name: preferredName,
    });
    if (profileError) throw profileError;

    if (userMeta.avatar_seed && profile.avatar_seed !== userMeta.avatar_seed) {
      const { error: avatarError } = await supabaseClient.rpc("update_my_profile", {
        p_display_name: profile.display_name,
        p_avatar_seed: userMeta.avatar_seed,
      });
      if (!avatarError) profile.avatar_seed = userMeta.avatar_seed;
    }

    const { data: markets, error: marketsError } = await supabaseClient
      .from("markets")
      .select("*")
      .order("created_at", { ascending: false });
    if (marketsError) throw marketsError;

    const { data: history } = await supabaseClient
      .from("market_history")
      .select("market_id, probability, created_at")
      .order("created_at", { ascending: true });

    const remoteUser = remoteProfileToLocal(profile);
    ensureUserGame(remoteUser);
    state.currentUserId = remoteUser.id;
    state.users = await fetchLiveUsers(remoteUser);
    if (remoteUser.isAdmin) {
      const { data: profiles } = await supabaseClient
        .from("profiles")
        .select("id, display_name, avatar_seed, wallet_balance, is_admin, created_at")
        .order("created_at", { ascending: false });
      state.adminProfiles = (profiles || []).map(remoteProfileToLocal);
    } else {
      state.adminProfiles = [];
    }
    state.markets = (markets || []).map(remoteMarketToLocal);
    (history || []).forEach((point) => {
      const market = state.markets.find((item) => item.id === point.market_id);
      if (!market) return;
      market.history.push({ at: new Date(point.created_at).getTime(), probability: Number(point.probability) });
    });
    state.trades = [];
    state.positions = {};
    supabaseMode = true;
    setConnectionStatus("live", "Supabase live");
    save();
    render();
    if (userData?.user?.is_anonymous) toast("Connected with legacy anonymous Supabase account.");
  } catch (error) {
    supabaseMode = false;
    console.error(error);
    if (IS_LIVE_BETA || !DEMO_FALLBACK_ENABLED) {
      setConnectionStatus("error", "Live error");
      renderAuthDialog();
      if (!$("#authDialog").open) $("#authDialog").showModal();
      toast(`Live connection issue: ${error.message || "could not connect"}`);
      return;
    }
    setConnectionStatus("error", "Demo fallback");
    toast(`Demo fallback: ${error.message || "could not connect"}`);
  }
}

async function fetchLiveUsers(fallbackUser) {
  if (!supabaseClient) return [fallbackUser];
  const { data, error } = await supabaseClient.rpc("public_leaderboard");
  if (error || !data?.length) return [fallbackUser];
  return data.map(remoteProfileToLocal).map((user) => {
    if (user.id !== fallbackUser.id) return user;
    user.game = fallbackUser.game;
    return user;
  });
}

async function refreshSupabaseData() {
  if (!supabaseMode || !supabaseClient) return;

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", state.currentUserId)
    .single();
  if (profile) {
    const existingGame = currentUser()?.game;
    const remoteUser = remoteProfileToLocal(profile);
    remoteUser.game = existingGame || remoteUser.game;
    state.currentUserId = remoteUser.id;
    state.users = await fetchLiveUsers(remoteUser);
  }

  if (currentUser()?.isAdmin) {
    const { data: profiles } = await supabaseClient
      .from("profiles")
      .select("id, display_name, avatar_seed, wallet_balance, is_admin, created_at")
      .order("created_at", { ascending: false });
    state.adminProfiles = (profiles || []).map(remoteProfileToLocal);
  } else {
    state.adminProfiles = [];
  }

  const { data: markets, error: marketsError } = await supabaseClient
    .from("markets")
    .select("*")
    .order("created_at", { ascending: false });
  if (marketsError) throw marketsError;

  const { data: history } = await supabaseClient
    .from("market_history")
    .select("market_id, probability, created_at")
    .order("created_at", { ascending: true });

  state.markets = (markets || []).map(remoteMarketToLocal);
  (history || []).forEach((point) => {
    const market = state.markets.find((item) => item.id === point.market_id);
    if (!market) return;
    market.history.push({ at: new Date(point.created_at).getTime(), probability: Number(point.probability) });
  });

  save();
  render();
}

function currentUser() {
  return state.users.find((user) => user.id === state.currentUserId);
}

function ensureUserShape(user) {
  if (!user) return;
  if (!user.avatar) user.avatar = AVATAR_OPTIONS[Math.abs(user.name?.length || 0) % AVATAR_OPTIONS.length];
  ensureUserGame(user);
}

function probability(market) {
  return clamp(market.yesPool / (market.yesPool + market.noPool), 0.03, 0.97);
}

function sidePrice(market, side) {
  const yes = probability(market);
  return side === "yes" ? yes : 1 - yes;
}

function positionKey(userId, marketId, side) {
  return `${userId}:${marketId}:${side}`;
}

function getPosition(userId, marketId, side) {
  return state.positions[positionKey(userId, marketId, side)] || { userId, marketId, side, shares: 0, cost: 0 };
}

function setPosition(position) {
  state.positions[positionKey(position.userId, position.marketId, position.side)] = position;
}

function openPositions(userId) {
  return Object.values(state.positions).filter((pos) => pos.userId === userId && pos.shares > 0.01);
}

function portfolioValue(userId) {
  return openPositions(userId).reduce((sum, pos) => {
    const market = state.markets.find((item) => item.id === pos.marketId);
    if (!market || market.status !== "open") return sum;
    return sum + pos.shares * sidePrice(market, pos.side);
  }, 0);
}

function netWorth(user) {
  return user.wallet + portfolioValue(user.id);
}

function edgeScore(user) {
  const start = user.ledger.find((entry) => entry.reason === "Starting allocation")?.amount || 1000;
  const roi = ((netWorth(user) - start) / start) * 100;
  const activity = state.trades.filter((trade) => trade.userId === user.id).length * 4;
  return Math.round(roi * 8 + activity);
}

function addXp(user, amount, reason) {
  ensureUserGame(user);
  user.game.xp += amount;
  markActive(user);
  if (reason) user.ledger.push({ at: Date.now(), amount: 0, reason: `XP: ${reason}` });
}

function markActive(user) {
  ensureUserGame(user);
  const today = dayKey();
  const yesterday = dayKey(Date.now() - 86400000);
  if (user.game.lastActiveDay === today) return;
  user.game.streak = user.game.lastActiveDay === yesterday ? user.game.streak + 1 : 1;
  user.game.lastActiveDay = today;
}

function levelInfo(user) {
  ensureUserGame(user);
  const xpPerLevel = 120;
  const level = Math.floor(user.game.xp / xpPerLevel) + 1;
  const current = user.game.xp % xpPerLevel;
  return { level, current, xpPerLevel, percent: (current / xpPerLevel) * 100 };
}

function dailyMissions(user) {
  const today = dayKey();
  const tradesToday = state.trades.filter((trade) => trade.userId === user.id && dayKey(trade.at) === today);
  const createdToday = state.markets.filter((market) => market.creatorId === user.id && dayKey(market.createdAt) === today);
  const claimed = state.gamification.claimedMissions[`${user.id}:${today}`] || [];
  return [
    {
      id: "trade",
      title: "Make one call",
      detail: "Place any YES or NO trade",
      reward: 75,
      complete: tradesToday.length > 0,
    },
    {
      id: "radar",
      title: "Read the room",
      detail: "Open Rumor radar once",
      reward: 40,
      complete: state.gamification.viewedRadar[user.id] === today,
    },
    {
      id: "portfolio",
      title: "Diversify",
      detail: "Hold 2 open positions",
      reward: 60,
      complete: openPositions(user.id).length >= 2,
    },
    {
      id: "creator",
      title: "Drop a question",
      detail: "Create or launch a market idea",
      reward: 80,
      complete: createdToday.length > 0,
    },
  ].map((mission) => ({ ...mission, claimed: claimed.includes(mission.id) }));
}

function badgeCatalog(user) {
  const trades = state.trades.filter((trade) => trade.userId === user.id);
  const created = state.markets.filter((market) => market.creatorId === user.id);
  const rumorTrades = trades.filter((trade) => state.markets.find((market) => market.id === trade.marketId)?.category === "rumor");
  return [
    { id: "first_trade", label: "First call", icon: "1", earned: trades.length >= 1 },
    { id: "three_day", label: "3-day signal", icon: "3", earned: user.game.streak >= 3 },
    { id: "market_maker", label: "Market maker", icon: "+", earned: created.length >= 1 },
    { id: "rumor_hunter", label: "Rumor hunter", icon: "R", earned: rumorTrades.length >= 2 },
    { id: "big_swing", label: "Big swing", icon: "B", earned: trades.some((trade) => trade.amount >= 250) },
    { id: "diversified", label: "Diversified", icon: "D", earned: openPositions(user.id).length >= 3 },
  ];
}

function awardBadges(user) {
  ensureUserGame(user);
  const earned = badgeCatalog(user).filter((badge) => badge.earned);
  const fresh = earned.filter((badge) => !user.game.badges.includes(badge.id));
  fresh.forEach((badge) => user.game.badges.push(badge.id));
  if (fresh.length) {
    toast(`Badge unlocked: ${fresh.map((badge) => badge.label).join(", ")}.`);
  }
}

function marketMove(market) {
  const history = market.history;
  if (history.length < 2) return 0;
  return probability(market) - history[Math.max(0, history.length - 4)].probability;
}

function render() {
  renderUser();
  renderGamification();
  renderPersonas();
  renderLeaderboard();
  renderOverview();
  renderMarkets();
  renderSuggestions();
  renderMovement();
  renderPositions();
  renderAdmin();
}

function renderOverview() {
  const hottest = [...state.markets].sort((a, b) => b.volume - a.volume)[0];
  $("#overviewConsensus").textContent = hottest ? pct(probability(hottest)) : "50%";
}

function renderUser() {
  const user = currentUser();
  ensureUserShape(user);
  $("#currentUserAvatar").textContent = profileAvatar(user);
  $("#currentUserName").textContent = user.name;
  $("#currentUserMeta").textContent = user.isAdmin ? "admin desk" : isSupabaseSignedIn() ? "signed-in desk" : "demo desk";
  $("#signOutBtn").classList.toggle("hidden", !isSupabaseSignedIn());
  $("#newPersonaBtn").classList.toggle("hidden", isSupabaseSignedIn());
  $("#walletBalance").textContent = money(user.wallet);
  $("#portfolioValue").textContent = money(portfolioValue(user.id));
  $("#edgeScore").textContent = money(edgeScore(user));
}

function renderGamification() {
  const user = currentUser();
  ensureUserGame(user);
  const level = levelInfo(user);
  $("#streakPill").textContent = `${user.game.streak || 0} day${user.game.streak === 1 ? "" : "s"}`;
  $("#levelLabel").textContent = level.level;
  $("#xpFill").style.width = `${level.percent}%`;
  $("#xpLabel").textContent = `${level.current} / ${level.xpPerLevel} XP`;

  const missions = dailyMissions(user);
  $("#missionList").innerHTML = missions
    .map(
      (mission) => `
        <div class="mission ${mission.complete ? "complete" : ""}">
          <span class="mission-check">${mission.claimed ? "✓" : mission.complete ? "!" : ""}</span>
          <div>
            <strong>${esc(mission.title)}</strong>
            <span>${esc(mission.detail)}</span>
          </div>
          <span class="mission-reward">${mission.claimed ? "Done" : `+${mission.reward}`}</span>
        </div>
      `
    )
    .join("");

  const claimable = missions.some((mission) => mission.complete && !mission.claimed);
  $("#claimMissionsBtn").disabled = !claimable;
  $("#claimMissionsBtn").textContent = claimable ? "Claim rewards" : "All caught up";

  $("#badgeList").innerHTML = badgeCatalog(user)
    .map(
      (badge) => `
        <span class="badge ${badge.earned ? "" : "locked"}" title="${badge.earned ? "Unlocked" : "Locked"}">
          <span class="badge-icon">${esc(badge.icon)}</span>
          ${esc(badge.label)}
        </span>
      `
    )
    .join("");
}

function renderPersonas() {
  if (supabaseMode) {
    $("#personaList").innerHTML = `<p class="muted">Live mode: one real anonymous account per browser. Persona switching is disabled.</p>`;
    return;
  }
  $("#personaList").innerHTML = state.users
    .map(
      (user) => `
      <button class="persona ${user.id === state.currentUserId ? "active" : ""}" data-user="${user.id}">
        <span>${esc(profileAvatar(user))} ${esc(user.name)}</span>
        <strong>${money(netWorth(user))}</strong>
      </button>
    `
    )
    .join("");
}

function renderLeaderboard() {
  const ranked = [...state.users].sort((a, b) => netWorth(b) - netWorth(a));
  $("#leaderboard").innerHTML = ranked
    .map((user, index) => {
      const leaderBoost = index === 0 ? "Momentum leader" : `${edgeScore(user)} edge`;
      return `
        <li>
          <span class="rank">${index + 1}</span>
          <div>
            <strong>${esc(user.name)}</strong>
            <div class="muted">${leaderBoost}</div>
          </div>
          <strong>${money(netWorth(user))}</strong>
        </li>
      `;
    })
    .join("");
}

function filteredMarkets() {
  const q = $("#searchInput").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const sort = $("#sortFilter").value;
  const list = state.markets.filter((market) => {
    const categoryMatch = category === "all" || market.category === category;
    const queryMatch = !q || `${market.title} ${market.criteria} ${market.category}`.toLowerCase().includes(q);
    return categoryMatch && queryMatch;
  });

  return list.sort((a, b) => {
    if (sort === "move") return Math.abs(marketMove(b)) - Math.abs(marketMove(a));
    if (sort === "close") return new Date(a.closeDate) - new Date(b.closeDate);
    if (sort === "new") return b.createdAt - a.createdAt;
    return b.volume - a.volume;
  });
}

function renderMarkets() {
  const markets = filteredMarkets();
  $("#marketGrid").innerHTML = markets.map(renderMarketCard).join("");
  markets.forEach((market) => drawSparkline(`spark-${market.id}`, market.history));
}

function filteredSuggestions() {
  const q = ($("#suggestionSearchInput")?.value || "").trim().toLowerCase();
  const type = $("#suggestionTypeFilter")?.value || "all";
  return MARKET_SUGGESTIONS.filter((suggestion) => {
    const typeMatch = type === "all" || suggestion.type === type || (type === "multiple" && suggestion.options?.length);
    const queryText = `${suggestion.title} ${suggestion.criteria} ${(suggestion.options || []).join(" ")}`.toLowerCase();
    return typeMatch && (!q || queryText.includes(q));
  });
}

function renderSuggestions() {
  const grid = $("#suggestionGrid");
  if (!grid) return;
  const suggestions = filteredSuggestions();
  grid.innerHTML = suggestions.map(renderSuggestionCard).join("");
}

function renderSuggestionCard(suggestion) {
  const isMultiple = Boolean(suggestion.options?.length);
  const typeLabel = suggestion.type === "spicy" ? "HR spicy" : isMultiple ? "multiple choice" : "yes/no";
  const options = isMultiple
    ? `<div class="option-grid">
        ${suggestion.options
          .map((option) => `<button data-suggestion-option="${suggestion.id}" data-option="${esc(option)}">${esc(option)}</button>`)
          .join("")}
      </div>`
    : `<button class="primary" data-suggestion="${suggestion.id}">Launch market</button>`;
  return `
    <article class="suggestion-card ${suggestion.type === "spicy" ? "spicy" : ""}">
      <div class="tag-row">
        <span class="tag">${esc(suggestion.category)}</span>
        <span class="tag ${suggestion.type === "spicy" ? "bad" : "hot"}">${esc(typeLabel)}</span>
        ${suggestion.hrApproved ? `<span class="tag good">HR approved</span>` : ""}
        <span class="tag">Resolves ${esc(suggestion.resolves)}</span>
      </div>
      <h3>${esc(suggestion.title)}</h3>
      <p>${esc(suggestion.criteria)}</p>
      ${suggestion.type === "spicy" ? `<p class="spicy-note">HR spicy lane. Names are treated as anonymized in-game handles from the seed file; confirm the resolution source before publishing.</p>` : ""}
      ${options}
    </article>
  `;
}

function renderMarketCard(market) {
  const p = probability(market);
  const move = marketMove(market);
  const closed = market.status !== "open";
  const myYes = getPosition(state.currentUserId, market.id, "yes").shares;
  const myNo = getPosition(state.currentUserId, market.id, "no").shares;
  return `
    <article class="market-card">
      <div class="market-top">
        <div>
          <h3 class="market-title">${esc(market.title)}</h3>
          <div class="tag-row">
            <span class="tag">${esc(market.category)}</span>
            <span class="tag hot">${money(market.volume)} volume</span>
            <span class="tag ${move >= 0 ? "good" : "bad"}">${move >= 0 ? "+" : ""}${Math.round(move * 100)} pts</span>
            ${closed ? `<span class="tag">${market.resolution}</span>` : ""}
          </div>
        </div>
        <div class="probability">
          <strong>${pct(p)}</strong>
          <span class="muted">YES</span>
        </div>
      </div>
      <div class="prob-bar"><div class="prob-fill" style="width:${p * 100}%"></div></div>
      <div class="movement-strip">
        <div class="movement-strip-header">
          <span>Market movement</span>
          <strong>${move >= 0 ? "+" : ""}${Math.round(move * 100)} pts</strong>
        </div>
        <canvas class="sparkline" id="spark-${market.id}" width="600" height="132"></canvas>
      </div>
      <p class="muted">${esc(market.criteria)}</p>
      <div class="tag-row">
        <span class="tag">Closes ${market.closeDate}</span>
        <span class="tag">You: YES ${myYes.toFixed(1)} / NO ${myNo.toFixed(1)}</span>
      </div>
      <div class="card-actions">
        <button class="yes-btn" data-trade="${market.id}" data-side="yes" ${closed ? "disabled" : ""}>Buy YES</button>
        <button class="no-btn" data-trade="${market.id}" data-side="no" ${closed ? "disabled" : ""}>Buy NO</button>
      </div>
    </article>
  `;
}

function drawSparkline(id, history) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#f7f9ff";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#dfe5ff";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  if (history.length < 2) return;
  const start = history[0].probability;
  const end = history[history.length - 1].probability;
  const gradient = ctx.createLinearGradient(0, 0, w, 0);
  gradient.addColorStop(0, "#1a2fee");
  gradient.addColorStop(0.55, "#7582f6");
  gradient.addColorStop(1, end >= start ? "#00b8d9" : "#c33b2f");
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  history.forEach((point, index) => {
    const x = (index / (history.length - 1)) * (w - 24) + 12;
    const y = h - (point.probability * (h - 24) + 12);
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  const last = history[history.length - 1];
  const x = w - 12;
  const y = h - (last.probability * (h - 24) + 12);
  ctx.fillStyle = end >= start ? "#00b8d9" : "#c33b2f";
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
}

function renderMovement() {
  const movers = [...state.markets]
    .filter((market) => market.status === "open")
    .sort((a, b) => Math.abs(marketMove(b)) - Math.abs(marketMove(a)))
    .slice(0, 8);
  $("#movementList").innerHTML = movers
    .map((market) => {
      const move = marketMove(market);
      return `
      <div class="movement">
        <div>
          <strong>${esc(market.title)}</strong>
          <span class="muted">${pct(probability(market))} YES now. ${esc(market.category)} market.</span>
        </div>
        <span class="delta ${move < 0 ? "down" : ""}">${move >= 0 ? "+" : ""}${Math.round(move * 100)} pts</span>
      </div>`;
    })
    .join("");
}

function renderPositions() {
  const positions = openPositions(state.currentUserId);
  if (!positions.length) {
    $("#positionsList").innerHTML = `<p class="muted">No open positions yet. Place a trade and your book will show up here.</p>`;
    return;
  }
  $("#positionsList").innerHTML = positions
    .map((pos) => {
      const market = state.markets.find((item) => item.id === pos.marketId);
      const value = market && market.status === "open" ? pos.shares * sidePrice(market, pos.side) : 0;
      const pnl = value - pos.cost;
      return `
        <div class="position">
          <div class="position-row">
            <div>
              <strong>${esc(market?.title || "Market")}</strong>
              <div class="muted">${pos.side.toUpperCase()} ${pos.shares.toFixed(2)} shares at ${money(pos.cost)} cost</div>
            </div>
            <strong class="${pnl >= 0 ? "delta" : "delta down"}">${pnl >= 0 ? "+" : ""}${money(pnl)}</strong>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAdmin() {
  if (supabaseMode && !currentUser().isAdmin) {
    $("#adminList").innerHTML = `<p class="muted">Admin tools are hidden in live mode unless this Supabase profile has <strong>is_admin = true</strong>.</p>`;
    return;
  }
  const userList =
    supabaseMode && currentUser().isAdmin
      ? `
        <div class="admin-item">
          <div class="admin-row">
            <div>
              <strong>User desk list</strong>
              <div class="muted">Visible only to admin profiles.</div>
            </div>
            <span class="tag">${state.adminProfiles.length} users</span>
          </div>
          <div class="user-admin-list">
            ${state.adminProfiles
              .map(
                (profile) => `
                <div>
                  <span>${esc(profileAvatar(profile))} ${esc(profile.name)}</span>
                  <strong>${profile.isAdmin ? "Admin" : money(profile.wallet)}</strong>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      `
      : "";

  const marketList = state.markets
    .map(
      (market) => `
      <div class="admin-item">
        <div class="admin-row">
          <div>
            <strong>${esc(market.title)}</strong>
            <div class="muted">${market.status === "open" ? `${pct(probability(market))} YES, closes ${market.closeDate}` : `Resolved ${market.resolution}`}</div>
          </div>
          <span class="tag">${market.category}</span>
        </div>
        ${
          market.status === "open"
            ? `<div class="resolve-actions">
                <button class="yes-btn" data-resolve="${market.id}" data-result="yes">Resolve YES</button>
                <button class="no-btn" data-resolve="${market.id}" data-result="no">Resolve NO</button>
                <button class="ghost" data-resolve="${market.id}" data-result="void">Void</button>
              </div>`
            : ""
        }
      </div>
    `
    )
    .join("");
  $("#adminList").innerHTML = userList + marketList;
}

async function placeTrade(marketId, side, amount) {
  const market = state.markets.find((item) => item.id === marketId);
  const user = currentUser();
  if (!market || market.status !== "open") {
    toast("Market is closed.");
    return false;
  }
  if (amount <= 0 || amount > user.wallet) {
    toast("Not enough credits for that trade.");
    return false;
  }

  if (supabaseMode && supabaseClient) {
    const { error } = await supabaseClient.rpc("place_trade", { market_id: marketId, side, amount });
    if (error) {
      toast(`Trade failed: ${error.message}`);
      return false;
    }
    addXp(user, Math.min(45, 15 + Math.round(amount / 20)), "trade placed");
    awardBadges(user);
    await refreshSupabaseData();
    pulseSpark();
    toast(`Trade placed: ${money(amount)} on ${side.toUpperCase()}.`);
    return true;
  }

  const price = sidePrice(market, side);
  const shares = amount / clamp(price, 0.05, 0.95);
  user.wallet -= amount;
  user.ledger.push({ at: Date.now(), amount: -amount, reason: `Bought ${side.toUpperCase()} on ${market.title}` });

  if (side === "yes") market.yesPool += amount;
  else market.noPool += amount;
  market.volume += amount;
  market.history.push({ at: Date.now(), probability: probability(market) });

  const pos = getPosition(user.id, marketId, side);
  pos.shares += shares;
  pos.cost += amount;
  setPosition(pos);

  state.trades.push({ id: uid("trade"), userId: user.id, marketId, side, amount, shares, price, at: Date.now() });
  addXp(user, Math.min(45, 15 + Math.round(amount / 20)), "trade placed");
  awardBadges(user);
  save();
  render();
  pulseSpark();
  toast(`Trade placed: ${money(amount)} on ${side.toUpperCase()}.`);
  return true;
}

async function resolveMarket(marketId, result) {
  const market = state.markets.find((item) => item.id === marketId);
  if (!market || market.status !== "open") return;

  if (supabaseMode && supabaseClient) {
    const { error } = await supabaseClient.rpc("resolve_market", { market_id: marketId, result });
    if (error) return toast(`Resolve failed: ${error.message}`);
    await refreshSupabaseData();
    toast(result === "void" ? "Market voided and stakes returned." : `Resolved ${result.toUpperCase()}. Payouts posted.`);
    return;
  }

  market.status = "resolved";
  market.resolution = result;

  Object.values(state.positions)
    .filter((pos) => pos.marketId === marketId && pos.shares > 0)
    .forEach((pos) => {
      const user = state.users.find((item) => item.id === pos.userId);
      if (!user) return;
      let payout = 0;
      if (result === "void") payout = pos.cost;
      if (result === pos.side) payout = pos.shares;
      if (payout > 0) {
        user.wallet += payout;
        user.ledger.push({ at: Date.now(), amount: payout, reason: `Payout: ${market.title}` });
      }
      pos.shares = 0;
    });

  save();
  render();
  toast(result === "void" ? "Market voided and stakes returned." : `Resolved ${result.toUpperCase()}. Payouts posted.`);
}

async function createMarket({ title, criteria, category, closeDate, initialProbability, liquidity }) {
  const p = clamp(initialProbability / 100, 0.05, 0.95);
  if (supabaseMode && supabaseClient) {
    const { error } = await supabaseClient.from("markets").insert({
      title,
      criteria,
      category,
      close_at: new Date(`${closeDate}T18:00:00`).toISOString(),
      creator_id: state.currentUserId,
      yes_pool: liquidity * p,
      no_pool: liquidity * (1 - p),
      volume: 0,
    });
    if (error) {
      toast(`Market failed: ${error.message}`);
      return false;
    }
    const user = currentUser();
    addXp(user, 35, "market created");
    awardBadges(user);
    await refreshSupabaseData();
    pulseSpark();
    launchMarketConfetti();
    toast("Market launched.");
    return true;
  }

  state.markets.unshift({
    id: uid("market"),
    title,
    criteria,
    category,
    yesPool: liquidity * p,
    noPool: liquidity * (1 - p),
    createdAt: Date.now(),
    closeDate,
    status: "open",
    resolution: null,
    volume: 0,
    creatorId: state.currentUserId,
    history: [{ at: Date.now(), probability: p }],
  });
  const user = currentUser();
  addXp(user, 35, "market created");
  awardBadges(user);
  save();
  render();
  pulseSpark();
  launchMarketConfetti();
  toast("Market launched.");
  return true;
}

function newPersona() {
  if (supabaseMode) return toast("Live mode uses one anonymous account per browser.");
  const used = new Set(state.users.map((user) => user.name));
  const name = names.find((item) => !used.has(item)) || `Anonymous ${state.users.length + 1}`;
  const user = {
    id: uid("user"),
    name,
    avatar: AVATAR_OPTIONS[state.users.length % AVATAR_OPTIONS.length],
    createdAt: Date.now(),
    wallet: 1000,
    ledger: [{ at: Date.now(), amount: 1000, reason: "Starting allocation" }],
  };
  ensureUserGame(user);
  state.users.push(user);
  state.currentUserId = user.id;
  save();
  render();
  toast(`Joined as ${name}.`);
}

function airdrop() {
  if (supabaseMode) {
    toast("Weekly drops need admin-controlled server payouts in Live Beta.");
    return;
  }
  const user = currentUser();
  const leaders = [...state.users].sort((a, b) => netWorth(b) - netWorth(a));
  const rank = leaders.findIndex((item) => item.id === user.id) + 1;
  const bonus = rank === 1 ? 150 : rank <= 3 ? 75 : 50;
  user.wallet += 250 + bonus;
  user.ledger.push({ at: Date.now(), amount: 250 + bonus, reason: `Weekly token drop with rank ${rank} momentum bonus` });
  addXp(user, 20, "weekly drop claimed");
  awardBadges(user);
  save();
  render();
  pulseSpark();
  toast(`Token drop: ${250 + bonus} credits. Rank ${rank} momentum bonus included.`);
}

function daysUntil(dateString) {
  const target = new Date(`${dateString}T18:00:00`);
  const diff = target.getTime() - Date.now();
  return Math.max(1, Math.ceil(diff / 86400000));
}

async function launchSuggestion(id, option = null) {
  const suggestion = MARKET_SUGGESTIONS.find((item) => item.id === id);
  if (!suggestion) return false;
  const isOption = Boolean(suggestion.options?.length && option);
  const title = isOption ? `Will "${option}" win: ${suggestion.title}?` : suggestion.title;
  const prefix = suggestion.type === "spicy" ? "HR-approved spicy market. Names are anonymized in-game handles from the seed file. " : "";
  const criteria = prefix + (isOption
    ? `YES if "${option}" is the final winning outcome. ${suggestion.criteria}`
    : suggestion.criteria);
  const created = await createMarket({
    title,
    criteria,
    category: suggestion.category,
    closeDate: suggestion.resolves,
    initialProbability: isOption ? Math.max(10, Math.round(100 / suggestion.options.length)) : 50,
    liquidity: isOption ? 900 : 1200,
  });
  if (created) activateView("markets");
  return created;
}

async function launchTopSuggestions() {
  const top = MARKET_SUGGESTIONS.slice(0, 3);
  for (const suggestion of top) {
    if (suggestion.type === "multiple") {
      await launchSuggestion(suggestion.id, suggestion.options[0]);
    } else {
      await launchSuggestion(suggestion.id);
    }
  }
  toast("Top suggestions launched.");
}

function claimMissions() {
  if (supabaseMode) {
    toast("Live Beta mission rewards are tracked locally for now; token payouts stay server-backed.");
    return;
  }
  const user = currentUser();
  const today = dayKey();
  const key = `${user.id}:${today}`;
  const claimed = state.gamification.claimedMissions[key] || [];
  const missions = dailyMissions(user);
  const claimable = missions.filter((mission) => mission.complete && !mission.claimed);
  if (!claimable.length) return toast("No completed missions to claim yet.");

  const credits = claimable.reduce((sum, mission) => sum + mission.reward, 0);
  const xp = claimable.length * 30;
  user.wallet += credits;
  user.ledger.push({ at: Date.now(), amount: credits, reason: "Daily mission rewards" });
  addXp(user, xp, "daily missions");
  state.gamification.claimedMissions[key] = [...claimed, ...claimable.map((mission) => mission.id)];
  awardBadges(user);
  save();
  render();
  pulseSpark();
  toast(`Daily rewards claimed: ${credits} credits and ${xp} XP.`);
}

function resetIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(showIdleBonusDialog, IDLE_BONUS_MS);
}

function showIdleBonusDialog() {
  const user = currentUser();
  const now = Date.now();
  const anyDialogOpen = $$("dialog").some((dialog) => dialog.open);
  if (anyDialogOpen) {
    resetIdleTimer();
    return;
  }

  state.gamification.lastIdleBonusAt[user.id] = now;
  save();
  bonusSpinLocked = false;
  $("#spinBonusBtn").disabled = false;
  $("#spinBonusBtn").textContent = "Spin once";
  $("#bonusResult").classList.remove("win");
  $("#bonusResult").textContent = "One spin. Clear odds. Real dopamine.";
  $("#slotOne").textContent = "❓";
  $("#slotTwo").textContent = "❓";
  $("#slotThree").textContent = "❓";
  $("#idleBonusDialog").showModal();
}

async function spinIdleBonus() {
  if (bonusSpinLocked) return;
  bonusSpinLocked = true;
  $("#spinBonusBtn").disabled = true;
  $("#spinBonusBtn").textContent = "Spinning...";

  const reels = [$("#slotOne"), $("#slotTwo"), $("#slotThree")];
  const symbols = ["🍒", "💰", "💃", "🌴", "💎", "🍋", "🍀", "⚡", "🏆", "🔥"];
  reels.forEach((reel) => reel.classList.add("spinning"));

  const tick = window.setInterval(() => {
    reels.forEach((reel) => {
      reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    });
  }, 90);

  window.setTimeout(async () => {
    window.clearInterval(tick);
    reels.forEach((reel) => reel.classList.remove("spinning"));
    const reward = await claimIdleBonusReward();
    const finalSymbols = finalSlotSymbols(reward);
    reels.forEach((reel, index) => {
      reel.textContent = finalSymbols[index];
    });
    applyIdleBonusReward(reward);
  }, 1350);
}

async function claimIdleBonusReward() {
  if (!supabaseMode || !supabaseClient) return drawIdleBonusReward();
  const { data, error } = await supabaseClient.rpc("claim_slot_reward");
  if (error) {
    toast(`Slot reward failed: ${error.message}`);
    return 0;
  }
  return Number(data || 0);
}

function drawIdleBonusReward() {
  const rewards = [
    { value: 0, weight: 35 },
    { value: 25, weight: 30 },
    { value: 50, weight: 20 },
    { value: 100, weight: 10 },
    { value: 250, weight: 5 },
  ];
  const total = rewards.reduce((sum, reward) => sum + reward.weight, 0);
  let roll = Math.random() * total;
  for (const reward of rewards) {
    roll -= reward.weight;
    if (roll <= 0) return reward.value;
  }
  return rewards[rewards.length - 1].value;
}

function finalSlotSymbols(reward) {
  const user = currentUser();
  const combos = {
    250: [["💎", "💎", "💎"], ["💰", "💎", "💰"], ["🏆", "💎", "🏆"]],
    100: [["💰", "💰", "💰"], ["🍒", "💰", "🍒"], ["⚡", "💰", "⚡"]],
    50: [["🍒", "🍒", "🍒"], ["🍀", "🍒", "🍀"], ["💃", "🍒", "💃"]],
    25: [["🍀", "🍀", "🍀"], ["🍋", "🍀", "🍋"], ["🌴", "🍀", "🌴"]],
    0: [["🍋", "❓", "🍋"], ["🌴", "🍒", "💃"], ["⚡", "🍋", "🍀"], ["💃", "🌴", "❓"], ["🍒", "🍋", "🌴"]],
  };
  const pool = combos[reward] || combos[0];
  const previous = state.gamification.lastIdleBonusCombo[user.id];
  const available = pool.filter((combo) => combo.join("") !== previous);
  const combo = (available.length ? available : pool)[Math.floor(Math.random() * (available.length ? available.length : pool.length))];
  state.gamification.lastIdleBonusCombo[user.id] = combo.join("");
  return combo;
}

function applyIdleBonusReward(reward) {
  const user = currentUser();
  state.gamification.idleBonusSpins[user.id] = (state.gamification.idleBonusSpins[user.id] || 0) + 1;
  state.gamification.lastIdleBonusReward[user.id] = reward;
  markActive(user);

  if (reward > 0) {
    user.wallet += reward;
    user.ledger.push({ at: Date.now(), amount: reward, reason: "Idle bonus spin" });
    addXp(user, Math.min(40, 10 + Math.round(reward / 10)), "idle bonus");
    $("#bonusResult").classList.add("win");
    $("#bonusResult").textContent = `You won ${reward} credits. Back to the floor.`;
    launchMarketConfetti();
    toast(`Idle bonus: ${reward} credits.`);
  } else {
    addXp(user, 5, "idle bonus attempt");
    $("#bonusResult").classList.remove("win");
    $("#bonusResult").textContent = "No credits this time. You still earned 5 XP.";
  }

  awardBadges(user);
  save();
  render();
  pulseSpark();
  $("#spinBonusBtn").textContent = "Spin used";
  resetIdleTimer();
}

function pulseSpark() {
  const panel = document.querySelector(".spark-panel");
  if (!panel) return;
  panel.classList.remove("spark-pop");
  void panel.offsetWidth;
  panel.classList.add("spark-pop");
}

function particleLayer() {
  let layer = document.querySelector(".particle-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "particle-layer";
    document.body.appendChild(layer);
  }
  return layer;
}

function launchMarketConfetti() {
  const colors = ["#1a2fee", "#00095b", "#e2ec2b", "#7582f6", "#ffffff"];
  const layer = particleLayer();
  for (let i = 0; i < 180; i += 1) {
    const particle = document.createElement("span");
    particle.className = "celebration-particle";
    const size = 7 + Math.random() * 14;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty("--size", `${size}px`);
    particle.style.setProperty("--radius", Math.random() > 0.75 ? "99px" : "2px");
    particle.style.setProperty("--color", colors[Math.floor(Math.random() * colors.length)]);
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 520}px`);
    particle.style.setProperty("--spin", `${(Math.random() > 0.5 ? 1 : -1) * (260 + Math.random() * 900)}deg`);
    particle.style.setProperty("--duration", `${1200 + Math.random() * 1600}ms`);
    particle.style.setProperty("--delay", `${Math.random() * 550}ms`);
    layer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
  window.setTimeout(() => {
    if (!layer.children.length) layer.remove();
  }, 3600);
}

function launchExitSadness() {
  const layer = particleLayer();
  const symbols = ["👎", "☹️", "😢", "💔", "nooo"];
  for (let i = 0; i < 70; i += 1) {
    const particle = document.createElement("span");
    particle.className = "celebration-particle emoji";
    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty("--font-size", `${18 + Math.random() * 24}px`);
    particle.style.setProperty("--drift", `${(Math.random() - 0.5) * 360}px`);
    particle.style.setProperty("--spin", `${(Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 420)}deg`);
    particle.style.setProperty("--duration", `${900 + Math.random() * 900}ms`);
    particle.style.setProperty("--delay", `${Math.random() * 180}ms`);
    layer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
  window.setTimeout(() => {
    if (!layer.children.length) layer.remove();
  }, 2400);
}

function generateProposals() {
  const raw = $("#proposalText").value.trim();
  if (!raw) return toast("Paste some Slack or Notion text first.");
  const lines = raw
    .split(/[.\n!?]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 18)
    .slice(0, 8);

  const proposalList = lines.map((line) => {
    const cleaned = line.replace(/^[-*]\s*/, "");
    const category = /founder|announce|hiring|budget|ship|release|sales|target|customer/i.test(cleaned) ? "business" : "rumor";
    const title = questionFromText(cleaned);
    return { title, criteria: `YES if this is confirmed by an official company source or visible outcome within 30 days. Source text: "${cleaned.slice(0, 120)}"`, category };
  });

  $("#proposalList").innerHTML = proposalList
    .map(
      (proposal) => `
      <div class="proposal">
        <strong>${esc(proposal.title)}</strong>
        <span class="muted">${esc(proposal.criteria)}</span>
        <button class="primary" data-proposal='${encodeURIComponent(JSON.stringify(proposal))}'>Launch this</button>
      </div>
    `
    )
    .join("");
}

function questionFromText(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (/will\b/i.test(clean)) return clean.endsWith("?") ? clean : `${clean}?`;
  if (/ship|release|launch/i.test(clean)) return `Will ${clean.charAt(0).toLowerCase()}${clean.slice(1)} within 30 days?`;
  if (/budget|approve|finance/i.test(clean)) return `Will Finance confirm that ${clean.charAt(0).toLowerCase()}${clean.slice(1)}?`;
  if (/founder|announce|all-hands/i.test(clean)) return `Will leadership confirm: ${clean}?`;
  return `Will this rumor be confirmed: ${clean}?`;
}

function toast(message) {
  const toastEl = $("#toast");
  toastEl.textContent = message;
  toastEl.classList.add("show");
  window.clearTimeout(toastEl.timer);
  toastEl.timer = window.setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function setAuthMessage(message, type = "info") {
  const messageEl = $("#authMessage");
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `auth-message show ${type}`;
}

function clearAuthMessage() {
  const messageEl = $("#authMessage");
  if (!messageEl) return;
  messageEl.textContent = "";
  messageEl.className = "auth-message";
}

function bindEvents() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activateView(tab.dataset.view);
    });
  });

  $("#startTutorialBtn").addEventListener("click", () => activateView("tutorial"));
  $("#startTradingBtn").addEventListener("click", () => activateView("markets"));
  $("#tutorialCreateBtn").addEventListener("click", () => openCreateDialog());

  $("#openCreateBtn").addEventListener("click", () => openCreateDialog());
  $("#openAuthBtn").addEventListener("click", () => {
    renderAuthDialog();
    $("#authDialog").showModal();
  });
  $("#signOutBtn").addEventListener("click", signOut);
  $("#claimMissionsBtn").addEventListener("click", claimMissions);
  $("#spinBonusBtn").addEventListener("click", spinIdleBonus);
  $("#launchTopSuggestionsBtn").addEventListener("click", launchTopSuggestions);

  $$("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => closeDialog(button.dataset.closeDialog));
  });

  $$("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  $("#avatarPicker").addEventListener("click", (event) => {
    const avatar = event.target.closest("[data-avatar]");
    if (!avatar) return;
    selectedAvatar = avatar.dataset.avatar;
    renderAuthDialog();
  });

  $("#saveAuthBtn").addEventListener("click", handleAuthSubmit);

  $$("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  $("#saveMarketBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    const title = $("#marketTitleInput").value.trim();
    const criteria = $("#marketCriteriaInput").value.trim();
    const closeDate = $("#marketCloseInput").value;
    if (!title || !criteria || !closeDate) return toast("Question, criteria, and close date are required.");
    const created = await createMarket({
      title,
      criteria,
      category: $("#marketCategoryInput").value,
      closeDate,
      initialProbability: Number($("#marketProbInput").value),
      liquidity: Number($("#marketLiquidityInput").value),
    });
    if (!created) return;
    $("#marketDialog").close();
    $("#marketTitleInput").value = "";
    $("#marketCriteriaInput").value = "";
  });

  $("#newPersonaBtn").addEventListener("click", newPersona);
  $("#airdropBtn").addEventListener("click", airdrop);
  $("#seedBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });

  ["searchInput", "categoryFilter", "sortFilter"].forEach((id) => {
    $(`#${id}`).addEventListener("input", renderMarkets);
  });

  ["suggestionSearchInput", "suggestionTypeFilter"].forEach((id) => {
    $(`#${id}`).addEventListener("input", renderSuggestions);
  });

  document.body.addEventListener("click", (event) => {
    const persona = event.target.closest("[data-user]");
    if (persona) {
      state.currentUserId = persona.dataset.user;
      save();
      render();
    }

    const tradeButton = event.target.closest("[data-trade]");
    if (tradeButton) {
      const market = state.markets.find((item) => item.id === tradeButton.dataset.trade);
      tradeIntent = { marketId: market.id, side: tradeButton.dataset.side };
      $("#tradeSideLabel").textContent = `Buy ${tradeIntent.side.toUpperCase()}`;
      $("#tradeTitle").textContent = market.title;
      $("#tradeAmountInput").value = 50;
      updateTradePreview();
      $("#tradeDialog").showModal();
    }

    const stake = event.target.closest("[data-stake]");
    if (stake) {
      $("#tradeAmountInput").value = stake.dataset.stake;
      updateTradePreview();
    }

    const resolveButton = event.target.closest("[data-resolve]");
    if (resolveButton) resolveMarket(resolveButton.dataset.resolve, resolveButton.dataset.result);

    const suggestionButton = event.target.closest("[data-suggestion]");
    if (suggestionButton) launchSuggestion(suggestionButton.dataset.suggestion);

    const optionButton = event.target.closest("[data-suggestion-option]");
    if (optionButton) launchSuggestion(optionButton.dataset.suggestionOption, optionButton.dataset.option);

    const ideaButton = event.target.closest("[data-idea]");
    if (ideaButton) {
      const [title, criteria, category] = ideaButton.dataset.idea.split("|");
      createMarket({
        title,
        criteria,
        category,
        closeDate: todayISO(30),
        initialProbability: 50,
        liquidity: 1000,
      });
      activateView("markets");
    }

    const proposalButton = event.target.closest("[data-proposal]");
    if (proposalButton) {
      const proposal = JSON.parse(decodeURIComponent(proposalButton.dataset.proposal));
      createMarket({
        ...proposal,
        closeDate: todayISO(30),
        initialProbability: 50,
        liquidity: 1000,
      });
    }
  });

  $("#tradeAmountInput").addEventListener("input", updateTradePreview);
  $("#confirmTradeBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    if (!tradeIntent) return;
    const placed = await placeTrade(tradeIntent.marketId, tradeIntent.side, Number($("#tradeAmountInput").value));
    if (!placed) return;
    $("#tradeDialog").close();
  });

  $("#generateProposalsBtn").addEventListener("click", generateProposals);
  $("#clearProposalsBtn").addEventListener("click", () => {
    $("#proposalText").value = "";
    $("#proposalList").innerHTML = "";
  });

  document.addEventListener("mouseleave", (event) => {
    if (event.clientY <= 0) launchExitSadness();
  });

  window.addEventListener("beforeunload", () => {
    launchExitSadness();
  });

  ["pointerdown", "keydown", "scroll", "input"].forEach((eventName) => {
    window.addEventListener(eventName, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

function activateView(view) {
  document.body.dataset.activeView = view;
  $$(".tab").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  $$(".view").forEach((item) => item.classList.toggle("active", item.id === `${view}View`));
  if (view === "radar") {
    const user = currentUser();
    const alreadyViewed = state.gamification.viewedRadar[user.id] === dayKey();
    markActive(user);
    state.gamification.viewedRadar[user.id] = dayKey();
    if (!alreadyViewed) addXp(user, 10, "radar viewed");
    awardBadges(user);
    save();
    renderGamification();
  }
}

function openCreateDialog() {
  $("#marketCloseInput").value = todayISO(14);
  $("#marketDialog").showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function renderAuthDialog() {
  const isSignup = authMode === "signup";
  clearAuthMessage();
  $("#authDialogTitle").textContent = isSignup ? "Create account" : "Log in";
  $("#saveAuthBtn").textContent = isSignup ? "Create account" : "Log in";
  $$("[data-auth-mode]").forEach((button) => button.classList.toggle("active", button.dataset.authMode === authMode));
  $$(".signup-only").forEach((item) => item.classList.toggle("hidden", !isSignup));
  $("#authPasswordInput").autocomplete = isSignup ? "new-password" : "current-password";
  $("#avatarPicker").innerHTML = AVATAR_OPTIONS.map(
    (avatar) => `<button type="button" class="avatar-option ${avatar === selectedAvatar ? "active" : ""}" data-avatar="${avatar}" aria-label="Choose avatar ${avatar}">${avatar}</button>`
  ).join("");
}

function setAuthMode(mode) {
  authMode = mode;
  renderAuthDialog();
}

async function completeSupabaseProfile(displayName, avatar) {
  const { error: profileError } = await supabaseClient.rpc("create_profile_for_current_user", {
    p_display_name: displayName,
  });
  if (profileError) throw profileError;

  const { error: avatarError } = await supabaseClient.rpc("update_my_profile", {
    p_display_name: displayName,
    p_avatar_seed: avatar,
  });
  if (avatarError) throw avatarError;
}

function readableAuthError(error) {
  const raw = `${error?.error_code || ""} ${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  if (raw.includes("signup endpoint is missing")) {
    return "The username signup endpoint is missing the server-only Supabase service role key. Add SIGNAL_FLOOR_SUPABASE_SERVICE_ROLE_KEY in Vercel, redeploy, and try again.";
  }
  if (raw.includes("over_email_send_rate_limit") || raw.includes("email rate limit")) {
    return "Supabase is trying to send confirmation emails and has hit the email rate limit. Go to Supabase -> Authentication -> Providers -> Email and turn OFF Confirm email for this Live Beta. Then delete this half-created test user in Authentication -> Users and try again.";
  }
  if (raw.includes("confirm") || raw.includes("confirmation")) {
    return "Supabase is waiting for email confirmation, so the app cannot create the game profile yet. Turn OFF Authentication -> Providers -> Email -> Confirm email for the Live Beta, then try again.";
  }
  if (raw.includes("invalid login credentials")) {
    return "Wrong username or password. If you created this username during the earlier broken signup flow, delete that test user in Supabase Authentication -> Users and create it again.";
  }
  if (raw.includes("create_profile_for_current_user") || raw.includes("update_my_profile") || raw.includes("schema cache")) {
    return "The login worked, but Supabase is missing the latest profile RPC. Run supabase-repair.sql again in the Supabase SQL Editor, then reload and try again.";
  }
  if (raw.includes("already") || raw.includes("registered")) {
    return "This account already exists. Switch to Log in and use the same username/password, or delete the test user in Supabase Authentication -> Users and create it again.";
  }
  return error?.message || "Could not log in.";
}

async function createUsernameAccount({ username, password, displayName, avatar }) {
  if (!["http:", "https:"].includes(window.location.protocol)) {
    throw new Error("Username signup needs the Vercel app URL so the secure signup endpoint can run. Use the deployed URL, or run through a local web server.");
  }

  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, displayName, avatar }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not create account.");
  return result;
}

async function handleAuthSubmit() {
  clearAuthMessage();
  if (!supabaseClient && window.supabase?.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  if (!supabaseClient) {
    setAuthMessage("Supabase client is not available. Check that the Supabase script loaded.", "error");
    return;
  }

  let identity;
  try {
    identity = parseAuthIdentity($("#authUsernameInput").value);
  } catch (error) {
    setAuthMessage(error.message, "error");
    return;
  }

  const password = $("#authPasswordInput").value;
  const displayName = ($("#authDisplayNameInput").value.trim() || identity.username || "Signal Desk").slice(0, 40);

  if (password.length < 6) {
    setAuthMessage("Password needs at least 6 characters.", "error");
    return;
  }

  const email = identity.email;
  setConnectionStatus("demo", authMode === "signup" ? "Creating..." : "Logging in...");
  $("#saveAuthBtn").disabled = true;

  try {
    if (authMode === "signup") {
      setAuthMessage(`Creating account for ${identity.username}...`);
      await createUsernameAccount({
        username: identity.username,
        password,
        displayName,
        avatar: selectedAvatar,
      });
      const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      await completeSupabaseProfile(displayName, selectedAvatar);
      setAuthMessage(`Account ready. Welcome to the floor, ${displayName}.`, "success");
      toast(`Welcome to the floor, ${displayName}.`);
    } else {
      setAuthMessage(`Logging in as ${identity.username}...`);
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setAuthMessage("Logged in. Loading the floor...", "success");
      toast("Logged in.");
    }

    $("#authDialog").close();
    await bootstrapSupabase();
  } catch (error) {
    setConnectionStatus("error", "Auth failed");
    setAuthMessage(readableAuthError(error), "error");
  } finally {
    $("#saveAuthBtn").disabled = false;
  }
}

async function signOut() {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
  supabaseMode = false;
  setConnectionStatus("error", "Signed out");
  window.location.reload();
}

function updateTradePreview() {
  if (!tradeIntent) return;
  const market = state.markets.find((item) => item.id === tradeIntent.marketId);
  const amount = Number($("#tradeAmountInput").value || 0);
  const price = sidePrice(market, tradeIntent.side);
  $("#tradePrice").textContent = pct(price);
  $("#tradeShares").textContent = (amount / clamp(price, 0.05, 0.95)).toFixed(2);
}

bindEvents();
render();
bootstrapSupabase();
