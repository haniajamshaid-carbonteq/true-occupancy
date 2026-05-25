# User Story — Batch automation: re-scan scope & retention

## Story

**As a** code-compliance officer automating a batch of properties,
**I want** to choose which property statuses get re-scanned and what happens
to a property when its status later changes,
**so that** my recurring scans stay focused on the cases I care about without
me having to rebuild the list by hand each cycle.

## Context

When a batch finishes scanning, every property lands in one of three statuses:
**Rented**, **Possibly Rented**, or **Not Rented**. Automating the batch sets
up a recurring re-scan. Two decisions drive the recurring scope:

1. **Which statuses** seed the re-scan set (e.g. only Rented + Possibly Rented).
2. **Retention** — when a property in the set later stops matching those
   statuses, do we keep monitoring it or drop it?
   - **Continue monitoring it** — the property stays in the automation even
     after its status changes (catches cases that go quiet, then come back).
   - **Remove it from automation** — the property drops out of future runs
     once it no longer matches.

Copy is deliberately consequence-first and avoids the terms
"static / dynamic / scope".

## Acceptance criteria

### Creating an automation (batch)
1. The Automate modal shows, in order: **Cadence**, **Which properties to
   re-scan?** (status pills), **If a property no longer matches these
   statuses** (retention cards), and a live **scope summary** card.
2. **Cadence** offers Weekly, Monthly, 3 Months, 6 Months. Default is
   **6 Months**.
3. **Status pills** (Rented / Possibly Rented / Not Rented) are multi-select,
   each showing its count from the latest scan. Default selection is
   **Rented + Possibly Rented**.
4. **Retention** offers two cards — **Continue monitoring it** (default) and
   **Remove it from automation**.
5. The **scope summary** updates live and shows: "Will re-scan X of Y addresses
   {cadence}", a retention note line, and the next-run date.
6. The primary CTA is disabled while **zero** statuses are selected.

### All-statuses rule  ⭐ (the case to include)
7. When **all three** statuses are selected, the **"If a property no longer
   matches these statuses"** section is **hidden**, because every property
   always matches one of the three — nothing can ever stop matching, so the
   whole batch is re-scanned regardless.
8. While hidden, the automation behaves as **Continue monitoring** (the set is
   effectively the entire batch). The scope summary reflects the full batch and
   omits the retention note line.
9. If the user later deselects any status (dropping below all three), the
   retention section **reappears**, restoring the user's previous choice (or
   the default, **Continue monitoring**, if none was made).

### Editing an existing automation
10. Opening edit pre-selects the saved cadence, statuses, and retention.
11. The primary CTA stays disabled until cadence, statuses, **or** retention
    changes (and at least one status remains selected).
12. The all-statuses rule (AC 7–9) applies identically in edit mode.

### Downstream surfaces
13. **Scheduled list** shows the cadence (e.g. "Weekly", "Every 3 months") and
    can be filtered by it.
14. **Schedule detail** shows a **"When status changes"** field reading
    "Keep monitoring" or "Remove from automation" (batch only).
15. The **batch automation banner** and the **Automate control** reflect the
    saved cadence.

### Single-property automations
16. Single-property automations show **cadence only** — no status pills and no
    retention section (their scope is implicitly that one address).

## Out of scope
- Re-scanning properties **outside** the original batch (no new addresses are
  ever pulled in; the set can only stay the same or shrink).
- Per-property overrides of the retention rule.

## Notes
- AC 7–9 (the all-statuses rule) is **not yet implemented** — the retention
  section currently always renders for batches. See
  `src/components/AutomateModal.tsx`.
