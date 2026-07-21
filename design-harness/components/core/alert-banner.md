name: alert-banner
status: draft
version: 1
extends: none
class: Async / data

## Anatomy
There is no single banner primitive. Two full-width, `Card`-based banners exist; both
compose `src/components/ui/Card.tsx` + `Icon` and share the "leading glyph · body column ·
trailing controls" skeleton.

**`src/components/AutomationBanner.tsx`** — active-automation notice on the Batch screen.
- `<Card role="status">` with `!bg-brand-soft/40`, `px-card py-card-tight`,
  `flex items-start gap-3 flex-wrap`.
- Leading chip: `w-7 h-7 rounded-full bg-brand-soft text-brand-deep`, `<Icon name="replay" size={14}>`,
  `aria-hidden`.
- Body: `text-body-sm text-ink` line — bold "Auto-rerun:" + cadence label + scope count +
  `text-ink-3` status list; second line `font-mono tabular-nums text-caption text-ink-3`
  ("Next run …").
- Scope count is a hover target: `underline decoration-dotted underline-offset-2 cursor-help`
  with a per-status `title` + `aria-label` breakdown.
- Trailing: `<Button variant="ghost">` Edit (opens `AutomateModal`) and a bespoke destructive
  button — `h-9 px-control-x rounded-lg text-error-ink hover:bg-error-soft`, transparent
  border — opening a confirm `Modal`.

**`src/components/result/AddressIntegrityBanner.tsx`** — address-integrity notice above the
verdict on the result page.
- `<Card padded>` with inline `background`/`borderColor` from a `TONE` map (CSS vars, not
  Tailwind classes, so the Play CDN doesn't need to emit them).
- Bare leading glyph on the card surface — **no chip behind it** — `<Icon size={20}>` tinted
  to the tone's ink.
- Title `font-sans font-semibold`, `fontSize: var(--text-body)`, tone title colour.
- Dismiss `×` top-right, `<Icon name="x" size={14}>`, `opacity: 0.6`, `aria-label="Dismiss banner"`.
- Disclosure toggle "View details / Hide details" — `text-caption font-medium` with a chevron
  that rotates `180deg` when open.
- Expanded body: lead copy, then a `rounded-md border` comparison block on `var(--surface)` /
  `var(--line)` with two `AddressDiffRow`s (Submitted / Resolved to) — eyebrow label at
  `var(--text-eyebrow)` and ⚠ hardcoded `width: '78px'`, address in `font-mono text-body-sm`
  with suspect characters painted `background: highlightBg; color: white; borderRadius: 2px`
  (⚠ raw values in source) — then the plain-English reasoning paragraph.

## States
This class's state floor does not map cleanly onto either banner — both are presentational
notices driven entirely by props, not by their own fetch.
- populated — the only fully-realised state for both. AutomationBanner: cadence + scope +
  next-run line. AddressIntegrityBanner: compact title + toggle (collapsed is the default;
  expanded adds lead copy, address diff, reasoning). Dismissed → returns `null`.
- loading — partially implemented, AutomationBanner only: `batch.countsPending` swaps the
  scope count for a `text-ink-3` "counts pending" and skips the hover breakdown.
  ⚠ NOT IMPLEMENTED in AddressIntegrityBanner.
- empty — ⚠ NOT IMPLEMENTED in either. Both are rendered conditionally by the parent; an
  absent finding means no banner, not an empty banner.
- error — ⚠ NOT IMPLEMENTED as a banner state. `AddressIntegrityBanner`'s `tampered` variant
  *carries* a risk finding, but that is content, not a component failure state. Neither banner
  has a "this notice failed to load" surface.
- partial — ⚠ NOT IMPLEMENTED. Closest analogue is `countsPending` above.

## Variants
- `AddressIntegrityBanner` — `variant: 'tampered' | 'typo'`, driving the `TONE` map:
  - `tampered` → bg `--risk-soft`, border `--risk`, glyph/title/body `--risk` / `--risk-ink`,
    `icon="warning"`, highlight `--risk`.
  - `typo` → bg `--warn-soft`, border `--warn`, glyph/title/body `--warn-ink`, `icon="info"`,
    highlight `--warn`.
- `AutomationBanner` — no variant prop; a single brand-soft tone.

## Rules
- The integrity finding is **orthogonal** to the verdict: the banner must not lower the
  rental confidence score, and dismissing it must not affect the verdict below
  (`docs/address-integrity-banner-user-story.md` §15, §13).
- Compact by default — no taller than ~3 lines of body text; the evidence is behind
  "View details" so the banner never dominates the page (user story §6, §8).
- Title must read as a notice, not a competing page title — smaller than the page heading
  (user story §7).
- Dismissal is per-page-visit only, never persisted. Local `useState`; remount resets to
  `dismissed = false` (user story §12). The `×` always works even with no `onDismiss` wired.
- Dismissing must not remove the finding from the audit trail (user story §14).
- Reasoning copy is written for a lender — no "homoglyph", no Unicode/codepoint language,
  no character-position enumeration (user story §9).
- Tone must use the `*-soft` / `*-ink` token pairs; bare warning glyph with no chip behind it;
  no gradient (user story §17–18, DESIGN.md §13.3 Pills).
- Sizes come from the type ramp tokens (`--text-eyebrow`, `--text-body-sm`, …), not raw px
  (user story §19).
- AutomationBanner carries `role="status"`; cancelling opens a destructive confirm and must
  state that the current run, if any, will finish.
- ⚠ Keyboard focus: every control is a real `<button>`, but neither banner declares a
  `focus-visible` ring — the `×` and the disclosure toggle rely on browser default.
  The scope-count hover target is a `<span>` with `title` only, so its per-status breakdown
  is unreachable by keyboard (the `aria-label` covers screen readers).
- Mobile: AutomationBanner relies on `flex-wrap` so the Edit/Cancel cluster drops below the
  body. AddressIntegrityBanner has no breakpoint rules; the address block uses `break-all`.

## Revisions
- r1: transcribed from `src/components/AutomationBanner.tsx`,
  `src/components/result/AddressIntegrityBanner.tsx`, and
  `docs/address-integrity-banner-user-story.md` into harness format.
