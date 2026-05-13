# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static UI prototype for **True Occupancy** — a short-term-rental compliance scanner (target user: city code-compliance officers like "J. Marlow, Asheville"). It walks through a property scan that returns one of three outcomes (Clean / Questionable / Red Flag), with matched listings across Airbnb, Vrbo, and Facebook Marketplace.

Four HTML entry points share the same component vocabulary, all loading from `src/*.tsx`:

- **`app.html`** — the interactive app prototype. Animates a fake scan, then reveals score + factor breakdown + matched listings.
- **`design-spec.html`** — a multi-screen "design spec" canvas: scaled-down browser-frame mocks of every state of the app, plus token/typography/component reference panels. Used as a Figma-style handoff doc.
- **`states-spec.html`** — state matrix for the new screens (history, scheduled, batch, schedule detail).
- **`components.html`** — component gallery.

The legacy Babel-Standalone `.jsx` prototype (`app.jsx`, `components.jsx`, `data.jsx`, `design-canvas.jsx`, `icons.jsx`, `tweaks-panel.jsx`) now lives in `legacy/` and is not loaded by any HTML host.

## Running

There is no build system, no `package.json`, no bundler. **Just open the HTML file in a browser.**

```bash
open "app.html"            # the app prototype
open "design-spec.html"    # the design spec canvas
open "states-spec.html"    # the state matrix
open "components.html"     # the component gallery
```

React 18, ReactDOM, and Babel Standalone are loaded from `unpkg.com` via `<script>` tags. Each `.tsx` file is loaded with `<script type="text/babel">` and transpiled in the browser. Files that look like ES modules are *not* — they share the global scope.

## Architecture

### Globals, not modules

Every `.tsx` file declares its dependencies as a `/* global ... */` comment at the top and attaches its own exports to the window via plain top-level `const`/`function` declarations. There are no `import`/`export` statements — adding any would break the Babel-Standalone setup.

Load order is enforced by the `<script>` tag order at the bottom of each HTML file. When adding a new TSX file, it must be appended after every file it depends on. See each HTML entry point for its explicit load list.

### The EDITMODE block

Each HTML file has a small JSON config inside a marked block:

```html
<script type="application/json" id="tweak-defaults">
/*EDITMODE-BEGIN*/{ "scenario": "high", ... }/*EDITMODE-END*/
</script>
```

`useTweaks` reads this on boot. The `EDITMODE-BEGIN`/`EDITMODE-END` markers are load-bearing — the host editor uses them to find and rewrite the JSON. Don't remove them; don't reformat the block; don't add anything inside that isn't valid JSON.

### Design tokens

**Source of truth for design:** [docs/DESIGN.md](docs/DESIGN.md) — the active Halcyon 2026 rebrand spec. `docs/design-system.md` is the legacy spec (forest-green / teal-`#0F8FB8` era) and is superseded; do not edit it.

**Brand assets** (PDF, EPS, logo PNGs) live in `docs/brand/`.

Tokens live in `src/styles/tokens.css` + `tailwind.config.js` — the extracted, semantic-named token system, mirrored by the `:root` block in `design-spec.html`. Tailwind utilities (`bg-surface`, `text-ink-3`, etc.) resolve to `var(--token)`. Any inline `<style>` token blocks in HTML hosts should mirror `tokens.css`; see DESIGN.md §10.3 for the migration tracker.

Three type pairings (`institutional` / `editorial-warm` / `brand-forward`) are toggled via `body[data-type-pairing="..."]` selectors in `src/styles/typography.css` and overridden inline in `design-spec.html`. Switching pairings requires the matching Google Fonts to be loaded in the document head.

### Status color convention

Three status palettes — `clean` (green, positive), `warn` (amber, caution), `risk` (red-clay, danger) — each with three roles: solid for icons/bars, `-soft` for backgrounds, `-ink` for text on soft backgrounds. Applied as `bg-{status}-soft text-{status}-ink` (Tailwind) or `.pill.{status}` / `.factor.{pos|neg}` (semantic CSS). Hero gradients use `linear-gradient(180deg, var(--{status}-soft), var(--surface) 80%)`.

### Screen-frame scaling pattern

In `spec-app.jsx`, every preview is rendered at its real `1440px` width inside `.screen-canvas`, then visually scaled with CSS `transform: scale(0.62)`. The wrapping `.screen-frame` is sized to the *visual* dimensions (`1440 * scale + 2`). When changing screen sizes or scale, both the wrapper width *and* the inner `width: 1440` constant need to stay in sync.
