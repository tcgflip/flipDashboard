# Oʻahu Pokémon TCG Market — Context & Resource Base

This is a living document. Add to it whenever a run turns up a new shop, show series, or source — or finds that one of these is stale/dead.

_Last researched: 2026-09-13 (weekly deep dive + same-day daily check)._

## Card show calendar sources (check these, don't rely on memory)

- hawaiicardshows.com — best broad Oʻahu-specific calendar + shop directory (hawaiicardshows.com/calendar/, hawaiicardshows.com/shops/) — NOTE: the live JS calendar widget doesn't render for a plain page fetch ("Loading calendar…"); use WebSearch or the individual /shows/<name> pages instead, or cross-check against cutterscollection/thecardshopfinder/treasurehunter, which do return full listings.
- cutterscollection.com/card-shows/hawaii — reliable, returns full listings
- thecardshopfinder.com/events/hi/ — reliable, returns full listings, includes shop-hosted trade nights
- treasurehunter.show/shows/hawaii
- spotlightcardshow.com — mainland touring show, has started running a Honolulu date (Hawaii Convention Center) — new addition, see below
- alohacardshow.com — Blaisdell Center, general collectibles/comics/sports, not Pokémon-exclusive, but big foot traffic
- tcdb.com/CardShowCalendar.cfm?VIEW=Calendar&State=HI

## Known recurring Oʻahu shows (as of Sept 2026 — re-verify dates/venues each run, these shift)

- **Sports Cards & Collectibles Show** — Pearlridge Center (Lower Pearlridge), 98-1005 Moanalua Rd, Aiea — monthly, usually a Sat–Sun pair (e.g. Sept 12-13, Oct 10-11 2026)
- **Keep It Aloha Card Show** — SALT at Our Kakaako — first weekend of every month, Sat–Sun (e.g. Oct 3-4 2026)
- **Pokémon, Sports Cards & More** — rotates Ala Moana Hotel / Prince Waikiki / Hawaii Convention Center — roughly monthly (Sept 27 = Ala Moana Hotel, Hibiscus Ballroom & Garden Lanai, 410 Atkinson Dr, 10am-5pm; Oct 25 = Prince Waikiki)
- **808 Cards and Collectibles Show** — Oʻahu Veteran Center (Oct 18 2026)
- **Paradise Card Show** — The Republik — monthly-ish (Oct 18 2026, same day as 808 Cards — conflict, pick one)
- **Bayview Night Market** — Bayview Golf Course, ʻAiea/Kāneʻohe — biweekly Tuesdays (Sept 15, Oct 6, Oct 20 2026)
- **808 Showcase Trade Night** — Pearlridge — 3rd Friday monthly
- **West Side Card Show** — Kroc Center, Kāneʻohe — next confirmed Dec 5-6 2026
- **Aloha Card Show** — Neal S. Blaisdell Center Exhibition Hall — ~2x/year, general collectibles (Sept 19-20 2026 confirmed via alohacardshow.com: 10am-6pm both days; $10/day general admission (ages 7+); free all day both days for Aloha Pacific FCU cardholders, who also get early entry 9-10am)
- **Hawaii Pop Con** — Blaisdell Center — annual, January
- **HNL Card Fest** — Hawaii Convention Center — annual, July
- **Spotlight Card Show (Honolulu)** — Hawaii Convention Center — touring mainland show now running a Honolulu date; confirmed Oct 24-25 2026, 11am-5pm, 450+ vendors (Pokémon, sports, One Piece, Yu-Gi-Oh). Worth tracking as a recurring addition — check if it repeats.
- **Shop trade nights worth watching**: ToyLynx Trade Night (recurring, roughly every 2 weeks, Honolulu — Sept 24, Oct 8, Oct 22 2026); Uncle Tony's Trade Night at Pearlridge (Sept 18, Oct 16 2026); TCG Tavern Trade Day (Oct 26 2026); Mini Pokemon Market at FilCom Center, Waipahu (Sept 27 2026) — smaller/local, good for quiet bargain-hunting away from bigger-show price awareness.
- **NEW (found 2026-09-13 daily check) — Urban Soccer Hawaii Card Show** — Urban Soccer Hawaii, 218 Mohonua Pl, Honolulu — recurring (had a prior date July 25 2026), includes Pokémon/sports/other TCG per hawaiicardshows.com. thecardshopfinder.com lists a Sept 26 2026 date. Exact recurrence cadence and confirmed next date still unclear — verify before treating as actionable; watch for a firmer date on hawaiicardshows.com/shows/urban-soccer-hawaii-card-show.

Confirmed dates as of this run (verify again before acting — schedules move): Pearlridge Sept 12-13 2026 (concluding today, 10am-5pm, as this daily check ran); Aloha Card Show Sept 19-20 2026 (Blaisdell, details above); Keep It Aloha Oct 3-4 2026 (SALT); Spotlight Card Show Oct 24-25 2026 (Hawaii Convention Center); West Side Card Show Dec 5-6 2026 (Kroc Center, Kāneʻohe); Urban Soccer Hawaii Card Show ~Sept 26 2026 (unconfirmed, see above).

## Known Oʻahu shops (verify current hours/stock before a trip)

- **ToyLynx / Ideal808** — 650 Iwilei Rd, Honolulu (near Costco) — sealed, singles, Japanese imports, runs tournaments + biweekly trade nights
- **TCG Tavern** — 903 Isenberg St, Honolulu — full Pokémon inventory, trade days (next Oct 26 2026)
- **Space 62** — Ala Moana Center, 3rd floor near Buffalo Wild Wings — Pokémon selection + graded slabs
- **Aloha Card Shop** — Pokémon sealed/singles/sports; also sells online (alohacardshop.com, eBay store "alohatcg"); ~1,847 Pokémon SKUs listed online as of this run, but still no 30th Celebration/Anniversary listings found as of 2026-09-13 daily check (pre-release — check again after Sept 16 launch)
- **808 Showcase** — Pokémon inventory, trade nights
- **Nocturnal TCG & Collectibles** — Honolulu (shopnocturnaltcg.com)
- **Final Form Hawaii** — finalformhawaii.com
- Others to periodically check for stock/restocks: Box Jellyz, Best of the Best, iWinGames, Da Planet, Paula's Sports Cards, Other Realms, Evolving Realms, From the Heart, Dragon's Lair, Windward Collectibles, Armchair Adventurer

## Online / local marketplaces & communities

- Facebook groups: "Pokemon TCG Hawaii" (POP808), "Pokemon Cards Kanto: Buy Sell Trade"
- Facebook Marketplace — Honolulu / Oʻahu listings
- Instagram — @alohacardshow, @toylynx, @tcgtavernhi and individual shop accounts (restocks are often announced here first, before the website) — NOTE: plain web fetch/search cannot reliably read Instagram/Facebook post content (JS-rendered, auth-gated); a genuinely thorough restock/marketplace scan needs a logged-in browser pass, not just WebSearch/WebFetch.

## Pricing / trend data sources (for ROI + EV math)

- TCGplayer — market price + price history charts
- Pokémon TCG API (api.pokemontcg.io) — reliable, WebFetch-able source for a card's current TCGplayer price object (low/mid/high/market/directLow per variant) and card images; snapshot only, dated by `tcgplayer.updatedAt`, no historical series
- PriceCharting — sealed product and graded-card trend charts, but blocked via WebFetch (403) as of 2026-09-13; also seen at least one clearly anomalous data point on an earlier run — treat any print that looks wildly out of line with eBay sold comps as suspect
- eBay sold/completed listings — realized prices, more reliable than asking prices, but not reliably scrapable via WebFetch — needs a logged-in browser pass for real sold-comp research
- PSA population report — for graded singles/slabs scarcity
- Official Pokémon TCG release calendar + competitive season calendar — set rotations, Worlds, Regionals, anime tie-ins drive demand spikes, useful for timing buys/sells and for sourcing pull-rate data for sealed EV math

## Giveaway sourcing

- Local shop Instagram/Facebook pages often run giveaways tied to restocks or upcoming shows
- Broader communities (Reddit Pokémon TCG subs, X/Twitter) occasionally post giveaways — verify legitimacy before flagging: a real giveaway never asks for payment, card numbers, or full personal ID up front
- Watch for **paid raffle sites (e.g. RaffledUp)** — entry fee for a chance at a box; not scams per se, but not free giveaways, and carry real counterparty/seller-reputation risk. Flag separately from true no-cost giveaways.

## Strategy & buy rules

Buy-list rules (product types, ROI thresholds, budget caps, EV methodology for sealed product) now live in `instructions.md`, not here. This file stays focused on resources — where to find shows, shops, and pricing data. For what to buy and why, check `instructions.md`.

## Dashboard & automation (updated 2026-09-14 — migrated off Cowork/Project scheduling)

Dashboard: https://flipdashboard.tcgflip.workers.dev

Everything the tracker needs — `instructions.md`, `context.md` (this file), `run-log.md`, `holdings-log.md`, and `data.json` — now lives together in the `flipDashboard` GitHub repo (main branch), alongside the dashboard's own `index.html`/`wrangler.jsonc`. Cloudflare auto-redeploys whenever `data.json` changes on main.

Scheduled runs now happen via Claude Code routines that clone this repo directly and use real git operations — not a Cowork/Project GitHub connector, which had reliability issues (connectors showing "connected" while exposing no working tools). Two routines: a daily quick-check and a weekly deep dive, both following `instructions.md`.

At the end of every run: rebuild `data.json` from the current state of `holdings-log.md`/`context.md`/`instructions.md`, append a dated entry to `run-log.md`, commit and push everything together.

This copy of `context.md` in Claude Project knowledge is now a secondary reference for manual chats here — the repo copy is the source of truth going forward.
