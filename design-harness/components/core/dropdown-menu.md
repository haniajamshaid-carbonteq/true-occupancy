name: dropdown-menu
status: draft
version: 1
extends: none
class: Overlay

## Anatomy
- `src/components/ui/DropdownMenu.tsx` — one primitive covering every "click a button, see a
  menu of actions" surface. Rendered inline in a `relative inline-block` container (no portal).
- Trigger: `trigger` prop, node or `(open: boolean) => node` so callers can mirror open state
  (e.g. flip a chevron). Wrapped in a click-toggling `<span>`.
- Items: `{ label, icon?, onClick?, disabled?, destructive?, hint? }[]`.
- Desktop popover (`hidden md:block`): absolutely positioned, `mt-2`, aligned `right-0` /
  `left-0` from `align` ('end' default), width from `menuWidth` (default `w-56`), `bg-surface`,
  `border --line`, `rounded-lg` (`--r-lg`), `--shadow-md`, `p-1`, `z-40`, `origin-top`.
  Optional eyebrow `title` row (`text-eyebrow`, `tracking-[0.16em]`, uppercase, `text-ink-4`).
- Mobile bottom sheet (`md:hidden`): full-width scrim `bg-ink-2/40 backdrop-blur-[2px]` +
  panel pinned `inset-x-0 bottom-0`, `rounded-t-2xl`, `border-t --line`, `--shadow-lg`,
  `pb-[max(env(safe-area-inset-bottom),16px)]`, grab handle bar in `--line-strong`, and
  the same optional `title` eyebrow in `text-ink-3`.
- Item rows are `<button role="menuitem">`: `PopoverItem` (desktop, `text-label`, `px-2.5 py-2`,
  `rounded-md`) and `SheetItem` (mobile, `text-body`, `px-3 py-3.5`, `rounded-lg`, icon in a
  36px `bg-surface-2` tile, optional `hint` caption line).
- Consumer: `src/components/AutomationControl.tsx` (Automation pill trigger → Change Cadence /
  Cancel).

## States
- open — local `open` state; both the mobile sheet and desktop popover mount, visibility split
  purely by `md:` breakpoint. Sheet animates `sheet-in 180ms cubic-bezier(0.22,1,0.36,1)`
  (translateY 100%→0); popover animates `menu-in 120ms cubic-bezier(0.22,1,0.36,1)`
  (opacity + translateY -4px + scale .98) — ⚠ both keyframes and easings are hardcoded in a
  local `<style>` block rather than drawn from `src/styles/motion.css`. Body scroll locks only
  on mobile (`matchMedia('(max-width: 767px)')`).
- closing / dismiss — ⚠ NO EXIT ANIMATION: the tree unmounts immediately. Dismiss paths:
  outside `mousedown`, `Escape`, trigger re-click, or activating any non-disabled item
  (`activate()` fires `onClick` then closes). Scroll lock is restored on unmount.
- overflow — ⚠ NOT IMPLEMENTED for the desktop popover: no `max-height`, no `overflow-y`, and
  no viewport collision detection — a long item list or a near-edge trigger can run off-screen
  (`align` is the only manual control). The mobile sheet is bottom-anchored so it grows upward
  but likewise has no scroll container. Item labels themselves `truncate`.

## Variants
- `align`: `'start' | 'end'` (default `'end'`) — desktop horizontal anchoring only.
- Item modifiers: `destructive` (`text-error-ink`, hover/active `bg-error-soft`) and `disabled`
  (`opacity-40 cursor-not-allowed`, activation blocked). Default item hover is
  `bg-brand-tint text-brand-deep` on desktop, `active:bg-brand-tint` on mobile.

## Rules
- Must render as a bottom sheet below `md`, never as a floating popover — this is the project's
  stated mobile rule in the component header.
- Must close after any item activates; `disabled` items must not fire `onClick` or close.
- `role="menu"` / `role="menuitem"` are set, but ⚠ arrow-key roving focus and
  `aria-haspopup` / `aria-expanded` on the trigger are NOT implemented — keyboard users Tab
  through items and Escape to close.
- Brand teal is accent-only here (hover tint, active item), per DESIGN.md §13.1's ~3% budget.
- Not portalled — a clipping ancestor will cut the desktop popover. `src/components/ui/Card.tsx`
  documents an escape hatch for exactly this case.

## Revisions
- r1: transcribed from `src/components/ui/DropdownMenu.tsx`, `src/components/AutomationControl.tsx`,
  `src/components/ui/Card.tsx`, `src/styles/tokens.css`, `docs/DESIGN.md` §13.1/§13.3
  into harness format.
