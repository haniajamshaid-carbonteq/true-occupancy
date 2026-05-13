# Halcyon Design Source of Truth

> **Status:** active spec for the 2026 rebrand of True Occupancy.
> **Source:** `Halcyon_Brand Guidelines_2026.pdf` (Edition 2026, January 2026).
> **Editorial filter:** *"Decide with certainty."* Every visual and verbal choice is judged against this line.
>
> This file supersedes the legacy `docs/design-system.md` (forest-green / teal-#0F8FB8 era) for all future UI work. The legacy doc remains for historical reference only.

---

## 1. Brand essence

Halcyon Solutions is an AI-powered data intelligence platform for financial services and fintech. The product suite — **TrueTax**, **TrueCalc**, **TrueMark**, **TrueYou**, **TrueOccupancy**, **TrueReport** — helps lenders, banks, and fintechs decide faster with less fraud exposure.

Three axes anchor every design decision:

| Axis | Value |
| --- | --- |
| Visual mass | Teal gradient is always primary. Navy is depth/authority. Amber is accent only. |
| Tone | Authoritative, problem-first, specific, trustworthy, operationally aware. |
| Filter | "Decide with certainty." — does this feel clear, credible, and authoritative? |

---

## 2. Logo system

The logo has two parts: the **symbol mark** (stylized bird/helix in the teal-to-blue gradient) and the **wordmark** "HALCYON" set in bold sans-serif. The tagline "Decide with certainty." is a standalone lockup used on title slides, covers, and large-format pieces only.

**Variants** (three color modes × four lockups):

- Color modes: full color · black · white reversed
- Lockups: horizontal · vertical · with-tagline · wordmark · icon-only

**Existing assets in repo:** all under `docs/brand/` — `halcyon-logo.png`, `halcyon-mark.png`, `halcyon-mark-v2.png`, source EPS files in `EPS.zip`, and the master `Halcyon_Brand Guidelines_2026.pdf`.

**Clear space.** Always reserve a margin equal to the cap-height of the "H" in HALCYON on all four sides. Nothing — type, image, graphic — may cross that zone.

**Minimum sizes.**

- Full logo: 1.5″ / **108 px** wide.
- Symbol mark alone: 0.5″ / **36 px**.
- Below those thresholds use the symbol mark only. Web minimum for the full lockup is 120 px.

**Background pairings.**

| Background | Use this lockup |
| --- | --- |
| White / very light | Full-color horizontal or vertical |
| Teal gradient | White reversed (or approved black mark) — never full-color over teal |
| Navy / dark photo | White reversed |
| Section dividers / watermarks on teal gradient | Black symbol mark, ghosted, bleeding the frame |

**Don't.** Recolor, outline, drop-shadow, stretch, skew, rotate, clip, recreate, or typeset the logo. Do not place the full-color logo directly on the teal gradient. Always pull from the approved master files.

---

## 3. Color tokens

All hex values are authoritative and pulled directly from the brand book. RGB values are the matched triplets.

### 3.1 Primary gradient

```css
background: linear-gradient(90deg, #0AB7A3 0%, #0498C6 100%);
```

| Stop | Hex | RGB | Role |
| --- | --- | --- | --- |
| Teal Green (start) | `#0AB7A3` | 10, 183, 163 | Hero banners, footer bars, watermark base |
| Teal Blue (end) | `#0498C6` | 4, 152, 198 | Same — gradient terminus |

Direction is **always left-to-right** in horizontal layouts. Never reverse. Never run the gradient vertically in standard marketing materials.

### 3.2 Supporting teals

| Token | Hex | RGB | Role |
| --- | --- | --- | --- |
| Teal Mid | `#02AF9B` | 2, 175, 155 | Section accents, icon fills |
| Teal Dark | `#015E7A` | 1, 94, 122 | Deep teal text on light bg, hyperlink hover |
| Footer Teal | `#079FAD` | 7, 159, 173 | Footer bar, horizontal rules |
| Link Teal | `#0292BE` | 2, 146, 190 | Hyperlinks, CTA email, link text |

Do not substitute these for the primary-gradient endpoints in hero applications.

### 3.3 Navy & blue family

| Token | Hex | RGB | Role |
| --- | --- | --- | --- |
| Deep Navy | `#142D55` | 20, 45, 85 | Dark backgrounds, headlines on white |
| Quote Blue | `#3E6BA4` | 62, 107, 164 | Quote-block overlays |
| Mid Blue | `#1E4380` | 30, 67, 128 | Table headers, secondary panel fills |
| Link Blue | `#3374DD` | 51, 116, 221 | Digital accents, chart fills |

### 3.4 Amber accent (problem framing only)

| Token | Hex | RGB | Role |
| --- | --- | --- | --- |
| Amber Gold | `#EDA436` | 237, 164, 54 | Problem callouts, "Manual / Legacy" pill |
| Amber Dark | `#C3872D` | 195, 135, 45 | Amber hover, card border accents |

> Amber is **accent only** and **semantically marks "the Problem."** It must never be the dominant color in a composition and must never compete with the teal gradient for visual mass. The pairing — amber pill = legacy/old way, teal pill = Halcyon/solution — is now established across the suite and is non-negotiable.

### 3.5 Neutrals

| Token | Hex | Role |
| --- | --- | --- |
| Body Ink | `#1C1C1E` | Body text on white |
| Surface | `#FFFFFF` | Page / card background |
| Alt-row Gray | `#F2F2F2` | Comparison-table alternating rows |

### 3.6 Color usage by application (verbatim from brand book §3)

| Surface | Spec |
| --- | --- |
| Hero banners | Teal gradient `#0AB7A3 → #0498C6`, white headline, white reversed logo |
| Footer bars | Same teal gradient, white icons + contact text |
| Background watermark | Symbol mark ghosted at low opacity over teal gradient fill |
| Content area background | White `#FFFFFF`. Cards: white with subtle amber/gold border or shadow |
| Comparison table | Light gray `#F2F2F2` alt rows. Amber pill header for "Manual / Legacy" column. Teal pill header for the product column |
| Quote blocks | Navy-to-blue overlay (`#3E6BA4` range), white italic text, semi-transparent over photo |
| Subheadings — Problem | Amber Gold `#EDA436` |
| Subheadings — Solution | Teal Green `#0AB7A3` |
| Body text | Near-black `#1C1C1E` on white |
| Hyperlinks / CTA email | Link Teal `#0292BE`, underlined; hover Teal Dark `#015E7A`. Never amber for links. |

---

## 4. Typography

**Primary typeface: Century Gothic** across every brand touchpoint. Geometric, circular letterforms; ships with Microsoft Office; available cross-platform for office docs.

### 4.1 Type scale

| Style | Spec | Usage |
| --- | --- | --- |
| Display / H1 | Century Gothic Bold, 36–48 pt | Cover titles |
| Hero headline | Century Gothic Bold, 28–36 pt | One-pager hero band on teal gradient, white, sentence case |
| Section heading / H2 | Century Gothic Bold, 24 pt | Section titles |
| Subheading | Century Gothic Bold, 14–16 pt | "The Problem" / "The Solution" pill labels |
| Body copy | Century Gothic Regular, 10–11 pt | Paragraphs, captions in cards |
| Caption / label | Century Gothic Regular, 8–9 pt | Footnotes, table cell labels |

Body line-height: **130–145%** of font size. Minimum body weight: Regular (no thin/light at small sizes).

### 4.2 Hero headline rules

- Sentence case **always**. Never title case, never ALL CAPS.
- Formula for product one-pagers: **[Action verb] + [Outcome] + [Context]**.
  *Example:* "Automate self-employed income calculations and eliminate manual work."
- White text on the teal gradient, Century Gothic Bold, 28–36 pt.
- Avoid abstract claims — be specific about what the product does.

### 4.3 Don'ts

- Don't mix Century Gothic with another sans-serif.
- Don't ALL-CAPS body copy or paragraph text.
- Don't push print body above 11 pt.
- Don't use Century Gothic at huge decorative-display sizes without marketing approval.

### 4.4 Web font stack (open question — flagged for marketing)

The Microsoft Office license for Century Gothic does **not** cover web embedding. Until marketing licenses a web-deliverable cut, use this fallback chain so Office-installed users still see the brand face and everyone else gets a tonally close geometric sans:

```css
font-family:
  "Century Gothic",       /* native on Mac/Windows w/ Office */
  "CenturyGothic",        /* alt internal name */
  "URW Geometric",        /* recommended web-licensed substitute */
  "Futura PT",            /* second-choice substitute */
  "Avenir Next",          /* macOS/iOS fallback */
  ui-sans-serif, system-ui, sans-serif;
```

**Action item:** marketing to confirm whether to license URW Geometric or Futura PT for web. Until then, this stack is the working default.

---

## 5. Voice & tone

| Trait | Meaning |
| --- | --- |
| Authoritative | Lead with evidence. State what the product does and what it prevents. No hedging when the outcome is clear. |
| Problem-first | Name the pain before offering the solution. Every product story starts with what's broken, then how we fix it. |
| Specific | Real numbers, real job titles, real scenarios. "80% faster" beats "significantly faster." "VP Underwriting" beats "a customer." |
| Trustworthy | Understated confidence. No hyperbole, no marketing superlatives. Evidence speaks for itself. |
| Operationally aware | Use the language of underwriters, loan officers, compliance teams, commercial bankers — not generic tech-marketing language. |

If a sentence introduces ambiguity, hedges without evidence, or uses vague tech language, revise it. *Decide with certainty* is the editorial filter for every word.

---

## 6. Layout patterns (one-pager grammar)

This is the canonical structure for product one-pagers. Web pages should map to it section-for-section unless explicitly redesigned.

1. **Navigation bar.** White background. Full product suite listed in Century Gothic Regular. Active product is bold/darker. Halcyon logo right-aligned.
2. **Product header.** White. Product logo + name (left), vertical divider, vertical-market label (center), Halcyon logo (right).
3. **Hero banner.** Teal gradient `#0AB7A3 → #0498C6`. White Century Gothic Bold headline (sentence case). Ghosted iconography at right edge.
4. **Content card.** White, rounded corners, subtle amber/gold border. Two columns: **The Problem** (left, amber subheading) and **The Solution** (right, teal subheading).
5. **Comparison table.** Inside the content card.
   - "Manual / Legacy" column: **amber pill header**, ✗ red bullets.
   - Product column: **teal pill header**, ✓ teal checkmarks.
   - Light gray `#F2F2F2` alt-row fill.
   - The amber-vs-teal pairing is semantic and must not be reused for any other purpose.
6. **Bridge paragraph.** White background, body copy, centered. One to two sentences linking problem/solution to the CTA.
7. **Quote block.** Navy-to-blue overlay (`#3E6BA4` range) with white italic testimonial. Attribution in italic, right-aligned. Photo background allowed if soft-focus and identity is not the focus.
8. **CTA strip.** White, centered. Bold closing statement + contact line + Link-Teal hyperlinked email.
9. **Footer bar.** Teal gradient. White website / email / phone icons + contact details.

---

## 7. Product suite naming

All products use the **"True"** architecture. Always one compound word with both parts capitalized. Never abbreviate. Never use informal shorthand in client-facing copy.

| Product | Purpose |
| --- | --- |
| TrueTax | IRS data access and tax document verification |
| TrueCalc | AI-powered self-employed income calculation from tax returns or IRS data |
| TrueMark | Real-time government ID verification for commercial document signers |
| TrueYou | Consumer identity verification and synthetic-identity fraud detection |
| TrueOccupancy | Property occupancy verification and fraud prevention |
| TrueReport | Reporting, documentation, and compliance output suite |

**Trademarks.** First reference in any collateral takes ™: `TrueOccupancy™`, `TrueCalc™`, etc. The Halcyon wordmark takes ®: `Halcyon®`. Confirm trademark status with legal before publishing new materials.

---

## 8. Imagery

| Aspect | Spec |
| --- | --- |
| Subject matter | Authentic financial services contexts — underwriters, loan officers, commercial bankers. Precision and focus. No generic stock smiles. |
| Lighting | Clean, well-lit. Reserve dramatic cinematic lighting for brand-awareness pieces only. |
| Color grading | Slight cool shift consistent with the teal palette. No warm golden tones as dominant color. |
| Quote-block photos | Soft-focus, de-emphasized, under the blue-teal overlay. Identity not the focus. |
| Negative space | Hero/web images must preserve a text-overlay zone — typically right 50–60% or left third clear of busy detail. |
| Resolution | Web: 72–96 DPI / @2x. Print: 300 DPI minimum. JPEG @ 85% for photo, PNG for logos/transparency, SVG for product icons, WebP preferred for web photo (JPEG fallback). |

**AI-generated imagery — standing exclusions.** No bokeh bleed or lens flare in the negative-space zone. No embedded text or logos unless specified. No generic stock-photography look. No oversaturated gradients that conflict with teal. No composite faces that read as stock portraiture. No warm golden tones as dominant color.

---

## 9. Web & digital standards

| Concern | Spec |
| --- | --- |
| Gradient | `background: linear-gradient(90deg, #0AB7A3, #0498C6);` — always horizontal |
| Logo on web | Min 120 px wide. Full color on white; white reversed on teal/dark headers. Alt text: *"Halcyon Solutions — Decide with certainty."* |
| Hyperlinks | Color `#0292BE`, underlined. Hover `#015E7A`. Never amber. |
| Image formats | PNG (logos/transparency), WebP preferred for photography (JPEG fallback), SVG for product icons |
| Social profile | Symbol mark centered on a teal-gradient square |
| Social cover | Teal gradient with white reversed full logo + tagline |
| Accessibility | **WCAG AA required for all text.** Dark navy on white passes at all sizes. White on teal gradient must be verified at small body sizes — see open question below. |

**Open question — white-on-gradient contrast.** White body copy on the `#0AB7A3 → #0498C6` gradient does *not* clear WCAG AA at smaller sizes (the green stop is too light). Two options, pending marketing call:

1. Restrict white-on-gradient to display-size headlines (≥ 24 pt) and put body copy on white surfaces beneath the gradient band.
2. Allow Teal Dark `#015E7A` for body copy that must sit on the gradient.

Until marketing decides, default to option 1.

---

## 10. Token mapping into the codebase

The repo already has a semantic token layer in `src/styles/tokens.css` that is referenced by `tailwind.config.js` (`bg-brand`, `text-ink-3`, etc.). The redesign **keeps the semantic names** and reroutes the values to the Halcyon palette so existing component CSS keeps working.

### 10.1 `:root` rewrite for `src/styles/tokens.css`

```css
:root {
  /* === Surfaces === */
  --bg: #FFFFFF;
  --surface: #FFFFFF;
  --surface-2: #F2F2F2;       /* alt-row gray, also subtle nested-card fill */

  /* === Lines === */
  --line: #E5E7EB;
  --line-strong: #CBD5E1;

  /* === Ink === */
  --ink:   #1C1C1E;           /* body ink (brand book) */
  --ink-2: #142D55;           /* deep navy for headlines on white */
  --ink-3: #475569;           /* muted */
  --ink-4: #94A3B8;           /* placeholder / disabled */

  /* === Brand (teal) === */
  --brand:       #0AB7A3;     /* gradient start, primary brand */
  --brand-2:     #0498C6;     /* gradient end */
  --brand-soft:  #E6F8F5;     /* tinted brand-pill background */
  --brand-tint:  #F2FBFA;     /* lightest brand wash (active nav) */
  --brand-deep:  #015E7A;     /* hover / pressed; also link hover */
  --brand-link:  #0292BE;     /* hyperlink color */
  --brand-mid:   #02AF9B;     /* section accents, icon fills */
  --brand-footer:#079FAD;     /* footer bar, hr rules */

  /* === Authority / quote === */
  --navy:        #142D55;
  --navy-quote:  #3E6BA4;
  --navy-mid:    #1E4380;
  --navy-link:   #3374DD;

  /* === Amber accent (Problem framing only) === */
  --warn:      #EDA436;
  --warn-soft: #FDF1DC;
  --warn-ink:  #6B4914;
  --warn-deep: #C3872D;       /* hover / card border accent */

  /* === Status: clean (Solution framing) — reuse brand teal === */
  --clean:      #0AB7A3;
  --clean-soft: #E6F8F5;
  --clean-ink:  #015E7A;

  /* === Status: risk === */
  --risk:      #C0533C;
  --risk-soft: #FBE3DB;
  --risk-ink:  #6F2917;

  /* === Type families === */
  --sans: "Century Gothic", "CenturyGothic", "URW Geometric", "Futura PT",
          "Avenir Next", ui-sans-serif, system-ui, sans-serif;
  --serif: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --mono:  "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* === Gradient utility === */
  --brand-gradient: linear-gradient(90deg, #0AB7A3 0%, #0498C6 100%);

  /* radii / shadows — keep existing values */
}
```

### 10.2 Tailwind notes

`tailwind.config.js` already binds Tailwind colors to the `var(--*)` tokens — no schema change needed. New surface utilities to add later:

- `bg-brand-gradient` → `background: var(--brand-gradient)` (custom utility plugin or arbitrary value `bg-[linear-gradient(...)]`).
- `text-ink-2` is now Deep Navy and is the correct headline color on white.
- The legacy Tailwind classes `bg-brand`, `bg-clean-soft`, etc. keep working unchanged because they resolve through the rewritten CSS variables.

### 10.3 Surfaces that need to migrate off legacy values

These are tracked here so the rebrand PR can find them. Don't change them in the same commit as this doc:

- `true-occupancy.html` `<style>` block currently uses **forest green `#1F3D2E`** as brand and does not load `tokens.css` or Tailwind. This file must either be relinked through `tokens.css` or have its inline values rewritten to match §10.1.
- `design-spec.html` mirrors the `:root` block from `tokens.css`; rewrite both in the same commit to keep them in sync.
- Three type-pairing presets in `src/styles/typography.css` (`institutional` / `editorial-warm` / `brand-forward`) need a fourth — or a rewrite of the default — that pins to Century Gothic.

---

## 11. Governance

- **Brand source assets:** PDF, EPS, and logo PNGs live in `true-occupancy/docs/brand/`. Do not duplicate elsewhere in the repo.
- **Approval gate:** new collateral formats, partner co-brands, event signage, and any departure from this doc require sign-off from the Halcyon marketing team **before** production or publication.
- **Asset requests:** logos, approved background files, one-pager templates, master decks — request from Halcyon marketing. Do not create derivative assets, recolor the logo, or modify approved layouts without prior approval.
- **Trademark check:** confirm with legal before publishing any product name in new collateral.

**Contacts.**

| Channel | |
| --- | --- |
| Website | [www.halcyonsolutions.ai](https://www.halcyonsolutions.ai) |
| General | info@halcyonsolutions.ai |
| Sales | sales@halcyonsolutions.ai |
| Phone | 844-880-1040 |

---

## 12. Open questions tracker

| # | Question | Owner | Default until resolved |
| --- | --- | --- | --- |
| 1 | License a web cut of Century Gothic, or settle on URW Geometric / Futura PT? | Marketing | Use the fallback stack in §4.4 |
| 2 | White-on-gradient body copy fails WCAG AA at small sizes — restrict gradient to display-only, or allow Teal Dark body copy on gradient? | Marketing + design | Restrict gradient to display-size headlines (option 1) |
| 3 | Does the existing `true-occupancy.html` inline-style surface get migrated to `tokens.css`, or rewritten in place? | Engineering | Migrate to `tokens.css` in the rebrand PR |

---

## 13. Product surface posture (modern-fintech B2B)

Brand-book §6 prescribes the visual language for **one-pager marketing collateral** (full-bleed teal-gradient hero banners, navy-quote testimonial blocks, four-column gradient footer bars). Brand-book §10 prescribes the visual language for **web/digital product** (white content area, content cards on white, hyperlinks in Link Teal, gradient confined to small accents). The two are not in conflict — they govern different surfaces.

`app.html` is a **product surface** and follows §10. Marketing surfaces (a future `/about` page, sell-sheets, decks) follow §6. This section pins the §10 implementation so it's not weakened later.

### 13.1 Color budget on the product surface

Approximate area allocation across any visible viewport:

- **~85% white** (`--bg`, `--surface`).
- **~12% navy / near-black ink** (`--ink`, `--navy`, `--ink-2/3/4`) for type and dividers.
- **~3% brand teal**, used as accents only — active nav, link hover, primary button fill, focus rings, KPI deltas, the 4 px brand strip on the side nav, the `ScanCard` progress bar.
- Amber `#EDA436` only on Problem-framed callouts (Batch "Rented" stat dot, future "Manual / Legacy" comparison columns).
- No full-bleed gradient banners on product pages. The teal gradient appears as a 4 px brand strip on the side nav, the avatar circle in the workspace block, and the `ScanCard` progress bar — that is the entire gradient inventory on the product surface.

### 13.2 Type usage

| Style       | Size    | Weight | Tracking  | Color        |
|-------------|---------|--------|-----------|--------------|
| Display     | 32–40 px| 600    | -0.012 em | navy         |
| H1          | 28–32 px| 600    | -0.008 em | navy         |
| H2          | 20–22 px| 600    | -0.005 em | navy         |
| H3 / card   | 16 px   | 600    | 0         | navy         |
| Eyebrow     | 11 px   | 600    | 0.14 em uc| brand-deep   |
| Body lg     | 14.5 px | 400    | 0         | ink-2        |
| Body        | 14 px   | 400    | 0         | ink-2        |
| Caption     | 12.5 px | 500    | 0         | ink-3        |
| Mono label  | 10.5 px | 600    | 0.16 em uc| ink-3        |

Sentence case for every headline (brand-book §4.2). Weight 600 on display / H1 / H2 — not 700 — so the type reads modern instead of heavy.

### 13.3 Surfaces

- **Cards.** `bg-surface` + 1 px `--line` hairline + `rounded-xl` (12 px). No shadow at rest; shadow only on hover or for elevated chrome (modals, popovers).
- **Tables.** Hairline-divided rows, `bg-surface-2` header strip with mono uppercase column labels, hover row tint = `bg-brand-tint/40`.
- **KPI tiles.** Hairline-divided horizontal strip inside a single rounded-xl card. Each tile: mono uppercase label · 36 px tabular-numeral in navy · optional delta (▲ green, ▼ red) + hint caption. No per-tile borders; the dividers carry the structure.
- **Buttons.** Primary = solid `--brand` (Teal Green `#0AB7A3`, the brand-book §3.1 primary brand color) on white, white text, no gradient. Hover = `--brand-deep` (Teal Dark `#015E7A`), mirroring the brand-book §10 hyperlink hover pattern. Default = white surface + line-strong border, hover tints to brand-tint. Ghost = transparent until hover.
- **Pills.** Status `*-soft` background tints, status `*-ink` text, no border. Brand pill = `brand-soft` background + `brand-deep` text.

### 13.4 Spacing

Use only: 8 / 12 / 16 / 20 / 24 / 32 / 40 / 56 / 80. Section spacing on the home / batch surfaces: `mt-10/12 mb-10/12` between major bands.

### 13.5 Numbers

Every numeric display gets `tabular-nums`. Big numerals (KPI tiles, scores, counts) at weight 600, `tracking-[-0.012em]`, navy.

### 13.6 What this looks like in practice

The Home page is a working dashboard, not a marketing landing. Top-to-bottom:

1. Page header (eyebrow + sentence-case bold H1 + 1-line subhead + sync status).
2. Scanner card (the primary affordance).
3. KPI strip (hairline-divided, four tiles).
4. Recent scans table (hairline rows, mono column labels).
5. Two-card row: Flagged for review + Methodology.
6. Utility footer (single hairline strip, copyright + legal links).

The Batch page mirrors steps 1–3 (header → KPI strip → table) so the two surfaces feel like one product.

### 13.7 Brand preservation rule

If at any point the product surface reads as *less* Halcyon than this doc prescribes — logo missing, palette muted to gray, side-nav brand strip removed, sentence-case voice replaced with title case — that is a regression and gets reverted. The bar is not "less brand"; it is "brand applied via §10, not §6".
