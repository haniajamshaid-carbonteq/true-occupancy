name: working-indicator
status: draft
version: 1
extends: none
class: AI surface

## Anatomy
The Notification Dock (DESIGN.md §14) is this product's working indicator. It is a
background-task surface, not a chat surface.

- `src/components/notification/NotificationDock.tsx` — three parts in one file:
  `NotificationDock` (entry; forks on the `notifications` prop), `LiveDock`
  (subscribes to `useAppState().liveBatch` + `useAIInvestigator()` + `transients`,
  derives the list and wires actions), `DockShell` (pure presenter, owns
  collapsed ↔ expanded). Mounted once in `src/components/AppShell.tsx`.
- Positioning wrapper (`DockShell`): `fixed` (or `absolute` when `contained`),
  `top: 14`, `left: 50%`, `translateX(-50%)`, `zIndex: 90` — ⚠ hardcoded in
  source; classes `notification-dock` + `md:!left-[calc(50%+140px)]`.
- `NotificationPill.tsx` — collapsed `<button>`. 26 px glyph well (spinner /
  `Icon check` / `Icon alert` / `StackedDotsGlyph`) · title `text-label` on
  `--ink-2` · meta `font-mono text-micro` on `--ink-3` · optional 2 px
  `InlineRail` · optional `CountdownRing` (26 px SVG, `--clean` stroke over
  `--line`).
- `NotificationStack.tsx` — expanded shell, `w-[420px] max-h-[360px]`, `p-3`,
  `gap-3`. Header = mono eyebrow summary (`2 running · 1 done · 1 failed`) on
  `--ink-4` + collapse chevron. Body = scrolling column of rows, `gap-2`.
- `NotificationRow.tsx` — 26 px status chip (`theme.soft` bg, `theme.accent`
  glyph) · title `text-label` 600 · meta `font-mono text-micro` (`mt-0.5`) ·
  `CountProgress` (3 px bar) or `StepProgress` (segmented, `dock-shimmer` on the
  active segment) · `RowAction` buttons (`mt-2.5`, `gap-1.5`) · Dismiss `x`
  (hidden while running).
- Surface tokens: `--surface` bg, `--line-strong` border, radius 22 px
  (⚠ hardcoded), rows `--surface-2` + `--line` + `rounded-xl`. Shadow is written
  literally as `0 24px 48px -16px rgba(20,45,85,.14), 0 8px 16px -8px rgba(20,45,85,.07)`
  ⚠ hardcoded in source (DESIGN.md §14.1 names this `--shadow-lg`).
- Companion surface in `src/components/result/AIInvestigator.tsx`: a single
  persistent slot below `ConfidenceHero` that owns all four states
  (`IdleCard` · `LoadingCard` · `ReportCard` · `ErrorCard`). The dock
  suppresses itself while the slot is on screen. `AICtaButton` was removed
  in r2 — see Rules.
- Motion (`src/styles/motion.css`): `dock-in` 320 ms `--ease-spring` applied
  inline by `DockShell`; `dock-out` defined but not referenced by any component;
  `dock-shimmer` 1400 ms on the active `StepProgress` segment; `ai-spin` 900 ms
  linear on both dock spinners (800 ms in `AIInvestigator.Spinner`).

## States
- idle — dock renders `null` (`LiveDock` returns `null` on an empty derived
  list). The occupancy-report slot does **not**: `AIInvestigator` renders
  `IdleCard`, a `Card padded` carrying the "Occupancy report" eyebrow, the
  headline "Find out who actually lives here", one line of explanation, and a
  `Button variant="primary"` labelled "Run report" pinned top-right. The slot
  never returns `null`, because a report that was never run and a report that
  found little must be distinguishable in an audit trail.
  ⚠ Changed in r2. Previously the slot rendered `null` and the only idle
  affordance was `AICtaButton` in `ScanContextBar`.
- working (steps visible) — status `running`. Accent `--brand`, chip
  `--brand-soft`, spinner on `ai-spin`. Batch → `CountProgress` (`done / total`,
  gradient `accent → --brand-2`); AI → `StepProgress` (`Step 1 of 2` / `2 of 2`,
  active segment shimmering, remaining `--line-strong` / `--line`). Meta strings:
  `Retrieving listings` → `Cross-checking signals`. Dismiss suppressed. Inline on
  `/result/*`, `LoadingCard` expands the two bus phases into six named substeps
  (`Resolving property records` … `Building the investigation report`) with a
  done (`--clean`) / current (`--brand-soft` + brand halo) / pending (`--line`)
  breadcrumb plus a `skeleton-pulse` silhouette of the result card.
- streaming — ⚠ NOT IMPLEMENTED in source. `src/data/aiInvestigation.tsx` resolves
  one whole `AIInvestigationResult` after two timed phases; nothing emits partial
  output.
- complete — status `completed`: accent `--clean` / `--clean-soft`, `Icon check`,
  progress removed, meta `N / M scanned`, `primaryAction` "View results"
  (navigates `/batch/{id}` then calls `dismissBatch()`); `autoDismissAt =
  finishedAt + 6000` and the pill draws a `CountdownRing`. Mixed outcome →
  `completed-errors`: accent `--warn` / `--warn-soft`, `Icon alert`, meta appends
  `· N failed`. On AI success the dock drops the notification entirely
  (`deriveAINotification` returns `null`) and `AIInvestigator.ReportCard` renders
  in the page body. The report is **frozen**: generated once per scan, written to
  `sessionStorage.occupancyReports`, and re-read on every later mount, so it
  survives navigation away and back. It carries a generated date and offers **no
  re-run** — a re-run control on a one-time artifact is a discard button.
  Disclosure is a full-width labelled bottom row ("Read the full report" /
  "Collapse") with a circled chevron, deliberately the same anatomy as
  `ConfidenceHero`'s "Why This Score" so the two cards on the result page
  disclose identically.
- error — status `error`: accent `--risk` / `--risk-soft`, `Icon alert`. Batch →
  "View partial"; AI → "Retry" (`startAIInvestigation(scenario)`). Persists until
  dismissed; no `autoDismissAt`. Pill and stack switch to `role="alert"` (stack
  also `aria-live="assertive"`). Inline equivalent `AIInvestigator.ErrorCard`
  shares the `IdleCard` shell (plain `Card`, eyebrow, headline, top-right
  action) with headline "The report did not finish" and a `Re-run` button.
  Nothing is written to storage on failure, so a failed run does not consume
  the scan's one report — the copy states this explicitly, because without it
  users will not risk pressing the button.
  ⚠ The user-facing wording deliberately avoids the word "interrupted", which
  this file reserves for user-initiated abort. Decision recorded 2026-07-21.
- refusal — ⚠ NOT IMPLEMENTED in source. No status distinct from `error` exists
  for "cannot complete". Still open: an investigation that *runs* but reaches no
  verdict should consume the report and render as a finding, not as a retryable
  error. Today it would be indistinguishable from a dropped connection.
- interrupted — ⚠ NOT IMPLEMENTED in source. No cancel/abort affordance;
  `runAIInvestigation` has no abort path. The bus's monotonic `runId` guard
  against stale resolutions has no visual surface.

Cross-cutting:
- Keyboard focus — pill is a real `<button>`; `.notification-dock-pill:focus-visible`
  paints `0 0 0 2px rgba(10,183,163,.45)` ⚠ hardcoded (brand teal at 45%).
  Enter/Space expand natively; Esc collapses via a `DockShell` keydown listener.
- Mobile — centred on `left: 50%`; the `md:` override shifts it past the side nav
  only at `md` and up. Stack is a fixed `w-[420px]` with no narrow-viewport
  reflow. ⚠ no mobile behaviour specified in source.

## Variants
- Collapsed `NotificationPill` vs expanded `NotificationStack` (`forcedExpanded`
  overrides internal state for spec frames).
- Pill: single-task render vs aggregate (`N tasks running` + `StackedDotsGlyph`)
  when more than one notification is live.
- Notification `kind`: `batch` · `ai-investigator` · `transient`.
- Notification `status`: `running` · `completed` · `completed-errors` · `error`.
- Progress `kind`: `count` (bar) · `step` (segmented).
- `contained` — anchors to the nearest positioned ancestor for spec frames.

## Rules
- Must own every long-running task; replaces the legacy inline `BatchHugCard` and
  the inline AI loading/error cards for cross-page awareness (§14).
- Must suppress a notification when the user is on the page already showing that
  task's rich inline surface: batch when `pathname === '/batch'`, AI when
  `pathname.startsWith('/result/')` (§14.8, `LiveDock`).
- Must not be used for ephemeral confirmations (`AutomationControl.Toast`,
  bottom-centre, 3 s), form validation, or idle pre-action affordances.
- ⚠ **Conflict with DESIGN.md §14.9, resolved by the owner 2026-07-21, not
  silently.** §14.9 places the run CTA in `ScanContextBar`. It now lives in the
  occupancy-report slot itself. Reason: the split put the button at the top of
  the result page and its outcome below the fold, with no scroll, no anchor,
  and a CTA that deleted itself on success — so a ~10 s async action completed
  entirely off-screen. One slot that is the CTA, then the progress, then the
  report removes the problem rather than patching it with a `scrollIntoView`.
  §14.9 is now stale on this point and needs the owner's edit.
- Status accents must reuse the existing `*-soft` / `*-ink` pairs; the dock
  introduces no palette of its own (§14.2). The surface stays white — the accent
  chip carries the entire status signal.
- Dismiss is only offered once a task is not `running`; errors persist until
  acknowledged, only `completed` carries an auto-dismiss countdown (§14.7).
- `prefers-reduced-motion: reduce` strips transforms and kills descendant
  animations (`animation: none !important`), leaving opacity only.
- Invisible logic: batch status is derived, never stored — `failed === 0` →
  `completed`, `failed >= total` → `error`, otherwise `completed-errors`.

## Revisions
- r2 (2026-07-21): the AI surface became a one-time **occupancy report**.
  Breaking for anything that assumed the old contract — re-check consumers.
  · run CTA moved from `ScanContextBar` into the slot (§14.9 conflict above)
  · slot never renders `null`; `IdleCard` added
  · `SuccessCard` → `ReportCard`: frozen, dated, bottom-row disclosure,
    no re-run
  · `AICtaButton`, `ModuleHeader` and `IdleHint` deleted
  · reports persist in `sessionStorage.occupancyReports`; `resetAIInvestigation`
    now clears live status only and never touches stored reports
  · `?ai=loading|success|error` on a result route forces a state, because the
    mock never rejects and the failure path is otherwise unreachable in-app
  · still open: report is absent from the PDF certificate and from AppState
    history; refusal vs error still unsplit (see States)
- r1: transcribed from src/components/notification/{NotificationDock,NotificationPill,
  NotificationStack,NotificationRow}.tsx, src/components/result/AIInvestigator.tsx,
  src/data/aiInvestigation.tsx, src/styles/motion.css and docs/DESIGN.md §14.
