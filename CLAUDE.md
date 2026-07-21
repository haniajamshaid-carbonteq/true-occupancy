# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Design work: read the harness first

**Any task that touches UI — a component, a screen, a token, a style — starts by reading [design-harness/design-harness.md](design-harness/design-harness.md).** It is one page: a decision map routing to the right file, the operating rules, and the creation gate. Everything longer sits behind it and loads only when the map points there.

Do not design from `docs/DESIGN.md` directly. That is the brand source of truth and the harness routes to the right part of it; reading it cold means reading 550 lines to find 3.

### The creation gate — applies even if you never open the harness

**Claude builds from the system. Only humans change the system.**

Building from registered components, tokens, hypertokens and motion is always allowed. Anything canonical changes only when the person explicitly asks.

- Every element maps to a registered component, or composes registered ones.
- Every visual value maps to a token. **No hardcoded values.**
- Every animation maps to registered motion, by token name.

If nothing fits:

1. **STOP.** Do not improvise an unregistered component, token, or motion value.
2. **Name the gap** — what's needed, why nothing fits, the closest existing thing, the delta required.
3. **Wait.** Only an explicit "yes, create it" / "extend X" lets you proceed.

Check the extensions index (harness §7) before ever saying "nothing fits" — several real components are registered there as candidates.

### Things that will bite you

- **Adding a token is a three-file operation:** `src/styles/tokens.css` (the value) → `src/styles/tailwind-config.js` (the runtime utility binding, shared by all 7 HTML hosts) → `tailwind.config.js` (the tooling mirror). Miss the second and the utility silently resolves to nothing.
- **Adding a component means editing every HTML host that renders it.** There is no bundler; each host has a `files` array in dependency order, and a component missing from it is `undefined` at runtime.
- **Four known DESIGN.md ↔ code conflicts are recorded, not resolved** (card radius/shadow, table hover tint, KPI tile borders, side-nav brand strip). Do not silently "fix" either side — they are the owner's call.
- **Three colour layers are deliberately distinct:** verdict tones (categorical, non-judgemental) ≠ status clean/warn/risk ≠ state success/warning/error. Conflating them is the most common way to get this system wrong.
- **Verdict neutrality:** Rented / Possibly rented / Not rented are findings, not verdicts of good or bad. Never colour or word them as pass/fail.

`design-harness/VIABILITY.md` tracks what is missing and what to do next.

---

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

Load order is enforced by a `files` array near the bottom of each HTML host, fetched and Babel-compiled in sequence. When adding a TSX file, insert it into **every host that renders it**, above every file that depends on it.

**A component missing from a host's `files` array is `undefined` at runtime and its consumer throws** — there is no bundler to catch it, and the failure shows up as a React error boundary, not a build error. This is a real bug class here: `design-spec.html` was missing `ReferenceCell` and `SavedSnapshotDrawer`, so its result screens threw for some time before anyone noticed.

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

Tokens live in `src/styles/tokens.css` — the extracted, semantic-named token system. Tailwind utilities (`bg-surface`, `text-ink-3`, etc.) resolve to `var(--token)` via **[src/styles/tailwind-config.js](src/styles/tailwind-config.js), the single runtime config loaded by all 7 HTML hosts.** `tailwind.config.js` at the repo root is a tooling/IntelliSense mirror only and is *not* loaded at runtime — keep the two in sync.

> This config used to be copy-pasted inline into each host and had drifted badly: `navy` existed in one host, `verdict-*` in four, `hover-bg` in six. `text-navy` and `bg-hover-bg` silently resolved to nothing depending on which page you opened, which is why raw hex kept getting written into components. Do not reintroduce a per-host config block.

`design-spec.html` also mirrors the `:root` block inline; see DESIGN.md §10.3 for the migration tracker. `design-harness/references/tokens.md` indexes every token with its role.

Three type pairings (`institutional` / `editorial-warm` / `brand-forward`) are toggled via `body[data-type-pairing="..."]` selectors in `src/styles/typography.css` and overridden inline in `design-spec.html`. Switching pairings requires the matching Google Fonts to be loaded in the document head.

### Status color convention

Three status palettes — `clean` (green, positive), `warn` (amber, caution), `risk` (red-clay, danger) — each with three roles: solid for icons/bars, `-soft` for backgrounds, `-ink` for text on soft backgrounds. Applied as `bg-{status}-soft text-{status}-ink` (Tailwind) or `.pill.{status}` / `.factor.{pos|neg}` (semantic CSS). Hero gradients use `linear-gradient(180deg, var(--{status}-soft), var(--surface) 80%)`.

### Screen-frame scaling pattern

In `spec-app.jsx`, every preview is rendered at its real `1440px` width inside `.screen-canvas`, then visually scaled with CSS `transform: scale(0.62)`. The wrapping `.screen-frame` is sized to the *visual* dimensions (`1440 * scale + 2`). When changing screen sizes or scale, both the wrapper width *and* the inner `width: 1440` constant need to stay in sync.
