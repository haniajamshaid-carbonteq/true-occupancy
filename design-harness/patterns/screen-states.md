name: screen-states
status: draft
type: pattern

# Page-level states pattern

Not yet a full pattern spec — this is where "which states does a screen owe?" lands, and
it answers by routing to the Page/screen floor until it earns more.

## The floor (from §5, Page / screen class)

Every screen archetype owes: `loaded` · `first-load (skeleton)` · `first-use empty` ·
`no-results empty` · `page error` · `partial failure` · `no-access`.

## Compose from

- **loaded** — the screen's own content.
- **first-load** — `components/core/loading.md` (skeleton, reduced-motion fallback shipped).
- **first-use empty** — `components/core/empty-state.md` (`ScreenEmpty`, first-use only).
- **no-results empty** — currently a plain-text line inside `DataTable`, *not* a variant of
  `ScreenEmpty`. Two components, one job — a known split, see `empty-state.md`.
- **page error** — owned by `ScreenError`, a §7 **candidate with no stub yet**. Four pages
  swap it in where `DataTable` has no `error` prop. It has an anatomy contract with
  `ScreenEmpty` that rots silently if only one is specced.
- **partial failure / no-access** — no dedicated surface exists. Hits the creation gate (§3).

## Known gaps that touch screen states

- `ScreenError` needs a file before this pattern is real (§7, VIABILITY host-wiring notes).
- `empty-state` covers first-use only; no-results lives elsewhere.
- `table.md` has no `error` state — that's why `ScreenError` gets swapped in.

> Compose-and-route stub, not a designed pattern. Promote it once a screen proves the
> full state set, or fold it into a `ScreenError` spec when that lands.
