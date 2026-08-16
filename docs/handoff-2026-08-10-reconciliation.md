# Implementation Handoff — Reconciliation Release

**Date:** August 10, 2026
**Author:** Zarlish Khan
**Trello board:** [True Occupancy](https://trello.com/b/U1EtLHku/true-occupancy) — 18 cards
**Reference implementation:** this repo, `app.html` (branch `main`, HEAD includes uncommitted changes on top of `48f4a80`)

---

## How to use this document

The Trello cards are written **per screen** — "Dashboard column", "Batch tiles", "History
drawer" — because that is how the change was reviewed and how QA will verify it. That
framing is right for acceptance and wrong for implementation: eleven of the eighteen cards
are the *same* code change surfacing on eleven different screens. Built card-by-card, you
write the derivation eleven times and they drift.

So this doc regroups the same eighteen cards into **nine workstreams by shared code**. Each
workstream says what changes underneath, which cards it closes, and where the working
version already lives in this prototype.

**Nothing here replaces the tickets.** Use them together:

| | Trello card | This doc |
|---|---|---|
| Unit of | acceptance & QA | implementation & PRs |
| Owns | user-visible behaviour, edge cases, AC checklist | code shape, sequencing, shared helpers |
| Read it | when verifying a screen | when deciding what to build and in what order |

A card appearing in two workstreams is normal and is called out where it happens — e.g.
[#8](https://trello.com/c/SiZBONtJ) touches the derivation (W1), the red marker (W2), the
filter (W4) and the vocabulary (W3). It is only *done* when all four have landed.

**The prototype is the spec.** Every workstream cites `file:line` in this repo. Where copy,
tone, fallback or empty-state behaviour is ambiguous in a card, the prototype is the tiebreak
— read it before inventing an answer.

---

## Read this first: two decisions block eight cards

Both are the owner's call, not the developer's. Neither is a large change; both are cheap now
and expensive after eight screens ship the wrong word.

### Decision 1 — the naming collision (card [#18](https://trello.com/c/tVEIs2Ti))

Three words — *Consistent*, *Inconclusive*, *Needs review* — are currently mapped along **two
different axes**, and both mappings render inside the same table on the Configuration page.

**Cell results** — `OCC_STATUS_MATCH_LABEL`, [src/state/OccupancyConfig.tsx:193](src/state/OccupancyConfig.tsx:193):

```
green → Consistent     yellow → Inconclusive     red → Needs review
```

**Column headers** — `MATRIX_HEADER_LABEL`, [src/pages/ScanConfigScreen.tsx:55](src/pages/ScanConfigScreen.tsx:55):

```
not-rented → Consistent     possibly-rented → Needs review     rented → Inconclusive
```

They do not line up, and the contradiction is visible in one glance at the outcome matrix:

- The column headed **"Needs review"** (possibly-rented) contains, for owner-occupied, a
  **yellow** cell whose result label is **"Inconclusive"**.
- The column headed **"Inconclusive"** (rented) contains a **red** cell whose result label is
  **"Needs review"**.

Every card that says "show the reconciliation Result" inherits this. Resolve it before
starting W3.

**Recommendation:** keep the cell mapping (it is the one on nine screens) and revert the
config headers to the raw verdicts `NOT RENTED · POSSIBLY RENTED · RENTED`. The matrix's
axes are *declared intent* × *what the scan found* — the columns genuinely are findings, and
labelling them with outcome words is what created the overlap. That makes card
[#1](https://trello.com/c/1dMoACW7) a revert rather than a build. If the owner prefers to keep
outcome wording in the headers, the two mappings must be reconciled to one, not left as-is.

**Gates:** [#1](https://trello.com/c/1dMoACW7),
[#4](https://trello.com/c/l76qRUZk), [#8](https://trello.com/c/SiZBONtJ),
[#9](https://trello.com/c/PrzoWTst), [#14](https://trello.com/c/LM7BPmLX),
[#15](https://trello.com/c/bb1hlQXn), [#17](https://trello.com/c/IN0yfp5W),
[#19](https://trello.com/c/BnH8vwOJ)

### Decision 2 — ratify the matrix itself (card [#18](https://trello.com/c/tVEIs2Ti))

The default matrix is currently only a code default. It needs to become a ratified,
documented source of truth. **The code already matches the table proposed on card #18
exactly** — verified against
[src/state/OccupancyConfig.tsx:140](src/state/OccupancyConfig.tsx:140):

| Declared intent | Not rented | Possibly rented | Rented |
|---|---|---|---|
| Owner-occupied | Consistent | Inconclusive | **Needs review** |
| Second home | Consistent | Inconclusive | **Needs review** |
| Rental / investment | Inconclusive | Inconclusive | Consistent |
| Not sure | Consistent | Inconclusive | Inconclusive |

So the outstanding work on #18 is **sign-off and documentation**, not code. Two properties
worth confirming explicitly at sign-off, because both are load-bearing downstream:

1. *Not sure* can never produce red. An undeclared property is never accused.
2. *Rental + Not rented* is yellow, not green — absent expected income is a soft signal, not
   a clean bill.

---

## The one idea underneath everything

Before this release, "what a scan means" was **stored** — a verdict string on a row, plus a
hand-curated list of red addresses. After it, "what a scan means" is **derived**, at read
time, from two inputs and one config:

```
occMatchForRisk(declaredIntent, observedRisk, config)
   → { status, label, tone, verdict }
```

[src/state/OccupancyConfig.tsx:218](src/state/OccupancyConfig.tsx:218)

Everything else in this release is a consequence:

- Screens stop rendering stored verdict strings and start calling the derivation → **W3**
- The curated red list has no reason to exist → **W2**
- "Red" and "Needs review" become the same thing, so two filters collapse into one → **W4**
- Because it is config-driven, the config page needs to expose it honestly → **W8**

**The three rules that keep this from unravelling:**

1. **Derive, never rename.** `HOME_VERDICT_LABEL['high'] = 'Rented'` → `'Needs review'` is
   *wrong*. The same address is Needs review under an owner-occupied declaration and
   Consistent under a rental one. If a change can be made with find-and-replace, it is the
   wrong change.
2. **One helper, no reimplementation.** Nine screens, one function. A local
   `if (risk === 'risk') return 'red'` anywhere is a bug waiting for the first config edit.
3. **Undeclared is never red.** Absent intent falls back to `not-sure`
   ([OccupancyConfig.tsx:225](src/state/OccupancyConfig.tsx:225)), whose row is green/yellow
   only. Preserve this fallback — it is the difference between a finding and an accusation,
   and it is why the helper takes `intent | undefined` rather than requiring a value.

> **Design-system note.** Three colour layers are deliberately distinct and are the most
> common way to get this system wrong: verdict tones (categorical, non-judgemental) ≠ status
> green/yellow/red (contradiction severity) ≠ clean/warn/risk (the brand palette). Status maps
> *onto* clean/warn/risk for rendering via `OCC_STATUS_TONE`; verdict tones are never coloured
> directly. See `CLAUDE.md` and `docs/DESIGN.md`.

---

## Workstreams

Ordered by dependency. W1 first; W2–W4 can run in parallel once W1 lands; W5–W9 are
independent of all of it.

---

### W1 — Reconciliation core *(foundation — land first)*

**Closes:** [#18](https://trello.com/c/tVEIs2Ti) (with Decisions 1 & 2)
**Prerequisite for:** W2, W3, W4
**Reference:** [src/state/OccupancyConfig.tsx](src/state/OccupancyConfig.tsx)

Port the derivation layer as a standalone, pure, unit-testable module. It has no React
dependency and no I/O — it should be the easiest thing in the release to test and the
hardest to get wrong later.

| Export | Line | Role |
|---|---|---|
| `OccIntent` / `OccVerdict` / `OccStatus` | [41](src/state/OccupancyConfig.tsx:41) | the three vocabularies, kept separate on purpose |
| `OCC_STATUS_MATCH_LABEL` | [193](src/state/OccupancyConfig.tsx:193) | status → *Consistent / Inconclusive / Needs review* |
| `OCC_STATUS_TONE` | [75](src/state/OccupancyConfig.tsx:75) | status → clean/warn/risk (the only colour bridge) |
| `RISK_TO_OCC_VERDICT` | [201](src/state/OccupancyConfig.tsx:201) | existing `risk` field → verdict vocabulary |
| `DEFAULT_OCC_CONFIG.outcomeMatrix` | [140](src/state/OccupancyConfig.tsx:140) | the ratified table from Decision 2 |
| `deriveOccVerdict()` | [164](src/state/OccupancyConfig.tsx:164) | confidence + thresholds → verdict |
| **`occMatchForRisk()`** | [218](src/state/OccupancyConfig.tsx:218) | **the function every screen calls** |

**Contract to preserve exactly:**

- Returns `null` when `risk` is undefined — the row has not been scanned. `null` means *no
  result yet*, and callers must render nothing rather than a default. Do not let it collapse
  into green.
- `intent` undefined → `'not-sure'`, never red (Rule 3 above).
- `config` is a defaulted parameter. Production should thread the org's saved config through;
  the prototype leans on the default because it has no backend.

**Note on `configVersion`.** A scan stores only raw `confidence` plus the `configVersion` in
force when it ran; verdict and status are derived at read time. This is what lets an org edit
its matrix without rewriting a report a lender already attached to a closing file. Production
must resolve each row against *its own* `configVersion`, not the current one — the prototype
stamps the version ([AppState.tsx](src/state/AppState.tsx)) but always derives against the
default, because it has one config and no history of them. **This is the single biggest gap
between prototype and production and it is not covered by any card.**

**Tests worth writing here** (cheap, and they pin Decision 2 permanently):

- All 12 intent × verdict combinations return the ratified status.
- `not-sure` never returns red, for any verdict.
- Undefined intent behaves identically to `not-sure`.
- Undefined risk returns `null`, not a status.

---

### W2 — Retire the curated red list

**Closes:** the ⚠ half of [#6](https://trello.com/c/llRURwVV),
[#8](https://trello.com/c/SiZBONtJ), [#14](https://trello.com/c/LM7BPmLX),
[#17](https://trello.com/c/IN0yfp5W)
**Depends on:** W1

Red used to be membership in a hand-maintained address list (`isRedAddress`). That list could
disagree with the matrix, and did — the same address showed a ⚠ in one table and not in
another, because one read the list and the other read the data. Red is now *derived*:

```js
occMatchForRisk(intent, risk)?.status === 'red'
```

**Rollups:**
- **Batch row** → red if `matchStatusOf(row) === 'red'`
  ([BatchScreen.tsx:433](src/pages/BatchScreen.tsx:433))
- **Batch/schedule aggregate** → worst status across its properties: any red → red, else any
  yellow → yellow, else green ([HistoryScreen.tsx:42](src/pages/HistoryScreen.tsx:42),
  [ScheduledScreen.tsx:42](src/pages/ScheduledScreen.tsx:42))
- **Unscanned or failed rows** are excluded from every count — `occMatchForRisk` returns
  `null` and `null` is not a status. Do not coerce it.

**Converted in the prototype:** [BatchScreen.tsx:68](src/pages/BatchScreen.tsx:68),
[HistoryScreen.tsx:38](src/pages/HistoryScreen.tsx:38),
[ScheduledScreen.tsx:35](src/pages/ScheduledScreen.tsx:35),
[ScanContextBar.tsx:62](src/components/ScanContextBar.tsx:62)

> **Known gap — the prototype is not finished here.** Two surfaces still read the curated
> list and will show ⚠ markers that disagree with the matrix. Production should convert them
> in this workstream rather than inherit the inconsistency:
>
> - [HomeScreen.tsx:247](src/pages/HomeScreen.tsx:247),
>   [:503](src/pages/HomeScreen.tsx:503), [:544](src/pages/HomeScreen.tsx:544) — dashboard ⚠
>   flags and the batch "N red" badge. Note that :522 in the same file *has* been converted
>   for the Result column, so the row's pill and its ⚠ can currently contradict each other.
> - [ScheduleDetailScreen.tsx:60](src/pages/ScheduleDetailScreen.tsx:60) — the red-flag count
>   in the schedule-detail banner.
>
> No card covers these. They are the same one-line substitution as the converted call sites.

`isRedAddress` ([RedAddressesScreen.tsx:250](src/pages/RedAddressesScreen.tsx:250)) should be
deleted once those two are converted, so it cannot come back.

---

### W3 — Result replaces Verdict across every surface

**Closes:** [#1](https://trello.com/c/1dMoACW7), [#4](https://trello.com/c/l76qRUZk),
[#8](https://trello.com/c/SiZBONtJ), [#9](https://trello.com/c/PrzoWTst),
[#15](https://trello.com/c/bb1hlQXn), [#19](https://trello.com/c/BnH8vwOJ)
**Depends on:** W1 + **Decision 1**

The vocabulary change. Every list column, tile and hero leads with the reconciliation Result.
This is Rule 1 territory — derive per row, do not relabel.

**The rule for where raw verdicts survive.** After this workstream, *Rented / Possibly rented
/ Not rented* appears in exactly three places. Anywhere else is a leak and a regression:

1. The **"Why this result"** line on a property hero — the finding being reconciled.
2. The **config outcome matrix** internals — its axis genuinely is findings.
3. The **red property drawer's "Found" row** —
   [RedPropertyDrawer.tsx:219](src/components/red/RedPropertyDrawer.tsx:219).

Everything else shows the Result. `HOME_VERDICT_LABEL`
([HomeScreen.tsx:120](src/pages/HomeScreen.tsx:120)) should be retired from list columns as
each surface converts.

**Per-surface reference:**

| Surface | Card | Reference |
|---|---|---|
| Dashboard → Recent Scans, Single tab | [#4](https://trello.com/c/l76qRUZk) | [HomeScreen.tsx:522](src/pages/HomeScreen.tsx:522) |
| History → table column | [#15](https://trello.com/c/bb1hlQXn) | [HistoryScreen.tsx:435](src/pages/HistoryScreen.tsx:435) |
| Batch → summary tiles | [#8](https://trello.com/c/SiZBONtJ) | [VerdictTiles.tsx](src/components/VerdictTiles.tsx) |
| Batch → RESULT column | [#8](https://trello.com/c/SiZBONtJ) | [BatchScreen.tsx:1161](src/pages/BatchScreen.tsx:1161) |
| Property hero + Why-this-result | [#9](https://trello.com/c/PrzoWTst), [#19](https://trello.com/c/BnH8vwOJ) | [ConfidenceHero.tsx:251](src/components/result/ConfidenceHero.tsx:251) |
| Config matrix headers | [#1](https://trello.com/c/1dMoACW7) | [ScanConfigScreen.tsx:55](src/pages/ScanConfigScreen.tsx:55) — **see Decision 1** |
| Run history rows | — | [RunHistory.tsx:77](src/components/RunHistory.tsx:77) |

**Batch tiles ([#8](https://trello.com/c/SiZBONtJ)) specifics.** `VerdictTiles` already takes
the reconciliation shape. Three tiles — Consistent (shield/clean) · Inconclusive (alert/warn)
· Needs review (flag/risk). The old "N red" sub-count is **removed**: Needs review *is* the
red tile, and two numbers for one concept is how they drift. `redCount` survives as a
deprecated prop for callers mid-migration
([VerdictTiles.tsx:15](src/components/VerdictTiles.tsx:15)) — drop it once nothing passes it.
Counts must sum to the scanned-row count.

**The "Why this result" one-liner ([#19](https://trello.com/c/BnH8vwOJ)).** Copy is locked and
implemented as `reconciliationWhy()` at
[ConfidenceHero.tsx:225](src/components/result/ConfidenceHero.tsx:225). Port it verbatim —
these four strings were written to keep the product verdict-neutral, and paraphrasing them is
a brand regression, not a wording preference:

| Status | Copy |
|---|---|
| green | `The scan found {finding}, which is consistent with the declared {intent}.` |
| red | `The scan found {finding}, which contradicts the declared {intent} — worth a human review.` |
| yellow | `The scan found {finding}; against the declared {intent} this is inconclusive and may need a closer look.` |
| no intent | `No occupancy was declared for this property, so the finding ({finding}) can't be reconciled — treat it as informational.` |

Note the apostrophe in the fourth string is a typographic `'` (U+2019), matching the rest of
the app's copy.

---

### W4 — One status filter per surface

**Closes:** the filter half of [#6](https://trello.com/c/llRURwVV),
[#14](https://trello.com/c/LM7BPmLX), [#15](https://trello.com/c/bb1hlQXn),
[#17](https://trello.com/c/IN0yfp5W)
**Depends on:** W1, W2

Three list screens each carried **two overlapping status filters** — a standalone "● Red flags
N" pill *and* a status/verdict filter that could contradict it. One filter per surface, driven
by the matrix.

**History and Scheduled — drawer chip filter.** Remove the top red pill; add a **"Flagged"**
chip row in the Filters drawer: All / Green / Yellow / Red with per-status counts, recomputed
against the active tab.

- History: [HistoryScreen.tsx:85–126](src/pages/HistoryScreen.tsx:85),
  [:307](src/pages/HistoryScreen.tsx:307)
- Scheduled: [ScheduledScreen.tsx:57–104](src/pages/ScheduledScreen.tsx:57),
  [:289](src/pages/ScheduledScreen.tsx:289)

History additionally drops its raw **Verdict** filter entirely (card
[#15](https://trello.com/c/bb1hlQXn)) — it was the second, redundant status filter. Flagged is
the only one left.

**Batch — clickable tiles instead of a filter row.** The summary tiles *are* the filter; there
is no separate control. [BatchScreen.tsx:503–534](src/pages/BatchScreen.tsx:503)

- `MatchFilter = 'all' | 'consistent' | 'inconclusive' | 'needsReview'`
- Clicking a tile applies it; clicking the selected tile clears it; selected tile is
  highlighted.
- Deep-link: arriving from an "N red" badge elsewhere pre-applies `needsReview`
  **once** ([:521](src/pages/BatchScreen.tsx:521)) — the one-shot flag is cleared after read
  so a refresh does not re-trigger it.

**Applies to all three:** an empty filtered result renders the table empty-state, never a
blank region. On Scheduled, removing the red toggle must not disturb the separate "No
automations yet" empty state — they are different states with different copy.

---

### W5 — Automation reach

**Closes:** [#5](https://trello.com/c/dgZBs2V4), [#16](https://trello.com/c/7sfAQvdn), the
nudge half of [#9](https://trello.com/c/PrzoWTst)
**Depends on:** W1 (for "is this red?")

Recurring re-scan was batch-only. It now extends to single scans, and red results actively
suggest it. The whole workstream hangs on one rule: **one modal, one event, no parallel
implementation.**

```js
window.dispatchEvent(new Event('halcyon:open-automate'))
```

`AutomationControl` listens globally
([AutomationControl.tsx:78](src/components/AutomationControl.tsx:78)) and owns create-vs-edit
— callers never decide which. Three call sites, all already wired:

| Entry point | Card | Reference |
|---|---|---|
| Batch — "Automation recommended" under the Needs-review tile | [#5](https://trello.com/c/dgZBs2V4) | [BatchScreen.tsx:812](src/pages/BatchScreen.tsx:812) |
| Property hero — same link on a red result | [#9](https://trello.com/c/PrzoWTst) | [ConfidenceHero.tsx:317](src/components/result/ConfidenceHero.tsx:317) |
| Single scan header — Automate CTA | [#16](https://trello.com/c/7sfAQvdn) | [ScanContextBar.tsx:148](src/components/ScanContextBar.tsx:148) |

The nudge renders only when the red count is `> 0` **and** the batch has finished scanning —
no premature prompting on a half-complete run. Keyboard-focusable with an accessible label.
When a schedule already exists the CTA shows its status (`Automated · every 6mo`) and opens
edit; single-target cadence options match batch. Scheduled single scans then appear on the
Scheduled page alongside batch automations.

---

### W6 — Batch intake integrity

**Closes:** [#7](https://trello.com/c/YPb7V2a3), [#12](https://trello.com/c/Ei1yGQhZ)
**Independent** — can start immediately

Two unrelated fixes that both live in the batch intake form.

**Duplicate title guard ([#12](https://trello.com/c/Ei1yGQhZ)).**

A batch is identified **to the user** by its **title**, not its filename. Two batches must
never share a title. The same CSV file may back multiple batches with distinct titles — the
filename is not part of the uniqueness check.

The guard lives in two places, covering both creation and rename:

1. **Upload form** — [BatchScreen.tsx:~127–165](src/pages/BatchScreen.tsx). The effective
   title is the user-typed value or, if empty, the derived-from-filename fallback. If that
   effective title collides (case-insensitive, trimmed) with any existing batch, submit is
   blocked and the design-system `Input` error state surfaces on the Title field — not on the
   drop zone. The error message names the colliding title. The file itself is **not** checked
   for uniqueness.

2. **Inline rename** — [BatchScreen.tsx:~549](src/pages/BatchScreen.tsx). `EditableTitle`'s
   new `validate` prop runs `isBatchTitleTaken(next, batch.filename)` before `onSave`. On
   collision: the field stays open, shows the error, and re-focuses so the user can fix in
   place. `excludeFilename` prevents a batch from colliding with itself.

**Central helper:** `isBatchTitleTaken(title, excludeFilename?)` on `AppStateValue`
([AppState.tsx:~637](src/state/AppState.tsx)). Compares against every batch's **resolved
display title** (user title, else derived-from-filename fallback) across `liveBatch`,
`history`, and `schedules`. `excludeFilename` drops every row sharing that filename — a
batch's runs all share its filename, so this removes every "self" row in one pass, letting a
rename keep or case-adjust its own title without a false collision.

**EditableTitle validation** — [EditableTitle.tsx](src/components/ui/EditableTitle.tsx) now
accepts an optional `validate?: (next: string) => string | null` prop. On commit: if the
value is unchanged, close without validating (your own title is never a collision). Otherwise
run `validate`; if it returns a string, reject — stay in edit mode, show the error with
`role="alert"` and the design-system error tones (`--error`, `--error-soft`, `--error-ink`),
re-focus the field. Typing clears the error. This is a generic component enhancement — any
future inline-editable field can use it.

- **Legitimate re-runs are not blocked** — only new batches or renames that collide. Re-running
  through Run history is a different path and stays open.
- *Not yet in the prototype:* when the colliding batch has automation ON, also surface its run
  history (last scanned + cadence) so the user can see it is an active recurring batch. Build
  this from the card; there is no reference implementation.

**Intended Occupancy strip ([#7](https://trello.com/c/YPb7V2a3)).**
[BatchScreen.tsx:588–597](src/pages/BatchScreen.tsx:588)

Reconciliation is meaningless without a declared baseline, so the results header states it:
`INTENDED OCCUPANCY · Owner-occupied · applies to all 14`. Hidden entirely when the batch has
no `defaultIntent` — never a blank row. Pluralise the tail ("all 1 property" vs "all 14").
Eyebrow styling matches the app's other eyebrows.

---

### W7 — History is a list of targets, not a log of runs

**Closes:** [#13](https://trello.com/c/HA0H56SG)
**Independent**

History listed every run as its own row, so one property appeared up to five times. Collapse
to one row per target; the full timeline moves to the detail view.

- `dedupeLatest(rows, keyFn)` — [HistoryScreen.tsx:9](src/pages/HistoryScreen.tsx:9), applied
  at [:108](src/pages/HistoryScreen.tsx:108) (single) and
  [:112](src/pages/HistoryScreen.tsx:112) (batch)
- Dedup key: single = normalised address (case-insensitive, whitespace-collapsed); batch =
  filename. "Latest" = `max(scannedAt)`.
- **Display-only.** Every run is retained and listed under "Run history" on the detail view
  ([RunHistory.tsx](src/components/RunHistory.tsx)). Nothing is deleted.
- The row opens the latest run's report.
- Tab badges, the "N of M entries" label, and **pagination page maths** all recompute over the
  deduped list. Paginating the raw list and deduping the page is the obvious bug here — it
  produces short pages.

---

### W8 — Configuration page surface

**Closes:** [#1](https://trello.com/c/1dMoACW7), [#2](https://trello.com/c/4CICsvpH),
[#3](https://trello.com/c/vz3Zsk6a) *(Done)*
**Independent** except #1, which needs **Decision 1**

**Session timeout ([#2](https://trello.com/c/4CICsvpH)) — net new.** Client request (Jim
McGowan): org security policies range from ten minutes to an hour to never, so it has to be
configurable and tied to SSO forced-logout.

Shape lands on `OccConfig` at
[OccupancyConfig.tsx:116–130](src/state/OccupancyConfig.tsx:116), seeded at
[:154](src/state/OccupancyConfig.tsx:154):

```ts
sessionTimeout: { enabled: boolean; value: number; unit: 'minutes' | 'hours' | 'days' }
// seed: { enabled: false, value: 30, unit: 'minutes' }
```

- Section sits below the Outcome matrix. Toggle **off by default**.
- On → reveal number field + unit selector. Floor of 1, **no upper cap**; invalid/empty/NaN
  clamps to 1. Large values must not break layout.
- Off → hide inputs, save as disabled, **retain the value** for re-enable.
- Switching unit keeps the entered number.
- Real `role="switch"`, keyboard and screen-reader operable, respects
  `prefers-reduced-motion`.
- Participates in dirty-tracking so Save enables correctly.
- Auth setting, not a scan rule — issued reports are unaffected.

**Confidence thresholds removed ([#3](https://trello.com/c/vz3Zsk6a)) — already Done.**
[ScanConfigScreen.tsx:238](src/pages/ScanConfigScreen.tsx:238). The pattern matters for
production parity: the **card is removed, the config shape is kept**. `thresholds.hi/lo` stay
on `OccConfig` and in screen state so saved configs still load and save; `ThresholdBandPreview`
stays in code but dormant ([:86](src/pages/ScanConfigScreen.tsx:86)). Critically, the
threshold **validation path is removed with the inputs** — otherwise Save is blocked by an
invisible field. Same treatment as the retired Recurring-scans and Investigation-depth
sections. Verify parity; do not delete the shape.

---

### W9 — Label only

**Closes:** [#11](https://trello.com/c/hAO9RdD4)
**Independent**

Property detail header: `Download` → `Download PDF`.
[ScanContextBar.tsx:164](src/components/ScanContextBar.tsx:164). Behaviour unchanged; if the
control has a format dropdown, keep it.

Explicitly out of scope on this card, and worth honouring — the batch page one step back
already carries these, and duplicating CTAs on the detail page is what the scope note is
guarding against:

- No automation-status pill in this header.
- No command/search (⌘K) affordance.

---

### W10 — Intent leak prevention *(cross-cutting, no card)*

**Depends on:** W1
**Independent of** W2–W9

The prototype stores `scanIntent` in `sessionStorage` so the result page can reconcile. When
a navigation path does **not** carry a declared intent (red property drawer, monitoring panel,
schedule-detail rows without intent), any previously-stored intent leaks into the next report
and produces a wrong reconciliation line.

**Fix pattern:** every navigation that opens a result page must either set `scanIntent` to the
row's intent or `removeItem('scanIntent')` when no intent exists.

| Call site | File | Change |
|---|---|---|
| Red property drawer "View report" | [RedPropertyDrawer.tsx:~328](src/components/red/RedPropertyDrawer.tsx) | `sessionStorage.removeItem('scanIntent')` — red rows carry no declared intent |
| Monitoring panel "openChange" | [HomeScreen.tsx:~711](src/pages/HomeScreen.tsx) | Same `removeItem` |
| Schedule detail "view run" | [ScheduleDetailScreen.tsx:~70](src/pages/ScheduleDetailScreen.tsx) | Set if `run.intent` exists, remove otherwise |

Production must enforce this at the routing layer — any entry point to a result page that
doesn't explicitly pass intent should clear it. The prototype's `sessionStorage` approach is a
stand-in; production should thread intent through the route/query/state rather than ambient
storage.

---

### W11 — Matrix legend null-safety *(minor, no card)*

[ScanConfigScreen.tsx:~131](src/pages/ScanConfigScreen.tsx) — the `MatrixLegend` component
crashed when iterating an outcome matrix with missing intent rows (possible if a saved config
predates a newly added intent). Added optional chaining (`matrix[intent]?.[v]`) and a
truthiness check. One-line fix; port it to avoid a crash on legacy configs.

---

### W12 — Demo state toggle *(prototype-only, do not port)*

[app.html:~64](app.html) sets `window.__TO_DEMO_STATES__ = true` at boot. This enables the
in-app "Demo · preview states" affordances (e.g. `DemoStateToggle`) so a dev reviewing the
prototype can see a state (like the duplicate-title error) without reproducing it manually.
Set only in `app.html` — `states-spec.html` and `occupancy-spec.html` leave it unset.

**This is prototype-only infrastructure. Do not port to production.**

---

## Ticket → workstream index

Pick up a card, find where the code lives. **A card is done when every workstream listed
against it has landed.**

| # | Card | Screen | Workstreams | Status |
|---|---|---|---|---|
| [1](https://trello.com/c/1dMoACW7) | Relabel Outcome Matrix column headers | Config | **Decision 1**, W3, W8 | Blocked |
| [2](https://trello.com/c/4CICsvpH) | Session timeout setting | Config | W8 | Ready |
| [3](https://trello.com/c/vz3Zsk6a) | Remove Confidence thresholds editor | Config | W8 | **Done** |
| [4](https://trello.com/c/l76qRUZk) | Dashboard Verdict → Result | Dashboard | W1, W3 | Blocked on D1 |
| [5](https://trello.com/c/dgZBs2V4) | "Automation recommended" nudge | Batch | W5 | Ready |
| [6](https://trello.com/c/llRURwVV) | Red toggle → Needs-review filter | Batch | W2, W4 | Ready after W1 |
| [7](https://trello.com/c/YPb7V2a3) | Intended Occupancy strip | Batch | W6 | Ready |
| [8](https://trello.com/c/SiZBONtJ) | Tiles + RESULT column + ⚠ | Batch | W1, W2, W3, W4 | Blocked on D1 |
| [9](https://trello.com/c/PrzoWTst) | Hero Result + "Why this result" | Property detail | W1, W3, W5 | Blocked on D1 |
| [11](https://trello.com/c/hAO9RdD4) | "Download" → "Download PDF" | Property detail | W9 | Ready |
| [12](https://trello.com/c/Ei1yGQhZ) | Duplicate batch title guard | Batch upload + inline rename | W6 | Ready |
| [13](https://trello.com/c/HA0H56SG) | De-duplicate History rows | History | W7 | Ready |
| [14](https://trello.com/c/LM7BPmLX) | Red pill → Flagged drawer filter | History | W2, W4 | Ready after W1 |
| [15](https://trello.com/c/bb1hlQXn) | Verdict column + filter → Result | History | W3, W4 | Blocked on D1 |
| [16](https://trello.com/c/7sfAQvdn) | Automate CTA on single scans | Result | W5 | Ready |
| [17](https://trello.com/c/IN0yfp5W) | Red toggle → Flagged filter | Scheduled | W2, W4 | Ready after W1 |
| [18](https://trello.com/c/tVEIs2Ti) | Define & document matrix logic | Config | **Decisions 1 & 2**, W1 | **Blocking 8 cards** |
| [19](https://trello.com/c/BnH8vwOJ) | "Why this result" one-liner copy | Property detail | W3 | Blocked on D1 |

*(There is no card #10 on the board.)*

**Not covered by any card, tracked here only:**

- The two `isRedAddress` leftovers on Dashboard and Schedule Detail (W2).
- Resolving each row against **its own** `configVersion` rather than the current config (W1).
- Intent leak prevention across all navigation paths into result pages (W10).
- Matrix legend null-safety on legacy configs (W11).

---

## Suggested build order

Five PRs. The first is small and unblocks everything; the rest can run in parallel from day
one (with a dependency note on PR 2). The numbered sequence below is the recommended order if
only one developer is working serially.

### Step-by-step sequence (single developer)

```
Step 1 → PR 1: Reconciliation core (W1 + Decisions 1 & 2)
         Pure module, unit tests, no UI. Closes #18.
         ↓ unblocks everything below
Step 2 → PR 2: Reconciliation across the surfaces (W2 + W3 + W4 + W10)
         The bulk of the release — every screen deriving from the helper.
         W10 (intent leak fix) must land with this or before it.
         Closes #1, #4, #6, #8, #9, #14, #15, #17, #19.
         ↓ can start in parallel with Steps 3–4 once PR 1 lands
Step 3 → PR 3: Automation reach (W5)
         Independent of PR 2. Closes #5, #16, and #9's nudge.
Step 4 → PR 4: Independent screen work (W6 + W7 + W8 + W9 + W11)
         W6 is the title-based duplicate guard (upload + inline rename).
         W11 is the one-line matrix legend fix.
         Safe to batch or split by reviewer preference.
         Closes #2, #7, #11, #12, #13.
Step 5 → Regression checklist (below) against all PRs together.
```

### If parallelising across developers

| Dev A | Dev B | Dev C |
|---|---|---|
| PR 1 (day 1) | PR 4 (day 1 — fully independent) | PR 3 (day 1 — fully independent) |
| PR 2 (day 2+ — needs PR 1) | — | — |

PR 4 and PR 3 need no dependency on anything and can start immediately. PR 2 is the critical
path and the largest — it should start the moment PR 1 merges.

### PR details

**PR 1 — Reconciliation core** *(blocks 8 cards; land first)*
W1 + Decisions 1 & 2. Pure module, unit tests, no UI. Closes #18.

**PR 2 — Reconciliation across the surfaces** *(the bulk of the release)*
W2 + W3 + W4 + W10 together, including the two `isRedAddress` leftovers and the intent-leak
fixes. Splitting these by screen means shipping a build where the Dashboard ⚠ and the
Dashboard Result pill disagree — they read from the same data and should change in the same
commit. Closes #1, #4, #6, #8, #9, #14, #15, #17, #19.

**PR 3 — Automation reach**
W5. Independent of PRs 1–2. Closes #5, #16, and #9's nudge.

**PR 4 — Independent screen work**
W6 + W7 + W8 + W9 + W11. Five unrelated changes, no shared code, safe to batch or split by
reviewer preference. Closes #2, #7, #11, #12, #13.

---

## Cross-cutting regression checklist

Run against the whole release, not per card. Most of these are the failure modes of *partial*
migration — they pass on any single screen and fail across the app.

**Consistency**
- [ ] The same address, in the same run, shows the same status on Dashboard, History,
      Scheduled, Batch and its detail page. This is the headline check — it is what the
      curated red list used to break.
- [ ] A ⚠ marker appears on exactly the rows the Needs-review tile counts. No row has a red ⚠
      and a green pill.
- [ ] Editing the outcome matrix in Configuration changes every screen's counts on next read.
      If a screen does not move, it is not calling the helper.

**Vocabulary**
- [ ] Raw verdict wording (*Rented / Possibly rented / Not rented*) appears **only** in the
      three permitted places (W3). Grep the built output, not just the diff.
- [ ] Result labels are per-row derivations, not a static relabel — the same address reads
      differently under a different declared intent.

**Neutrality and fallback**
- [ ] A property with no declared intent never renders as Needs review, anywhere.
- [ ] An unscanned or failed row is excluded from every tile count, filter count and tab
      badge — never bucketed as green.
- [ ] Nothing in the UI words or colours a verdict as pass/fail. *Rented* is a finding.
- [ ] Opening a result page from the red property drawer, monitoring panel, or a schedule row
      with no intent does NOT show a stale intent from a previous scan (W10 — intent leak).

**Batch title uniqueness**
- [ ] Two batches with the same title (case-insensitive) cannot both exist — blocked at upload
      and at inline rename.
- [ ] A batch can be renamed to its own current title (case-adjusted) without a false collision.
- [ ] The error appears on the Title field (not the drop zone) and clears on typing.

**Filters and empty states**
- [ ] Each list screen has exactly one status filter. Grep for any surviving `RedFilterToggle`
      or raw-verdict filter.
- [ ] Every filter that can return zero rows renders the table empty-state, not a blank
      region.
- [ ] Scheduled's "No automations yet" empty state still works and is distinct from the
      filtered-to-nothing state.
- [ ] History pagination is computed over deduped rows — no short pages.

**Accessibility**
- [ ] Session-timeout toggle: `role="switch"`, keyboard operable, screen-reader labelled,
      respects `prefers-reduced-motion`.
- [ ] "Automation recommended" links are keyboard-focusable with accessible labels.
- [ ] Status is never communicated by colour alone — every pill carries its label.

---

## Reading the prototype

```bash
open app.html
```

No build system, no bundler, no `package.json`. React and Babel Standalone load from unpkg;
each `.tsx` is transpiled in the browser. Files are **not** ES modules — they share global
scope, and load order comes from the `files` array near the bottom of each HTML host. If you
add a file, add it to every host that renders it, above its consumers; a missing entry is
`undefined` at runtime with no build error.

**Fastest path into the change,** in order:

1. [src/state/OccupancyConfig.tsx](src/state/OccupancyConfig.tsx) — the whole model, ~260
   lines, read it end to end
2. [src/pages/BatchScreen.tsx](src/pages/BatchScreen.tsx) — the densest consumer: tiles,
   filters, RESULT column, intake guard, intent strip
3. [src/components/result/ConfidenceHero.tsx](src/components/result/ConfidenceHero.tsx) — hero
   Result, Why-this-result, automation nudge
4. [src/pages/HistoryScreen.tsx](src/pages/HistoryScreen.tsx) — dedup + Flagged filter +
   rollups
5. [src/pages/ScanConfigScreen.tsx](src/pages/ScanConfigScreen.tsx) — matrix editor, session
   timeout, the removed-but-retained thresholds pattern
6. [src/state/AppState.tsx](src/state/AppState.tsx) — `isBatchTitleTaken` helper, intent
   threading
7. [src/components/ui/EditableTitle.tsx](src/components/ui/EditableTitle.tsx) — inline
   validation pattern (generic, reusable)

For visual states of every screen without clicking through flows:

```bash
open states-spec.html
```

**Related docs:** `docs/handoff-2026-08-03.md` (previous release — ServedStamp/freshness, admin
panel, red-address flow, the `scannedAgo` → `scannedAt` migration) · `docs/DESIGN.md` (brand
source of truth) · `design-harness/design-harness.md` (read before any UI work) ·
`CLAUDE.md` (architecture and the token/component rules).
