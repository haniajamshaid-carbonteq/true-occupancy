# Implementation Handoff — Intended Occupancy, Confidence Flip & AI Report Release

**Date:** August 17, 2026
**Author:** Zarlish Khan
**Trello board:** [True Occupancy](https://trello.com/b/U1EtLHku/true-occupancy) — cards #34–#52 (19)
**Reference implementation:** this repo, `app.html` (branch `main`). Every card carries a screenshot of the target screen.

---

## How to use this document

Same contract as the [Aug-10 reconciliation handoff](handoff-2026-08-10-reconciliation.md): the Trello cards are per-screen because that is how QA verifies; this doc regroups them into **workstreams by shared code** so the derivation is written once, not six times. A card is done when every workstream listed against it has landed. **The prototype is the spec** — where copy or fallback behaviour is ambiguous, read `app.html` before inventing an answer.

Grounding: the [July-23 scope note](../TrueOccupancy-Scope-2026-07-23.pdf notes in one-pager) fixed the AI-report scope (batch, run-now, auto-run-on-red, provenance, per-lender trigger). The Aug-13 meeting fixed the declared-occupancy column. Anything beyond those is explicitly *not* in this release (see "Not in this release").

---

## Read this first: three decisions block work

1. **Where does per-lender AI-trigger config live?** (#45) — per-org settings on the Config page is assumed; the scope note flags it as open. Blocks #45 only.
2. **`InfoHover` tooltip extension** — the registered `Tooltip` is truncation-gated; #42, the "Mixed" hover (#34/#36) and the AI marker hover (#50) all need a general hover tooltip. A candidate implementation ships in the prototype (`ScanConfigScreen.tsx → InfoHover`, grey bubble: `surface-2`/`ink-2`/`line` tokens). Needs design-system sign-off before reuse.
3. **Naming: "Deep Search" vs "Occupancy report"** (#43) — the action vs the artifact. Note `OccDepth` (`standard`/`deep-ambiguous`/`deep-always`) already exists as a *scan-depth* config; do not let the feature name collide with it.

---

## The two ideas underneath everything

**1 · Declared is derived through one resolver, like detected is.** The detected side already has one helper every screen calls (`occMatchForRisk`). This release gives the declared side the same: `resolveIntent(row, defaultIntent)` → `row.intent ?? defaultIntent`, plus a batch summary (uniform → the label; differing → `Mixed` + per-intent counts). Nine surfaces render it; none reimplement it.

**2 · The confidence % always describes the finding.** Stored score = P(rented). Finding **rented** → show raw; **not rented** → show `100 − score`; **possibly rented** → no flip (it *is* the uncertainty). Declared intent never changes the flip — it only drives the reconciliation headline. Same rule on screen and PDF; they must never disagree.

---

## Workstreams

### W1 — Declared-occupancy resolver *(land first)*
**Closes:** #34 · **Prerequisite for:** W2
One pure helper + batch summary. Edge contract: undeclared → "Not sure", never blank; failed/unscanned rows still count toward the declared summary; historical batches resolve (per-row `intent` is retained on `BatchHistoryEntry.rows`).

### W2 — Intended columns across the surfaces
**Closes:** #35 #36 #37 #38 #39 #48 · **Depends on:** W1
- #35/#36 are **one change** — the shared `buildScanColumns` (`HomeScreen.tsx:208`) feeds both Dashboard and History.
- #37 promotes the per-address Declared column from the red-filtered set (`buildBatchRedColumns`) into the default batch columns — don't duplicate it in the red view. CSV junk intents (`normalizeIntent` returns null) must surface an intake notice, not a silent fallback.
- #38/#39: schedules list + batch-schedule detail show the batch summary ("Mixed"), per-address on the opened run.
- #48: per-run intent on `RunHistory` rows (both kinds), from the same helper.

### W3 — Confidence flip
**Closes:** #40 #41 · **Independent** · **✅ fully implemented in the prototype**
`ConfidenceHero.tsx` (flip + finding-labelled copy) and `CertificateSheet.tsx` (`:240` main finding, `:779` per-row history — each row flips on **its own** verdict). Port verbatim. Do **not** flip: `RedPropertyDrawer:212` (always the rented branch), `ListingsPanel` Confidence (listing-match, different number), `AIInvestigator` scores.

### W4 — "Not sure" config
**Closes:** #42 · **Independent** · **✅ implemented in the prototype**
ⓘ tooltip + toggle + "likely to look like" dropdown + the three outcome filters. **The two controls are different jobs**: the dropdown = the scan/treatment baseline for an undeclared property; the three filters = Not-sure's *own* definition of red/yellow/green — they may differ, neither disables the other. OFF → binary rented check. Production: new `OccConfig` fields (`notSureResemblesIntent`, `notSureByResemblance`) wired into `occMatchForRisk`, Save and dirty-tracking (the prototype does not persist them).

### W5 — AI report core
**Closes:** #46 → #43 #44 (#45 after decision 1) · #46 ✅ in prototype
- #46: one opt-in toggle, OFF by default, copy states **single + batch** coverage and the **cost** reason. On: red from a single scan auto-runs the report; a batch finds its red rows and runs them.
- #43: batch job over `LiveBatch.aiPhase` / per-row `aiReport` (state machine already in `AppState.tsx` — the sim conveyor is the seam a real backend replaces). Per-row retry for failures; notification-dock "AI reports · N of M" states need speccing.
- #44: run-now must bypass the batch queue; add a cost hint at the CTA.
- AI-report **scheduling stays deferred** (human-in-the-loop, per scope).

### W6 — Provenance & AI visibility
**Closes:** #47 #49 #50 · **Depends on:** W5
- #47: cached serve + "last ran / last confirmed" + "re-checked on X — identical result". Applies to the **transparency certificate** only; the AI-report PDF is deferred scope.
- #49: AI status on schedule-detail run rows (only when #46 is ON; absence renders nothing).
- #50: quiet "AI report available" marker on list rows — strictly informational, never changes verdict/tone/counts.

### W7 — Status-change reaction *(cross-cutting)*
**Closes:** #52 · **Depends on:** W5
Source-agnostic rule: any effective-status change (re-scan or AI) re-evaluates automation membership via the **existing** `retention: monitor | remove`; a cleared red stops its red-flag-rule automation (existing stopped/restart UI in the red drawer). **Scope guard:** whether AI changes the effective status is the Aug-13 open question — this workstream triggers on status change from any source and does not itself decide that.

### W8 — Red-list retirement *(debt)*
**Closes:** #51 · **Independent** · **✅ implemented in the prototype**
`HomeScreen` ⚠ flags + batch "N red" badge and `ScheduleDetailScreen` red-count banner are now matrix-derived (`occMatchForRisk`). Production: port, then **delete `isRedAddress`** (`RedAddressesScreen.tsx:250`). Headline regression: same address, same run → same red status on every screen; no row with a red ⚠ and a non-red pill.

---

## Suggested build order

```
PR 1  W1 + W8      (helper + debt port — small, unblocks everything)
PR 2  W2           (all Intended columns in one PR — shared builder means split PRs drift)
PR 3  W3           (hero + PDF together; never ship one without the other)
PR 4  W4           (needs InfoHover sign-off)
PR 5  W5           (#46 first — the toggle is the contract #43/#44 implement)
PR 6  W6           (needs PR 5)
PR 7  W7           (needs PR 5)
```

## Cross-cutting regression checklist
- [ ] Declared value for one address identical on Dashboard, History, Batch, Scheduled, run history, PDF.
- [ ] "Mixed" appears iff a batch's resolved intents differ; counts on hover sum to the batch total.
- [ ] Confidence % + finding label agree with the verdict pill on every surface; screen and PDF show the same figure.
- [ ] Not-sure: toggle OFF → binary rented behaviour; ON → resemblance baseline + Not-sure's own outcome filters.
- [ ] AI auto-run fires only on red, only when opted in; yellow/green stay on-demand; run-now always works.
- [ ] A status change (any source) re-evaluates automation membership; cleared red = stopped rule, visible in the drawer.
- [ ] `isRedAddress` deleted; grep clean; editing the outcome matrix moves every ⚠/count on next read.

## Not in this release (decided or deferred — do not build)
- AI-report certificate/PDF and AI-report scheduling (deferred, July-23 scope).
- AI changing the displayed verdict / "changed by AI" icons / investigation-level indicator (Aug-13 open question — parked proposal).
- Deep search on yellow/green (works against the scaled-cost model).
- Outside pictures / image matching (research only, no UI expected).

## Next week (queued, in order)
1. **Red-flag rule productized** — "red → auto-schedule" (Aug-6 intent), plus fixing the red drawer's dead link to the retired "Configuration → Recurring scans" section. Ticket to be written.
2. **Report TTL** — deny-serve beyond N days (July-30) — confirm agreement first.
3. **Per-intent report variants** (Aug-6 commitment) — spec-first card.
4. Revisit outside pictures + AI↔verdict reconciliation when the client decides.

**Reading order for day 1:** `src/state/OccupancyConfig.tsx` → `src/state/AppState.tsx` (resolver seams, `aiPhase` conveyor, `retention`) → `src/pages/ScanConfigScreen.tsx` (Not-sure + AI toggle mocks) → `src/components/result/ConfidenceHero.tsx` + `CertificateSheet.tsx` (the flip) → `src/pages/HomeScreen.tsx` (`buildScanColumns`, matrix-derived ⚠).
