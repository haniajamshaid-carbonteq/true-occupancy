name: forms
status: draft
type: pattern

# Form pattern

Not yet a full pattern spec — but this is where form questions land, so it answers them
by composition until it earns more.

## Compose from

- **Control** — `components/core/text-field.md`, `textarea.md`, `select.md`, `checkbox.md`,
  `radio.md`, `toggle.md`. Pick per input type; each carries its own state contract (§5).
- **Wrapper** — `components/core/field-scaffold.md` (`Field.tsx`). Owns label + hint +
  error colour around one control. Already extracted — not a gap.
- **Submit** — one primary `button.md` per form; callers must pass `type="submit"`
  explicitly (Button defaults to `type="button"`).

## Known gaps that touch forms

- `field-scaffold` owns error *colour* only; `aria-invalid` / `role="alert"` /
  `aria-describedby` are unimplemented (see `field-scaffold.md`). A form's error
  handling is incomplete until that closes.
- `select` and `toggle` are still `[ ]` gaps — a form needing either hits the creation
  gate (§3). Check the extensions index (§7) first.
- No global `:focus-visible` ring yet (floor violation, §5). Field focus is per-component.

## Rules that bind here

- Sentence case on all labels and buttons (§2).
- Amber is never a button fill; error state uses the `risk` layer, not `warn` (§2, tokens.md).

> This file is a compose-and-route stub, not a designed pattern. Promote it — or replace
> it with a real anatomy — once a form screen proves the composition.
