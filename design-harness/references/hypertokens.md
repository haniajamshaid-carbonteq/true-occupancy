# Hypertokens

Named bundles of tokens that always travel together. The middle layer between single tokens and full components. Read the name, get the whole look.

**Rules:**
- A hypertoken references tokens by name only. **No hardcoded values inside a hypertoken.**
- A hypertoken is **static style only**: fill, border, radius, shadow, typography, spacing, surfaces, transforms. The moment it carries hover, focus, error, disabled, keyboard interaction, ARIA, or conditional logic, it has become a component — move it to `components/`.
- **No inheritance.** A variant is a new named bundle (e.g. `surface.card.raised`), not a delta on a parent.
- **No status field.** A bundle is either the current definition or it isn't. It carries revisions, not a draft/proven/retired lifecycle.

---

## Scope note

These bundles are **descriptive, not new design**. Each one records a look that is already listed out by hand in several places across `src/`. They were extracted during the harness transcription; nothing here introduces a value that wasn't already shipping.

Where a bundle disagrees with [`docs/DESIGN.md`](../../docs/DESIGN.md), the disagreement is recorded on the bundle rather than resolved. Per the operating rules, conflicts are never settled silently.

---

## The format

```
name: surface.card
version: 1
fields:
  fill:   {color.surface.raised}
  border: {color.border.subtle}
  radius: {radius.md}
  shadow: {shadow.100}

## Revisions
- r1: initial bundle.
```

Every field value in `{braces}` is a token name from `tokens.md`, never a raw value.

---

## Bundles

```
name: surface.card
version: 1
fields:
  fill:   {--surface}
  border: 1px {--line}
  radius: {--r-lg}
  shadow: {--shadow-sm}
  padding: {--pad-card}

## Revisions
- r1: transcribed from src/components/ui/Card.tsx.

⚠ CONFLICT — DESIGN.md §13.3 specifies cards as radius 12px with NO shadow at rest
  ("shadow only on hover or for elevated chrome"). The shipped Card.tsx uses --r-lg
  (10px) and carries --shadow-sm by default. This bundle records what ships.
  Owner decides which one wins; do not silently change either.
```

```
name: surface.card-dense
version: 1
fields:
  fill:   {--surface}
  border: 1px {--line}
  radius: {--r-lg}
  padding: {--pad-card-tight}

## Revisions
- r1: the metric/KPI tile surface. DESIGN.md §13.3 — no per-tile borders when tiles sit
      in a hairline-divided strip; the dividers carry the structure.
```

```
name: surface.elevated
version: 1
fields:
  fill:   {--surface}
  border: 1px {--line-strong}
  shadow: {--shadow-lg}

## Revisions
- r1: elevated chrome — modals, popovers, the notification dock (DESIGN.md §14.1).
      The lift comes from the shadow, not from a fill swap. Radius is per-surface:
      modals use {--r-xl}, the dock pill uses a raw 22px for the Dynamic-Island
      silhouette (an intentional off-token exception, documented in tokens.md).
```

```
name: surface.table-header
version: 1
fields:
  fill:      {--surface-2}
  label-font: {--mono}
  label-size: {--text-micro}
  label-case: uppercase
  ink:       {--ink-3}
  padding-x: {--pad-cell-x}
  padding-y: {--pad-cell-y}

## Revisions
- r1: DESIGN.md §13.3 Tables — bg-surface-2 header strip, mono uppercase column labels.
```

```
name: surface.row-hover
version: 1
fields:
  fill: {--brand-tint} at 40% opacity

## Revisions
- r1: DESIGN.md §13.3 — table row hover tint. Distinct from {--hover-bg}, which is the
      neutral wash used by buttons, nav rows and ghost CTAs.
```

```
name: type.eyebrow
version: 1
fields:
  font:     {--mono}
  size:     {--text-eyebrow}
  weight:   600
  tracking: 0.14em
  case:     uppercase
  ink:      {--brand-deep}

## Revisions
- r1: DESIGN.md §13.2. Uppercase is a typographic device here, not emphasis — it is one
      of only two places uppercase is permitted (see voice.md).
```

```
name: type.mono-label
version: 1
fields:
  font:     {--mono}
  size:     {--text-micro}
  weight:   600
  tracking: 0.16em
  case:     uppercase
  ink:      {--ink-3}

## Revisions
- r1: DESIGN.md §13.2 — table column labels, dock row meta, badge text.
```

```
name: type.numeral
version: 1
fields:
  weight:   600
  tracking: -0.012em
  ink:      {--ink-2}
  figures:  tabular-nums

## Revisions
- r1: DESIGN.md §13.5 — every numeric display. Size varies by slot ({--text-display}
      for the hero numeral, {--text-h2} for KPI values); the rest of the recipe is fixed.
```

```
name: pill.neutral
version: 1
fields:
  fill:   {--pill-neutral-bg}
  ink:    {--ink-3}
  radius: 999px
  border: none
  gap:    {--pad-inline-tight}

## Revisions
- r1: transcribed from src/components/ui/Pill.tsx.
```

```
name: pill.brand
version: 1
fields:
  fill:   {--brand-soft}
  ink:    {--brand-deep}
  radius: 999px
  border: none
  gap:    {--pad-inline-tight}

## Revisions
- r1: DESIGN.md §13.3 Pills. The status variants follow the same shape with their own
      {--<status>-soft} / {--<status>-ink} pair — each is its own bundle if it earns one.
      No pill carries a border.
```

```
name: focus.ring
version: 1
fields:
  border: 1px {--brand}
  ring:   0 0 0 3px {--brand-soft}

## Revisions
- r1: transcribed from Input.tsx, EditableTitle.tsx and DateRangePicker.tsx, which all
      hand-list this same recipe.

⚠ INCOMPLETE COVERAGE — this is the de-facto focus treatment but there is no global
  :focus-visible rule in src/styles/. Button, Tabs, Checkbox and SearchBar do not use it;
  they fall back to the UA outline or show nothing. DESIGN.md §9 requires WCAG AA and
  §13.1 lists focus rings among the sanctioned brand-teal accents, so the gap is a real
  defect, not a style choice. Logged, not fixed.
```
