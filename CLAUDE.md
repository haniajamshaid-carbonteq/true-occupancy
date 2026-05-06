# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static UI prototype for **True Occupancy** — a short-term-rental compliance scanner (target user: city code-compliance officers like "J. Marlow, Asheville"). It walks through a property scan that returns one of three outcomes (Clean / Questionable / Red Flag), with matched listings across Airbnb, Vrbo, and Facebook Marketplace.

Two distinct surfaces share the same component vocabulary:

- **`true-occupancy.html`** — the interactive app prototype. Animates a fake scan, then reveals score + factor breakdown + matched listings.
- **`design-spec.html`** — a multi-screen "design spec" canvas: scaled-down browser-frame mocks of every state of the app, plus token/typography/component reference panels. Used as a Figma-style handoff doc.

## Running

There is no build system, no `package.json`, no bundler. **Just open the HTML file in a browser.**

```bash
open "true-occupancy.html"   # the app prototype
open "design-spec.html"      # the design spec canvas
```

React 18, ReactDOM, and Babel Standalone are loaded from `unpkg.com` via `<script>` tags. Each `.jsx` file is loaded with `<script type="text/babel">` and transpiled in the browser. Files that look like ES modules are *not* — they share the global scope.

## Architecture

### Globals, not modules

Every `.jsx` file declares its dependencies as a `/* global ... */` comment at the top and attaches its own exports to the window via plain top-level `const`/`function` declarations. There are no `import`/`export` statements — adding any would break the Babel-Standalone setup.

Load order is enforced by the `<script>` tag order at the bottom of each HTML file:

| HTML | Load order |
|---|---|
| `true-occupancy.html` | `tweaks-panel` → `icons` → `data` → `components` → `app` |
| `design-spec.html` | `tweaks-panel` → `icons` → `data` → `spec-screens` → `spec-app` |

When adding a new JSX file, it must be appended after every file it depends on.

### File roles

- **`data.jsx`** — `PROPERTY`, `PLATFORMS`, and the `SCENARIOS` object (keys `low` / `medium` / `high` mapping to clean / questionable / risk). Every visual variation downstream is driven by this scenario record: score, risk badge, factor breakdown, listings per platform. Also exports `buildScanScript(scenario)` which returns the timed scan-step list that drives `app.jsx`'s animation.
- **`components.jsx`** — production components used by the live app (`Sidebar`, `Topbar`, `PageHead`, `ScanCard`, `ScoreCard`, `WhyCard`, `ListingsPanel`).
- **`spec-screens.jsx`** — `Static*` variants of the same components, frozen to specific scenarios for the design spec (no animation, no state).
- **`app.jsx`** — wires state for the live prototype: drives the scan timeline via `setTimeout` per step, then animates the score numeral with `requestAnimationFrame`.
- **`spec-app.jsx`** — composes the design-spec page: renders each screen inside a 1440-wide canvas scaled down to fit a `screen-frame`, plus token/type/component reference sections.
- **`icons.jsx`** — single `<Ico name="..." />` component, Lucide-style stroked SVGs, lookup by name.
- **`tweaks-panel.jsx`** — generic floating dev panel (`TweaksPanel`, `TweakRadio`, `TweakSlider`, etc.) with a `useTweaks(defaults)` hook. **Speaks a host postMessage protocol** (`__activate_edit_mode` / `__edit_mode_set_keys` / `__edit_mode_dismissed`) so an external editor can rewrite the `EDITMODE-BEGIN` / `EDITMODE-END` JSON block inside the HTML on disk. Don't touch the protocol code unless you understand the host integration.

### The EDITMODE block

Each HTML file has a small JSON config inside a marked block:

```html
<script type="application/json" id="tweak-defaults">
/*EDITMODE-BEGIN*/{ "scenario": "high", ... }/*EDITMODE-END*/
</script>
```

`useTweaks` reads this on boot. The `EDITMODE-BEGIN`/`EDITMODE-END` markers are load-bearing — the host editor uses them to find and rewrite the JSON. Don't remove them; don't reformat the block; don't add anything inside that isn't valid JSON.

### Design tokens

Tokens live in two places and **are currently inconsistent** — be explicit about which set you're touching:

- **`src/styles/tokens.css`** + **`tailwind.config.js`** — the extracted, semantic-named token system. Brand is **teal** (`#0F8FB8`). Mirrors the `:root` block in `design-spec.html`. Tailwind utilities (`bg-surface`, `text-ink-3`, etc.) resolve to `var(--token)`. See `docs/design-system.md`.
- **`true-occupancy.html` `<style>` block** — inline tokens for the live app. Brand here is **forest green** (`#1F3D2E`). The HTML doesn't currently link `tokens.css` or load Tailwind.

If asked to "change the brand color" or similar, clarify which surface is in scope, or change both.

Three type pairings (`institutional` / `editorial-warm` / `brand-forward`) are toggled via `body[data-type-pairing="..."]` selectors in `src/styles/typography.css` and overridden inline in `design-spec.html`. Switching pairings requires the matching Google Fonts to be loaded in the document head.

### Status color convention

Three status palettes — `clean` (green, positive), `warn` (amber, caution), `risk` (red-clay, danger) — each with three roles: solid for icons/bars, `-soft` for backgrounds, `-ink` for text on soft backgrounds. Applied as `bg-{status}-soft text-{status}-ink` (Tailwind) or `.pill.{status}` / `.factor.{pos|neg}` (semantic CSS). Hero gradients use `linear-gradient(180deg, var(--{status}-soft), var(--surface) 80%)`.

### Screen-frame scaling pattern

In `spec-app.jsx`, every preview is rendered at its real `1440px` width inside `.screen-canvas`, then visually scaled with CSS `transform: scale(0.62)`. The wrapping `.screen-frame` is sized to the *visual* dimensions (`1440 * scale + 2`). When changing screen sizes or scale, both the wrapper width *and* the inner `width: 1440` constant need to stay in sync.
