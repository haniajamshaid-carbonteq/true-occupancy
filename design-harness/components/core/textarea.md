name: textarea
status: draft
version: 1
extends: none
class: Input

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. Do not build from this file.
Closest existing thing: two one-off inline `<textarea>`s — the batch Description field in `src/pages/BatchScreen.tsx` (~line 203, hand-written classes: `bg-surface border border-line rounded-lg px-4 py-2.5`, `focus:border-brand`, `focus:shadow-[0_0_0_3px_var(--brand-soft)]`, `resize-none`) and the `multiline` branch of `src/components/ui/EditableTitle.tsx` — neither is a reusable primitive.
Delta required: a shared `Textarea` primitive matching `Input.tsx`'s track/label/hint contract, plus rows/auto-grow, character-count, disabled and read-only treatments.

## States
Required for class Input: default · hover · focus · active · disabled · empty · filled · error · read-only. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
