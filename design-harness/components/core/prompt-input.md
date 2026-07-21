name: prompt-input
status: draft
version: 1
extends: none
class: AI surface

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` accepts free-text prompt entry into the AI. Do not
build from this file. The AI is driven from a single button, not a prompt box:
`startAIInvestigation(scenario)` takes a `ScenarioKey` (`'low' | 'medium' |
'high'`) and nothing else (`src/data/aiInvestigation.tsx`).

Closest existing thing: `src/components/ScanContextBar.tsx` — the `showAI` branch
mounts `AICtaButton` (defined in `src/components/result/AIInvestigator.tsx`) top-
right next to Download PDF, per DESIGN.md §14.9. It is a brand-gradient button
(`linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)` ⚠ hardcoded,
`rounded-lg`, white 600-weight label, `Icon ai-star` with the `ai-cta-spark`
shimmer) reading "Run occupancy investigation"; while in flight it disables,
swaps to a `Spinner` and reads "Investigating..."; on `success` it unmounts.

Other free-text surfaces exist but none of them is a prompt: the address field on
the scanner card, `CommandSearch` / `CommandPalette` (⌘K navigation), and
`ReferenceCell` (case-reference note on a table row).

Delta required: an actual prompt contract on the AI bus (today it accepts only a
scenario key), plus multiline entry, submit/stop affordances, and error/limit
handling — none of which is designed.

## States
Required for class AI surface: idle · working (steps visible) · streaming ·
complete · error · refusal · interrupted. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription; checked ScanContextBar.tsx,
  AIInvestigator.tsx (AICtaButton), src/data/aiInvestigation.tsx, DESIGN.md §14.9.
