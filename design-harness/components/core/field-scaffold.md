name: field-scaffold
status: draft
version: 2
extends: none
class: Input

## Anatomy
Source: `src/components/ui/Field.tsx` (exports `Field`)
- Column wrapper: `flex flex-col gap-1.5` (⚠ hardcoded in source), holds label → control → hint.
  `className` is appended, so callers can add width/margin constraints; all other div props
  pass through via `...rest`.
- Optional `label` above the control: `text-caption`, semibold, `--ink-2`, bound to the control
  by the caller-supplied `htmlFor`. Field does **not** generate an id — `Input.tsx` makes its own
  `React.useId()` and passes it in as both `id` and `htmlFor`.
- Control slot: `children`, rendered untouched. Field applies no styling, no state class, and no
  ARIA to whatever is passed in.
- Optional `hint` line below: `text-micro`, `--ink-3`, or `--risk-ink` when `error`.

Consumers and near-misses:
- `src/components/ui/Input.tsx` — the only real consumer. It hands Field its `label` / `htmlFor` /
  `hint` / `error` / `containerClassName` and owns the bordered track itself.
- `src/components/ui/Textarea.tsx` — ⚠ **reimplements this anatomy inline** (same
  `flex flex-col gap-1.5`, same `text-caption font-semibold` / `--ink-2` label, same `text-micro`
  / `--ink-3` hint) rather than composing Field. A live duplication, not a variant.
- `src/components/ui/DateRangePicker.tsx:88` — a third label variant switched by
  `labelStyle: 'eyebrow' | 'form'`; the `'form'` branch matches Field's label recipe but is
  hand-written.
- `src/components/AutomateModal.tsx` — section labels are bare uppercase eyebrow `<div>`s with no
  field association at all.

## States
Field is a wrapper: it owns the label and the hint, and nothing else. Every control state below
is the child control's responsibility, and Field neither renders nor forwards it.

- default — label `--ink-2`, hint `--ink-3`, no wrapper chrome.
- hover — ⚠ NOT IMPLEMENTED in source. No hover rule on the wrapper (correct: the control owns it).
- focus — ⚠ NOT IMPLEMENTED in source. No `:focus-within` rule; the wrapper never reacts to focus.
- active — ⚠ NOT IMPLEMENTED in source.
- disabled — ⚠ NOT IMPLEMENTED in source. No `disabled` prop; the label does not dim when the
  control it points at is disabled.
- empty — ⚠ NOT IMPLEMENTED in source. Field cannot see the control's value.
- filled — ⚠ NOT IMPLEMENTED in source. Same reason.
- error — `error` prop **only recolors the hint** (`--ink-3` → `--risk-ink`). It deliberately does
  not touch the control, because each control owns its own error affordance. ⚠ The practical
  consequence, via the one real consumer: `Input.tsx` only changes border/ring inside its
  *focused* branch, so a blurred errored field is visually identical to a valid one apart from the
  hint color. ⚠ No `aria-invalid`, no `role="alert"` on the hint, and no `aria-describedby`
  linking hint to control — the error is invisible to the accessibility tree.
- read-only — ⚠ NOT IMPLEMENTED in source.

## Variants
none — no variant union. Presentation varies only by the optional `label` / `htmlFor` / `hint`
slots and the `error` boolean.

## Rules
- Must not style the control. The label/hint/control split is what makes this wrapper visually
  neutral across Input, checkbox, radio and textarea; adding control styling here would break the
  extraction's premise. Recorded in the source header as a deliberate constraint.
- Must be given `htmlFor` whenever `label` is set — Field does not mint an id, so an unpaired
  label points at nothing.
- Validation errors render inline via `hint` + `error`, never as a toast
  (`docs/DESIGN.md`: "Form validation errors — inline next to the field").
- ⚠ The accessibility wiring named as the delta in r1 (`aria-describedby`, `aria-invalid`,
  `role="alert"`, required/optional affix) is still **not** implemented. The extraction moved the
  duplication into one place; it did not close the gap.
- ⚠ `Textarea.tsx` should compose this wrapper and does not. Converging them is an open decision,
  not a silent fix.

## Revisions
- r1: logged as a gap during harness transcription.
- r2: extracted from the inline label/hint copies in `src/components/ui/Input.tsx` and
  `src/pages/BatchScreen.tsx` into a shared primitive, `src/components/ui/Field.tsx`;
  transcribed here.
