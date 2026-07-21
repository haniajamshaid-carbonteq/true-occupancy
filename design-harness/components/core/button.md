name: button
status: draft
version: 1
extends: none
class: Interactive

## Anatomy
- `src/components/ui/Button.tsx` — a native `<button>`, `type="button"` by default.
- Base: `inline-flex items-center gap-inline rounded-lg font-medium font-sans border cursor-pointer`.
- Optional leading `icon` slot and trailing `iconRight` slot; both `inline-flex shrink-0` with the SVG forced to 14px (`[&>svg]:w-3.5 [&>svg]:h-3.5`).
- Label children between the two icon slots.
- Sizes: `md` = `h-9 px-control-x text-label` (36px, the spec default); `sm` = `h-8 px-3 text-caption`.
- Transition: `transition-[background-color,border-color,color,transform] duration-150`.

## States
- default — per variant: `primary` `bg-brand` · `text-white` · `border-brand`; `default` `bg-surface` · `text-ink-2` · `border-line-strong`; `ghost` `bg-transparent` · `text-ink-2` · `border-transparent`.
- hover — `primary` → `bg-brand-deep` + `border-brand-deep`; `default` → `bg-hover-bg`, border stays `line-strong`; `ghost` → `bg-hover-bg`, text color unchanged.
- focus — ⚠ NOT IMPLEMENTED in source. No `focus-visible` ring on the component and no global `:focus-visible` rule in `src/styles/*.css`; only the UA default outline applies. (`.notification-dock-pill` in `src/styles/motion.css` is the sole custom focus ring in the codebase.)
- active — `active:scale-[0.97]` (⚠ hardcoded in source). No color change.
- disabled — `disabled:opacity-50 disabled:cursor-not-allowed`. Colors are not otherwise swapped.

## Variants
`variant`: `primary` · `default` · `ghost` · `spotlight`. `size`: `sm` · `md` (default). No `secondary` and no dedicated `icon` variant exist in the prop union — icon-only usage is `variant="ghost"` with an `icon` and no children.

`spotlight` is the hero CTA: `bg-gradient-to-br from-brand to-brand-deep`, `text-on-brand`, transparent border, `hover:brightness-[1.06]`, plus the `.ai-cta` sheen from `src/styles/motion.css`. One per screen.

## Rules
- Primary is solid `--brand` on white with white text — **never a gradient**. `spotlight` is the one variant that may carry a gradient (see below).
- **Gradient on the product surface is permitted for `spotlight` only** (revised Jul-2026, owner call — supersedes the previous marketing-only rule from DESIGN.md §6 / §10). The §13.1 product-surface gradient inventory is now: side-nav strip, workspace avatar, `ScanCard` progress bar, and the `spotlight` CTA. Nothing else.
- One `spotlight` per screen. A second one on the same view cancels the emphasis it exists to create.
- Primary hover is `--brand-deep`, mirroring the brand-book hyperlink hover.
- Ghost is transparent until hover; hover lands on neutral `--hover-bg`, not a brand tint — the pale brand tint read washed-out against surrounding cards (comment in source).
- One primary button per view band; brand fill is part of the ~3% teal budget in DESIGN.md §13.1.
- Amber must never be a button fill (DESIGN.md §3.4 — amber is Problem-framing only).
- `type="button"` is the default; callers must pass `type="submit"` explicitly for form submits.
- DESIGN.md §13.3 says the default button "hover tints to brand-tint"; the code deliberately uses `--hover-bg`. Source comment documents the override.

## Revisions
- r1: transcribed from `src/components/ui/Button.tsx`, `docs/DESIGN.md` §13.1 / §13.3 / §10, `src/styles/tokens.css`, `tailwind.config.js` into harness format.
- r2 (breaking, rule change): added the `spotlight` variant and lifted the product-surface gradient ban for it. Owner call, made when the top AI CTA was removed and the scan CTA inherited its emphasis. **Re-check on breaking:** `docs/DESIGN.md` line 393 still states the old inventory ("that is the entire gradient inventory on the product surface") and the §10 marketing-vs-product split in `design-harness.md` §1 has been amended but DESIGN.md itself has not — the brand book is the owner's file to edit, so the two now disagree until that line is updated. First consumer: the scan CTA in `src/components/ui/CommandSearch.tsx`.
