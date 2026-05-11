# Halcyon PDF Certificate — Spec

The **True Occupancy Certificate** is the single PDF template behind every
Halcyon download. Single-property scans, batch scans, and future audit
deliverables all render through this template. Replaces the legacy
lender-form layouts (e.g. Fannie Mae 1036, Freddie Mac 1115) with a
Halcyon-branded equivalent.

> **Rule:** every downloadable Halcyon report must reuse
> `src/components/result/CertificateSheet.tsx`. New report types are added
> as variants of that component, not as parallel print templates.

## Hard requirements

- **One page.** Letter, portrait, 0.4in margins. Content must fit even on
  the busiest scenario (Rented · High confidence with all platforms
  populated). Overflow listings collapse into a "+N more" footnote.
- **Required fields:**
  1. **Result score** (0–100) with a **neutral descriptive verdict**
     (e.g. "Rented · High confidence", never "Red flag"). Source:
     `Scenario.riskLabel` in [src/data/scenarios.tsx](../src/data/scenarios.tsx).
  2. **Timestamp** of the scan (local time, ISO-style date + 24h clock).
     Refreshed on every print via the `beforeprint` event so the stamp
     reflects when the PDF was saved.
  3. **Discoverable property links** — every matched listing's full URL,
     rendered as a real `<a href>` so clicks survive the print-to-PDF
     pipeline. Capped at 8 rows; remainder noted inline.
- **Scan ID** — deterministic `TO-XXXXXXXX` short hash of address +
  scenario. Printed next to the timestamp and again in the
  "Verifiable at halcyon.app/verify/{id}" footer.

## Layout (top → bottom)

```
┌──────────────────────────────────────────────────────────────────────┐
│  [mark]  Halcyon                            TO-XXXXXXXX              │
│          True Occupancy Certificate         2026-05-11 13:42 local   │
│                                             SINGLE-PROPERTY SCAN     │
│ ════════════════════════════════════════════════════════════════════ │  ← teal gradient rule
│                                                                      │
│  SUBJECT PROPERTY                                                    │
│  1428 Maplewood Drive, Asheville, NC 28804                           │
│  Parcel 9648-23-7104 · R-1 Single Family · No STR permit on file    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────────┐ │
│ │ RESULT SCORE                                                     │ │
│ │   87        Rented · High confidence                             │ │
│ │ of 100      Active listings on Airbnb, Vrbo, and Facebook…       │ │
│ └──────────────────────────────────────────────────────────────────┘ │  ← accent band
│                                                                      │
│  Discoverable properties                              4 LISTINGS     │
│  ─────────────────────────────────────────────────────────────────── │
│  PLATFORM   LISTING                                 MATCH    FIRST   │
│  Airbnb     Charming Mountain Retreat…              94%     Apr 18   │
│             https://airbnb.com/rooms/example-…                       │
│  …                                                                   │
│                                                                      │
│ ────────────────────────────────────────────────────────────────────│
│ Verifiable at halcyon.app/verify/TO-XXXXXXXX           Page 1 of 1   │
│ Generated 2026-05-11 13:42 local · Halcyon True Occupancy           │
└──────────────────────────────────────────────────────────────────────┘
```

## Tokens

All values resolve through [src/styles/tokens.css](../src/styles/tokens.css)
so the certificate inherits any future brand rebalance for free.

| Role               | Token                                        |
| ------------------ | -------------------------------------------- |
| Page background    | `#FFFFFF`                                    |
| Brand wordmark     | `var(--navy)` `#142D55`                      |
| Product line       | `var(--brand-deep)` `#015E7A`                |
| Top rule gradient  | `var(--brand)` → `var(--brand-2)`            |
| Score accent       | `var(--verdict-{high,med,low})` + soft fill  |
| Body text          | `var(--ink)`                                 |
| Muted / footer     | `var(--ink-3)` / `var(--ink-4)`              |
| Listing URL        | `var(--brand-link)`                          |
| Borders            | `var(--line)`                                |

## Typography

| Zone                  | Family               | Size     | Weight |
| --------------------- | -------------------- | -------- | ------ |
| Wordmark              | Jost                 | 16pt     | 700    |
| Product / verdict     | Jost                 | 9.5–13pt | 500–600 |
| Eyebrows              | Jost (uppercase, tracked) | 7.5pt | 600  |
| Address               | Jost                 | 15pt     | 600    |
| Score numeral         | Jost (tabular-nums)  | 44pt     | 700    |
| Body / summary        | Jost                 | 9.5–10.5pt | 400–500 |
| Scan ID, timestamp, URLs, page no. | Geist Mono | 7.5–10pt | 500    |

## Mechanics

`CertificateSheet` is rendered as a child of each result page but uses
`ReactDOM.createPortal` to mount its DOM as a direct sibling of `#root`.

`src/styles/print.css` then:

- Hides `.cert-print-root` on screen.
- On `@media print`, hides `#root` and renders `.cert-print-root` only.
- Sets `@page { size: Letter; margin: 0.4in }`.
- Forces `print-color-adjust: exact` so the brand rule, score band, and
  link colors aren't stripped by user-agent defaults.

`window.print()` (called by the **Download PDF** button in
[ScanContextBar](../src/components/ScanContextBar.tsx)) is sufficient —
no PDF library required. Browsers preserve `<a href>` attributes when
"Save as PDF" is the destination, so listing URLs stay clickable in the
saved file.

## Adding a new report variant

Don't fork the template. Extend `CertificateSheet` with a `variant`
prop and route the new fields through the same body. The portal +
`@media print` plumbing should not be duplicated.
