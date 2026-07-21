name: checkbox
status: draft
version: 1
extends: none
class: Input

## Anatomy
Source: `src/components/ui/Checkbox.tsx`
- Outer `<label htmlFor>`: inline-flex, `gap-2` (⚠ hardcoded), `cursor-pointer`, `select-none`, caption scale, ink `--ink-2`.
- Facade box: 16×16 px (`w-4 h-4` ⚠ hardcoded), Tailwind `rounded` (4 px ⚠ hardcoded — not `--r-md`/`--r-lg`), `transition-colors`, `aria-hidden`.
- Check glyph: inline `<svg>` 12×12, `stroke="white"` (⚠ hardcoded raw colour, not a token), `strokeWidth 2.4`, rendered only when `checked`.
- Native `<input type="checkbox">` rendered `sr-only` behind the facade — carries the real semantics, keyboard handling, and `onChange`.
- Optional `label` node after the input.

Real usage: "Remember me" in `src/pages/AuthScreen.tsx`.

## States
- default (unchecked) — background `--surface`, border `1px solid var(--line-strong)`.
- hover — ⚠ NOT IMPLEMENTED in source. No hover rule on label or facade.
- focus — ⚠ NOT IMPLEMENTED in source. The native input is `sr-only`, so its focus ring is not visible, and the facade has no `peer-focus` / `focus-visible` treatment. **This breaks the harness cross-cutting requirement for visible keyboard focus.**
- active — ⚠ NOT IMPLEMENTED in source. No pressed styling.
- disabled — ⚠ NOT IMPLEMENTED in source. `disabled` passes through to the native input via `...rest`, but the facade keeps full-contrast tokens and the label keeps `cursor-pointer`.
- empty (unchecked) — identical to default; this component collapses empty and default into one state.
- filled (checked) — background `--brand`, border `1px solid var(--brand)`, white check glyph.
- error — ⚠ NOT IMPLEMENTED in source. No `error` prop, no `--risk` path.
- read-only — ⚠ NOT IMPLEMENTED in source.
- indeterminate — outside the required floor and ⚠ not implemented; `checked` is a plain boolean.

## Variants
none — `CheckboxProps` adds only `label` on top of the native input attributes.

## Rules
- The native input must stay in the tree (`sr-only`) — it is the accessibility and keyboard contract. Do not swap the facade for a `div` + click handler.
- Checked fill uses `--brand`; one of the sanctioned brand-teal accents per `docs/DESIGN.md` §"~3% brand teal, used as accents only".
- Fully controlled: it renders `checked` and holds no internal state.
- Must not be used for a set of mutually exclusive options — see `radio.md` (gap).

## Revisions
- r1: transcribed from `src/components/ui/Checkbox.tsx` and `src/pages/AuthScreen.tsx` into harness format.
