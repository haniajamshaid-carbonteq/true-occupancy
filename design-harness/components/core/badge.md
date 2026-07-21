name: badge
status: draft
version: 1
extends: none
class: Static

## Anatomy
Canonical: **Pill** — `src/components/ui/Pill.tsx`. The single small-label primitive.
- `span`, `inline-flex items-center rounded-full font-sans border`.
- Optional leading 6px dot (`w-1.5 h-1.5 rounded-full bg-current`).
- Optional leading icon slot, forced to 12px (`[&>svg]:w-3 [&>svg]:h-3`) at `opacity-70`.
- Label text.

Sibling: **RiskBadge** — `src/components/ui/RiskBadge.tsx`. Same badge family, larger and glyph-led; carries the scan verdict.
- `span`, `inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-label font-medium font-sans`.
- Shell = `bg-{level}-soft` + `text-{level}-ink`, no border.
- Leading circular glyph: `w-[22px] h-[22px]` (⚠ hardcoded in source) `rounded-full grid place-items-center text-white`, background = solid `bg-{level}`, SVG child forced to 12px.

## States
- default — Pill: size + variant classes only. `md` = `h-6 px-2.5 gap-1.5 text-micro font-medium uppercase tracking-[0.04em]` (⚠ tracking hardcoded in source); `sm` = `h-5 px-1.5 gap-1 text-eyebrow font-bold uppercase tracking-[0.08em]` (⚠ hardcoded). RiskBadge: shell + glyph pair for the given `level`. Neither is interactive — no hover, focus, active or disabled treatment exists, by design.

## Variants
- Pill `variant`: `default` (`bg-pill-neutral` · `text-ink-2` · `border-line`) · `clean` / `warn` / `risk` (`bg-{s}-soft` · `text-{s}-ink` · `border-transparent`) · `brand` (`bg-brand-soft` · `text-brand-deep`) · `verdict-high` / `verdict-med` / `verdict-low` (`bg-verdict-*-soft` · `text-verdict-*-ink` — purple / yellow / blue, categorical not severity).
- Pill `size`: `sm` · `md` (default).
- Pill modifiers: `dot` · `subtle` (`bg-surface-2` · `text-ink-2` · `border-line` plus `font-normal normal-case tracking-normal`; replaces the old Tag) · `icon`.
- RiskBadge `level`: `clean` · `warn` · `risk`. Optional `glyph` node.

## Rules
- Color pairs must come from the variant maps — never inline a color on a pill.
- Status variants carry no border (`border-transparent`); only `default` and `subtle` show a `line` border.
- `verdict-*` is a categorical confidence band, not severity — must not be substituted for `clean` / `warn` / `risk`.
- Per DESIGN.md §13.3: pills use status `*-soft` background + `*-ink` text with no border; the brand pill is `brand-soft` + `brand-deep`.
- Amber (`warn`) is Problem-framing only per DESIGN.md §3.4 / §13.1 — must not become a general highlight.
- `subtle` keeps the size's height and padding so subtle pills line up with regular ones in the same row.

## Revisions
- r1: transcribed from `src/components/ui/Pill.tsx` and `src/components/ui/RiskBadge.tsx` plus `docs/DESIGN.md` §3.4 / §13.1 / §13.3 into harness format.
