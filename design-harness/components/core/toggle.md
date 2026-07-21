name: toggle
status: draft
version: 1
extends: none
class: Input

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. There is no `role="switch"` and no switch/toggle-track component anywhere in `src/` — every "toggle" in the code is either a disclosure button (`aria-expanded`, e.g. the Advanced section in `src/pages/BatchScreen.tsx`, the map reveal in `src/components/result/PropertyOverview.tsx`) or React Router's `Switch`. Do not build from this file.
Closest existing thing: `src/components/ui/Checkbox.tsx` — the same on/off boolean semantics, but a 16 px square check, not a sliding track.
Delta required: a track+thumb switch with its own on/off token pair, sliding motion (`--ease-out` / `--ease-spring` from `src/styles/motion.css`), and a `prefers-reduced-motion` fallback per `docs/DESIGN.md` §"strips all transforms / animations except opacity".

## States
Required for class Input: default · hover · focus · active · disabled · empty · filled · error · read-only. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription.
