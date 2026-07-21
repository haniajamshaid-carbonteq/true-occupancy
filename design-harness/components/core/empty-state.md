name: empty-state
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
- `src/components/ui/ScreenEmpty.tsx` — full-surface "never had any data" block. Anatomy is
  deliberately a mirror of `src/components/ui/ScreenError.tsx` so the two read as siblings.
- Container: `bg-surface border border-line rounded-lg`.
- Inner column: `flex flex-col items-center text-center gap-stack max-w-[420px] mx-auto
  py-section-sub px-card` (`--gap-stack`, `--gap-section-sub`, `--pad-card`).
  ⚠ `max-w-[420px]` hardcoded in source.
- Icon badge: `w-12 h-12 rounded-full grid place-items-center bg-brand-soft`, glyph colour
  `var(--brand-deep)`, `<Icon size={24}>`, default `icon="history"`. `aria-hidden`.
- Title: `font-sans font-semibold text-h4 tracking-[-0.005em]`, colour `var(--navy)`.
  Default copy "Nothing here yet".
- Message (optional): `font-sans text-body-sm text-ink-3 leading-relaxed`.
- CTA (optional): `<Button variant="primary">`, rendered only when **both** `actionLabel`
  and `onAction` are supplied.

## States
- populated — n/a. This component only ever renders the empty condition; the page mounts it
  instead of the data surface.
- loading — ⚠ NOT IMPLEMENTED. Pages guard with `!loading && rows.length === 0` so
  `ScreenEmpty` never appears while a fetch is in flight (`src/pages/HistoryScreen.tsx:301`).
- empty — the only state. Icon badge + title + optional message + optional CTA.
- error — ⚠ NOT IMPLEMENTED here by design. `ScreenError` is the sibling that owns failure;
  it swaps `bg-brand-soft` for `bg-error-soft text-error-ink`, uses `icon="alert"`, adds
  `role="alert"`, and offers Retry / Go back buttons.
- partial — ⚠ NOT IMPLEMENTED.

## Variants
No variant prop. The stub's "first-use vs no-results" split is **not** carried by this
component — and this is worth being explicit about:
- **first-use empty** → `ScreenEmpty`. Pages render it in place of the whole table when
  `!loading && rows.length === 0` on unfiltered data
  (`src/pages/HomeScreen.tsx:382`, `src/pages/HistoryScreen.tsx:302`,
  `src/pages/ScheduledScreen.tsx:247`).
- **no-results empty** → `DataTable`'s `empty` prop, a plain
  `px-5 py-12 text-center text-label text-ink-3` line inside the table container
  ("No scans match your filters." — `src/pages/HistoryScreen.tsx:317`).
So the two empties exist in the product, but as two *different components*, not as variants
of one. `ScreenEmpty` itself supports only the first-use case. Anything that wants a
richer no-results surface would have to be designed.

## Rules
- Must be used only when there is literally no data — brand-new account, freshly cleared
  state. `DataTable.empty` stays the answer for "filter returned zero"
  (`ScreenEmpty.tsx` header comment; restated in `src/spec/StatesSpecApp.tsx:201`).
- Must keep sibling anatomy with `ScreenError`; the only intended differences are the badge
  palette and the CTA row.
- CTA is all-or-nothing — a label without a handler renders nothing.
- Copy is sentence case (DESIGN.md §13.2 / brand-book §4.2).
- ⚠ Keyboard focus: only the optional `Button` is focusable; the block itself is not a
  landmark and carries no `role`. `ScreenError` does set `role="alert"`; `ScreenEmpty` sets none.
- Mobile: the block is a centred `max-w-[420px]` column with no breakpoint-specific rules —
  it simply narrows with the container.

## Revisions
- r1: transcribed from `src/components/ui/ScreenEmpty.tsx`, `src/components/ui/ScreenError.tsx`,
  and the page usages in `src/pages/*.tsx` into harness format.
