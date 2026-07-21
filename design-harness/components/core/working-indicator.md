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
- Companion surfaces in `src/components/result/AIInvestigator.tsx`:
  `AICtaButton` (idle affordance, mounted by `ScanContextBar`) and `LoadingCard`
  (inline six-substep breadcrumb + skeleton) — the dock suppresses itself while
  either inline owner is on screen.
- Motion (`src/styles/motion.css`): `dock-in` 320 ms `--ease-spring` applied
  inline by `DockShell`; `dock-out` defined but not referenced by any component;
  `dock-shimmer` 1400 ms on the active `StepProgress` segment; `ai-spin` 900 ms
  linear on both dock spinners (800 ms in `AIInvestigator.Spinner`).

## States
- idle — dock renders `null` (`LiveDock` returns `null` on an empty derived list;
  `AIInvestigator` returns `null` on `status === 'idle'`). The only idle
  affordance is `AICtaButton` in `ScanContextBar`: brand gradient
  `linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)`,
  `Icon ai-star`, label "Run occupancy investigation".
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
  (`deriveAINotification` returns `null`) and `AIInvestigator.SuccessCard` renders
  in the page body.
- error — status `error`: accent `--risk` / `--risk-soft`, `Icon alert`. Batch →
  "View partial"; AI → "Retry" (`startAIInvestigation(scenario)`). Persists until
  dismissed; no `autoDismissAt`. Pill and stack switch to `role="alert"` (stack
  also `aria-live="assertive"`). Inline equivalent `AIInvestigator.ErrorCard`:
  `--risk-soft` surface, `--risk` border, `--risk-ink` type, heading
  "Investigation failed", default `Button` "Try again".
- refusal — ⚠ NOT IMPLEMENTED in source. No status distinct from `error` exists
  for "cannot complete".
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
  bottom-centre, 3 s), form validation, or idle pre-action affordances — the run
  CTA belongs in `ScanContextBar` (§14.9).
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
- r1: transcribed from src/components/notification/{NotificationDock,NotificationPill,
  NotificationStack,NotificationRow}.tsx, src/components/result/AIInvestigator.tsx,
  src/data/aiInvestigation.tsx, src/styles/motion.css and docs/DESIGN.md §14.
