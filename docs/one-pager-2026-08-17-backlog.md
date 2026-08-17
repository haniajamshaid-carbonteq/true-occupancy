# True Occupancy — Backlog One-Pager
**Date:** August 17, 2026 · **Board:** [True Occupancy](https://trello.com/b/U1EtLHku/true-occupancy) · **Cards:** #32 + #34–#52 (20, all in Backlog, all with screenshots)

Every card follows the house format (Navigation → Why → What changes → Edge cases → Acceptance criteria) and carries its screen label. Reference implementation for ✅-marked items is live in `app.html` — commits **`dc0f0af`** (flip / Not-sure / AI toggle / red-list) and **`d68861c`** (Intended columns) on `main`; #32's fix is `49f95f0`.

---

## What's on the board, in four themes

**1 · Declared / Intended occupancy everywhere** *(meeting action point — compare declared vs detected at a glance)*
| # | Card | Prototype |
|---|---|---|
| 34 | [Foundation: per-address resolver + batch "Mixed" summary](https://trello.com/c/xyqiiuap) | ✅ built (`d68861c`) |
| 35 | [Dashboard: Intended column on Recent Scans](https://trello.com/c/37LTqJ6g) | ✅ built |
| 36 | [History: Intended column](https://trello.com/c/3Av2nYBQ) | ✅ built |
| 37 | [Batch: per-address Declared column in default view](https://trello.com/c/PFCSdCXv) | ✅ built |
| 38 | [Scheduled: Intended column](https://trello.com/c/HAcJudRO) | ✅ built |
| 39 | [Schedule detail: per-address intended for batch schedules](https://trello.com/c/bUxalHBb) | ✅ built |
| 48 | [Run history: per-run intended on the timeline](https://trello.com/c/zGPKwVgL) | ✅ built |

**2 · Confidence score flip** *(the % always reads as confidence IN the finding)*
| # | Card | Prototype |
|---|---|---|
| 40 | [Property hero: flip](https://trello.com/c/SQlMsFwU) | ✅ built |
| 41 | [PDF certificate: flip](https://trello.com/c/QFBTIqGp) | ✅ built |

**3 · "Not sure" configuration** *(resolve the ambiguous intent)*
| # | Card | Prototype |
|---|---|---|
| 42 | [Config: "likely to look like" dropdown + on/off toggle + ⓘ tooltip](https://trello.com/c/HECw9VPg) | ✅ built |

**4 · AI report (Deep Search) — the July-23 confirmed scope**
| # | Card | Prototype |
|---|---|---|
| 46 | [Config: auto-run AI on red (opt-in, cost-flagged, single + batch)](https://trello.com/c/JoxL0aay) | ✅ built |
| 43 | [Batch: AI reports as one batch job](https://trello.com/c/9VCxJ0it) | state scaffolded |
| 44 | [Result: on-demand "Run now"](https://trello.com/c/tq4V52GW) | ✅ mostly exists |
| 45 | [Config: per-lender "stop vs dig deeper" trigger](https://trello.com/c/qxF1op6e) | ✅ built (`1b3f477`) |
| 47 | [Result: caching + provenance "re-checked on X, identical"](https://trello.com/c/MhbruvTQ) | partial (ServedStamp) |
| 49 | [Schedule detail: AI status on auto-triggered runs](https://trello.com/c/y8xPYnAU) | ✅ built (`1b3f477`) |
| 50 | [Lists: "AI report available" marker](https://trello.com/c/zaXBlYZf) | ✅ built (`1b3f477`) |

**Cross-cutting / debt**
| # | Card | Prototype |
|---|---|---|
| 32 | [Config: simplify unsaved-changes banner copy](https://trello.com/c/ZRH4dYGi) *(pre-existing card)* | ✅ built — commit `49f95f0` |
| 51 | [Retire the curated red list (matrix-derived ⚠ everywhere)](https://trello.com/c/kofV8lgq) | ✅ built |
| 52 | [Automation reacts to status changes (incl. AI); retention decides](https://trello.com/c/kejxjYtF) | mechanism exists (`retention`) |

---

## Recommended dev sequence (dependency-ordered)

```
PR 0  #32 banner copy                    → already on main (49f95f0); verify + move to Ready for Test
PR 1  #34 foundation + #51 port          → tiny, unblocks everything; #51 keeps ⚠ consistent
PR 2  #35 #36 #37 #38 #39 #48            → the Intended columns (one shared builder feeds 35+36)
PR 3  #40 #41                            → confidence flip (hero + PDF must land together)
PR 4  #42                                → Not-sure config (needs InfoHover sign-off)
PR 5  #46 → #43 + #44 (+#45 if config home decided)  → AI core: toggle first, then batch + run-now
PR 6  #47 #49 #50                        → provenance + AI visibility (need PR 5)
PR 7  #52                                → automation reaction (needs PR 5; mechanism = existing retention)
```
Rules that keep it safe: one shared helper per concept (no per-screen reimplementation) · verdict-neutral copy is locked, port verbatim · the ⚠/pill/tile derivations must always agree (see #51's regression list).

**Open decisions before dev hits them:** where the per-lender trigger config lives (#45, flagged in the scope note) · InfoHover tooltip extension sign-off (#42, #34/#36, #50) · "Deep Search" vs "Occupancy report" naming (#43).

