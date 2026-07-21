name: radio
status: draft
version: 2
extends: none
class: Input

## Anatomy
Source: `src/components/ui/Radio.tsx` (exports `RadioGroup` + `Radio`)

This is **not** a classic radio row. Each option is a bordered card with a title, a hint line and
a small circular indicator; the group lays them out as a grid.

- `RadioGroup`: `<div role="radiogroup" aria-label={label}>`,
  `grid grid-cols-1 sm:grid-cols-2 gap-2` (⚠ `gap-2` hardcoded in source) — 1-up on mobile,
  2-up from `sm`. `label` is required and becomes the group's accessible name.
- `Radio` card: `<button type="button" role="radio" aria-checked>`,
  `text-left flex items-start gap-inline-loose px-control-x py-3` (⚠ `py-3` hardcoded),
  `rounded-md` (`--r-md`), 1px border, `transition-colors`.
  - unselected: `bg-surface`, `border-line`.
  - selected: `!bg-brand-tint`, `!border-brand/40` (⚠ `/40` opacity modifier hardcoded).
- Indicator: 16 px `w-4 h-4` (⚠ hardcoded) `rounded-full border-2` (⚠ hardcoded width),
  `mt-0.5` (⚠ hardcoded), `aria-hidden`. Ring `--brand` when checked, `--line-strong` when not;
  checked also renders a `w-1.5 h-1.5` (⚠ hardcoded) `bg-brand` pip.
- Title line: `font-sans font-semibold text-label`, `--brand-deep` when checked, `--navy` when not.
- Hint line: `text-caption`, `--ink-3`, `mt-0.5` (⚠ hardcoded), plus `hintClassName`.
  ⚠ `hintClassName` carries the **one and only difference** between the two shipping groups: the
  retention cards pass `leading-snug` because their hints wrap to two lines; the cadence cards
  pass nothing. It exists solely so both call sites render exactly as they did pre-extraction.
- Consumers: `src/components/AutomateModal.tsx:261` (Cadence) and `:299` (retention rule).

## States
- default — `bg-surface` / `border-line`, indicator ring `--line-strong`, title `--navy`.
- hover — unselected only: `hover:bg-hover-bg` + `hover:border-line-strong`. ⚠ The selected card
  has no hover treatment (its `!` overrides win).
- focus — ⚠ NOT IMPLEMENTED in source. No `focus-visible` ring is declared; the card is a real
  `<button>` so it is tabbable, but the affordance is browser-default only. Fails the harness's
  cross-cutting visible-keyboard-focus requirement (design-harness.md §5).
- active — ⚠ NOT IMPLEMENTED in source. No pressed treatment; selection lands on click.
- disabled — ⚠ NOT IMPLEMENTED in source. `disabled` reaches the native `<button>` through
  `...rest`, but no dimming, cursor or border change is applied.
- empty (nothing selected) — supported structurally: `checked` is computed by the caller, so a
  group with no match renders all cards unselected. No "choose one" affordance.
- filled (one selected) — `!bg-brand-tint` / `!border-brand/40`, `--brand` ring + pip,
  `--brand-deep` title.
- error — ⚠ NOT IMPLEMENTED in source. No `error` prop, no risk border, no error hint,
  no `aria-invalid`.
- read-only — ⚠ NOT IMPLEMENTED in source.

## Variants
none — one card shape. The only per-instance variation is `hintClassName` (`leading-snug` on the
retention group) and whatever `className` the caller appends.

## Rules
- Selection is **not** managed here. `checked` is computed by the caller — the cadence group
  compares option objects with `sameCadence()`, so a `value`/`onChange` contract would not fit
  both call sites. Do not add one without revisiting AutomateModal.
- No native `<input type="radio">` anywhere in `src/`. The control is `<button role="radio">` +
  `aria-checked`, so the group does **not** get browser radio semantics: no name-grouping, no
  form participation, no native keyboard model.
- ⚠ **This is not the ARIA radiogroup pattern.** It has `role="radiogroup"` and `role="radio"`
  but no roving `tabindex` and no arrow-key handling — every card is its own tab stop and
  Up/Down/Left/Right do nothing. Combined with the missing focus ring, keyboard use is possible
  but unguided and invisible. Recorded, not fixed: adding either changes behaviour and rendering
  and is the owner's call.
- Selected styling relies on `!important` utilities to beat the unselected branch. Keep both
  branches in one template literal so the override order stays predictable.
- Sentence case on card titles and hints (design-harness.md §2).
- Mobile: the group collapses to one column below `sm`; the card itself never changes shape.

## Revisions
- r1: logged as a gap during harness transcription.
- r2: extracted from the two hand-rolled `role="radiogroup"` blocks in
  `src/components/AutomateModal.tsx` into a shared primitive, `src/components/ui/Radio.tsx`;
  transcribed here.
