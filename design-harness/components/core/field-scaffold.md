name: field-scaffold
status: draft
version: 1
extends: none
class: Input

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. The label + helper + error pattern exists, but only **inline and duplicated** — there is no shared wrapper component any control can be dropped into. Do not build from this file.

Where the pattern is repeated today (all hand-written, none reusable):
- `src/components/ui/Input.tsx` — bakes label / `hint` / `error` into the text-field itself; the wrapper is not extractable and cannot host a checkbox, radio, or textarea.
- `src/pages/BatchScreen.tsx` (~line 195) — the Description field re-types the exact same label markup (`text-caption font-semibold`, `--ink-2`) and helper markup (`text-micro`, `--ink-3`) around a raw `<textarea>`, plus its own `(optional)` affix. `FormSection` in the same file (~line 302) is only an eyebrow-label group wrapper, not a field scaffold.
- `src/components/ui/DateRangePicker.tsx` — a third label variant, switched by `labelStyle: 'eyebrow' | 'form'`.
- `src/components/AutomateModal.tsx` — section labels as bare eyebrow `<div>`s with no field association at all.

Closest existing thing: `src/components/ui/Input.tsx` (label + hint + error, but fused to a text input).
Delta required: extract a control-agnostic `Field` wrapper owning id generation, `htmlFor`, required/optional affix, helper vs error text swap (`--ink-3` → `--risk-ink`), and the `aria-describedby` / `aria-invalid` wiring that no current call site has.

## States
Required for class Input: default · hover · focus · active · disabled · empty · filled · error · read-only. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
