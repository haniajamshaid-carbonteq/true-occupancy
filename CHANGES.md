# True Occupancy — Changes from baseline

This document summarizes every change made on top of the cloned baseline
(commit **`d90c827` — "Cache-bust .tsx fetches in the bootstrap"**, the last
commit on `main` before subsequent UI/architecture rework). All work happens
in this folder (`initial-version/`), kept as a separate git worktree so the
original tree is undisturbed.

Five features were added on top of the baseline, plus a cross-cutting
vocabulary shift. Sections are ordered roughly by user-visible impact.

---

## 0. Vocabulary shift (cross-cutting)

The original prototype framed every scan in **risk** language — `Red flag`,
`Questionable`, `Clean` — paired with an `Investigator` / `Resident`
audience toggle. That framing was retired because it carries judgment the
product is not licensed to make.

| Old | New |
|---|---|
| `Red flag` | `Likely Rented` |
| `Questionable` | `Possibly Rented` |
| `Clean` | `No Public Evidence Found` |
| `Risk score` (0–100) | `Confidence` (0–100%) |
| `Investigator / Resident` mode | *removed* — one unified view |

Color treatment is now keyed on **confidence band**, not on rental status —
color signals *how sure we are*, not *how bad it is*:

| Confidence band | Tone |
|---|---|
| High | Deep blue (brand teal) |
| Moderate | Amber |
| Low | Gray |
| No evidence | Light gray |

Applied across: result screens, batch metric cards, batch table verdict
column, history table result column, history timeline, history diff badges.

---

## 1. New confidence section on result screens

The hero card on every result screen now follows this hierarchy, top → bottom:

1. **Rental status** — biggest text. Qualitative finding (`Likely Rented`).
2. **Confidence band** — medium text with a colored dot (`High confidence`).
3. **Numeric percent** — small bordered chip (`92%`).

The numeric score supports the textual assessment; it no longer dominates.

### User flow

1. User runs or opens a scan → lands on a result screen.
2. Sees the rental status at the top of the page.
3. Reads the confidence band + percent for "how sure we are."
4. Drops into the property overview / WhyCard / listings panel for the
   supporting evidence.

### What changed
- `ScoreCard` was rewritten from scratch. `InvestigatorHero` and
  `ResidentHero` were replaced with one `ConfidenceHero`.
- The `mode` prop on `ScoreCard` was removed.
- `ModeToggle` was removed from `ResultCleanScreen`, `ResultMediumScreen`,
  `ResultHighScreen`, and `WhyExpandedScreen`. The toggle file (`ModeToggle.tsx`)
  is still on disk but no longer mounted.

---

## 2. Auto-rerun scheduling on the batch screen

Batches can now be set to automatically re-run on a fixed cadence
(3 / 4 / 6 / 12 months). The schedule is part of the upload flow and can
also be added later from the batch detail view.

### User flow A — schedule at upload

1. **Upload** → pick a CSV or click "Or try a sample batch."
2. **Ready to scan** (new intermediate step) — user sees:
   - Source confirmation: filename + address count
   - Auto-rerun toggle (off by default)
   - When toggled on: cadence radio + live next-run preview
   - Footer with contextual copy + an explicit **Start scan** button
3. **Results** — banner at top shows `Auto-rerun: every 4 months — next run
   after this completes ~Sep 11, 2026`. The schedule is persisted with
   the batch.

### User flow B — set up a schedule on an existing batch

1. Batch detail page → banner says "Auto-rerun is off for this batch."
2. Click **Set up auto-rerun** → inline cadence picker appears with a
   next-run preview.
3. Confirm → banner switches to the active form.

### User flow C — change cadence / cancel

- **Change cadence** opens the inline picker pre-populated with the current
  value. A confirmation strip shows the old and new next-run dates side by
  side before saving.
- **Cancel auto-rerun** asks for confirmation, noting that the current run
  (if any) will finish but the schedule won't fire again.

### User flow D — run history

The batch detail view now lists every run for this batch (newest first),
with status (`Completed` / `In progress` / `N errors`), duration, and a
link into that run's result set. The first row is marked `initial`.

### What changed
- New `BatchReady` view between `BatchUpload` and `BatchResults`.
- New `ScheduleControl` (cadence picker, used in both upload and edit).
- New `AutoRerunBanner` with collapsed / editing / confirming-cancel states.
- New `RunHistory` section.
- New `Toggle`, `CadenceOption` primitives, inline.

---

## 3. Certificate download / share

Every scan can now be saved as a certificate (a placeholder text blob in
the prototype — swap for a server-rendered PDF in production). CTAs live in
three places, sized to the context.

### Surfaces

| Where | CTA | Behavior |
|---|---|---|
| Result screen header | `Save as PDF` button | Single click → "Preparing…" → real download → "Saved" |
| History timeline entries | PDF icon on each card | Click downloads that scan's cert; doesn't open the result detail |
| Batch results — top toolbar | `Download ▾` dropdown menu | Three options (Combined PDF / ZIP / CSV) |
| Batch row | PDF icon on hover | One click downloads that property's cert |

The dropdown menu options are labeled with their use case so the user
doesn't have to guess:

- **Combined report (PDF)** — Every property in one document — good for sharing
- **Per-property certificates (ZIP)** — One PDF per address — good for case files
- **Spreadsheet (CSV)** — Raw data for analysis or import

### User flow

1. User finds a scan they want to archive (on any of the four surfaces above).
2. Click the relevant CTA.
3. Button shows "Preparing…" briefly, then a `.txt` placeholder downloads.
4. Button shows "Saved" for ~1.5s and reverts to idle.

### What changed
- New shared module `src/components/CertificateActions.tsx` exports
  `CertDownloadButton`, `CertDownloadIcon`, `BatchExportMenu`, plus the
  `useCertDownload` state-machine hook.
- All three result screens render `CertDownloadButton` in the page header.
- The batch screen's old `Export CSV` button became `Download ▾`.
- The batch table row grid widened to fit a hover-revealed PDF icon.
- The history timeline entry adds a PDF icon next to the existing arrow.

---

## 4. History page

`/history` was added as a top-level nav entry. It supports two views:

- `/history` — search + filter + table of every scan across all batches.
- `/history/:address_id` — one address's scan timeline with diff badges
  between consecutive scans.

### Browse view — search + filters + table

The browse view follows this flow: **search → filter → open timeline →
view snapshot → download PDF → compare runs → re-run / schedule.**

A single search bar matches **both** addresses and batch names.

Six filter chips sit below the search bar, each opening a small dropdown:

| Filter | Options |
|---|---|
| Date | All time / 7d / 30d / 90d / 1y |
| Result | Any / Likely Rented / Possibly Rented / No Public Evidence |
| Confidence | Any / High / Moderate / Low / No signal |
| Batch | All batches / each batch name |
| Batch status | Any / Completed / In progress |
| Trigger | Any / Manual / Scheduled |

Active filters highlight in brand tint; a `Clear all` link appears when any
filter or search is on.

The table has six columns:

| Column | Notes |
|---|---|
| Address | Primary identifier; sub-line shows `Run #N · trigger` |
| Scan date & time | Full timestamp for audit defensibility |
| Result | Pill (`Likely Rented`/etc.) + confidence band + % below |
| Batch | Batch name (mono) |
| PDF | Inline `CertDownloadIcon` |
| Actions | `→` View timeline · `↻` Re-run scan |

### Detail view — scan timeline

When the user opens an address, they see the timeline of every scan for
that property, newest first:

1. **Header** with full address, scan count, latest result, and a primary
   **Run new scan** CTA that navigates to `/?prefill=<encoded-address>`.
2. **Scan timeline** with a left rail and colored dot per scan keyed by
   rental status.
3. **Diff badges** between consecutive entries — what changed since the
   previous (older) scan:
   - **Result flip** (`result: possibly rented → likely rented`) — colored by destination
   - **Confidence delta** (`+12 confidence` / `−8 confidence`) — only shown when |delta| ≥ 5
   - **Platforms added** (`new on Vrbo, Facebook`) — brand tone, check glyph
   - **Platforms removed** (`gone from Airbnb`) — muted tone, X glyph
   - "No change since previous scan" placeholder when nothing diffed
4. Each timeline entry has its own **download icon** and arrow into the
   corresponding result page.

### Implementation notes
- Routes registered in `App.tsx`: `/history/:address_id` listed before
  `/history` so the param matches first (v5 Switch ordering).
- History nav entry added to `Sidebar.tsx`.
- `HistoryScreen.tsx` houses both views in one file.
- Mock data: 5 addresses × 2–4 scans each, with `trigger`, full datetimes,
  and platform/listing variations so every filter and diff badge type has
  something to show.

---

## 5. Run AI investigation CTA

A full-width primary CTA sits at the bottom of every result screen:
solid brand fill, white text, brain glyph on the left, generous height.

### User flow

1. User has reviewed the result, score, evidence, listings.
2. If they want a deeper / harder look, they click **Run AI investigation**
   at the bottom of the page.
3. Button shows "Starting investigation…" with a spinner glyph for ~900ms
   (stub for the production handler that would kick off the long-running
   AI pass).

### What changed
- New `brain` icon added to `Icons.tsx`.
- New shared component `RunInvestigationCTA.tsx`.
- All three result screens mount it as the last child of the page body.

---

## Files added

| Path | Purpose |
|---|---|
| `src/pages/HistoryScreen.tsx` | Browse view + per-address timeline |
| `src/components/CertificateActions.tsx` | Cert download CTAs + export menu |
| `src/components/RunInvestigationCTA.tsx` | Full-width brand CTA |

## Files modified

| Path | What |
|---|---|
| `app.html` | Boot order: register the three new files |
| `src/App.tsx` | Routes for `/history` and `/history/:address_id` |
| `src/components/Sidebar.tsx` | Adds the "History" workspace nav entry |
| `src/components/ui/Icons.tsx` | Adds the `brain` icon |
| `src/components/result/ScoreCard.tsx` | Complete rewrite — confidence hierarchy |
| `src/pages/ResultCleanScreen.tsx` | Removes `ModeToggle`; mounts cert + AI CTAs |
| `src/pages/ResultMediumScreen.tsx` | Same |
| `src/pages/ResultHighScreen.tsx` | Same |
| `src/pages/WhyExpandedScreen.tsx` | Removes `ModeToggle` |
| `src/pages/BatchScreen.tsx` | Auto-rerun, ready-to-scan state, run history, BatchExportMenu, per-row cert, new vocabulary |

## Files left unchanged but worth noting
- `src/components/result/ModeToggle.tsx` — still on disk; no longer mounted anywhere. Safe to delete.
- `src/components/ui/RiskBadge.tsx` — no longer used by `ScoreCard`. Safe to delete.
- `src/data/scenarios.tsx` — internal `risk: 'clean' | 'warn' | 'risk'` typing kept as an implementation detail; surface labels are translated at display time.

---

## How to verify

1. Start the static server: `python3 -m http.server 8765` from this folder.
2. Open `http://localhost:8765/app.html`.
3. Walk each flow:
   - **Confidence hero** — `/result/high`, `/result/medium`, `/result/clean`
   - **Auto-rerun** — `/batch` → "Or try a sample batch" → toggle auto-rerun on → pick cadence → **Start scan**
   - **Certificates** — `Save as PDF` on a result; `Download ▾` on a batch; PDF icon on any batch row or history row
   - **History** — `/history` → search "Maplewood" → click View → see the timeline
   - **Run AI investigation** — scroll to the bottom of any result screen
