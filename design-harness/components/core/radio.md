name: radio
status: draft
version: 1
extends: none
class: Input

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. There is no `<input type="radio">` in `src/`. Do not build from this file.
Closest existing thing: the two hand-rolled radio-card groups in `src/components/AutomateModal.tsx` (`role="radiogroup"` at ~line 260 for Cadence and ~line 324 for retention). Each option is a `<button role="radio" aria-checked>` with a 16 px `rounded-full border-2` dot — `border-brand` + `bg-brand` pip when active, `border-line-strong` when not — on a card that switches from `bg-surface border-line hover:bg-hover-bg hover:border-line-strong` to `!bg-brand-tint !border-brand/40`. Inline only; not extracted.
Delta required: extract a `Radio` / `RadioGroup` primitive (bare radio and the card form), with arrow-key roving focus, a visible focus ring, and disabled/error treatments — none of which the inline version has.

## States
Required for class Input: default · hover · focus · active · disabled · empty · filled · error · read-only. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
