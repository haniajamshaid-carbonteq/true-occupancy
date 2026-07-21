# TrueOccupancy · Design Harness

The always-loaded router and rulebook. About one page. Everything long lives behind it in `components/`, `patterns/`, and `references/`, and loads only when the decision map points to it.

This file is the working harness for **TrueOccupancy**.

---

## 0 · What owns what

The harness does not replace the design documentation — it routes to it.

| Layer | Lives in | Owns |
|---|---|---|
| **Brand + rationale** | [`docs/DESIGN.md`](../docs/DESIGN.md) | Why the system is the way it is. Brand book, product-surface posture (§13), notification dock (§14). The design source of truth. |
| **Values** | [`src/styles/tokens.css`](../src/styles/tokens.css) | The tokens themselves. The only place a value is defined. |
| **Utility binding** | [`src/styles/tailwind-config.js`](../src/styles/tailwind-config.js) | The single runtime Tailwind config, loaded by all 7 HTML hosts. |
| **This harness** | `design-harness/` | Routing, rules, per-component state contracts, and the record of what exists vs what's missing. |

**Nothing in this harness defines a value.** `references/tokens.md` is an index of `tokens.css`, not a second copy. If the two disagree, `tokens.css` wins and the index is stale — fix the index.

> ⚠ [`docs/design-system.md`](../docs/design-system.md) is the **superseded** legacy spec (forest-green / teal `#0F8FB8`). Never read it for values. `docs/DESIGN.md` supersedes it.

---

## 1 · Decision map

Task-language routing. Add a line whenever a new recurring task needs a home.

```
Need exact values?          → references/tokens.md  (index of src/styles/tokens.css)
Adding a token?             → tokens.css AND src/styles/tailwind-config.js AND
                              tailwind.config.js (the mirror). Three files, one behaviour.
Need a repeated look?       → references/hypertokens.md
Animating something?        → references/motion.md  (+ src/styles/motion.css)
Writing user-facing text?   → references/voice.md
Using a component?          → components/core/[name].md — read its revisions, build the current version

Building a form?            → patterns/forms.md (composes text-field + field-scaffold
                              + checkbox …). ⚠ forms.md is a compose-and-route stub;
                              select and toggle are still gaps
Page-level states?          → patterns/screen-states.md (composes empty-state + loading …)
                              ⚠ screen-states.md is a compose-and-route stub;
                              ScreenError owns page error and still has no file — see §7
Building a table?           → components/core/table.md + loading.md + pagination.md
Long-running / async task?  → components/core/working-indicator.md + docs/DESIGN.md §14
                              (the notification dock owns every async task)
Overlay or dialog?          → components/core/modal.md + dropdown-menu.md
App chrome / navigation?    → components/core/app-shell.md
Brand question?             → docs/DESIGN.md §1–§9. Product surface: §13. Never §6 for product UI.

Nothing fits, need new?     → STOP. Read the creation gate (§3) first.
```

**Marketing vs product.** DESIGN.md §6 governs marketing collateral (full-bleed gradient heroes, navy quote blocks). §13 governs the product surface (white content area, gradient confined to small accents). `app.html` and everything in `src/` is a **product surface** and follows §13. Do not import §6 grammar into product UI.

> **Amended Jul-2026 (owner call).** One exception: the `spotlight` Button variant may carry the brand gradient on product surfaces. The §13.1 gradient inventory is now side-nav strip · workspace avatar · `ScanCard` progress bar · `spotlight` CTA. Full-bleed gradient bands are still marketing-only. See `components/core/button.md` r2 — DESIGN.md line 393 still records the old inventory and needs the matching edit.

---

## 2 · Operating rules

- **Precedence.** Production system beats prototype. Doc beats prototype on rules. `tokens.css` beats every doc on values. **Never resolve a conflict silently** — known conflicts are recorded on the component and hypertoken files where they occur. Add to that record; don't quietly fix.
- **Cascade.** core → extension → feature-level override (declared in the feature's handoff).
- **Naming.**
  - Tokens: CSS custom properties, kebab-case, semantic not literal — `--ink-3`, not `--gray-500`. Status families follow `--{name}` / `--{name}-soft` / `--{name}-ink`.
  - Components: PascalCase `.tsx` under `src/components/`, grouped `ui/` (primitives) and `result/` · `scan/` · `notification/` (feature).
  - Harness files: kebab-case `.md` matching the component's slug.
- **Icons.** Local Lucide-style stroked set in [`src/components/ui/Icons.tsx`](../src/components/ui/Icons.tsx). Names are kebab-case (`arrow-right`, `eye-off`, `trend-up`). All icons are `currentColor`-driven, `strokeWidth: 1.6`, `viewBox 0 0 24 24`, default size 16. **Use these; do not mix in icons from outside the set.** The file's own rule: keep the list narrow — add only what screens actually use.
- **Three colour layers, never conflated.** The most common way to get this system wrong, so the whole map is here inline — details in `references/tokens.md`.
  - **Verdict tones** — the scan finding itself: Rented / Possibly rented / Not rented. Categorical, non-judgemental. Use *only* on the occupancy verdict.
  - **Status** clean / warn / risk — brand-framed severity on the product surface (pills, factor rows, hero gradients). Use for how concerning a signal is.
  - **State** success / warning / error — true UI semantics (a save worked, a field is invalid, a request failed). Use for the interface talking about itself, never about the property.
  - Rule of thumb: if it describes the *property*, it's a verdict tone; if it describes a *concern level*, it's status; if it describes the *app's own action*, it's state.
- **Verdict neutrality.** Never colour or word a verdict as good/bad — the neutrality binds copy *and* palette, not just one.
- **Sentence case everywhere.** Headings, buttons, labels. Uppercase only for tracked mono eyebrows.
- **Reduced motion ships with the animation**, not after it.
- **When nothing fits.** Check the extensions index (§7). Still nothing? Flag the gap. Never invent — see the gate.

---

## 3 · Creation gate

**Claude builds from the system. Only humans change the system.** Building from registered components, tokens, hypertokens, and motion is always allowed. Anything canonical changes only when the person explicitly asks.

```
## Creation gate

You may NOT create, modify, or extend anything canonical on your
own: components, tokens, hypertokens, motion, or patterns.

- Every element in your output maps to a registered component,
  or is composed purely from registered ones.
- Every visual value maps to a token. No hardcoded values.
- Every repeated look maps to a hypertoken, and every hypertoken
  maps only to tokens. No hardcoded values inside a hypertoken.
- Every animation maps to registered motion. Motion patterns
  reference duration and easing by token name. No hardcoded
  values inside a motion pattern.

If nothing fits:
1. STOP. Do not improvise an unregistered component, token,
   hypertoken, motion value, or pattern.
2. Name the gap: what's needed, why nothing fits, the closest
   existing thing, the delta required.
3. Wait. Only an explicit "yes, create it" / "extend X" from the
   person lets you proceed.

When told to proceed: write the file in the component-file format
(§8) — delta-only for extensions, status: draft — and add one line
to the extensions index (§7).
```

**The gate in action** — what a correct STOP looks like, and what happens after:

```
Task:  "Add a filter control above the results table."
Claude: A single-select filter row isn't a registered component. Closest
        is ChipRow (§7 candidate — single-select filter, Interactive), but
        it has no file, so I can't build from it. Gap: a chip-style filter
        control. Delta from Button: no border, selected state, roving focus.
        STOP — need a "yes" before I create anything.
Owner:  "Yes, spec ChipRow as an extension of button."
Claude: Writes components/extensions/chip-row.md — delta-only, extends: button,
        status: draft — listing just what differs (selected fill, focus model).
        Adds one line to the §7 extensions index. Then builds from it.
```

The point: the STOP is not a refusal. It's the one move that keeps the
system the owner's to change, not the transcriber's.

---

## 4 · Status glossary

- **draft** — new, not yet proven in real use. May change.
- **proven** — used in real screens here and held up. Safe to reuse.
- **retired** — superseded or dropped. Don't use; kept so old work still resolves.

Status is self-set, not granted. The owner marks an extension *proven* once it's held up in real screens, and may move a *proven* one into `core/` when it's earned a place. No approval step.

> **Every file in `components/core/` is currently `status: draft`.** They were transcribed from shipping code, so several describe components demonstrably proven in real screens — but promotion is the owner's call, not the transcriber's. Promote them as you review.

---

## 5 · Minimum Viable States (the state floor)

Per class: the states without which a thing is undesigned. Classes inherit downward — an Input needs everything Interactive needs, plus its own. Pages are a class too.

| Class | Examples | Required states |
|-------|----------|-----------------|
| **Static** | badge, divider, card, avatar | default only, explicitly no others |
| **Interactive** | button, link, tab, menu item | default · hover · focus · active · disabled |
| **Input** | text field, select, checkbox, toggle | Interactive + empty · filled · error · read-only |
| **Overlay** | modal, drawer, popover, toast | open · closing / dismiss · overflow |
| **Async / data** | table, list, dashboard widget | populated · loading · empty · error · partial |
| **AI surface** | chat output, summary, suggestion | idle · working (steps visible) · streaming · complete · error · refusal · interrupted |
| **Page / screen** | every screen archetype | loaded · first-load (skeleton) · first-use empty · no-results empty · page error · partial failure · no-access |

Cross-cutting, all classes: visible keyboard focus, mobile-width behavior. State names are canonical — define each in one line as the project adopts it, so "skeleton" is never confused with "loading".

> ⚠ **The cross-cutting focus requirement is not currently met.** There is no global `:focus-visible` rule in `src/styles/`. The de-facto ring recipe is captured as `focus.ring` in `references/hypertokens.md`, but Button, Tabs, Checkbox and SearchBar don't use it. A live defect against this floor, not a style choice.

---

## 6 · Minimum Viable Components (the width floor)

The smallest set that makes composition possible. Common screen types (form, list, detail, dashboard, AI interaction) must be buildable by composition alone.

| Class | Core set |
|-------|----------|
| **Static** | card · badge/tag · divider |
| **Interactive** | button (primary / secondary / ghost / icon) · link · tabs |
| **Input** | text field · textarea · select · checkbox · radio · toggle · field scaffold (label + helper + error wrapper) |
| **Overlay** | modal · dropdown menu · tooltip · toast |
| **Async / data** | table · list · pagination · loading (spinner + skeleton) · empty state · alert/banner |
| **Layout** | app shell (header + content + sidebar) |
| **AI surface** | prompt input · streaming text block · working/steps indicator · source/citation chip · refusal block |

Each has a stub in `components/core/`. A component isn't done until it covers every state its class requires (§5).

**Current width: 5 of the 24 required components are gaps** — link, select, toggle, toast, list. Down from 8: `field-scaffold`, `textarea` and `radio` were extracted from inline duplicates into real primitives.

The five that remain genuinely do not exist in any form, so closing them means designing, not extracting. Exact status in `VIABILITY.md`.

---

## 7 · Extensions index

One line per extension: name, status, what it extends, when to use it. Checked before ever reporting "nothing fits".

Nothing is registered yet. The following are **candidates identified during transcription** — real, shipping components that own real states but have no home in the core set. The owner decides which earn a file.

```
- ScreenError      — candidate. Page-level error surface. The true owner of the "error"
                     state for table.md (DataTable has no error prop; four pages swap in
                     ScreenError instead). Has an anatomy contract with ScreenEmpty that
                     will rot silently if only one is specced.
- MetricCard       — candidate. The §13.3 KPI tile. Two DESIGN.md conflicts live here
                     (per-tile borders, and a gradient outside the §13.1 inventory).
- Drawer           — candidate. Sibling of modal; diverges on overflow handling.
- ConfidenceHero   — candidate. Owns the --rb-* soft-rainbow spectrum.
- ChipRow          — candidate. Single-select filter control (Interactive, not data).
- StatusPillSelector — candidate. Multi-select pill group.
- CommandPalette / CommandSearch — candidates.
- Avatar / Keycap / EditableTitle / SearchBar — candidates (Static / Interactive / Input).
```

---

## 8 · Component-file format

The shape every core and extension file follows.

```
name: slug
status: draft          draft | proven | retired
version: 1
extends: parent | none

## Anatomy      parts & structure
## States       every state for its class (from §5)
## Variants     if any
## Rules        must / must-not, invisible logic
## Revisions    what changed, + re-check on breaking
```

Extensions are **delta-only**: list only what differs from the parent; the rest is inherited. Brand-new (`extends: none`) files carry the full set.

Two conventions added during transcription, used throughout `components/core/`:

- `⚠ NOT IMPLEMENTED in source.` — a state the class requires that the shipping component doesn't have.
- `⚠ hardcoded in source` — a raw value where a token should be. Records drift without silently fixing it.
