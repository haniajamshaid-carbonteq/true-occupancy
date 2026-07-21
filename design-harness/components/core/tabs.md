name: tabs
status: draft
version: 1
extends: none
class: Interactive

## Anatomy
- `src/components/ui/Tabs.tsx` — controlled segmented strip. Generic over the value union; used by the dashboard (History / Schedule) and the Scheduled page (Single / Batch).
- Outer row: `flex items-center justify-between gap-4`.
- Tablist: `role="tablist"`, `relative flex items-center gap-1 border-b border-line` — the bottom hairline the active underline reads against.
- Tab: `<button role="tab" type="button" aria-selected>`, `inline-flex items-center h-10 px-control-x font-sans text-label font-medium transition-colors`.
- Optional trailing count badge per tab: `tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded`, background/color swapped inline via `--brand-tint` / `--brand-deep` when active, `--surface-2` / `--ink-3` when not.
- Sliding indicator: `aria-hidden` `absolute -bottom-px h-[2px] bg-brand` (⚠ 2px hardcoded), position/width measured from the active tab via `useLayoutEffect` + `ResizeObserver` + window resize.
- Optional `rightSlot` — right-aligned node on the same baseline (`shrink-0`).

## States
- default (inactive tab) — `text-ink-3`; count badge `--surface-2` / `--ink-3`.
- hover — inactive tab → `text-ink-2` via `transition-colors`. Active tab has no distinct hover.
- focus — ⚠ NOT IMPLEMENTED in source. No `focus-visible` treatment on the tab buttons and no global `:focus-visible` rule in `src/styles/*.css`; only the UA default outline applies.
- active (selected) — `aria-selected={true}`, text `--navy` (applied both as `text-navy` and as an inline `style` fallback — ⚠ duplicated in source); count badge `--brand-tint` / `--brand-deep`; the 2px `bg-brand` indicator slides to the tab's measured left/width over `220ms var(--ease-out)`.
- disabled — ⚠ NOT IMPLEMENTED in source. `TabItem` has no `disabled` field and the button never sets the `disabled` attribute.

## Variants
none — `TabItem` exposes only `value`, `label`, optional `count`; `TabsProps` exposes `items`, `value`, `onChange`, `rightSlot`, `className`. There is no size or style variant.

## Rules
- Fully controlled: the component never holds selection state. `value` + `onChange` are required.
- The underline is the only selection affordance — must not add a filled/pill background to the active tab.
- The indicator is measured, not CSS-derived: labels or counts that change width re-measure through the `ResizeObserver`, and the effect key includes each item's `value:count`. Do not animate label width independently.
- The tablist must keep its `border-b border-line`, or the `-bottom-px` indicator no longer reads as part of a continuous edge (DESIGN.md §13.3 hairline rhythm).
- Counts are numeric and must stay `tabular-nums` (DESIGN.md §13.5).
- Brand teal appears only in the 2px indicator and the active count badge — inside the ~3% accent budget of DESIGN.md §13.1.
- Keyboard: `role="tablist"` / `role="tab"` are set, but arrow-key roving focus and `tabindex` management are not implemented; tabs are reachable only by sequential Tab.

## Revisions
- r1: transcribed from `src/components/ui/Tabs.tsx`, `docs/DESIGN.md` §13.1 / §13.3 / §13.5, `src/styles/tokens.css`, `src/styles/motion.css` into harness format.
