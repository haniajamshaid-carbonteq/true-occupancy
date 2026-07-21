name: tooltip
status: draft
version: 1
extends: none
class: Overlay

## Anatomy
Source: `src/components/ui/Tooltip.tsx`

A shared primitive now exists — the file-private `TruncatedText` helper in
`src/components/result/ListingsPanel.tsx` was lifted out verbatim. It is **truncation-gated**, not
a general always-on tooltip: the trigger is the text itself, and the bubble appears only when the
text is actually clipped. Callers wrap every cell unconditionally and only overflowing ones get a
tooltip.

- Trigger: `<span className="truncate block min-w-0">` wrapping `children`, plus the caller's
  `className` / `style`. A `ResizeObserver` on that span re-measures
  `scrollWidth > clientWidth + 1` (⚠ the `+ 1` slack is hardcoded) on mount and whenever the
  trigger or its children change.
- Bubble: `role="tooltip"`, `position: fixed` (so it escapes table/overflow clipping),
  `z-popover` (`--z-popover`), `pointer-events-none`, `px-2 py-1` (⚠ hardcoded in source),
  `rounded-md` (`--r-md`), `text-caption`, `font-sans`, `shadow-md` (`--shadow-md`),
  `max-w-sm` (⚠ hardcoded), `break-words`, `whiteSpace: normal`.
  Background `var(--navy)`; text is a raw `white` (⚠ hardcoded in source) — **deliberately not
  swapped to `--on-brand`**, because `--navy` is a structure/ink fill, not a brand fill, and
  `--on-brand` would assert a pairing that does not hold.
- Position: anchored to the trigger's `getBoundingClientRect()` at `left: rect.left`,
  `top: rect.top - 8` (⚠ hardcoded offset) with `translateY(-100%)` — always above, always
  left-aligned. No arrow.
- Content: the `tooltip` prop, falling back to `children` when `children` is a plain string;
  otherwise the bubble text is empty.
- Consumer: `src/components/result/ListingsPanel.tsx:1020` and `:1022` (listing title and its
  sub-line).
- Elsewhere in the product, "tooltip" still means two other mechanisms: the native `title`
  attribute (`src/components/AutomationControl.tsx`, disabled Automate button) and a bespoke
  hover panel (the per-status breakdown on the "X of Y" count in
  `src/components/AutomationScopeCard.tsx` / `src/components/AutomationBanner.tsx`).
  Three mechanisms, one name.

## States
- open — shows only when BOTH `hover` and `overflowing` are true, and a position has been
  measured. No open delay, no animation (⚠ neither `--motion-fast` nor any keyframe is applied).
- closing / dismiss — ⚠ NO EXIT ANIMATION and no dismiss affordance: `onMouseLeave` sets
  `hover=false` and the node unmounts instantly. Escape does not close it — there is nothing
  focused to close.
- overflow — the bubble is `max-w-sm` + `break-words` + `whiteSpace: normal`, so long text wraps
  rather than clipping. ⚠ Viewport collision is NOT handled: a trigger near the top or right edge
  pushes the bubble off-screen.

## Variants
none — one bubble shape. The only input variation is `tooltip` (explicit text) vs. falling back to
the child string.

## Rules
- Must only appear when the text is genuinely truncated — a tooltip that repeats fully visible
  text is noise. The `ResizeObserver` + `scrollWidth > clientWidth + 1` gate is the whole point,
  and is why this cannot double as a hover-anything tooltip: that would need different mount and
  gate logic and is deliberately not folded in.
- Must be `position: fixed`, not absolute, so it escapes the DataTable's clipping ancestors.
- ⚠ **Hover-only.** There are no `onFocus` / `onBlur` handlers, the trigger span is not focusable,
  and there is no `aria-describedby` on it — so keyboard and screen-reader users never reach the
  tooltip at all, `role="tooltip"` notwithstanding. This fails the harness's cross-cutting
  visible-keyboard-focus requirement (design-harness.md §5).
- ⚠ Touch: `onMouseEnter` never fires on touch devices, so there is no mobile path to the full
  text.
- Bubble uses `--navy` with white type — an inversion of the product surface, consistent with
  `docs/DESIGN.md` §13.1 treating navy as the ink/structure color and reserving teal for accents.
  The literal `white` is a recorded, intentional exception to the token rule, not drift to fix.

## Revisions
- r1: transcribed from `src/components/result/ListingsPanel.tsx` (`TruncatedText`), with
  cross-references to `src/components/AutomationScopeCard.tsx`,
  `src/components/AutomationBanner.tsx`, `src/components/AutomationControl.tsx`,
  `src/styles/tokens.css`, `docs/DESIGN.md` §13.1 into harness format.
- r1 (amended): extracted from the file-private `TruncatedText` helper in
  `src/components/result/ListingsPanel.tsx` into a shared primitive,
  `src/components/ui/Tooltip.tsx`; transcribed here. Behaviour unchanged; `z-50` is now the
  `z-popover` token.
