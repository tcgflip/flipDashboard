# Windward Ledger — Run Log

One entry per scheduled run (daily quick-check or weekly deep dive), newest first. Each entry: what changed, what was checked, and any blockers worth flagging to Ryan.

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
