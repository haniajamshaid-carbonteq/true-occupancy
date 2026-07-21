name: list
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides a reusable list primitive. Searched `src/` for list
components and for `<ul>` / `<ol>` / `role="list"`; the only semantic lists are one-off
markup inside `src/components/result/CertificateSheet.tsx` and
`src/components/result/AIInvestigator.tsx`, neither of which is reusable.

Closest existing thing: `src/components/ui/DataTable.tsx` — below `md` it already renders a
card-stack list (`MobileCard`: primary column as title, remaining columns as a `<dl>` of
label/value pairs). It carries the loading, empty, and page-owned error behaviour a list
would need, so a list would most likely be a mode of DataTable rather than a new component.

Ruled out as candidates:
- `src/components/result/ListingsPanel.tsx` — a bespoke diff-matrix evidence panel for one
  screen (desktop comparison matrix / mobile accordion). Domain-specific, not a primitive.
- `src/components/ui/ChipRow.tsx` — a single-select filter chip row (Interactive class,
  `h-8 rounded-md`, `!bg-brand-tint` when active). A control, not a data list.
- `src/components/notification/NotificationStack.tsx` — the dock's task accordion, specified
  separately in DESIGN.md §14.

Delta required: decide whether a list is a DataTable mode (single-column, no header strip,
row-as-card) or its own primitive, and spec row rhythm, divider treatment, and the
selected/active row state that DataTable does not have.

## States
Required for class Async / data: populated · loading · empty · error · partial. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
