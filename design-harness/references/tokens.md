# Tokens

Single named decisions. The dense value lookup, loaded when a task needs exact values.

**Rule:** every token is one named value. No bundles here (those are hypertokens). No raw values anywhere else in the harness — everything visual maps back to a token defined here.

---

## Source of truth

These tokens are **not defined here**. This file is an index of what already exists in code.

| Layer | File | Role |
|---|---|---|
| Definition | [`src/styles/tokens.css`](../../src/styles/tokens.css) | The `:root` block. Every value below lives here. |
| Type pairings | [`src/styles/typography.css`](../../src/styles/typography.css) | Overrides `--sans` / `--serif` / `--mono` per `body[data-type-pairing]`. |
| Tailwind binding | [`src/styles/tailwind-config.js`](../../src/styles/tailwind-config.js) | **The runtime config.** Binds utilities to `var(--token)`. Loaded by all 7 HTML hosts after the Play CDN script. |
| Tooling mirror | [`tailwind.config.js`](../../tailwind.config.js) | Editor IntelliSense only — **not loaded at runtime**. Must mirror the file above. |
| Rationale | [`docs/DESIGN.md`](../../docs/DESIGN.md) | Why the values are what they are. Brand book §3–§4, product posture §13. |

**To change a token, edit `tokens.css` — never this file.** Update this index afterward. Adding a token is a four-step process documented in DESIGN.md §10.

> ⚠ `docs/design-system.md` is the **superseded** legacy spec (forest-green / teal `#0F8FB8` era). Do not read it for values. `docs/DESIGN.md` supersedes it.

> **Why the config lives in one file now.** It used to be copy-pasted inline into all seven HTML hosts, and they drifted — `navy` existed only in `components.html`, `verdict-*` in four of seven, `hover-bg` in six. So `text-navy` and `bg-hover-bg` silently resolved to *nothing* depending on which page you opened, and people wrote raw hex to compensate. That is the root cause most of the hardcoded values traced back to. If you add a token, add it in `tokens.css` **and** `src/styles/tailwind-config.js` **and** the mirror — three places, one behaviour.

---

## Color — surfaces & lines

```
--bg:               #F4F6F8   page background — neutral cool off-white, lifts white cards
--surface:          #FFFFFF   cards, panels
--surface-2:        #F2F2F2   alt-row gray, nested-card fill, table header strip
--pill-neutral-bg:  #F6F7F8   neutral Pill default — a touch lighter than --surface-2
--line:             #E5E7EB   default hairline / divider
--line-strong:      #CBD5E1   emphasized border — buttons, dock, frames
--hover-bg:         #E8EBF0   hover wash — buttons, nav rows, ghost CTAs, table rows
```

## Color — ink (descending contrast)

```
--ink:    #1C1C1E   body ink (brand book §3.5)
--ink-2:  #142D55   deep navy — headlines on white
--ink-3:  #475569   muted, captions
--ink-4:  #94A3B8   placeholder, disabled
```

## Color — brand (Halcyon teal)

```
--brand:        #0AB7A3   gradient start, primary brand, primary button fill
--brand-2:      #0498C6   gradient end
--brand-soft:   #E6F8F5   tinted brand-pill background
--brand-tint:   #F2FBFA   lightest brand wash — active nav, table row hover
--brand-deep:   #015E7A   hover / pressed; also link hover
--brand-link:   #0292BE   hyperlink color
--brand-mid:    #02AF9B   section accents, icon fills
--brand-footer: #079FAD   footer bar, hr rules
--brand-gradient: linear-gradient(90deg, #0AB7A3 0%, #0498C6 100%)
```

Gradient direction is **always** left-to-right. Never reversed, never vertical (DESIGN.md §3.1).

## Color — authority (navy & blue)

```
--navy:        #142D55
--navy-quote:  #3E6BA4   quote-block overlays
--navy-mid:    #1E4380   table headers, secondary panel fills
--navy-link:   #3374DD   digital accents, chart fills
```

## Color — three separate semantic layers

The project runs **three distinct color layers**. Conflating them is the most likely way to get this system wrong, so they are listed separately.

**1 · Verdict tones — categorical, deliberately non-semantic.** The product's verdict labels (Rented / Possibly rented / Not rented) are descriptive: a "Rented" finding can be good or bad for the lender depending on what they're verifying. These use calm categorical hues that read as *different categories*, not *good/bad*.

```
--verdict-high:  #A855F7   purple — Rented          --verdict-high-soft: #F3E8FF   --verdict-high-ink: #6B21A8
--verdict-med:   #EAB308   yellow — Possibly rented --verdict-med-soft:  #FEF9C3   --verdict-med-ink:  #854D0E
--verdict-low:   #3B82F6   blue   — Not rented      --verdict-low-soft:  #DBEAFE   --verdict-low-ink:  #1E3A8A
```

**2 · Status — clean / warn / risk.** Brand-framed. `clean` reuses brand teal ("the Solution"), `warn` is the Halcyon amber ("the Problem").

```
--clean:  #0AB7A3   --clean-soft: #E6F8F5   --clean-ink: #015E7A
--warn:   #EDA436   --warn-soft:  #FDF1DC   --warn-ink:  #6B4914   --warn-deep: #C3872D
--risk:   #C0533C   --risk-soft:  #FBE3DB   --risk-ink:  #6F2917
```

**3 · State — true semantics.** KPI deltas, validation errors, success toasts. `--warning` is brighter than `--warn` so small dot indicators read as yellow caution rather than deep verdict amber.

```
--success: #16A34A   --success-soft: #DCFCE7   --success-ink: #14532D
--warning: #F59E0B   --warning-soft: #FEF3C7   --warning-ink: #78350F
--error:   #DC2626   --error-soft:   #FEE2E2   --error-ink:   #7F1D1D
```

Back-compat aliases, resolving to layer 3. **Do not use in new work** — they exist so straggler code keeps rendering, and are slated for removal:

```
--stat-up   → var(--success)     --stat-down   → var(--error)
--stat-up-soft / --stat-up-ink   --stat-down-soft / --stat-down-ink
```

## Color — platform brands

Third-party marks. Use only for the listing source they identify.

```
--airbnb: #FF5A5F     --vrbo: #245ABE     --fb: #1877F2
```

## Color — soft rainbow (confidence spectrum)

Low-saturation pastels used by `ConfidenceHero` waffle / sparkbars.

```
--rb-1: #F4A6A0   --rb-2: #F4C28A   --rb-3: #F4DD7A
--rb-4: #A8E0C2   --rb-5: #9CC9F0   --rb-6: #B3E5C5
--rb-gradient:    coral → peach → butter → mint → sky → soft green, 90deg
--rb-gb-gradient: #6BCFA8 → #5DC0A4 → #5DAFE0, 90deg
```

`--rb-gb-gradient` is the cool subset, ~30% more saturated, used for factor-impact bars in the Why-this-score breakdown. Positive and negative impacts share one palette on purpose — the +/− sign in the value carries direction, not the color.

## Type — families

```
--sans:  "Century Gothic", "CenturyGothic", "Jost", "URW Geometric",
         "Futura PT", "Avenir Next", ui-sans-serif, system-ui, -apple-system, sans-serif
--serif: "Instrument Serif", "Iowan Old Style", Georgia, serif
--mono:  "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace
```

Century Gothic is the brand face (DESIGN.md §4). The Office license does **not** cover web embedding — the fallback chain preserves the geometric intent until marketing licenses a web cut. That is **open question #1** in DESIGN.md §12.

Runtime pairings, via `body[data-type-pairing="…"]`: `halcyon` (production default) · `institutional` · `editorial-warm` · `brand-forward`. Switching requires the matching web fonts in `<head>`.

## Type — size ramp

Eleven named slots, consolidated from 28 ad-hoc sizes found across the codebase. Half-pixel sizes (11.5, 12.5, 13.5) are **deliberately excluded** — they were drift, not design.

```
--text-display:  64px   hero numeral — one per page max
--text-h1:       40px   page title
--text-h2:       28px   compact metric value, large heading
--text-h3:       22px   section heading, card title
--text-h4:       18px   subsection heading
--text-body:     16px   body lead
--text-body-sm:  14px   default body, table row
--text-label:    13px   UI label, dense body, button text
--text-caption:  12px   hint, secondary text
--text-micro:    11px   mono uppercase, kbd, badge
--text-eyebrow:  10px   tracked uppercase eyebrow (smallest)
```

Applied weights and tracking are in DESIGN.md §13.2. Headlines are weight **600, never 700** — so type reads modern rather than heavy. Sentence case always (§4.2).

## Spacing — primitives

4px base. **These are the only stops allowed.** Odd intermediates (`p-3.5`, `py-7`, `gap-2.5`) were drift and are deliberately unrepresented.

```
--space-0:   0       --space-3xs: 2px    --space-2xs: 4px    --space-xs:  6px
--space-sm:  8px     --space-md:  12px   --space-lg:  16px   --space-xl:  20px
--space-2xl: 24px    --space-3xl: 32px   --space-4xl: 48px   --space-5xl: 64px
```

## Spacing — semantics

Prefer these over primitives where intent matters. Larger values separate unrelated things; smaller values group related ones (law of proximity).

```
--pad-inline-tight:     var(--space-xs)    chip / pill icon+text gap
--pad-inline:           var(--space-sm)    button / default inline gap
--pad-inline-loose:     var(--space-md)    nav row icon+text gap

--pad-control-x:        var(--space-md)    button / input horizontal
--pad-control-y:        var(--space-sm)    button / input vertical

--pad-cell-x:           var(--space-md)    table cell horizontal
--pad-cell-y:           var(--space-md)    table cell vertical

--pad-card:             var(--space-2xl)   card / panel / modal body — 24
--pad-card-tight:       var(--space-xl)    dense cards (metric tiles) — 20
--pad-card-loose:       28px               roomy detail-page cards ⚠ off-scale half-step, intentional

--pad-surface-x:        var(--space-2xl)   modal & drawer body x
--pad-surface-y-header: var(--space-xl)    modal & drawer header y
--pad-surface-y-body:   var(--space-2xl)   modal & drawer body y
--pad-surface-y-footer: var(--space-lg)    modal & drawer footer y

--gap-stack-tight:      var(--space-sm)    heading → content; label → field
--gap-stack-md:         var(--space-md)    sub-heading → table — 12
--gap-stack:            var(--space-lg)    grouped sibling items
--gap-section-tight:    var(--space-xl)    tight sub-sections (Card → KPIs → Table) — 20
--gap-section-sub:      var(--space-3xl)   between sub-sections — 32
--gap-section:          var(--space-4xl)   between major sections — 48
```

## Radius

Tightened from 8/12/18/28 so cards and tables read as product chrome, not consumer-app marshmallows.

```
--r-xs:    4px    checkbox facade
--r-sm:    6px
--r-md:    8px
--r-lg:   10px
--r-xl:   14px
--r-2xl:  16px    side-nav rail
--r-pill: 999px   full pill — badges, chips
--r-dock:  22px   dock pill + stack — the Dynamic-Island silhouette (§14.1)
```

Tailwind: `rounded-xs` … `rounded-2xl`, `rounded-pill`, `rounded-dock`.

## Z-index

Nine bare literals with no ordering contract, so nobody could tell whether a new surface belonged above or below an existing one. Named by what the layer **is**, ascending.

```
--z-base:     1     in-flow lift — a positioned child over its siblings
--z-raised:   10    sticky table headers, floating labels, map markers
--z-sticky:   20    pinned page chrome inside a scroll container
--z-nav:      30    side nav rail
--z-scrim:    40    the dim behind an overlay
--z-popover:  50    dropdown menus, tooltips — attached to a trigger
--z-dock:     90    notification dock — above content, below dialogs
--z-modal:    100   modal + drawer. Nothing may sit above this.
```

Tailwind: `z-base` … `z-modal`. **Adding a layer means adding a token**, not an arbitrary number.

## Sizing — controls & glyphs

```
--size-control-sm:      32px   Button.sm, dock action buttons
--size-control-md:      36px   Button.md — the default control height
--size-control-lg:      44px   text input track, search bar
--size-gutter-leading:  36px   leading-icon cell in a field
--size-gutter-trailing: 40px   trailing-slot cell in a field
--size-glyph-sm:        18px
--size-glyph-md:        22px   RiskBadge leading glyph
--size-glyph-lg:        24px
--size-glyph-xl:        26px   dock status chip — DESIGN.md §14.2
```

## Widths

```
--width-modal-sm:   480px   Modal default
--width-modal-md:   520px   AutomateModal, single
--width-modal-lg:   600px   AutomateModal, batch
--width-nav:        248px   SideNav rail
--width-nav-offset: 280px   content offset = rail + gutter
--width-content:   1100px   page content max-width
--width-prose:      420px   empty-state / centred copy max-width
--dock-top:          14px   dock offset from viewport top (§14.1)
```

`--width-nav` and `--width-nav-offset` are deliberately separate: the offset is the rail plus its gutter, and the two drifting apart is what breaks the shell layout.

## Tracking

Negative values are the display ramp (DESIGN.md §13.2); positive values are the uppercase mono/eyebrow treatments.

```
--tracking-display:      -0.012em
--tracking-h1:           -0.008em
--tracking-h2:           -0.005em
--tracking-pill:          0.04em
--tracking-eyebrow:       0.08em
--tracking-eyebrow-loose: 0.14em
--tracking-mono-label:    0.16em
```

## Border widths

```
--border-hairline:   1px   the default rule everywhere
--border-emphasis:   1.5px selected card outline
--border-indicator:  2px   active tab underline
--border-focus:      3px   focus ring spread
```

## Overlay & on-brand colors

Raw values that were previously written inline because no token existed.

```
--scrim:            rgba(0,0,0,.40)        modal / drawer backdrop
--on-brand:         #FFFFFF                text & glyphs on a brand fill
--on-brand-divider: rgba(255,255,255,.20)  hairline on a brand fill
--focus-ring-brand: rgba(10,183,163,.45)   --brand at 45% — dock focus ring
```

Tailwind: `bg-scrim`, `text-on-brand`, `border-on-brand-divider`, plus the composed `shadow-focus-brand` and `shadow-focus-dock`.

## Elevation / shadow

Tinted with navy `rgba(20,45,85,…)`, never pure black, so cards stay grounded in the palette.

```
--shadow-sm: 0 1px 3px rgba(20,45,85,.055), 0 1px 1px rgba(20,45,85,.035)
--shadow-md: 0 4px 16px -4px rgba(20,45,85,.09), 0 2px 5px rgba(20,45,85,.05)
--shadow-lg: 0 24px 48px -16px rgba(20,45,85,.14), 0 8px 16px -8px rgba(20,45,85,.07)
```

Cards carry **no shadow at rest** (DESIGN.md §13.3) — hairline only. Shadow is for hover and elevated chrome (modals, popovers, the dock).

---

Note: motion values (duration, easing) are NOT tokens here — they live in [`motion.md`](motion.md), kept together as one coherent system.
