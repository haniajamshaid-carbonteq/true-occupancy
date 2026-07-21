name: pagination
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
Source: `src/components/ui/Pagination.tsx`

A standalone primitive now exists — the private footer inside `DataTable` was lifted out so
non-table surfaces can reuse it. It is **stateless**: props are `page` (zero-based), `pageSize`,
`total`, `onPageChange`, plus `className` and pass-through div props. The owner holds `page`;
`firstIdx` / `lastIdx` / `totalPages` are derived here, so callers never compute a range.

- Footer bar: `flex items-center justify-between gap-3 px-4 sm:px-6 py-3` (⚠ hardcoded in source)
  `border-t border-line bg-surface-2/40` (⚠ `/40` opacity modifier hardcoded).
- Range readout (left): `font-sans text-caption text-ink-3 tabular-nums` —
  "Showing **first**–**last** of **total**", numerals in `text-ink-2 font-medium`.
  The dash collapses when `firstIdx === lastIdx`.
- Control cluster (right): prev button · page readout · next button.
  - Buttons: `w-control-sm h-control-sm` (`--size-control-sm`) `grid place-items-center`
    `rounded-md` (`--r-md`) `text-ink-2 hover:bg-hover-bg disabled:opacity-40`
    (⚠ hardcoded opacity) `disabled:cursor-not-allowed transition-colors`; inline chevron SVG
    `w-3.5 h-3.5` (⚠ hardcoded), `strokeWidth={1.8}`, `aria-label="Previous page" / "Next page"`.
  - Readout: `font-sans text-caption text-ink-3 px-2 tabular-nums` — "Page **n** of **N**".
- `totalPages` is `max(1, ceil(total / pageSize))`; clamping is done here
  (`max(0, page - 1)` / `min(totalPages - 1, page + 1)`), so `onPageChange` always receives a
  valid index.
- Consumer: `src/components/ui/DataTable.tsx:263`, rendered only when
  `pageSize && rows.length > 0`. Page state and the shrink-reset effect stay in DataTable
  (`DataTable.tsx:74–79`). Table `pageSize`s: `src/pages/HistoryScreen.tsx` (10),
  `src/pages/ScheduledScreen.tsx` (10), `src/pages/ScheduleDetailScreen.tsx` (20),
  `src/pages/BatchScreen.tsx` (25).

## States
- populated — footer visible; range + page readout reflect the current slice. A single-page set
  still renders the footer (`totalPages` floors at 1).
- loading — ⚠ NOT IMPLEMENTED. DataTable's `loading` branch returns before the footer, so the
  footer disappears during a load and reappears after — the skeleton preserves row height but not
  footer height. Pagination itself has no loading prop.
- empty — suppressed by the consumer (`pageSize && rows.length > 0`), and DataTable's empty branch
  returns before it anyway. No "0 results" pagination surface.
- error — ⚠ NOT IMPLEMENTED. The page swaps the whole table (footer included) for
  `src/components/ui/ScreenError.tsx`.
- partial — ⚠ NOT IMPLEMENTED. The component assumes the full row set is already client-side;
  there is no server-page or "loading next page" mode.
- disabled (per control) — prev disabled at `page === 0`, next at `page >= totalPages - 1`; both
  `opacity-40` + `cursor-not-allowed` via `disabled:` variants on real `<button>`s.

## Variants
none — no prop union. The only configuration is `pageSize` (and, on DataTable, whether `pageSize`
is passed at all).

## Rules
- Stateless by contract: hold `page` in the owner and react to `onPageChange`. Clamping is this
  component's job; resetting when the row set shrinks under the current page is the owner's
  (`DataTable.tsx:74–79`) — without it, filtering strands the user on a blank page.
- Page state is owner-local and resets on unmount; it is not in the URL and does not survive
  navigation.
- Every count is `tabular-nums` (`docs/DESIGN.md` §13.5).
- Controls must stay icon-only with `aria-label`s; there is no numbered page list and no
  page-size selector.
- ⚠ Keyboard focus: prev/next are real `<button>`s and tabbable, but no `focus-visible` ring is
  declared — focus is browser-default only. Fails the harness's cross-cutting
  visible-keyboard-focus requirement (design-harness.md §5). The gap is carried over from the
  original DataTable footer, not introduced by the extraction.
- ⚠ Page changes are not announced: there is no live region and no focus management, so a screen
  reader gets no notification that the range or page number changed.
- Mobile: the footer keeps one row; only padding steps down (`px-4 sm:px-6`). It does not stack or
  hide below `md`, unlike the table body.

## Revisions
- r1: transcribed from the private pagination footer in `src/components/ui/DataTable.tsx`
  and its `pageSize` consumers in `src/pages/*.tsx` into harness format.
- r1 (amended): extracted from that private footer into a shared primitive,
  `src/components/ui/Pagination.tsx`; transcribed here. Now stateless
  (`page` / `pageSize` / `total` / `onPageChange`); `w-8 h-8` is now `w-control-sm h-control-sm`.
