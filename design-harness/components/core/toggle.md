name: toggle
status: draft
version: 2
extends: none
class: Input

## Anatomy
`src/components/ui/Toggle.tsx`. A track+thumb switch for a single on/off boolean.
- **track** — `h-6 w-10` rounded-full `<button role="switch">`. Fill is `--brand` when on, `--line-strong` when off.
- **thumb** — `h-5 w-5` rounded-full, `--on-brand` fill, `shadow-sm`. Slides `translateX(16px)` on → off.
- **label / description** (optional) — sit to the right; clicking them toggles too. Omit both and the bare switch is returned (pass `ariaLabel`).

Distinct from `checkbox.md` (a 16 px square check): use Toggle for enabling/disabling a setting (e.g. Session timeout in Scan configuration), Checkbox for selection in a set.

## States
- **default** — off (line-strong track, thumb left) / on (brand track, thumb right).
- **hover** — cursor-pointer; no colour change (the fill already carries state).
- **focus** — `focus-visible` brand ring + offset on the track button.
- **active** — click flips `aria-checked`.
- **disabled** — `opacity-50`, `cursor-not-allowed`, click no-ops.
- **filled / empty** — n/a for a boolean; on = filled, off = empty.
- **error / read-only** — ⚠ NOT IMPLEMENTED. No error or read-only styling yet; add if a form needs it.

## Variants
—

## Rules
- Motion binds to tokens: `--motion-fast` duration, `--ease-out` easing, on both the track colour and the thumb transform. `motion-reduce:transition-none` drops both under `prefers-reduced-motion`, per DESIGN.md.
- Renders a real `<button role="switch" aria-checked>` — never a styled div — so AT and keyboard get native switch semantics.
- No hardcoded colours: track `--brand` / `--line-strong`, thumb `--on-brand`.

## Revisions
- r1: logged as a gap during harness transcription.
- r2: implemented at owner's request (session-timeout control). track+thumb switch with token-bound sliding motion + reduced-motion fallback. status stays draft until proven across more screens. Re-check error/read-only if a validated form adopts it.
