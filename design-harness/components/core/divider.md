name: divider
status: draft
version: 1
extends: none
class: Static

## Anatomy
There is no Divider component in `src/components/`. The hairline is a **CSS treatment applied directly by the consuming surface**, always driven by the `--line` token.

Three shapes exist in the codebase:
- **Edge hairline** — `border-t` / `border-b` + `border-line` on the element that owns the edge. Tabs strip (`src/components/ui/Tabs.tsx`: `border-b border-line`), MetricCard footer (`src/components/ui/MetricCard.tsx`: `border-t border-line`, and `border-white/20` when the tile is `primary` — ⚠ hardcoded), DataTable header/row edges (`src/components/ui/DataTable.tsx`), utility footer strip (`src/pages/HomeScreen.tsx`).
- **Repeated separator in a stack** — `divide-y divide-line` on the list container (`src/components/result/ConfidenceHero.tsx`, `src/pages/Components.tsx`).
- **Vertical hairline between columns** — a bare 1px element: `w-px bg-line shrink-0`, `aria-hidden`, hidden at mobile width (`hidden md:block`) because the columns stack (`src/components/result/ConfidenceHero.tsx`).

One labelled variant exists locally, not shared: `OrDivider` in `src/pages/AuthScreen.tsx` — a rule with centered label text, private to that screen.

## States
- default — 1px, color `--line` (`border-line` / `bg-line`). No hover, focus, active or disabled treatment; the hairline is decorative and non-interactive.

## Variants
none — no component, therefore no prop union. The three shapes above are usage patterns, not variants.

## Rules
- Must use `--line` (`border-line` / `divide-line` / `bg-line`); `--line-strong` is for control borders (e.g. default Button), not for dividers.
- Per DESIGN.md §13.3, hairlines carry the structure inside cards: tables are hairline-divided rows, KPI tiles are a hairline-divided horizontal strip inside one rounded card with **no per-tile borders**. Do not add a border to each child when a divider already separates them.
- Prefer `divide-y divide-line` on the container over a `border-t` on every child, so there is no doubled edge at the top of a stack.
- Vertical dividers must be `aria-hidden` and must be removed at stacked/mobile widths — a vertical rule between columns is meaningless once the columns are stacked.
- Dividers count against the ~12% navy/ink budget in DESIGN.md §13.1; they are not a brand accent and must never be tinted teal or amber.

## Revisions
- r1: transcribed from `docs/DESIGN.md` §13.1 / §13.3, `src/styles/tokens.css`, and the hairline usages in `src/components/ui/Tabs.tsx`, `src/components/ui/MetricCard.tsx`, `src/components/ui/DataTable.tsx`, `src/components/result/ConfidenceHero.tsx`, `src/pages/HomeScreen.tsx`, `src/pages/AuthScreen.tsx`. No dedicated component exists — documented as a CSS treatment.
