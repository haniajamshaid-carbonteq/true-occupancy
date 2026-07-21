# TrueOccupancy · Viability checklist

The harness counts as viable when all three floors are green. A checkable, binary bar — this is what "the design system is set up" means, and what makes a from-scratch kickoff a scopeable, quotable phase.

Hypertokens and motion are NOT on this bar. They're optional layers that earn their place as the project scales.

---

## Status

**Not yet viable.** Floor 1 is green. Floor 3 is green. **Floor 2 is not** — but it moved: **5 of 24** required components have no implementation, down from 8.

`field-scaffold`, `textarea` and `radio` were extracted from inline duplicates into real primitives; `tooltip` and `pagination` were promoted from private helpers to shared components. The five remaining gaps genuinely do not exist in any form, so closing them means **designing**, not extracting.

This is a status report on a real, shipping product, not a scaffold waiting to be filled. Every entry below reflects what is actually in `src/`.

**Legend**

```
[x]  specced, and every state its class requires is implemented
[~]  specced from real code, but one or more required states are missing in source
[ ]  GAP — nothing in the codebase implements this
```

`[~]` and `[ ]` are both red for the purpose of this bar. The distinction is what the fix costs: `[~]` is finishing a component, `[ ]` is designing one.

---

## Floor 1 — Tokens exist ✅

- [x] Color tokens defined (`references/tokens.md` → `src/styles/tokens.css`)
- [x] Type tokens defined — 11-slot ramp, families, 4 runtime pairings
- [x] Spacing tokens defined — 12 primitives + 20 semantic aliases

Unusually complete: three separate colour layers, a semantic spacing layer, and documented rationale for the exclusions (no half-pixel type sizes, no odd spacing stops). Two known caveats, both already tracked in DESIGN.md §12: the Century Gothic web licence (open question #1) and white-on-gradient contrast (open question #2).

## Floor 2 — Every core component exists with all its Minimum Viable States ❌

Static
- [x] card — ⚠ conflicts with DESIGN.md §13.3 on radius and rest-shadow
- [x] badge — `Pill` canonical, `RiskBadge` sibling
- [~] divider — a CSS treatment (`border-line` / `divide-y` / `w-px bg-line`), not a component

Interactive
- [~] button — no visible focus ring; falls back to UA outline
- [ ] link — no Link component, no global anchor styling. `--brand-link` is defined but applied to no anchor. DESIGN.md §9 and §3.6 both specify link treatment; nothing implements it.
- [~] tabs — same focus gap as button

Input
- [~] text-field — `disabled` and `read-only` have no visual treatment; `error` is invisible when unfocused; no `aria-invalid`
- [~] checkbox — no visible keyboard focus (native input is `sr-only`, facade unstyled); no disabled/read-only
- [~] textarea — **extracted** to `Textarea.tsx`. Deliberately does not match Input's focus recipe (pure CSS focus, no resting shadow, vs Input's React focus state + resting `--shadow-sm`). Converging the two is an open visual decision.
- [ ] select — no `<select>`, no combobox, no listbox anywhere in `src/`
- [~] radio — **extracted** to `Radio.tsx` (`RadioGroup` + `Radio`). Still `role="radio"` on `<button>` cards with no roving tabindex, no arrow keys and no focus ring — not the ARIA radiogroup pattern.
- [ ] toggle — no `role="switch"`, no track/thumb component
- [~] field-scaffold — **extracted** to `Field.tsx`. Owns label + hint + error-colour only; the control's error styling stays in Input. No `aria-invalid`, `role="alert"` or `aria-describedby`.

Overlay
- [~] modal — `overflow` not implemented: no max-height, no body scroll, page scroll locked. Tall content becomes unreachable. `Drawer` handles this correctly; modal doesn't.
- [x] dropdown-menu — desktop popover + mobile bottom sheet
- [~] tooltip — **extracted** to `Tooltip.tsx`. Truncation-gated only (a generic always-on tooltip needs a different trigger contract). Hover-only: no `onFocus`/`onBlur`, trigger not focusable, so keyboard and screen-reader users never reach it.
- [ ] toast — **no implementation.** DESIGN.md §14.9 explicitly routes ephemeral confirmations to "the existing `AutomationControl.Toast`", which does not exist; those confirmations call `pushTransient` into the dock instead. Orphaned `toast-in` / `toast-out` keyframes remain in `motion.css`, referenced by nothing.

Async / data
- [~] table — no `error` prop; four pages swap in `ScreenError` instead. That component has no stub (see §7 of the harness).
- [ ] list — no reusable list primitive. `ListingsPanel` is a bespoke one-screen diff matrix; `ChipRow` is a filter control.
- [~] pagination — **extracted** to `Pagination.tsx`, stateless (`page` / `pageSize` / `total` / `onPageChange`). DataTable's public API unchanged. Still no visible focus style on prev/next, and page changes are not announced.
- [x] loading — skeleton + spinner, both with reduced-motion fallbacks
- [~] empty-state — `ScreenEmpty` covers first-use only. No-results is a separate plain-text line inside `DataTable`. Two components, not two variants.
- [x] alert-banner — `AutomationBanner` + `AddressIntegrityBanner`

Layout
- [~] app-shell — the **4px teal brand strip on the side nav does not exist in `SideNav.tsx`**. DESIGN.md §13.1 lists it as one of only three permitted gradient placements on the product surface, and §13.7 names its removal as an explicit revert-worthy regression. Needs an owner decision, not a silent fix.

---

## Optional — AI surface components

Included by default. **These do not count against the viability bar.**

This product's AI is a background-task model (the notification dock), not a chat model. Four of the five chat-shaped components genuinely don't apply — that is a legitimate product shape, not a hole.

- [~] working-indicator — the notification dock. The richest spec in the repo (DESIGN.md §14). `streaming`, `refusal` and `interrupted` are unimplemented; there is no cancel/abort affordance anywhere.
- [ ] streaming-text — output does not stream. `runAIInvestigation()` is a timed Promise chain resolving one complete result; reveal-on-completion only. SSE is named in a code comment as a future swap point.
- [ ] citation-chip — no source attribution on the AI surface at all. `evidenceRecords[]`, `occupancyHistory[].sources[]`, `runMeta.sourcesChecked` and `runMeta.evidenceRefsCount` are all populated and rendered nowhere.
- [ ] prompt-input — the AI takes only a `ScenarioKey`; there is no free-text entry. Closest thing is the `AICtaButton` in `ScanContextBar`.
- [ ] refusal-block — no refusal surface distinct from an error.

---

## Known-broken host: `design-spec.html`

Recorded here because it is the reason one smoke test and three visual-regression tests fail, and it has nothing to do with the design system itself.

`design-spec.html` throws React errors on every result screen — `ScanReferenceField` (inside `ConfidenceHero`) and `ListingsPanel` both hit an error boundary. This predates the tokenization work; the same failures occur on a clean tree.

Partial diagnosis, for whoever picks it up:

- Its script-load array is missing `ReferenceCell`, `SavedSnapshotDrawer` and `EditableTitle`, all of which those components depend on. `app.html` loads all three.
- **Adding all three is not sufficient.** With every global defined and confirmed resolving, both components still throw. So there is a second, deeper cause — most likely state or props the spec host's `MockAppStateProvider` does not supply.
- It also never loads `motion.css`, so `var(--motion-*)` / `var(--ease-*)` are undefined there (shared with `components.html`).

Not fixed here: the load-array additions alone don't resolve it, and going further is a debugging task with its own scope, not part of a token refactor.

---

## Floor 3 — The main file is complete ✅

`design-harness.md` carries:
- [x] The decision map — file targets filled; unwritten pattern files flagged inline rather than pointed at
- [x] Operating rules — naming convention and icon library named
- [x] The creation gate (verbatim)
- [x] The status glossary
- [x] Both floors
- [x] The extensions index — no registered extensions; 11 candidates listed

---

## What to do next

In the order that unblocks the most work:

1. **Fix focus visibility.** One global `:focus-visible` rule closes a cross-cutting floor violation across every Interactive and Input component, and it is currently a WCAG AA failure against DESIGN.md §9. The de-facto ring recipe is already captured as `focus.ring` in `references/hypertokens.md` — but see item 2, because the field version needs a token that doesn't exist yet.
2. **Add composite focus-ring tokens.** The three field components use `0 0 0 3px <ring>, var(--shadow-sm)` with an error branch. There is no single-token equivalent, so those rings could not be tokenized. Needs `--shadow-focus-brand` / `--shadow-focus-risk` as composite CSS vars.
3. **Decide the four DESIGN.md ↔ code conflicts** rather than letting them sit: card radius/shadow, table hover tint, KPI tile borders, and the missing side-nav brand strip. Each is doc-says-X, code-does-Y. The harness records both; only you can pick.
4. **Pick one scrim.** Modal and Drawer use `bg-ink/40`, DropdownMenu's mobile sheet uses `bg-ink-2/40`, SideNav's drawer uses `black/40`. Only the last matches `--scrim`. Three overlay treatments is two too many.
5. **Wire `motion.css` into `components.html` and `design-spec.html`.** Neither loads it, so every `var(--motion-*)` and `var(--ease-*)` silently no-ops there and shared animations don't run. Fixing it is a visible change, which is why it was left.
6. **Close the remaining gaps** — select, toggle, list, link, toast. These need designing, not extracting.
7. **Resolve the toast contradiction** before building it. DESIGN.md §14.9 routes ephemeral confirmations to `AutomationControl.Toast`, which does not exist; they go to the dock instead — the exact thing §14.9 says not to do. Either build the component or amend the doc.
8. **Fix the two z-index names that now read wrong.** DropdownMenu's desktop popover sits on `z-scrim` and its mobile scrim on `z-popover` (they were inverted in the original values, and were mapped by value to stay neutral). SideNav's mobile bar also sits on `z-scrim`.
9. **Consolidate the motion scale.** Eleven durations are named at their shipped values; that records drift rather than resolving it. Collapsing toward fast/mid/slow re-times animations — a design call.
10. **Promote statuses.** Everything is `draft`. Several are demonstrably proven in real screens.

When all three floors are checked, the harness is viable.
