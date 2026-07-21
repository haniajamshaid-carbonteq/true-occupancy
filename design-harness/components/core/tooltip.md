name: tooltip
status: draft
version: 1
extends: none
class: Overlay

## Anatomy
⚠ No shared primitive exists — there is no `src/components/ui/Tooltip.tsx`. The only real
implementation is a file-private helper, `TruncatedText`, in
`src/components/result/ListingsPanel.tsx` (~line 962). Transcribed here as-is; it is not
importable and must not be treated as a system component until the owner promotes it.

- Trigger: a `<span className="truncate block min-w-0">` wrapping the text. A `ResizeObserver`
  measures `scrollWidth > clientWidth + 1` to decide whether the text is actually clipped.
- Bubble: `role="tooltip"`, `position: fixed` (so it escapes table overflow clipping),
  `z-50` (⚠ hardcoded), `pointer-events-none`, `px-2 py-1`, `rounded-md` (`--r-md`),
  `text-caption`, `font-sans`, `--shadow-md`, `max-w-sm`, `break-words`.
  Background `var(--navy)`, text `white` (⚠ raw `white`, not a token, in source).
- Position: anchored to the trigger's `getBoundingClientRect()` at `left: rect.left`,
  `top: rect.top - 8` with `translateY(-100%)` — always above, always left-aligned. No arrow.
- Elsewhere in the product, "tooltip" means either the native `title` attribute
  (`src/components/AutomationControl.tsx` on the disabled Automate button) or a bespoke hover
  panel (the per-status breakdown on the "X of Y" count in
  `src/components/AutomationScopeCard.tsx` / `src/components/AutomationBanner.tsx`).
  Three different mechanisms, one name.

## States
- open — shows only when BOTH `hover` and `overflowing` are true. No open delay, no animation
  (⚠ neither `--motion-fast` nor any keyframe is applied). Content is the `tooltip` prop, else
  the child string.
- closing / dismiss — ⚠ NO EXIT ANIMATION and no dismiss affordance: `onMouseLeave` sets
  `hover=false` and the node unmounts instantly. Escape does not close it (nothing to close —
  it is not focusable).
- overflow — the bubble itself is `max-w-sm` + `break-words` + `whiteSpace: 'normal'`, so long
  text wraps rather than clipping. ⚠ Viewport collision is NOT handled: a trigger near the top
  or right edge pushes the bubble off-screen.

## Variants
none — one bubble shape. The only input variation is `tooltip` (explicit text) vs. falling back
to the child string.

## Rules
- Must only appear when the text is genuinely truncated — a tooltip that repeats fully visible
  text is noise. This is the whole point of the `ResizeObserver` check.
- Must be `position: fixed`, not absolute, so it escapes the DataTable's clipping ancestors.
- ⚠ Mouse-only: no `focus` / `blur` handlers, no `aria-describedby` on the trigger, and the
  trigger is not focusable — so the tooltip is unreachable by keyboard and effectively invisible
  to screen readers despite `role="tooltip"`. This fails the harness's cross-cutting
  visible-keyboard-focus requirement.
- ⚠ Touch: `onMouseEnter` never fires on touch devices, so there is no mobile path to the text.
- Bubble uses `--navy` on white type — an inversion of the product surface, consistent with
  DESIGN.md §13.1 treating navy as the ink/structure color and reserving teal for accents.

## Revisions
- r1: transcribed from `src/components/result/ListingsPanel.tsx` (`TruncatedText`), with
  cross-references to `src/components/AutomationScopeCard.tsx`,
  `src/components/AutomationBanner.tsx`, `src/components/AutomationControl.tsx`,
  `src/styles/tokens.css`, `docs/DESIGN.md` §13.1 into harness format.
