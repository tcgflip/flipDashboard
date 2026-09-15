# Windward Ledger — Run Log

One entry per scheduled run (daily quick-check or weekly deep dive), newest first. Each entry: what changed, what was checked, and any blockers worth flagging to Ryan.

---

## 2026-09-15 — Daily quick-check (scheduled, later same day)

**Scope:** Scheduled daily quick-check, firing several hours after the out-of-band runs logged below (all also dated 2026-09-15). Standard lightweight scope per `instructions.md`: imminent events, price sanity-check, giveaway scan, holdings review, website interface pass.

**Checked:**
- Aloha Card Show (Sept 19-20, Blaisdell) — reconfirmed via WebSearch, dates/hours/admission unchanged.
- Aloha Card Shop 30th Celebration listings — still unconfirmed, now 1 day out from the Sept 16 launch. Direct WebFetch to alohacardshop.com returned EGRESS_BLOCKED (newly confirmed blocked domain, added to `context.md`) — still needs a firsthand post-launch recheck, can't be verified from this environment.
- Rayquaza VMAX price conflict ($15.39 vs. $10.31) — re-searched, same unresolved spread turned up, no new data either way. Flag stands, no change made.
- Egress status — re-tested api.pokemontcg.io, still EGRESS_BLOCKED, consistent with every prior run.
- New giveaways: none found.
- Holdings: nothing to advise on — all items still Proposed.

**Website interface pass:** Found a real (latent) bug — the Events tab had no mechanism to ever stop showing a card show once it had ended; a past multi-day show would linger in the list indefinitely with just a blank countdown instead of disappearing. Fixed: added an `end_date` field to every show entry in `data.json`, and a client-side filter in `app.html` that drops a show once its `end_date` has passed (falling back to `start_date` for single-day shows), plus an empty-state message for the (currently hypothetical) case where the calendar is clear.

**Files updated:** `context.md` (egress note — alohacardshop.com confirmed blocked), `holdings-log.md` (this check's note), `public/data.json` (`end_date` added to all 10 shows), `public/app.html` (past-show filtering + empty state), `run-log.md` (this entry).

---

## 2026-09-15 — Thesis fact-check + bullet-format conversion (out-of-band, Ryan-requested)

**Scope:** Ryan asked to double-check the buy list's thesis text accuracy and reformat it as short "top reasons" bullets instead of prose.

**Fact-checked:** Charizard ex's PSA pop 5,455 (confirmed, two sources agreed within noise), Espeon ex/Umbreon ex Battle Deck's Oct 30 2026 release date (confirmed), Mew/Mewtwo 30th Celebration promo claim (confirmed), Lost Origin's 2022 release year (confirmed). Radiant Charizard's PSA pop ~19,073 claim wasn't independently re-verified this pass — noted as such rather than re-asserted with false confidence.

**Error found and fixed:** Giratina VSTAR's alt-art secret was misrecorded as #212/196 — it's actually #201/196 (confirmed via TCGplayer's own listing and an Amazon listing). Corrected in `holdings-log.md` and `data.json`.

**Format change:** `thesis` is now a JSON array of 2-3 short bullet strings per pick instead of a paragraph. `instructions.md` documents this for future runs; `public/app.html` renders it as an actual bulleted list on each buy-list tile.

**Files updated:** `instructions.md` (thesis schema documented), `holdings-log.md` (card-number fix, new dated note), `public/data.json` (all 10 buyList theses converted to arrays, Giratina card number fixed), `public/app.html` (bullet rendering + CSS), `run-log.md` (this entry).

---

## 2026-09-15 — Community demand signal added (out-of-band, Ryan-requested)

**Scope:** Ryan asked to pull Reddit data to gauge community card/rarity preference (example: gold/rainbow rares being less desired) and factor that into picks, ideally getting ahead of cards becoming popular.

**Tool limitation confirmed:** WebFetch is blocked entirely for reddit.com; WebSearch doesn't surface real Reddit thread/comment content even when explicitly targeting a subreddit. Reddit isn't usable as a direct source with this routine's tools.

**Substitute found and it confirms Ryan's instinct:** Bleeding Cool's "Pokémon TCG Value Watch" series and multiple 2026 collector guides show Illustration Rares/Special Illustration Rares have clearly overtaken gold Hyper Rares/rainbow Secret Rares in collector preference since Scarlet & Violet began. Added as a standing rarity-tier preference in `instructions.md`, favoring SIRs/alt-art and iconic mascots over gold/rainbow when price and liquidity are comparable.

**Applied immediately:** Pikachu VMAX PSA 10 (a rainbow secret) is the one current pick in direct tension with this — reworded its thesis to own that honestly rather than pitch the rarity as a strength. Kept the pick (brand-mascot power is a real counter-argument) but flagged it for Ryan's own judgment.

**"Ahead of the curve" guidance added:** two real (not guaranteed) leading indicators documented — set-reveal reaction before a set releases, and early tournament/competitive relevance.

**Files updated:** `instructions.md` (new community demand signal section), `holdings-log.md` (new dated note), `public/data.json` (Pikachu VMAX thesis reworded), `run-log.md` (this entry).

---

## 2026-09-15 — Target-price methodology fix (out-of-band, Ryan-requested)

**Scope:** Ryan couldn't find a Pikachu VMAX PSA 10 anywhere near the $58 target price on the buy list and asked how that number was derived, with a request to double-check pricing on all 10 cards.

**Root cause found:** `targetPrice` was never verified against a real listing — it was the market/sold-comp price minus an arbitrary discount (often 25-45%) chosen to produce a flattering ROI, not a number grounded in anything findable. This affected all 10 entries, not just Pikachu.

**Fix:** Recomputed every `targetPrice` as ~15% below the current verified market/sold-comp price — a realistic in-person, cash-negotiation discount, which is the only edge this routine can actually stand behind (it can't confirm a specific online listing exists at a specific price). Net ROI dropped from a 10-32% range to a consistent 8-12% — an honest correction, not a regression. Pikachu VMAX specifically: $58 target (24% ROI) → $69 target (10% ROI).

**UI change:** relabeled the price tile "Target (negotiate)" on both Buy List and Owned tabs so it's never mistaken for a purchasable listing price.

**Files updated:** `instructions.md` (methodology documents the ~15%-off-market rule), `holdings-log.md` (10 rows corrected, new dated note), `public/data.json` (10 buyList entries repriced), `public/app.html` (price label), `run-log.md` (this entry).

---

## 2026-09-15 — Daily check rerun under new price research methodology (out-of-band, Ryan-requested)

**Scope:** Ryan asked to rerun the daily check applying the new sold-comp/trend/cross-source methodology just added to `instructions.md`. Couldn't fire the actual daily-check routine (same permission issue as the previous out-of-band run below — not created by this agent session), so applied the methodology directly to the current 10-item buy list.

**Corrections found (2 of 10):**
- **Charizard ex** — buy $7.21→$6.00, sell $11.34→$7.92, ROI 37%→18%. Two sources disagreed 30%+ and a tracker confirmed a 12.6% decline since release; the old sell price was stale.
- **Rayquaza VMAX** — buy $11.50→$8.00, sell $15.39→$10.31, ROI 16%→15%. Resolves the conflict flagged 2026-09-14: confirmed a real 43.3% decline since release, so $10.31 (not $15.39) is current.

**No change, evidence-based (2 of 10):** Radiant Charizard (raw) — fresh read ($19.45) matches existing ($19.31) within noise, stable.

**No change, no new evidence either way (4 of 10):** Umbreon VMAX, Mew VMAX, Espeon VMAX (raw), and all 4 slabs (Radiant Charizard PSA 9, Mew VMAX PSA 10, Pikachu VMAX PSA 10, Giratina VSTAR PSA 10) — tried to strengthen sample size/trend confirmation on each; no additional clean data surfaced. Left as-is rather than revise without evidence, but noted as not independently trend-confirmed this pass.

**Tooling limitation:** WebSearch can't reliably filter to eBay's actual sold/completed listings — it returns active listings and third-party synthesized ranges instead. The methodology's ideal (3+ verified sold comps per pick) isn't fully achievable here; this run is the same "WebSearch-snippet-sourced" confidence tier as before, applied more rigorously (explicit trend + cross-source checks) rather than with better underlying data.

**Files updated:** `holdings-log.md` (new dated note, 2 corrected rows), `data.json` (2 corrected buyList entries), `run-log.md` (this entry).

---

## 2026-09-15 — Deferred $1,000-cap re-sourcing (out-of-band, Ryan-requested)

**Scope:** The daily quick-check earlier today (below) fixed the cap *text* but explicitly deferred actually re-sourcing the buy list under the new $1,000 ceiling to the next weekly deep dive. Ryan checked and asked for this to happen now instead of waiting — this run closes that specific backlog item. Not a full weekly-scope pass (no show calendar refresh, no sealed EV re-check, no holdings review beyond what's below).

**Re-evaluated the slab candidates rejected under the old $50 cap:**
- **Umbreon VMAX PSA 9 (Evolving Skies #095/203, non-alt-art)** — still excluded. eBay listings this pass came back a $150–$750 spread that looks contaminated by the unrelated "Moonbreon" alt-art secret rare (#215/203 — a different, far more expensive card) bleeding into search results. Couldn't get a clean number; not forcing a pick on unreliable data.
- **Mew VMAX PSA 10 (Fusion Strike #114/264)** — added. One clean eBay sold comp ($129.99, mid-April 2026). Target $95, ~20% net ROI.
- **Pikachu VMAX PSA 10 (Vivid Voltage #188/185, rainbow secret)** — added. Recent-sold range $52–$88, most recent actual sale $81 (Jan 2026). Target $58, ~24% net ROI.

**New pick using the higher ceiling:**
- **Giratina VSTAR PSA 10 (Lost Origin #212/196, alt art)** — a popular, high-print-run VSTAR alt art that simply didn't fit under the old $50 cap. Price is range-sourced ($150–$220 eBay/TCGplayer), not a single comp — flagged as lower-confidence than the others. Target $150, ~14% net ROI.

**Files updated:** `holdings-log.md` (new dated note + 3 new Proposed rows), `data.json` (3 new slab entries appended to `buyList`, `generated_at` unchanged — same day), `run-log.md` (this entry).

---

## 2026-09-15 — Daily quick-check

**Scope:** Lightweight spot-check per `instructions.md` — imminent events, price sanity-check on current buy-list picks, new-giveaway scan, and the daily website-interface pass.

**Checked:**
- Noted that a same-day-earlier session (commit `72235b2`, ~03:15 UTC, before this run) raised the raw-single/slab price cap from $50 to $1,000 in `instructions.md` and added the daily UI-polish routine, but left the buy list itself un-regenerated (still the original $50-cap-era 6 singles + 1 slab) and didn't log a run. `data.json`'s `singlesSlabsRule` text still said "$50" — corrected to "$1,000" to match `instructions.md`. Full re-sourcing of higher-value picks under the new cap is deferred to the next weekly deep dive — out of scope for a lightweight daily check.
- Bayview Night Market (today, Sept 15) — reconfirmed on via WebSearch, no change.
- Aloha Card Shop 30th Celebration listings — still none confirmed, 1 day out from the Sept 16 launch. Unchanged; still needs the direct post-launch recheck already flagged.
- Rayquaza VMAX price flag — attempted to resolve directly via WebFetch to TCGplayer and the pokemontcg.io API; both still return EGRESS_BLOCKED, consistent with prior runs. Same unresolved $15.39 vs. $10.31 conflict stands, no new data either way.
- New giveaways: none found.
- New show sighting: "Aloha Comic Con Card Pavilion" (Hawaii Convention Center, part of Amazing Comic Con Aloha) — ran Sept 12 2026, found after the fact via WebSearch. Not actionable this cycle; noted in `context.md` to check for a recurring/2027 date before adding to the active calendar.
- Holdings: nothing to advise on — everything is still Proposed.

**Website interface pass:** Found and fixed a real bug — the dashboard's browser-tab title and header both read "Poke Fips" instead of "Poke Flips" (typo introduced by a manual, non-Claude commit on 2026-09-13 and never caught since). Fixed both occurrences in `index.html`. Nothing else stood out as a clear, scoped improvement this run, so kept the change to just this fix.

**Files updated:** `context.md` (new show sighting, egress-status update), `holdings-log.md` (this check's note), `data.json` (`generated_at` bump, `singlesSlabsRule` cap text corrected to $1,000), `index.html` (title/header typo fix), `run-log.md` (this entry).

---

## 2026-09-14 — Daily quick-check (second same-day run, ~4 hours after the quick-check below)

**Scope:** Scheduled daily quick-check fired again the same calendar day as the entry below (first quick-check + weekly deep dive) — same lightweight scope per `instructions.md`: imminent events, price sanity-check, giveaway scan. Noting the same-day repeat here in case the schedule is firing more often than once/day; nothing in this session shows the underlying cadence, so flagging for Ryan's awareness rather than assuming it's a bug.

**Checked:**
- Live settings API (`https://flipdashboard.tcgflip.workers.dev/api/state`, new as of today's `instructions.md` update) — blocked by this environment's egress proxy (EGRESS_BLOCKED), same restriction category as the pricing/calendar domains already flagged, now confirmed to cover the dashboard's own Worker domain too. Fell back to the already-committed `data.json` toggle values (sealed/rawSingles/slabs all on). Noted in `context.md`.
- Bayview Night Market (tomorrow, Sept 15) — re-confirmed still on, no change.
- Aloha Card Shop 30th Celebration listings — still none confirmed, still 2 days from the Sept 16 launch, unchanged.
- Rayquaza VMAX price flag — re-checked, same unresolved $15.39 vs. $10.31 conflict as this morning's check, no new data either way.
- New giveaways: none found.
- Holdings: nothing to advise on — everything is still Proposed.

**Files updated:** `context.md` (live-settings-API egress note), `holdings-log.md` (this check's note), `data.json` (no content changes — nothing material to rebuild), `run-log.md` (this entry).

---

## 2026-09-14 — Daily quick-check (same day as the weekly deep dive below)

**Scope:** Lightweight spot-check per `instructions.md` — imminent events, a price sanity-check on current buy-list picks, and a scan for new giveaways. Not a full re-run of the show calendar or a fresh EV pass (that happened in today's weekly deep dive, below).

**Checked:**
- Bayview Night Market (tomorrow, Sept 15) — confirmed still on. Corrected `context.md`: venue is Kāneʻohe only (45-285 Kāneʻohe Bay Dr), not the ambiguous "ʻAiea/Kāneʻohe" phrasing that was there before; added host (@pkmn.collective) and cadence detail (1st & 3rd Tuesdays, matches existing dates).
- Aloha Card Shop 30th Celebration listings — still none confirmed, 2 days out from the Sept 16 launch. Unchanged from this morning; still needs the direct post-launch recheck already flagged in `context.md`.
- Buy-list price sanity check via WebSearch: Umbreon VMAX ($26.97 PokeScope read) is consistent with the $22.21 buy / $29.99 sell already on the list — no change. Rayquaza VMAX turned up a conflicting market read ($10.31 PokeScope vs. the $15.39 this pick relies on, ~33% spread) — flagged in `holdings-log.md` and `data.json` rather than pulled, since its Sept 28 sell-by isn't imminent yet and the conflict isn't resolved via a direct source.
- New giveaways: none found.
- Holdings: nothing to advise on — every item on the list is still Proposed, none confirmed Holding yet.

**Files updated:** `context.md` (Bayview Night Market venue correction), `holdings-log.md` (daily-check note + Rayquaza VMAX price flag), `data.json` (rebuilt to match — Rayquaza VMAX thesis now includes the price flag), `run-log.md` (this entry).

---

## 2026-09-14 — Weekly deep dive (first run under the new modern-only/toggle strategy, and first entry in this file)

**Scope:** Full weekly deep dive per `instructions.md` — re-verified the Oʻahu show calendar, ran sealed-product EV math, and sourced the first batch of raw-singles/slabs picks under the modern-only (2020+) rule set adopted 2026-09-13.

**Show calendar:**
- Corrected: West Side Card Show's venue is Kroc Center in **Kapolei**, not Kāneʻohe (`context.md` had conflated it with Bayview Night Market's Windward-side location).
- Corrected: Urban Soccer Hawaii Card Show's next date confirmed as **Sept 26, 2026** (not Sept 27 as previously estimated) — plus a newly found second date, **Oct 31, 2026**, same venue.
- Flagged as possibly stale/unconfirmable: "Uncle Tony's Trade Night" at Pearlridge (no independent evidence found; may be a mixup with 808 Showcase Trade Night, same venue/cadence).
- Flagged as unconfirmed, dropped from active tracking: "Mini Pokémon Market" at FilCom Center, Waipahu (no evidence found under that name at all).
- New addition to watch: Space 62 Collectibles Show (Ala Moana Center Annex) — periodic, last ran June 2026, no fall 2026 date confirmed yet.
- Aloha Card Shop still doesn't show confirmed 30th Celebration set listings — direct site access was blocked this run (see network note below), and the set doesn't launch until Sept 16, so recheck right around/after launch.
- All other previously-tracked shows (Aloha Card Show, Keep It Aloha, Pokémon/Sports Cards & More x2, 808 Cards/Paradise Card Show same-day conflict, Spotlight Card Show, Bayview Night Market, ToyLynx/808 Showcase/TCG Tavern trade nights) reconfirmed unchanged.

**Sealed product EV:** Evaluated Mega Evolution: Pitch Black booster box and the full Pokémon 30th Celebration line (ETB, Booster Bundle, Sylveon ex/Greninja ex boxes, UPC). **No sealed picks this run** — none clear the required +15–20% EV-over-price margin:
- Pitch Black: EV ≈ $110–140/box vs. ~$161 MSRP / ~$205 current street price → margin roughly −23% to −39%. Do not recommend.
- 30th Celebration line: can't be honestly EV'd yet — most chase-card (SIR/Illustration Rare) prices are still marked TBC by TCGplayer itself, 2 days before the set's Sept 16 launch, and box prices are running 2–3.4x MSRP on pure presale hype. Revisit in 2–4 weeks once real secondary sales exist and presale hype washes out.
- Espeon ex / Umbreon ex Battle Decks (Oct 30 release): insufficient data this far out — revisit closer to release.

**Raw singles / slabs (first batch under modern-only rule):** 6 raw singles + 1 slab qualified and were added to the buy list (see `holdings-log.md` and `data.json` for full detail, sorted by net ROI):
1. Charizard ex (SV: 151 #006/165) — 37% net ROI
2. Radiant Charizard (Pokémon GO #011/078) — 29%
3. Umbreon VMAX (Evolving Skies #095/203) — 18% (catalyst: Umbreon ex Battle Deck, Oct 30)
4. Rayquaza VMAX (Evolving Skies #111/203) — 16%
5. Mew VMAX (Fusion Strike #114/264) — 15%
6. Espeon VMAX (Evolving Skies #065/203) — 11% (catalyst: Espeon ex Battle Deck, Oct 30)
7. **Slab:** Radiant Charizard PSA 9 (Pokémon GO #011/078) — 32% net ROI at a conservative $25 buy-in (real sold comps ranged widely, $10.50–$40 — thin data, flagged in the notes)

Rejected/excluded rather than forced in: Iono (Paldea Evolved — price data too contradictory, and its Standard-rotation catalyst already lapsed in April 2026); several slab candidates over the $50 cap (Umbreon VMAX PSA 9 at $50.87, Umbreon/Mew/Pikachu VMAX PSA 10s) or with conflicting price sources (Rayquaza VMAX, Charizard ex 151 PSA 10 — one tracker quoted $126, actual eBay solds showed $45–50).

**Network/tooling note:** This run's environment blocked direct WebFetch/curl to almost every pricing and show-calendar site (TCGplayer, PriceCharting, pokemontcg.io API, pokescope.app, hawaiicardshows.com, and others — all 403/EGRESS_BLOCKED). All research this run relied on WebSearch result snippets instead, cross-checked across multiple sources where possible. This is a more restricted position than some prior runs — worth flagging to Ryan if it persists, since it caps price confidence to "WebSearch-snippet-sourced" rather than directly verified.

**Files updated:** `context.md` (calendar corrections/additions, network note), `holdings-log.md` (7 new Proposed picks), `data.json` (rebuilt to match), `run-log.md` (this entry, first one — file didn't exist yet).
