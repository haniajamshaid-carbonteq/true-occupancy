name: textarea
status: draft
version: 2
extends: none
class: Input

## Anatomy
Source: `src/components/ui/Textarea.tsx`
- Column wrapper: `flex flex-col gap-1.5` (⚠ hardcoded in source), holds label → field → hint.
  `containerClassName` is appended to the wrapper; `className` is appended to the `<textarea>`.
- Optional `label` above the field: `text-caption`, semibold, `--ink-2`, wired via `htmlFor` +
  `id` / `React.useId()` fallback. Accepts a node, so callers can append an inline
  "(optional)" affix (`src/pages/BatchScreen.tsx:195`).
- Field: `<textarea>` with `--surface` background, 1px `--line` border, `--r-lg` (`rounded-lg`),
  `px-4` / `py-2.5` (⚠ hardcoded in source — `px-control-x` is the token utility), `text-body-sm`,
  ink `--ink`, placeholder `--ink-4`, `resize-none`, `outline-none`, `transition-shadow`.
  Height is caller-controlled via native `rows` (3 at the one call site).
- Optional `hint` line below: `text-micro`, `--ink-3`.
- ⚠ Does **not** compose `Field` (`components/core/field-scaffold.md`) — the label + hint
  scaffold is re-typed inline here. Duplication, not a variant.
- Consumer: `src/pages/BatchScreen.tsx:195` (batch Description, `maxLength={280}`, `rows={3}`).
  `src/components/ui/EditableTitle.tsx`'s `multiline` branch is a separate ambient
  click-to-edit surface and does not use this primitive.

## States
- default — border `--line`, no shadow at rest.
- hover — ⚠ NOT IMPLEMENTED in source. No hover rule on the field.
- focus — pure CSS: `focus:border-brand` + `focus:shadow-[0_0_0_3px_var(--brand-soft)]`,
  animated by `transition-shadow`. This is the visible keyboard-focus affordance.
  ⚠ **Deliberately does not match `text-field.md`'s recipe.** Input drives its border/ring from
  React `focused` state (`onFocus`/`onBlur`) and carries a resting `--shadow-sm` that this
  component has none of, so its focused shadow is `ring, --shadow-sm` where Textarea's is the
  ring alone. Preserved because the extracted call site rendered exactly this way; converging
  the two is an **open visual decision**, not a bug to quietly fix.
- active — a textarea's pressed state is its focus state. ⚠ NOT IMPLEMENTED as a distinct state.
- disabled — ⚠ NOT IMPLEMENTED in source. `disabled` passes to the native element via `...rest`
  with no dimming, cursor, or border change.
- empty — placeholder in `--ink-4`; field identical to default.
- filled — value ink `--ink`; no other change from default.
- error — ⚠ NOT IMPLEMENTED in source. There is no `error` prop at all: no risk border, no risk
  ring, no `--risk-ink` hint, no `aria-invalid`, no `role="alert"`. Input has at least the hint
  recolor; this has nothing.
- read-only — ⚠ NOT IMPLEMENTED in source. `readOnly` passes through natively with no visual
  distinction.

## Variants
none — no variant union. Presentation varies only by the optional `label` / `hint` slots and the
native textarea props (`rows`, `maxLength`, `placeholder`) forwarded through `...rest`.

## Rules
- Focus rings are brand teal (`--brand` border + `--brand-soft` ring), per `docs/DESIGN.md`
  "~3% brand teal, used as accents only — … focus rings". Never the browser default blue; that
  is why `outline-none` plus an explicit ring exists.
- Must stay `resize-none` — the drag handle breaks the form's column rhythm.
- Character caps are communicated through `hint` copy plus native `maxLength`; there is no
  live counter and no over-limit state.
- ⚠ The focus divergence from Input is intentional and load-bearing. Do not "align" Textarea to
  Input's recipe without the owner's call — it changes pixels at the one shipping call site.
- Mobile: the field is fluid-width; the caller constrains it (`max-w-[560px]` in
  `src/pages/BatchScreen.tsx`).

## Revisions
- r1: logged as a gap during harness transcription.
- r2: extracted from the inline `<textarea>` in `src/pages/BatchScreen.tsx` into a shared
  primitive, `src/components/ui/Textarea.tsx`; transcribed here.
