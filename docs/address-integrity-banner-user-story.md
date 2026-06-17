# User Story — Address Integrity Banner (tampered address detection) (v1)

## Story

**As a** lender reviewing a TrueOccupancy scan result,
**I want** the system to clearly flag when the address the borrower
submitted looks like it has been deliberately altered — without that
flag getting in the way of the rest of the verdict,
**so that** I can spot a potential fraud signal before relying on the
rental finding, and follow up with the borrower to verify the address
before the loan closes.

## Context

The backend can detect a class of submitted addresses where the input
has been deliberately disguised — for example, by swapping Latin letters
with similar-looking numbers (`O` → `0`, `E` → `3`) or with Cyrillic
homoglyphs. This kind of substitution is rarely the result of typing;
it almost always means someone tried to obscure the property's
identity, often to evade tools like ours.

When this happens, the system resolves the submitted string to its
standard form and runs the scan against that resolved address. The
rental verdict that follows is still a correct read of the resolved
property — but the lender needs to know that **the address they were
given is not the address we scanned**. That's a finding the lender's
risk and fraud workflow needs to see independently, not buried inside
the confidence score.

The banner exists to surface that finding at the top of the result
page, in a form that:

1. Is visually distinct from the rental verdict (so the lender doesn't
   confuse the two findings).
2. Doesn't reduce the rental confidence score (those are orthogonal
   signals — mixing them is hard to defend later).
3. Stays compact by default so it doesn't dominate the page (most of
   the lender's attention should still be on the verdict and the
   listings beneath it).
4. Reveals the full evidence on demand (the submitted-vs-resolved
   comparison and the plain-English reasoning).

## Acceptance criteria

### When the banner appears

1. When the backend flags the submitted address as **tampered** (the
   integrity check returns the "deliberate manipulation" outcome), the
   banner appears at the top of the result page, above the rental
   verdict.
2. The banner appears on every result variant (Likely Rented,
   Possibly Rented, No Public Evidence) — the tampering finding is
   independent of the rental finding.
3. The banner does **not** appear when the backend says the address
   resolved cleanly with no integrity concerns.
4. Typo / low-confidence-input flags are out of scope for v1. Only the
   tampered case triggers a banner.

### Default state (compact)

5. The default state shows: a warning glyph, a one-line title
   (*"Address may have been altered"*), a `View details` toggle, and
   a close (×) control at the top-right.
6. The banner is no taller than three lines of body text in this
   default state — it does not dominate the page.
7. The title font is smaller than the page heading; the banner reads
   as a notice, not a competing title.

### Expanded state

8. Clicking `View details` reveals: the lead copy
   (*"This address looks like it may have been deliberately changed.
   We resolved it to a standard form before scanning — verify with the
   borrower before relying on this result."*), a side-by-side
   submitted-vs-resolved address comparison with the suspect characters
   highlighted, and a plain-English reasoning paragraph that explains
   what was unusual about the submitted form.
9. The reasoning is written for a lender, not an engineer — no
   "homoglyph", no "Unicode codepoint", no position enumeration. The
   reader should understand *what* happened and *what to do*.
10. Clicking `Hide details` returns the banner to the compact default
    state.

### Dismiss behavior

11. The banner has a close (×) control at the top-right. Clicking it
    removes the banner from the current view.
12. Dismissal is **per-page-visit, not persistent**. The next time the
    lender lands on the same result page — including a fresh load,
    a route change-and-return, or a re-navigation from history — the
    banner reappears. We do not remember a dismissal.
13. Dismissing the banner does not affect the rental verdict or
    confidence score below.
14. Dismissing the banner does not remove the finding from the audit
    trail. The tampered-address fact is recorded against the scan
    regardless of whether the lender saw or dismissed the banner in
    the UI.

### Relationship to the rental verdict

15. The rental confidence score below the banner is **unchanged** by
    the integrity finding. The score is the system's reading of the
    resolved address; it does not get penalized because the input was
    altered.
16. The verdict copy ("Likely Rented", etc.) and the supporting
    listings, factor breakdown, and property overview all render as
    normal. They speak to a different question than the banner.

### Visual style

17. Banner uses the risk tone — a soft red-clay background, a darker
    red-clay ink for the title and copy, a bare warning triangle
    glyph (no chip background behind it) in the same red tone.
18. The card matches the design-system `Card` primitive
    (`rounded-lg`, `shadow-sm`, `border border-{tone}`) — no
    gradient.
19. Eyebrows, body, and label sizes use the platform's type ramp
    tokens (`var(--text-eyebrow)`, `--text-body-sm`, etc.) rather than
    hard-coded pixel sizes.

## Out of scope (v1)

- **Typo / unusual input** variant — the banner component supports it
  internally, but only the tampered variant is surfaced to lenders in
  this release. Typos go through the normal scan path with no banner.
- **Dismissal persistence** — we deliberately do not remember a
  dismissal across visits. If the lender wants to suppress the banner
  permanently for a scan they've already reviewed, that's a separate
  feature.
- **PDF certificate treatment** of the integrity finding — handled in
  the [pdf-certificate-spec.md](pdf-certificate-spec.md) update, not
  here.
- **History / audit-trail UI** — out of scope for this story; the data
  is recorded but the surface to browse historical tampering events is
  a separate feature.
- **Multiple integrity findings on one scan** — v1 assumes at most one
  banner per scan. If the backend ever returns multiple distinct
  flags, they collapse into the single banner for now.

## Open questions

1. Should there be a way for the lender to mark a banner as
   **acknowledged** (vs dismissed) so the audit trail captures their
   active review? Probably yes — defer to v2.
2. When the lender exports the PDF certificate, should the banner copy
   appear in the cert? Likely yes — see PDF spec.
3. If the scan was triggered through the API (no UI), how does the
   tampering finding surface to the integrator? Out of scope here,
   but worth tracking.

## Notes

- The banner is a React component, `<AddressIntegrityBanner>`, living
  in `src/components/result/`. It is surfaced today only on
  `/result/tampered`. Production wiring (when the backend integrity
  check goes live) will conditionally render it above
  `<ConfidenceHero>` on every result screen.
- Dismissal uses local React `useState`. Mounting the component
  always starts with `dismissed = false`. Navigating away unmounts the
  component, so the state resets — which is the behavior we want.
