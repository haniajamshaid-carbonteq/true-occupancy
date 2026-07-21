name: citation-chip
status: draft
version: 1
extends: none
class: AI surface

## Anatomy
⚠ GAP — no implementation exists in this codebase.

Nothing in `src/components/` renders a citation / source-attribution chip on an AI
surface. Do not build from this file.

Closest existing things (none of them are this component):
- `src/components/result/SavedSnapshotDrawer.tsx` — `PLATFORM_LABEL` +
  `PLATFORM_COLOR` map `airbnb | vrbo | fb` onto the platform brand tokens
  `--airbnb`, `--vrbo`, `--fb` (tokens.css) for the snapshot tag. Same mapping is
  used by `src/components/result/CertificateSheet.tsx` via
  `.cert-snapshot-tag--{airbnb,vrbo,fb}` in `src/styles/print.css`.
- `src/components/result/ListingsPanel.tsx` — attribution is either a plain
  `<Pill>{PLATFORM_PILL_LABEL[r.platformId]}</Pill>` in the table's `platform`
  column, or a text pair in the comparison grid's "Source" row (`@handle` in
  `font-mono text-caption` on `--navy` + platform name in `text-micro` on
  `--ink-3`). Neither is a chip component and neither uses the brand tokens.
- `src/components/ReferenceCell.tsx` — despite the name, this is **not** a
  citation. It is an inline-editable free-text case-reference field for table
  rows (Interactive/Input class, `font-mono tabular-nums text-caption`, pencil on
  hover, Enter/blur commit, Esc cancel).

Notably, the AI result payload carries citation data that is never rendered:
`AIInvestigationResult.evidenceRecords[]` (`source` + `rowid` + `tone`),
`occupancyHistory[].sources[]`, and `runMeta.sourcesChecked` / `evidenceRefsCount`
in `src/data/aiInvestigation.tsx` have no consumer anywhere in `src/components/`.

Delta required: a chip that binds an AI claim to a source record (platform brand
token or internal record `SOURCE · rowid`), with a defined affordance for
"open source" vs "no source available".

## States
Required for class AI surface: idle · working (steps visible) · streaming ·
complete · error · refusal · interrupted. None specced.

## Variants
—

## Rules
Per the creation gate, this component must be designed by the owner before use.
Claude may not improvise it.

## Revisions
- r1: logged as a gap during harness transcription; checked ReferenceCell.tsx,
  ListingsPanel.tsx, SavedSnapshotDrawer.tsx, CertificateSheet.tsx, tokens.css.
