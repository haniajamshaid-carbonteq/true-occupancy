# True Occupancy — Design System

The design system is defined as CSS custom properties in [src/styles/tokens.css](../src/styles/tokens.css) and mirrored into Tailwind theme values in [tailwind.config.js](../tailwind.config.js). Tokens are the single source of truth — Tailwind utilities resolve to `var(--token)` so any runtime theme change (e.g. the Tweaks panel switching type pairings) flows through automatically.

## How to use

**In CSS / inline styles** — reference the variable directly:
```css
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); }
```

**In Tailwind classes** — use the semantic name:
```html
<div class="bg-surface text-ink-3 rounded-lg shadow-sm">…</div>
```

Both produce identical output. Prefer Tailwind for new components; keep existing semantic class names (`.card`, `.pill`, `.btn`) as-is.

---

## Color

### Surfaces & lines

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--bg` | `#F7F5F0` | `bg-bg` | Page background — warm cream |
| `--surface` | `#FFFFFF` | `bg-surface` | Card / panel background |
| `--surface-2` | `#FBF9F4` | `bg-surface-2` | Tinted surface — sidebar, nested cards |
| `--line` | `#E8E3D8` | `border-line` | Default border / divider |
| `--line-strong` | `#D6CFBF` | `border-line-strong` | Emphasized border — buttons, frames |

### Ink (text) — descending contrast

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--ink` | `#1C1B17` | `text-ink` | Primary body text, headings |
| `--ink-2` | `#45433C` | `text-ink-2` | Secondary text, body copy |
| `--ink-3` | `#76736A` | `text-ink-3` | Tertiary, muted, captions |
| `--ink-4` | `#A19D91` | `text-ink-4` | Placeholder, disabled |

### Brand (teal)

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `--brand` | `#0F8FB8` | `text-brand` / `bg-brand` | Primary accent — buttons, links, highlights |
| `--brand-2` | `#14B5A6` | `bg-brand-2` | Gradient pair (e.g. scan progress) |
| `--brand-soft` | `#E0F4F4` | `bg-brand-soft` | Tinted background for brand pills |
| `--brand-tint` | `#ECF8F8` | `bg-brand-tint` | Lightest wash — active nav item |
| `--brand-deep` | `#0A6E92` | `bg-brand-deep` | Hover / pressed brand |

### Status — clean / warn / risk

Each status has three roles: solid (icons, bars), `-soft` (background), `-ink` (text on soft).

| Status | Solid | Soft | Ink |
|---|---|---|---|
| **Clean** (positive) | `--clean` `#5B8A6A` | `--clean-soft` `#E8F0E5` | `--clean-ink` `#2C4A36` |
| **Warn** (caution) | `--warn` `#C68A3C` | `--warn-soft` `#FBF0DB` | `--warn-ink` `#6B4914` |
| **Risk** (danger) | `--risk` `#C0533C` | `--risk-soft` `#FBE3DB` | `--risk-ink` `#6F2917` |

Tailwind: `bg-clean-soft text-clean-ink`, `bg-risk text-white`, etc.

### Platform brand colors

| Token | Hex | Use |
|---|---|---|
| `--airbnb` | `#FF5A5F` | Airbnb logo background |
| `--vrbo` | `#245ABE` | Vrbo logo background |
| `--fb` | `#1877F2` | Facebook logo background |

---

## Radii

| Token | Value | Tailwind | Typical use |
|---|---|---|---|
| `--r-sm` | `8px` | `rounded-sm` | Buttons, pills, nav items |
| `--r-md` | `12px` | `rounded-md` | Inputs, small cards |
| `--r-lg` | `18px` | `rounded-lg` | Cards, search bar, score card |
| `--r-xl` | `28px` | `rounded-xl` | Hero panels, large surfaces |

Pills use `border-radius: 999px` directly (no token).

---

## Shadows

Layered ink-tinted shadows — never pure black.

| Token | Tailwind | Use |
|---|---|---|
| `--shadow-sm` | `shadow-sm` | Default card lift (search bar, cards, pill list) |
| `--shadow-md` | `shadow-md` | Hovered or focused cards |
| `--shadow-lg` | `shadow-lg` | Modals, popovers, screen frames |

```css
--shadow-sm: 0 1px 2px rgba(28,27,23,.04), 0 1px 1px rgba(28,27,23,.03);
--shadow-md: 0 4px 14px -4px rgba(28,27,23,.08), 0 2px 4px rgba(28,27,23,.04);
--shadow-lg: 0 24px 48px -16px rgba(28,27,23,.12), 0 8px 16px -8px rgba(28,27,23,.06);
```

---

## Typography

### Families

Three semantic roles — `--serif`, `--sans`, `--mono` — that resolve to the active pairing.

- **Serif** — page titles, score numerals, card headings (display)
- **Sans** — body, controls, navigation (UI)
- **Mono** — labels, eyebrows, breadcrumbs, metadata, badges

Tailwind: `font-serif`, `font-sans`, `font-mono`.

### Pairings

Switched at runtime by setting `data-type-pairing` on `<body>`. See [src/styles/typography.css](../src/styles/typography.css).

| Pairing | Serif | Sans | Mono | Voice |
|---|---|---|---|---|
| *default* | Instrument Serif | Geist | Geist Mono | Refined, contemporary |
| `institutional` | IBM Plex Serif | IBM Plex Sans | IBM Plex Mono | Authoritative, trustworthy |
| `editorial-warm` | Newsreader | Inter | JetBrains Mono | Magazine-like, approachable |
| `brand-forward` | Recoleta | General Sans | JetBrains Mono | Distinctive, ownable |

```html
<body data-type-pairing="brand-forward">…</body>
```

To switch in JS:
```js
document.body.dataset.typePairing = 'institutional';
```

### Scale

The system uses a fluid display scale rather than a fixed token set. Recurring sizes from the spec:

| Role | Size / weight / family |
|---|---|
| Hero numeral (score) | 128px / 400 / serif, `letter-spacing: -.04em` |
| Resident verdict | 88px / 400 / serif |
| Spec H1 | 64px / 400 / serif |
| Page title | 40px / 400 / serif |
| Section H2 | 36px / 400 / serif |
| Property title | 32px / 600 / serif |
| Card heading | 20–22px / 400 / serif |
| Spec value (large) | 20px / 600 / sans |
| Body | 14–16px / 400–500 / sans |
| Eyebrow / label | 10.5–12px / 500 / mono, `text-transform: uppercase`, `letter-spacing: .08–.18em` |

---

## Component conventions

These hold across the app — not enforced by tokens, but worth keeping consistent:

- **Cards** — `bg-surface border border-line rounded-lg shadow-sm`
- **Pills** — height 24px, `rounded-full`, mono label, `text-transform: uppercase`. Status variants swap to `{status}-soft` background + `{status}-ink` text.
- **Buttons** — height 36px, `rounded-sm`, `border-line-strong`. Primary swaps to `bg-brand text-white`.
- **Risk hero gradients** — `linear-gradient(180deg, var(--{status}-soft), var(--surface) 80%)`. Used for the score-card hero strip.
- **Eyebrows** — always mono, uppercase, `--ink-3` or `--ink-4`, with letterspacing.
- **Dashed dividers** — `border-top: 1px dashed var(--line)` separates rows inside a card; solid lines separate cards from the page.

---

## Adding a new token

1. Add the variable to `:root` in [src/styles/tokens.css](../src/styles/tokens.css) with semantic naming (what it *means*, not what it *looks like*).
2. Add a matching entry under the appropriate `theme.extend` key in [tailwind.config.js](../tailwind.config.js), pointing at `var(--your-token)`.
3. Document it in the relevant table above.
4. If it's typography-related and varies by pairing, add overrides in [src/styles/typography.css](../src/styles/typography.css).
