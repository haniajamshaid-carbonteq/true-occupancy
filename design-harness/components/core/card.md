name: card
status: draft
version: 1
extends: none
class: Static

## Anatomy
- `src/components/ui/Card.tsx` — a single container element. No header/footer sub-parts; callers compose children freely (tables, gradients, split panels).
- Base shell: `bg-surface` + 1px `border-line` + `rounded-lg` (`--r-lg`).
- `overflow-hidden` by default, so children are clipped to the radius.
- `shadow-sm` (`--shadow-sm`) by default.
- Optional internal padding `p-card` (`--pad-card`, 24px). Off by default so the card can host edge-to-edge content.
- Polymorphic: `as` renders any intrinsic element (default `div`).

## States
- default — `bg-surface` · `border-line` · `rounded-lg` · `shadow-sm` · `overflow-hidden`. No other states: the component carries no hover / focus / active / disabled treatment. Screens that need a row or card hover tint add it through `className`.

## Variants
- `padded` (bool) — adds `p-card`.
- `flat` (bool) — drops `shadow-sm`; for nesting cards.
- `allowOverflow` (bool) — drops `overflow-hidden` so a positioned popover / menu / tooltip inside the card is not clipped.
- `as` — element tag override.

## Rules
- Must use this shell; never hand-roll a white box with a raw border.
- Must set `allowOverflow` when the card hosts a floating layer, or the float gets cut by the rounded clip.
- Must set `flat` when nesting a card inside a card so shadows don't stack.
- Padding is opt-in — edge-to-edge is the default posture, because DESIGN.md §13.3 puts tables and KPI strips flush inside a single card with hairlines carrying the structure.
- DESIGN.md §13.3 specifies `rounded-xl` (12px) and *no shadow at rest*; the implementation ships `rounded-lg` + `shadow-sm`. Transcribed as implemented.

## Revisions
- r1: transcribed from `src/components/ui/Card.tsx`, `docs/DESIGN.md` §13.3, `src/styles/tokens.css`, `tailwind.config.js` into harness format.
