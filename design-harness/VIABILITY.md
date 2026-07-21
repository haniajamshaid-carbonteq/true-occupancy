# TrueOccupancy · Viability checklist

The harness counts as viable when all three floors are green. A checkable, binary bar — this is what "the design system is set up" means, and what makes a from-scratch kickoff a scopeable, quotable phase.

Hypertokens and motion are NOT on this bar. They're optional layers that earn their place as the project scales.

---

## Status at transcription

**Not yet viable.** Floor 1 is green. Floor 3 is green. **Floor 2 is not** — 8 of 24 required components have no implementation, and 11 more ship without a state their class requires.

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
- [ ] textarea — two one-off inline `<textarea>`s, no primitive
- [ ] select — no `<select>`, no combobox, no listbox anywhere in `src/`
- [ ] radio — no radio input; two hand-rolled `role="radiogroup"` card groups inline in `AutomateModal.tsx`
- [ ] toggle — no `role="switch"`, no track/thumb component
- [ ] field-scaffold — the label+helper+error pattern is real but inline and duplicated four different ways

Overlay
- [~] modal — `overflow` not implemented: no max-height, no body scroll, page scroll locked. Tall content becomes unreachable. `Drawer` handles this correctly; modal doesn't.
- [x] dropdown-menu — desktop popover + mobile bottom sheet
- [~] tooltip — exists only as the file-private `TruncatedText` helper inside `ListingsPanel.tsx`; not a shared primitive
- [ ] toast — **no implementation.** DESIGN.md §14.9 explicitly routes ephemeral confirmations to "the existing `AutomationControl.Toast`", which does not exist; those confirmations call `pushTransient` into the dock instead. Orphaned `toast-in` / `toast-out` keyframes remain in `motion.css`, referenced by nothing.

Async / data
- [~] table — no `error` prop; four pages swap in `ScreenError` instead. That component has no stub (see §7 of the harness).
- [ ] list — no reusable list primitive. `ListingsPanel` is a bespoke one-screen diff matrix; `ChipRow` is a filter control.
- [~] pagination — implemented, but as a private footer inside `DataTable.tsx`. No props, no reuse outside a table.
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

1. **Decide the four DESIGN.md ↔ code conflicts** rather than letting them sit: card radius/shadow, table hover tint, KPI tile borders, and the missing side-nav brand strip. Each one is doc-says-X, code-does-Y. The harness records both; only you can pick.
2. **Fix focus visibility.** One global `:focus-visible` rule closes a cross-cutting floor violation across every Interactive and Input component, and it's currently a WCAG AA failure against DESIGN.md §9.
3. **Close the Input gaps** — select, radio, toggle, field-scaffold. Five of the eight gaps are here, and they're what actually blocks composition-only form building.
4. **Resolve the toast contradiction.** Either build the component §14.9 describes, or amend §14.9 to say transients go to the dock. Right now the doc describes a component that doesn't exist.
5. **Promote statuses.** Everything is `draft`. Several are demonstrably proven in real screens.

When all three floors are checked, the harness is viable.
