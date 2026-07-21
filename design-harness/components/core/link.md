name: link
status: draft
version: 1
extends: none
class: Interactive

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. Do not build from this file.
There is no Link component and no global anchor styling: `src/styles/tokens.css`, `typography.css` and `motion.css` contain no `a` / `a:hover` rule. The `--brand-link` token (`#0292BE`) is defined in `tokens.css` but is never applied to a link anywhere in `src/` — its only consumer is a background `color-mix` in `src/components/ui/ChipRow.tsx`. Product anchors are styled ad hoc and diverge from the spec: `src/pages/HomeScreen.tsx` footer links are `no-underline hover:text-brand-deep`; `src/components/result/ListingsPanel.tsx` and `src/pages/AuthScreen.tsx` use `no-underline` button-like anchors. `.cert-*` link classes in `src/styles/print.css` are print-certificate-only.
Closest existing thing: `Button` with `variant="ghost"` (`src/components/ui/Button.tsx`) — the pattern actually used where a link would be expected.
Delta required: an inline text-link primitive honoring DESIGN.md §9 / §3.6 — `--brand-link` underlined at rest, hover `--brand-deep`, never amber — plus a visible focus treatment, since none exists globally.

## States
Required for class Interactive: default · hover · focus · active · disabled. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
