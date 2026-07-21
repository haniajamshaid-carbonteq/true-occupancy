name: loading
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
Two distinct loading affordances exist; there is no single `Loading` component.

**Skeleton — `src/components/ui/TableSkeleton.tsx`**
- Placeholder rows for `DataTable`, rendered inside DataTable's own container.
- Desktop (md+): `hidden md:grid gap-4 px-6 py-4 border-t border-line`, grid template built
  from the same `columns` array the live table uses, plus a trailing `16px` track when
  `interactive`.
- Bar: `h-3 rounded-sm bg-line skeleton-pulse`, width from `barWidth(row, col)` —
  deterministic `45–95%` so rows don't read as a regular comb and don't reflow per render.
- Mobile (`md:hidden`): card-stack mirror — `border-t border-line px-5 py-4 flex flex-col gap-2`
  with two bars per card.
- Every skeleton block is `aria-hidden`.

**Spinner — `ai-spin` keyframe, `src/styles/motion.css:250`**
- No component. It is a bare `@keyframes ai-spin { to { transform: rotate(360deg); } }`
  applied as an inline style by each consumer:
  `src/components/result/AIInvestigator.tsx:465` (`ai-spin 800ms linear infinite`),
  `src/components/notification/NotificationPill.tsx:27` and
  `src/components/notification/NotificationRow.tsx:57` (both `ai-spin 900ms linear infinite`).

**Pulse — `skeleton-pulse`, `src/styles/motion.css:228`**
- `animation: skeleton-pulse 1400ms ease-in-out infinite`; opacity oscillates `0.55 → 1 → 0.55`.
- `@media (prefers-reduced-motion: reduce)` → `animation: none; opacity: 0.7`.

## States
- populated — n/a for the skeleton itself; it is unmounted the moment `DataTable.loading`
  goes false and real rows take its place in the identical grid.
- loading — the component's only real state. `count` placeholder rows (default 6; DataTable
  passes `pageSize ?? 6`).
- empty — ⚠ NOT IMPLEMENTED. `count={0}` renders nothing; there is no zero-state treatment.
- error — ⚠ NOT IMPLEMENTED. The skeleton has no failure state; the owning page swaps to
  `src/components/ui/ScreenError.tsx` instead.
- partial — ⚠ NOT IMPLEMENTED. No mixed real-rows-plus-skeleton mode; loading is all-or-nothing.

## Variants
- skeleton (`TableSkeleton`) — table/list loading, layout-preserving.
- spinner (`ai-spin` inline animation) — in-flight async work inside the AI Investigator and
  the Notification Dock. Not a component; ⚠ each consumer hardcodes its own duration
  (800ms vs 900ms) inline.

## Rules
- Skeleton must reuse the live grid template so layout does not jump on data arrival
  (`TableSkeleton.tsx` header comment) — pass the same `columns` and `interactive` flag.
- Bar widths must stay deterministic per `(row, col)` so the skeleton doesn't flicker
  between renders.
- Bars use `--line` as fill; never a status or brand tone.
- Skeleton must be `aria-hidden` — it carries no information for assistive tech.
- `prefers-reduced-motion: reduce` must kill the pulse and settle at `opacity: 0.7`.
  ⚠ The `ai-spin` consumers have no reduced-motion guard — the spinner keeps rotating.
- Motion is reserved for moments that mean something (`motion.css` header); a spinner is a
  meaningful in-flight signal, decorative shimmer is not.
- Not focusable, no keyboard surface.

## Revisions
- r1: transcribed from `src/components/ui/TableSkeleton.tsx`, `src/styles/motion.css`
  (`skeleton-pulse`, `ai-spin`), and the `ai-spin` consumers into harness format.
