name: refusal-block
status: draft
version: 1
extends: none
class: AI surface

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` renders a refusal / cannot-complete surface distinct
from an error. Do not build from this file. The AI bus in
`src/data/aiInvestigation.tsx` has exactly five statuses — `idle`,
`loading-step-1`, `loading-step-2`, `success`, `error` — with no refusal branch,
and `docs/DESIGN.md` §14.2 defines only four dock statuses (`running`,
`completed`, `completed-errors`, `error`).

Closest existing things:
- `AIInvestigator.ErrorCard` (`src/components/result/AIInvestigator.tsx`) — the
  only failure surface: `Card` on `--risk-soft` with a `--risk` border, `--risk`
  alert glyph on a `--surface` disc, `--risk-ink` heading "Investigation failed"
  and message, default `Button` "Try again". This is a *failure*, not a refusal.
- The `low_evidence` verdict band in `AI_BAND_COPY` — the nearest "I can't
  determine this" concept, but it is a property of a **successful** result
  (`variant: 'default'`, tone `--ink-3`, soft `--surface-2`, ink `--ink-2`,
  label "Low evidence") rendered inside `SuccessCard`, not a separate block.
  `result.dataGaps[]` carries the same idea as content, not as a state.

Delta required: a bus status distinct from `error`, plus a surface that reads as
"declined / cannot determine" without borrowing the `--risk` failure palette —
and a decision on whether it is dismissible or terminal.

## States
Required for class AI surface: idle · working (steps visible) · streaming ·
complete · error · refusal · interrupted. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription; checked AIInvestigator.tsx,
  src/data/aiInvestigation.tsx, docs/DESIGN.md §14.
