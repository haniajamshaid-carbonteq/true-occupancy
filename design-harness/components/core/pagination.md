name: pagination
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
⚠ An implementation exists, but **not as a standalone component** — pagination is a private
footer inside `src/components/ui/DataTable.tsx:265–300`. There is no `Pagination.tsx`, no
exported props, and no way to use it apart from a table. It is transcribed here as-is; a
reusable primitive would still have to be designed.

- Footer bar: `flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-line
  bg-surface-2/40`. Rendered only when `pageSize` is set and `rows.length > 0`.
- Range readout (left): `font-sans text-caption text-ink-3 tabular-nums` —
  "Showing **first**–**last** of **total**", with the numerals in `text-ink-2 font-medium`.
  The dash collapses when `firstIdx === lastIdx`.
- Control cluster (right): prev button · page readout · next button.
  - Buttons: `w-8 h-8 grid place-items-center rounded-md text-ink-2 hover:bg-hover-bg
    disabled:opacity-40 disabled:cursor-not-allowed transition-colors`, inline chevron SVG
    `w-3.5 h-3.5`, `strokeWidth={1.8}`, `aria-label="Previous page" / "Next page"`.
  - Readout: `font-sans text-caption text-ink-3 px-2 tabular-nums` — "Page **n** of **N**".
- Page state is internal `React.useState(0)`; slicing is `rows.slice(page * pageSize, …)`.
- Consumers: `src/pages/HistoryScreen.tsx:315` (10), `src/pages/ScheduledScreen.tsx:258` (10),
  `src/pages/ScheduleDetailScreen.tsx:329` (20), `src/pages/BatchScreen.tsx:625` (25).

## States
- populated — footer visible; range + page readout reflect the current slice. `totalPages`
  is `max(1, ceil(rows.length / pageSize))`, so a single-page table still shows the footer.
- loading — ⚠ NOT IMPLEMENTED. DataTable's `loading` branch returns before the footer, so the
  footer disappears entirely during a load and reappears after — the skeleton preserves row
  height but not footer height.
- empty — footer is suppressed (`pageSize && rows.length > 0`), and the empty branch returns
  before it anyway. No "0 results" pagination surface.
- error — ⚠ NOT IMPLEMENTED. The page swaps the whole table (footer included) for
  `src/components/ui/ScreenError.tsx`.
- partial — ⚠ NOT IMPLEMENTED. Pagination assumes the full row set is already client-side;
  there is no server-page / "loading next page" mode.
- disabled (per control) — prev disabled at `page === 0`, next at `page >= totalPages - 1`;
  both `opacity-40` + `cursor-not-allowed` via `disabled:` variants on a real `<button>`.

## Variants
none — no prop union. The only configuration is `pageSize` on `DataTable`.

## Rules
- Must clamp on shrink: a `useEffect` watching `rows.length` resets `page` down to the new
  `maxPage` when filtering shrinks the row set below the current page
  (`DataTable.tsx:75–79`) — otherwise filtering strands the user on a blank page.
- Page state is component-local and resets on unmount; it is not in the URL and does not
  survive navigation.
- Every count is `tabular-nums` (DESIGN.md §13.5).
- Controls must stay icon-only with `aria-label`s; there is no numbered page list and no
  page-size selector.
- ⚠ Keyboard focus: prev/next are real `<button>`s and tabbable, but no `focus-visible` ring
  is declared — focus is browser-default only.
- Mobile: footer keeps the same row, only padding steps down (`px-4 sm:px-6`). It does not
  stack or hide below `md`, unlike the table body.

## Revisions
- r1: transcribed from the private pagination footer in `src/components/ui/DataTable.tsx`
  and its `pageSize` consumers in `src/pages/*.tsx` into harness format.
