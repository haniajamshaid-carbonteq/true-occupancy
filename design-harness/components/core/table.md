name: table
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
- `src/components/ui/DataTable.tsx` — the only tabular primitive; every table surface
  (Home recent scans, History, Scheduled, Schedule detail, Batch) uses it.
- Container: `bg-surface` + 1px `--line` border + `rounded-lg` (`--r-lg`), `overflow-hidden`.
- Desktop header strip (md+): CSS grid, `bg-surface-2`, `border-b border-line`, `px-6 py-4`;
  labels `font-sans text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3`.
  Rendered only when at least one column defines `label`.
- Rows: CSS grid (`gridTemplateColumns` built from each column's `width`, default `1fr`),
  `border-t border-line`, `px-6 py-3.5`. Row element is `<button>` when `onRowClick` is set,
  otherwise `<div>`.
- Trailing 16px chevron track when interactive — inline SVG, `text-ink-4`,
  `opacity-0 → group-hover:opacity-100` plus `group-hover:translate-x-0.5`.
- Below `md` the grid rows are hidden and a separate card-stack render takes over
  (`MobileCard`): the `primary: true` column becomes the card title, remaining columns
  render as a 2-col `<dl>` — `dt` `font-mono text-eyebrow uppercase tracking-[0.12em] text-ink-4`,
  `dd` `text-ink-2 truncate`.
- Optional pagination footer — see `pagination.md` (the footer lives inside this file).
- Loading delegates to `src/components/ui/TableSkeleton.tsx` — see `loading.md`.

## States
- populated — grid rows under the `bg-surface-2` header strip; hairline `border-t border-line`
  per row; interactive rows get `cursor-pointer transition-colors hover:bg-hover-bg`.
- loading — `loading` prop true: header strip still renders (`aria-hidden`), body replaced by
  `<TableSkeleton count={pageSize ?? 6}>` using the same grid template, so nothing shifts on
  data arrival. Pagination footer is not rendered while loading.
- empty — `rows.length === 0`: header strip is **not** rendered; container shows the `empty`
  node, or the default `px-5 py-12 text-center text-label text-ink-3` "No rows.". This is the
  *filter-returned-zero* empty only. First-use empty is the page's job — pages swap the whole
  table for `ScreenEmpty` when `!loading && rows.length === 0` unfiltered
  (`src/pages/HomeScreen.tsx:381`, `src/pages/HistoryScreen.tsx:302`,
  `src/pages/ScheduledScreen.tsx:247`).
- error — ⚠ NOT IMPLEMENTED in DataTable; it has no error prop. Pages own it and render
  `src/components/ui/ScreenError.tsx` *in place of* the table when `useAppState().error` is set
  (`src/pages/HomeScreen.tsx:376`, `src/pages/HistoryScreen.tsx:296`,
  `src/pages/ScheduledScreen.tsx:241`, `src/pages/ScheduleDetailScreen.tsx:32`).
  **ScreenError is the real owner of the table error state.**
- partial — ⚠ NOT IMPLEMENTED. The nearest thing is `pageSize` slicing, which is
  complete-data pagination, not a partially-loaded surface. There is no "some rows arrived"
  or "showing stale data" treatment.

## Variants
No variant prop union. Behaviour switches on props:
- interactive vs static (`onRowClick` set → row becomes `<button>`, chevron track, hover tint)
- paginated vs unpaginated (`pageSize` set or not)
- per-column: `align: 'left' | 'center' | 'right'`, `hideBelow: 'sm' | 'md' | 'lg'`,
  `primary`, `hideOnMobile`, `mobileCell`.

## Rules
- Must be the only tabular surface — row rhythm, hover treatment, and the table↔card
  breakpoint are shared so density and feel stay consistent (file header comment).
- Exactly one column should set `primary: true`; it becomes the mobile card title.
- Every numeric display gets `tabular-nums` (DESIGN.md §13.5). The footer counts already do;
  cell renderers must apply it themselves.
- Must not paint verdict colour on the row's leading edge. `leadingAccent` is still in the
  prop union and still invoked, but its return value is unused — verdict semantics live only
  in the verdict cell's dot+text (comments at `DataTable.tsx:89` and `:214`).
- Right/center-aligned header labels carry a compensating `∓0.16em` margin so the trailing
  letter-spacing doesn't push them out of optical alignment with the column.
- Skeleton grid must mirror the live grid — `TableSkeleton` is passed the same `columns`
  and `interactive` flag for exactly this reason.
- ⚠ Keyboard focus: interactive rows are real `<button>`s so they are tabbable, but no
  `focus-visible` ring is declared on the row — focus is browser-default only.

## Revisions
- r1: transcribed from `src/components/ui/DataTable.tsx`, `src/components/ui/TableSkeleton.tsx`,
  `docs/DESIGN.md` §13.3/§13.5, and the page usages in `src/pages/*.tsx` into harness format.
