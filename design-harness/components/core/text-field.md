name: text-field
status: draft
version: 1
extends: none
class: Input

## Anatomy
Source: `src/components/ui/Input.tsx`
- Column wrapper, `gap-1.5` (⚠ hardcoded in source), holds label → track → hint.
- Optional `label` above the track: caption scale, semibold, `--ink-2`, wired via `htmlFor` + `React.useId()`.
- Track: `--surface` background, 1px border, `--r-lg` (Tailwind `rounded-lg`), `--shadow-sm`.
- Optional `leadingIcon` gutter: 36×44 px grid cell (`w-9 h-11` ⚠ hardcoded), icon `--ink-3`, `aria-hidden`.
- `<input>`: borderless, transparent, `outline-none`, 44 px tall (`h-11` ⚠ hardcoded), body-sm scale, ink `--ink`, placeholder `--ink-4`. 16 px side padding is added only on the side where no icon/trailing slot exists.
- Optional `trailing` slot: 40×44 px grid cell (`w-10 h-11` ⚠ hardcoded), `--ink-3` — used for the password eye toggle in `src/pages/AuthScreen.tsx`.
- Optional `hint` line below: micro scale, `--ink-3`, or `--risk-ink` when `error`.

Siblings that reimplement this surface rather than consume it:
- `src/components/ui/SearchBar.tsx` — same track recipe (`--surface`, `--line`, `rounded-lg`, `--shadow-sm`) but **no focus treatment at all**.
- `src/components/ui/EditableTitle.tsx` — ambient click-to-edit text; its editing state copies Input's border/ring exactly (`--brand` border + `0 0 0 3px var(--brand-soft), var(--shadow-sm)`).
- `DateField` inside `src/components/ui/DateRangePicker.tsx` — same recipe at `h-9`.

## States
- default — border `--line`, `--shadow-sm`, ink `--ink`.
- hover — ⚠ NOT IMPLEMENTED in source. No hover rule on the track.
- focus — driven by React `focused` state from the input's `onFocus`/`onBlur` (not `:focus-within`). Border → `--brand`; box-shadow → `0 0 0 3px var(--brand-soft), var(--shadow-sm)`, animated by `transition-shadow`. This is the visible keyboard-focus affordance.
- active — a text field's pressed state is its focus state. ⚠ NOT IMPLEMENTED as a distinct state.
- disabled — ⚠ NOT IMPLEMENTED in source. `disabled` passes through to the native `<input>` via `...rest`, but no dimming, cursor, or border change is applied.
- empty — placeholder in `--ink-4`; track identical to default.
- filled — value ink `--ink`; no other change from default.
- error — `error` prop. Focus border → `--risk`, focus ring → `0 0 0 3px var(--risk-soft)`, hint ink → `--risk-ink`. ⚠ Unfocused error is invisible: when not focused the border stays `--line` regardless of `error`. No `aria-invalid`, no `role="alert"` on the hint.
- read-only — ⚠ NOT IMPLEMENTED in source. `readOnly` passes through natively with no visual distinction. (`EditableTitle.tsx` has its own `readOnly` prop that suppresses click-to-edit — a different component.)

## Variants
none — `InputProps` exposes no variant union. Presentation varies only by the optional `label` / `leadingIcon` / `trailing` / `hint` / `error` slots.

## Rules
- Focus rings are brand teal, per `docs/DESIGN.md` §"~3% brand teal, used as accents only — … focus rings". Never fall back to the browser default blue; that is the stated reason `outline-none` + an explicit ring exists.
- Validation errors render inline next to the field (`docs/DESIGN.md`: "Form validation errors — inline next to the field"), i.e. via `hint` + `error`, never as a toast.
- Must supply `label` or an `aria-label`. `id` falls back to `React.useId()`, so the `htmlFor` link is only guaranteed when the label is rendered by this component.
- Must not put a border on the inner `<input>` — the border lives on the track wrapper.
- Invisible logic: internal focus handlers wrap the caller's, and the caller's `onFocus`/`onBlur` still fire after the internal state update.
- Mobile: the track is fluid-width; callers constrain it (`max-w-[560px]` in `src/pages/BatchScreen.tsx`, `max-w-[380px]` in `AuthScreen.tsx`).

## Revisions
- r1: transcribed from `src/components/ui/Input.tsx`, `src/components/ui/SearchBar.tsx`, `src/components/ui/EditableTitle.tsx`, `src/components/ui/DateRangePicker.tsx`, `src/pages/AuthScreen.tsx` into harness format.
