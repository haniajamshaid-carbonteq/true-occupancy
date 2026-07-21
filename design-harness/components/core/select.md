name: select
status: draft
version: 1
extends: none
class: Input

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. There is no `<select>`, no `role="combobox"`, and no `role="listbox"` anywhere in `src/`. Do not build from this file.
Closest existing thing: `src/components/ui/DropdownMenu.tsx` — but it is an **action menu** (fires `onClick` per item, no selected value, no value semantics), not a value picker. `src/components/StatusPillSelector.tsx` is a multi-select pill group with its own visual language, and `src/components/ui/DateRangePicker.tsx` wraps native `<input type="date">`, not a select. None of the three is a select.
Delta required: a real single-value picker — trigger showing the current value, listbox popover with roving focus and type-ahead, plus the project's mobile bottom-sheet rule that `DropdownMenu.tsx` already honours.

## States
Required for class Input: default · hover · focus · active · disabled · empty · filled · error · read-only. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
