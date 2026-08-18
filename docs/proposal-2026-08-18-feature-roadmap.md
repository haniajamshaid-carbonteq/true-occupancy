# True Occupancy — Feature Proposal: Deepening Occupancy-Fraud Detection

**For discussion with Halcyon · August 18, 2026 · Carbonteq**
**Status: proposal only — nothing here is committed until agreed.**

---

## Why now

The current release lands the agreed scope: intended-occupancy everywhere, the reconciliation matrix, confidence nomenclature, the AI occupancy report with auto-run-on-red, and portfolio automation. Production has report freshness, the red auto-schedule rule, and per-intent report variants in flight.

That closes the "detect and reconcile" chapter. This proposal is the next chapter: **making the evidence harder to beat, and making the product speak lender language end-to-end.**

**Market framing.** Two kinds of products exist around us. Data-score vendors (CoreLogic LoanSafe, FraudGuard, DataVerify) score occupancy risk from records — credit headers, tax data — but never produce live listing evidence. STR-compliance vendors (Host Compliance/Granicus, Deckard, Harmari) capture listings for cities but don't speak to lenders at all. **True Occupancy's wedge is being the only lender-facing product whose evidence is the listing itself.** Every feature below deepens that wedge.

---

## Theme 1 — Evidence depth: make the scan harder to beat

### 1.1 Listing history lookback — "was it *ever* listed?" ⭐ recommended starter
Today a scan answers *is this property listed right now*. The obvious evasion is to **delist before closing and relist after**. A historical archive turns the scan into a timeline:

> "Listed 14 of the last 24 months across Airbnb + Vrbo. Delisted 9 days before the application date."

That single sentence is the most damning evidence the product could produce, and STR-compliance vendors have proven historical capture is feasible. Builds on the existing scan engine and run-history model.
**Effort: M–L** (capture/archive infrastructure). **Needs:** decision on lookback depth + storage.

### 1.2 Review-timeline mining
Guest reviews are timestamped, third-party proof of occupancy ("stayed here in March"). Mining review dates converts a listing match into a **rental activity timeline** printed on the certificate — evidence a borrower cannot explain away as a stale listing.
**Effort: M.** Builds on the existing listing-match pipeline and certificate.

### 1.3 Reverse occupancy fraud mode
The mirror scheme: a borrower declares *Rental / investment* to qualify with phantom rental income — but the property shows **no rental evidence and strong owner-occupancy signals**. Our matrix already treats `Rental + Not rented` as Inconclusive ("absent expected income"); this makes it a first-class detection story with its own indicator set.
**Effort: M.** Builds on the reconciliation matrix as shipped.

### 1.4 Public-record cross-checks
Homestead exemption is already a scoring factor. Natural extensions: **tax-bill mailing address ≠ subject address**, **USPS change-of-address**, **insurance policy type** (landlord vs homeowner). Each is a strong occupancy signal the data-score vendors rely on — combined with listing evidence, stronger than either alone.
**Effort: depends on data partnerships** — proposal is to pick one source and pilot it.

### 1.5 Platform expansion
Booking.com, Furnished Finder (mid-term), and long-term-rental surfaces (Zillow, Apartments.com, Craigslist). Occupancy fraud is not only short-term rental fraud.
**Effort: M per platform.** Prioritise by observed evasion patterns.

---

## Theme 2 — Lender workflow: where the value is realised

### 2.1 Evidence package — repurchase-defense export ⭐ recommended starter
A one-click, **timestamped and hashed evidence bundle**: listing captures, match factors, scan configuration version, run history. Purpose-built for a GSE repurchase dispute — the moment a lender most needs us. We already version every scan's configuration; this productises it.
**Effort: S–M.** Builds on the certificate and stored run data.

### 2.2 Post-close seasoning watch ⭐ recommended starter
A purpose-built mode of existing automation: monitor a closed loan through its **12-month owner-occupancy covenant window** and alert the moment a listing appears. Together with the point-in-time certificate at closing, this completes the lender story: *verify at closing, watch the covenant, alert on breach*.
**Effort: S–M.** Reuses schedules/automation as shipped; adds the covenant framing, alerting, and an end-of-window summary.

### 2.3 Case management on the Needs-review queue
Assign an analyst, attach notes, disposition the case (**confirmed / false positive**), keep the audit trail. Turns the red queue from a list into a workflow — and dispositions become training data for 2.4.
**Effort: M.**

### 2.4 Per-lender calibration loop
Analyst dispositions feed back into per-org thresholds — "every mortgage lender is a unique and beautiful snowflake" made operational. Revives the org-level threshold administration discussed in July, now with a data-driven reason to exist.
**Effort: M–L.** Depends on 2.3.

---

## Theme 3 — Portfolio intelligence: the longer play

### 3.1 Host identity graph
The same host or LLC operating multiple flagged properties; borrower-name ↔ host-name matching. Catches **serial operators**, not just single addresses — a portfolio-level signal no single-scan product offers.
**Effort: L.**

### 3.2 Originator / broker anomaly analytics
Fraud-rate analytics by channel and geography. A broker whose loans keep reconciling red is itself a signal. This is consortium-style intelligence the listing-scanner competitors cannot produce.
**Effort: L.** Needs volume before it's meaningful — a roadmap marker, not a next sprint.

---

## Recommended sequence

| Priority | Feature | Why first |
|---|---|---|
| 1 | **1.1 Listing history lookback** | Highest-value evidence; directly counters the standard evasion |
| 2 | **2.2 Post-close seasoning watch** | Completes the lender story on existing automation — smallest lift |
| 3 | **2.1 Evidence package export** | Monetises trust at the lender's moment of greatest need |
| then | 1.2 → 2.3 → 1.3 | Each builds on the one before |

All three starters build on shipped foundations and require **no unproven data source**.

## Questions for Halcyon

1. Lookback depth for listing history — 12, 24, or 36 months? Storage/pricing implications.
2. Seasoning watch — is the 12-month covenant window the right default, and is it a per-loan or per-portfolio purchase?
3. Data partnerships (1.4) — appetite and preferred first source (USPS, tax records, insurance)?
4. Does the evidence package need any specific format for GSE repurchase submissions?
5. Pricing fit with the scaled-cost model — which of these are premium add-ons vs core?

---

*Effort labels are prototype-informed sizing for discussion, not production estimates — those belong to the engineering team after scoping.*
