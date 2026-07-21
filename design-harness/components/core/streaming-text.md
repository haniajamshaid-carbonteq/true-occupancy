name: streaming-text
status: draft
version: 1
extends: none
class: AI surface

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` streams AI output. Do not build from this file.
Closest existing thing: `AIInvestigator.SuccessCard` / `InvestigationResultPanel`
in `src/components/result/AIInvestigator.tsx` — but it *reveals on completion*,
it does not stream. `src/data/aiInvestigation.tsx` → `runAIInvestigation()` is a
timed Promise chain (`AI_STEP_1_MS` 3600 ms → `AI_STEP_2_MS` 2800 ms) that
resolves one complete `AIInvestigationResult` object; the bus only ever moves
`loading-step-1` → `loading-step-2` → `success`. No token, chunk, SSE or partial
render path exists anywhere in `src/`. The file comment marks the SSE consumer as
a future backend swap point, not current behaviour.
Delta required: a partial-result contract on the bus plus a text surface that can
render and re-flow incomplete content (caret, partial-block skeleton, reduced-motion
fallback) — none of which is designed.

## States
Required for class AI surface: idle · working (steps visible) · streaming ·
complete · error · refusal · interrupted. None specced.

For the record, the non-streaming reveal that exists today lives in
`working-indicator.md` (dock) and is: `LoadingCard` breadcrumb + `skeleton-pulse`
silhouette while working, then a whole-card `card-rise` swap to `SuccessCard`.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription; verified against
  src/components/result/AIInvestigator.tsx and src/data/aiInvestigation.tsx.
