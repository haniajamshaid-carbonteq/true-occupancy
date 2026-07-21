# Voice

Copy rules, terminology, and error-message style. Direction, not values. Loaded when a task involves writing user-facing text.

**Source of truth:** [`docs/DESIGN.md`](../../docs/DESIGN.md) §5 (voice & tone), §4.2 (headline rules), §7 (product naming).

**The editorial filter is one line: _"Decide with certainty."_** Every word is judged against it. If a sentence introduces ambiguity, hedges without evidence, or reaches for generic tech language, revise it.

---

## Tone

Five traits, from DESIGN.md §5. All five apply to product UI copy, not just marketing.

```
Authoritative       — Lead with evidence. State what the product does and what it prevents.
                      No hedging when the outcome is clear.
Problem-first       — Name the pain before offering the solution.
Specific            — Real numbers, real job titles, real scenarios. "80% faster" beats
                      "significantly faster." "VP Underwriting" beats "a customer."
Trustworthy         — Understated confidence. No hyperbole, no marketing superlatives.
Operationally aware — Speak like underwriters, loan officers, compliance teams and
                      commercial bankers. Not like a tech marketer.
```

## Terminology

```
- Product names use the "True" architecture: one compound word, both parts capitalized.
  "TrueOccupancy", never "True Occupancy", "true-occupancy", or "TO".
- First reference in client-facing collateral takes the trademark: TrueOccupancy™.
  The Halcyon wordmark takes ®: Halcyon®. Confirm with legal before publishing new material.
- Never abbreviate a product name. Never use informal shorthand in client-facing copy.
- Verdict language is the product's own: "Rented" / "Possibly rented" / "Not rented".
```

**The verdict-neutrality rule.** A "Rented" finding is not bad news; it is a finding. Depending on what the lender is verifying, any verdict can be the good outcome. Copy must never editorialize a verdict as pass/fail, good/bad, safe/risky, or clean/dirty. This is why the verdict tokens deliberately avoid the green/amber/red ramp (see [`tokens.md`](tokens.md) — colour layer 1). Copy and colour have to hold the same line.

## Error messages

Every error names its cause. None say "something went wrong".

```
- Name the cause and the next action. Not "Scan failed" but what failed and what to do.
- Errors persist until acknowledged. Do not auto-dismiss an error (DESIGN.md §14.7).
- Partial failure is its own state, not an error. If 8 of 10 addresses scanned, say that
  and offer the partial result — do not present it as a failure.
- Form validation errors go inline next to the field, never in the notification dock
  and never in a toast (DESIGN.md §14.9).
```

## Empty states

The two empties read differently:

```
- First-use empty  — onboarding energy, one primary action. The user has done nothing
                     wrong; tell them what this surface will hold once they start a scan.
- No-results empty — neutral, factual. "No matches" plus the means to widen the search
                     (clear filters, change the date range). Never apologetic.
```

## Refusals

Refusals are not errors. Calm, and they name the reason.

```
- State what cannot be done and why, once, without apology-spam.
- Do not offer a workaround the product cannot actually perform.
```

⚠ No refusal surface exists in the codebase today — see `components/core/refusal-block.md`. These rules apply when one is built.

## Capitalization & punctuation

```
- Sentence case for every headline, heading, and button (DESIGN.md §4.2 and §13.2).
  Never title case. Never ALL CAPS for headlines or body.
- Uppercase is permitted ONLY for tracked mono eyebrows and labels
  (--text-eyebrow / --text-micro), where it is a typographic device, not emphasis.
- No trailing periods on labels, buttons, or table headers.
- No exclamation marks.
- Hero headline formula, where one is needed: [Action verb] + [Outcome] + [Context].
  e.g. "Automate self-employed income calculations and eliminate manual work."
```

## Numbers

```
- Every numeric display uses tabular figures (DESIGN.md §13.5).
- Be specific. A count, a percentage, a date — not "several", "recently", "a while ago".
```
