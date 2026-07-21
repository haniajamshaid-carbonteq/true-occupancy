name: toast
status: draft
version: 1
extends: none
class: Overlay

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` provides this. Do not build from this file.
`docs/DESIGN.md` §14.9 points at "the existing `AutomationControl.Toast` (bottom-center, 3 s)",
but `src/components/AutomationControl.tsx` contains no Toast — it pushes every ephemeral
confirmation ("Automation scheduled · …", "Automation updated · …", "Automation cancelled")
into the notification dock via `useAppState().pushTransient`. The only surviving trace of a
toast is the orphaned `toast-in` (220ms `--ease-out`) / `toast-out` (160ms `--ease-in-out`)
keyframe pair and `.toast-in` / `.toast-out` classes in `src/styles/motion.css`, referenced by
no component.
Closest existing thing: `src/components/notification/NotificationDock.tsx` (+ `NotificationPill`,
`NotificationStack`, `NotificationRow`), mounted once in `src/components/AppShell.tsx`.
Delta required: decide whether a bottom-center ephemeral surface should exist at all, or whether
§14.9 should be rewritten to match the code (dock owns transients). Only then spec the surface.

## States
Required for class Overlay: open · closing/dismiss · overflow. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

Boundary that DESIGN.md §14.9 asserts and that must be preserved by whatever resolves this gap:
ephemeral one-shot confirmations are explicitly NOT the notification dock's job — the dock is for
long-running, walk-away tasks (batch scans, AI Investigator). Form validation errors go inline
next to the field; idle pre-action affordances live in `ScanContextBar` (§13.3). The code
currently violates the first half of that boundary.

## Revisions
- r1: logged as a gap during harness transcription (DESIGN.md §14.9 references a component that
  does not exist in `src/`).
