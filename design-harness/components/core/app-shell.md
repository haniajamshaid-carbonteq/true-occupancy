name: app-shell
status: draft
version: 1
extends: none
class: Layout

## Anatomy
- `src/components/AppShell.tsx` — root wrapper: `min-h-screen bg-bg text-ink font-sans`.
  Renders `<SideNav />`, a content column offset `md:pl-[280px]` (⚠ hardcoded in source),
  and `<NotificationDock />` mounted once at the end.
- `<main>`: `contained` (default true) → `max-w-[1180px] mx-auto px-4 sm:px-6 md:px-8
  pt-6 sm:pt-8 pb-16 sm:pb-20`; `contained={false}` → `pt-6 sm:pt-8` only, for full-bleed pages.
  All ⚠ hardcoded px / Tailwind steps, not `--space-*` tokens.
- `sidebar` prop is accepted and ignored — deprecated, SideNav owns navigation.
- `src/components/SideNav.tsx` — three surfaces in one component:
  - Desktop rail (`hidden md:flex`): `fixed` at `top:16 bottom:16 left:16`, `width: NAV_WIDTH`
    = 248 (⚠ hardcoded), `bg-surface`, `border --line`, `rounded-2xl` (⚠ 16px Tailwind default,
    no token), `z-30`, `overflow-hidden`. Flex column: brand lockup block
    (`px-5 pt-6 pb-5`, `border-b --line`) → nav list (`flex-1 overflow-y-auto px-3 py-4 gap-1`)
    → profile button (`border-t --line`) pinned to the bottom by the `h-screen` flex column.
  - Mobile top bar (`md:hidden`): `sticky top-0 z-40`, `h-14`, `bg-surface`, `border-b --line`,
    small brand lockup + animated hamburger (three `1.5px` `bg-current` bars that morph to an X).
  - Mobile drawer: scrim `bg-black/40 backdrop-blur-sm` (⚠ raw `black`, not `--ink`) `z-40`
    + panel `fixed inset-y-0 left-0 z-50`, `width: min(86vw, 320px)`, `bg-surface`,
    `border-r --line`.
- Brand lockup: `docs/brand/halcyon-mark-v2.png` at 40px desktop / 32px mobile + "HALCYON"
  (`text-body`, bold, `tracking-[0.04em]`, uppercase, `--navy`) over
  "TrueOccupancy™" (`text-micro`, `--brand-deep`).
- Nav rows: `NavLink` h-10 desktop / h-12 mobile, `rounded-md` (`--r-md`), label color `--navy`,
  `hover:bg-hover-bg`, active `!bg-brand-tint !text-brand-deep`, optional `<Pill size="sm">` badge.
  Items: Dashboard `/`, Batch Upload `/batch`, History `/history`, Scheduled `/scheduled`.
- `src/components/Sidebar.tsx` — the LEGACY rail (`bg-surface-2`, `border-r --line`, static
  `px-5 py-7` column, grouped nav with mono eyebrow section labels, `Avatar` footer). It is not
  referenced by `AppShell`; its nav points at spec routes (`/scan/start`, `/result/*`,
  `/components`). Treat as superseded reference, not the shell.

## States
Class Layout — treated as Static: **default only, explicitly no others.**
- default — desktop rail visible at `md+` with content offset; below `md` the rail is replaced by
  the sticky top bar and the drawer is closed.

Responsive / mobile behavior (documented, not a state):
- Single breakpoint, `md` (768px). Above: fixed rail + `md:pl-[280px]` content offset.
  Below: `sticky` top bar, no offset, full-width main.
- Drawer open: `Escape` closes it; body scroll is locked
  (`document.body.style.overflow = 'hidden'`, restored on close); any nav row click closes it.
  Toggle carries `aria-expanded` and a swapping `aria-label` ("Open menu" / "Close menu").
- ⚠ The drawer has no focus trap and no focus restore — unlike `Modal.tsx` / `Drawer.tsx`,
  which both implement one.
- Z-order: rail `z-30` · mobile top bar `z-40` · drawer scrim `z-40` · drawer panel `z-50` ·
  modals `z-[100]`.

## Variants
none in the component API beyond `contained: boolean` (max-width column vs. full-bleed).
The deprecated `sidebar` prop is inert. The "header + content + sidebar" framing in the original
stub does not match the code: there is no shell-level header — page headers are per-page via
`src/components/PageHeader.tsx`.

## Rules
- `NotificationDock` must be mounted exactly once, here, and nowhere else (DESIGN.md §14). It
  takes no props in production — `LiveDock` subscribes to `useAppState().liveBatch` +
  `useAIInvestigator()` itself, and suppresses its own signal by `pathname` (§14.8) when the
  page already owns an inline progress surface.
- ⚠ CONTRADICTION: DESIGN.md §13.1 lists "the 4 px brand strip on the side nav" as one of only
  three permitted gradient placements on the product surface, and §13.7 names "side-nav brand
  strip removed" as an explicit regression that gets reverted. **No such strip exists in
  `SideNav.tsx`.** Do not invent one here — this needs an owner decision (restore the strip, or
  amend §13.1/§13.7).
- Brand budget per §13.1: ~85% white (`--bg` / `--surface`), ~12% navy ink, ~3% teal accent.
  In the shell, teal appears only as the active nav row (`bg-brand-tint` / `text-brand-deep`)
  and the "TrueOccupancy™" wordmark (`--brand-deep`). No full-bleed gradient banners.
- The logo lockup must stay Halcyon-parent over TrueOccupancy-product (brand book §2); removing
  it is a §13.7 regression.
- Main column offset and rail width must stay in sync: `left:16 + 248 = 264`, so `pl-[280px]`
  leaves a 16px gutter. Changing `NAV_WIDTH` without changing the offset breaks the layout.
- The desktop rail is `fixed`, so no ancestor may create a containing block for fixed
  descendants — this is why the route transition in `src/styles/motion.css` is opacity-only
  (`route-fade-in`) with the translateY deliberately dropped.
- `Sidebar.tsx` must not be reintroduced into `AppShell`; use `SideNav.tsx`.

## Revisions
- r1: transcribed from `src/components/AppShell.tsx`, `src/components/SideNav.tsx`,
  `src/components/Sidebar.tsx`, `src/components/notification/NotificationDock.tsx`,
  `src/styles/tokens.css`, `src/styles/motion.css`, `docs/DESIGN.md` §13.1 / §13.7 / §14
  into harness format.
