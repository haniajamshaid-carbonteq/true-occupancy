# Em-dash sweep: every user-facing string, with its replacement

Companion to Trello **#70**. The em dash (`—`) had become the house connector in product copy, joining two half-thoughts where a full stop, a comma or a rewritten clause belongs. This is the complete inventory of what changed in the prototype, screen by screen, so the same edits can be made in production without re-deriving them.

Prototype baseline: commit `eeed560`. Line numbers are pre-change. 84 strings across 34 surfaces.

## Deliberately left alone

- **A bare `—` standing for "no value"** in a table cell: empty Reference, no verdict yet, counts still pending, a cancelled schedule's next run, `— / 24` scope counts. Standard table convention, not a sentence. ~20 instances.
- **`—` as a range glyph** between two inputs: History date filter, Scan configuration bands, DateRangePicker.
- **Mock third-party listing titles** in seed data ("Charming Mountain Retreat near Blue Ridge — Hot Tub & Fire Pit" and three others). Those imitate real Airbnb / Vrbo / Facebook titles, which is not our voice.
- **The design-spec canvases** (`src/spec/*`, rendered by `design-spec.html` and `states-spec.html`). Internal handoff prose, ~30 further instances. Say the word and they get the same pass.

> **One footnote on `ScanConfigScreen.tsx:443`.** That paragraph sits inside the
> confidence-thresholds card that ticket **#67** re-instates, so its rewrite rides
> along with that ticket's commit rather than the sweep commit. The before/after
> below is still the change to make.

## The changes

### Automate control (result top bar)

`src/components/AutomationControl.tsx:191`

```
- aria-label={`Automated ${cadenceLabel(cadence)} — open menu`}
+ aria-label={`Automated ${cadenceLabel(cadence)}, open menu`}
```

### Automate modal

`src/components/AutomateModal.tsx:94`

```
- hint: 'Once added, the property stays in the automation — even if its status changes later.',
+ hint: 'Once added, the property stays in the automation even if its status changes later.',
```

`src/components/AutomateModal.tsx:313`

```
- organisation&rsquo;s setting — change it only if these properties are
- a different kind.
+ organisation&rsquo;s setting. Change it only if these properties are a
+ different kind.
```

### Automate modal - scope card

`src/components/AutomationScopeCard.tsx:90`

```
- Pick at least one status to include — otherwise nothing will be rescanned.
+ Pick at least one status to include, or nothing will be rescanned.
```

`src/components/AutomationScopeCard.tsx:104`

```
- Address counts pending — first scan is still running. We'll apply this scope
+ Address counts are pending while the first scan runs. We'll apply this scope
```

### Batch - AI report scope picker

`src/components/StatusPillSelector.tsx:117`

```
- title="Flagged red — reconciles to Needs review under the declared occupancy."
+ title="Flagged red because it reconciles to Needs review under the declared occupancy."
```

### Batch - reconciliation tiles

`src/components/VerdictTiles.tsx:103`

```
- ? `Your occupancy config labels this result combination — ${joinLabels(
+ ? `Your occupancy config labels ${joinLabels(
```

`src/components/VerdictTiles.tsx:105`

```
- )} — for automated re-scans, so running automation across these categories is recommended.`
+ )} results for automated re-scans, so running automation across these categories is recommended.`
```

### Batch Upload

`src/pages/BatchScreen.tsx:975`

```
- any combination. Reports run on completed scans only — rows that
+ any combination. Reports run on completed scans only. Rows that
```

### Command search (Cmd-K)

`src/components/ui/CommandSearch.tsx:34`

```
- 'Try a parcel ID — e.g. 9648-92-3271-00000…',
- 'Or geocoded coords — 35.5951, -82.5515…',
+ 'Try a parcel ID like 9648-92-3271-00000…',
+ 'Or geocoded coords like 35.5951, -82.5515…',
```

### Component gallery (internal)

`src/pages/Components.tsx:122`

```
- { token: 'text-body',    px: 16, use: 'Body lead',                   sample: 'One address — every public listing within a mile.' },
+ { token: 'text-body',    px: 16, use: 'Body lead',                   sample: 'One address. Every public listing within a mile.' },
```

### Configuration - Scan configuration

`src/pages/ScanConfigScreen.tsx:443`

```
- These bands decide the verdict. What each verdict then <em>means</em> — given what
- was declared — is the outcome matrix below.
+ These bands decide the verdict. The outcome matrix below decides what each verdict
+ then <em>means</em>, given what was declared.
```

`src/pages/ScanConfigScreen.tsx:479`

```
- label={`If ${(MATRIX_HEADER_LABEL[v] ?? OCC_VERDICT_LABEL[v]).toLowerCase()} — treat as`}
+ label={`If ${(MATRIX_HEADER_LABEL[v] ?? OCC_VERDICT_LABEL[v]).toLowerCase()}, treat as`}
```

`src/pages/ScanConfigScreen.tsx:507`

```
- description="Any address that comes back red — from a single scan, or found inside a batch — automatically gets the deeper AI report. Everything else stays on demand. Off by default: the report costs more per property, so it's reserved for red."
+ description="Any address that comes back red, whether from a single scan or inside a batch, automatically gets the deeper AI report. Everything else stays on demand. Off by default: the report costs more per property, so it's reserved for red."
```

`src/pages/ScanConfigScreen.tsx:591`

```
- Applies org-wide. 30 minutes is typical — set whatever your policy requires.
+ Applies org-wide. 30 minutes is typical, but set whatever your policy requires.
```

### Dashboard (home)

`src/pages/HomeScreen.tsx:89`

```
- { id: 'c4', address: '88 Cumberland Ave, Asheville, NC 28801', from: 'high',   to: 'low',  detail: 'All matched listings removed — case can be closed',    detectedAgo: '6 d ago' },
+ { id: 'c4', address: '88 Cumberland Ave, Asheville, NC 28801', from: 'high',   to: 'low',  detail: 'All matched listings removed, so the case can be closed',    detectedAgo: '6 d ago' },
```

### History

`src/pages/HistoryScreen.tsx:229`

```
- Every scan you've run — searchable, filterable, click any row to reopen the case.
+ Every scan you've run, searchable and filterable. Click any row to reopen it.
```

### Notification dock - pill

`src/components/notification/NotificationPill.tsx:232`

```
- ? `${single.title}${single.meta ? ` — ${single.meta}` : ''}`
+ ? `${single.title}${single.meta ? `. ${single.meta}` : ''}`
```

### Notification dock - row

`src/components/notification/NotificationRow.tsx:176`

```
- aria-label={`${notif.title}${notif.meta ? ` — ${notif.meta}` : ''}`}
+ aria-label={`${notif.title}${notif.meta ? `. ${notif.meta}` : ''}`}
```

### PDF certificate

`src/components/result/CertificateSheet.tsx:315`

```
- + {remaining} additional listing{remaining === 1 ? '' : 's'} — see live report at
+ + {remaining} additional listing{remaining === 1 ? '' : 's'}. See the live report at
```

`src/components/result/CertificateSheet.tsx:607`

```
- aria-label={`Listing screenshot — captured ${capturedAt}`}
+ aria-label={`Listing screenshot captured ${capturedAt}`}
```

`src/components/result/CertificateSheet.tsx:622`

```
- Listing screenshot — captured {capturedAt}
+ Listing screenshot captured {capturedAt}
```

### Red property drawer

`src/components/red/RedPropertyDrawer.tsx:105`

```
- The property stays red. Only the recurring scan stops — you will not
- be re-checked on this address until you start it again.
+ The property stays red. Only the recurring scan stops. You will not be
+ re-checked on this address until you start it again.
```

`src/components/red/RedPropertyDrawer.tsx:255`

```
- : `Re-scanned ${String(OCC_CADENCE_LABEL[p.recurring ?? 'none']).toLowerCase()} because it's flagged red — not a schedule you set up.`}
+ : `Re-scanned ${String(OCC_CADENCE_LABEL[p.recurring ?? 'none']).toLowerCase()} because it's flagged red, not because of a schedule you set up.`}
```

### Red-flag filter (History / Scheduled / batch)

`src/pages/RedAddressesScreen.tsx:265`

```
- if (!rec) return 'Flagged red — contradicts declared occupancy. Set by your occupancy rules (Config).';
+ if (!rec) return 'Flagged red because it contradicts the declared occupancy. Set by your occupancy rules (Config).';
```

`src/pages/RedAddressesScreen.tsx:270`

```
- return `Declared ${declared}, but the scan found it ${found} — flagged Red by your occupancy rules (Config).`;
+ return `Declared ${declared}, but the scan found it ${found}, so your occupancy rules flag it Red (Config).`;
```

`src/pages/RedAddressesScreen.tsx:327`

```
- title={`${title} — view them`}
+ title={`${title}, view them`}
```

`src/pages/RedAddressesScreen.tsx:361`

```
- aria-label={active ? 'Showing red flags only — click to show all' : `Show only the ${count} red flags`}
+ aria-label={active ? 'Showing red flags only. Click to show all.' : `Show only the ${count} red flags`}
```

`src/pages/RedAddressesScreen.tsx:392`

```
- Show only red flags — properties whose scan contradicts the declared occupancy.
+ Show only the properties whose scan contradicts the declared occupancy.
```

### Reference cell (History / result)

`src/components/ReferenceCell.tsx:98`

```
- title={`Edit reference — ${value}`}
+ title={`Edit reference ${value}`}
```

### Result - AI occupancy report

`src/components/result/AIInvestigator.tsx:1023`

```
- Open questions that limit confidence — not findings on their own.
+ Open questions that limit confidence. They are not findings on their own.
```

### Result - Property Listings

`src/components/result/ListingsPanel.tsx:104`

```
- disabledLabel = 'Snapshot still capturing — check back in a moment',
+ disabledLabel = 'Snapshot still capturing. Check back in a moment.',
```

`src/components/result/ListingsPanel.tsx:312`

```
- value: l.beds ?? '— n/a',
+ value: l.beds ?? 'n/a',
```

`src/components/result/ListingsPanel.tsx:327`

```
- value: l.baths ?? '— n/a',
+ value: l.baths ?? 'n/a',
```

`src/components/result/ListingsPanel.tsx:342`

```
- if (!l.sqft) return { value: '— n/a', kind: 'warn', sub: 'not disclosed' };
+ if (!l.sqft) return { value: 'n/a', kind: 'warn', sub: 'not disclosed' };
```

`src/components/result/ListingsPanel.tsx:360`

```
- value: typeof l.host.fuzzyMatchPct === 'number' ? `${l.host.fuzzyMatchPct}%` : '— n/a',
+ value: typeof l.host.fuzzyMatchPct === 'number' ? `${l.host.fuzzyMatchPct}%` : 'n/a',
```

`src/components/result/ListingsPanel.tsx:381`

```
- : '— n/a',
+ : 'n/a',
```

`src/components/result/ListingsPanel.tsx:564`

```
- label={`View snapshot — ${l.title}`}
+ label={`View snapshot of ${l.title}`}
```

`src/components/result/ListingsPanel.tsx:806`

```
- label={`View snapshot — ${l.title}`}
+ label={`View snapshot of ${l.title}`}
```

`src/components/result/ListingsPanel.tsx:977`

```
- 1.0&nbsp;mi radius — nothing matched the property's address
+ 1.0&nbsp;mi radius. Nothing matched the property's address
```

`src/components/result/ListingsPanel.tsx:1156`

```
- label={`View snapshot — ${r.title}`}
+ label={`View snapshot of ${r.title}`}
```

### Result - Timeline flyout

`src/components/result/PropertyTimelineDrawer.tsx:48`

```
- Showing the property&rsquo;s full history up to today — including scans newer than the{' '}
+ Showing the property&rsquo;s full history up to today, including scans newer than the{' '}
```

`src/components/result/PropertyTimelineDrawer.tsx:178`

```
- {modal ? `most often — ${modal.count} of ${runs.length}` : 'no reconciled runs'}
+ {modal ? `most often (${modal.count} of ${runs.length})` : 'no reconciled runs'}
```

### Result - address-integrity banner

`src/components/result/AddressIntegrityBanner.tsx:70`

```
- 'This address looks like it may have been deliberately changed. We resolved it to a standard form before scanning — verify with the borrower before relying on this result.',
+ 'This address looks like it may have been deliberately changed. We resolved it to a standard form before scanning. Verify with the borrower before relying on this result.',
```

`src/components/result/AddressIntegrityBanner.tsx:72`

```
- 'This address appears to contain a typo. We scanned the closest standard match — please confirm with the borrower.',
+ 'This address appears to contain a typo. We scanned the closest standard match. Please confirm with the borrower.',
```

### Result - hero

`src/components/result/ConfidenceHero.tsx:390`

```
- return 'The finding contradicts the intended occupancy — worth a human review.';
+ return 'The finding contradicts the intended occupancy, so it is worth a human review.';
```

`src/components/result/ConfidenceHero.tsx:668`

```
- ? 'No baseline to reconcile — the score is the observed rental likelihood.'
+ ? 'No baseline to reconcile, so the score is the observed rental likelihood.'
```

`src/components/result/ConfidenceHero.tsx:732`

```
- <>{' '}— on{' '}</>
+ <>{' '}on{' '}</>
```

`src/components/result/ConfidenceHero.tsx:734`

```
- <>The result was the same on the last scan — on{' '}</>
+ <>The result was the same on the last scan on{' '}</>
```

`src/components/result/ConfidenceHero.tsx:757`

```
- Earlier scans with this same result —{' '}
- {priorRecentFirst.length} of {addressScanCount} (
+ Earlier scans with this same result (
+ {priorRecentFirst.length} of {addressScanCount},{' '}
```

`src/components/result/ConfidenceHero.tsx:778`

```
- {' — '}
+ {': '}
```

### Result - saved-snapshot flyout

`src/components/result/SavedSnapshotDrawer.tsx:213`

```
- aria-label={`Listing screenshot — captured ${capturedAt}`}
+ aria-label={`Listing screenshot captured ${capturedAt}`}
```

### Result - tampered address

`src/pages/ResultTamperedScreen.tsx:14`

```
- "Letters in this address were swapped with numbers that look similar — a 0 (zero) where O should be in 'Northwest', and 3 (three) where E should be in 'Albuquerque'. Typos rarely look like this; it usually means the address was disguised on purpose.",
+ "Letters in this address were swapped with numbers that look similar: a 0 (zero) where O should be in 'Northwest', and 3 (three) where E should be in 'Albuquerque'. Typos rarely look like this; it usually means the address was disguised on purpose.",
```

### Result - top bar

`src/components/ScanContextBar.tsx:177`

```
- title="Property timeline — every scan of this address"
+ title="Property timeline for this address"
```

### Run history (result + batch detail)

`src/components/RunHistory.tsx:41`

```
- title={auto ? 'Automated run — triggered by the schedule on this property' : undefined}
+ title={auto ? 'Automated run started by the schedule on this property' : undefined}
```

### Scan intake (intended occupancy)

`src/components/scan/ScanIntentHero.tsx:107`

```
- msg = "No baseline declared — we'll report what the scan finds.";
+ msg = "No baseline declared, so we'll report what the scan finds.";
```

`src/components/scan/ScanIntentHero.tsx:161`

```
- What the loan or policy says this property should be — the scan is compared against it.
+ What the loan or policy says this property should be. The scan is compared against it.
```

`src/components/scan/ScanIntentHero.tsx:200`

```
- Scanning — reconciling against{' '}
+ Scanning and reconciling against{' '}
```

### Schedule detail

`src/pages/ScheduleDetailScreen.tsx:365`

```
- value={s.kind === 'mixed' ? `Mixed — ${batchIntentBreakdown(s)}` : OCC_INTENT_LABEL[s.intent]}
+ value={s.kind === 'mixed' ? `Mixed (${batchIntentBreakdown(s)})` : OCC_INTENT_LABEL[s.intent]}
```

`src/pages/ScheduleDetailScreen.tsx:399`

```
- {redInSchedule === 1 ? 'is' : 'are'} flagged red — the scan
+ {redInSchedule === 1 ? 'is' : 'are'} flagged red because the scan
```

`src/pages/ScheduleDetailScreen.tsx:443`

```
- No runs recorded yet — the next scan will appear here on{' '}
+ No runs recorded yet. The next scan will appear here on{' '}
```

### Scheduled (list)

`src/pages/ScheduledScreen.tsx:380`

```
- message="Schedule a recurring scan from any property or batch — they'll show up here."
+ message="Schedule a recurring scan from any property or batch, and it will show up here."
```

### Seed data - AI occupancy report body

`src/data/aiInvestigation.tsx:141`

```
- 'Sheila Shankle is tagged as unrelated but carries a homeowner flag — at odds with a single-owner home.',
+ 'Sheila Shankle is tagged as unrelated but carries a homeowner flag, which is at odds with a single-owner home.',
```

`src/data/aiInvestigation.tsx:149`

```
- '‘Jerahmy’ and ‘Jerehmy’ Winkfield appear across sources — a spelling variant of one person, not two occupants.',
+ '‘Jerahmy’ and ‘Jerehmy’ Winkfield appear across sources as a spelling variant of one person, not two occupants.',
```

`src/data/aiInvestigation.tsx:157`

```
- 'The rental listing is dated April 2026 — a future date with no corroboration elsewhere.',
+ 'The rental listing is dated April 2026, a future date with no corroboration elsewhere.',
```

`src/data/aiInvestigation.tsx:168`

```
- '1552 Samara Glen Way is a single-family home (3 bed / 1 bath, built 1983), classified residential on the tax record, with one active lien of $83,000 against an estimated $128,400 value — roughly 65% equity. There is no foreclosure code or distress marker, and the owner holds only this one residential property, a non-portfolio profile. This frames the other occupancy signals as consistent with either owner-occupancy or rental use, without ruling either out.',
+ '1552 Samara Glen Way is a single-family home (3 bed / 1 bath, built 1983), classified residential on the tax record, with one active lien of $83,000 against an estimated $128,400 value, roughly 65% equity. There is no foreclosure code or distress marker, and the owner holds only this one residential property, a non-portfolio profile. This frames the other occupancy signals as consistent with either owner-occupancy or rental use, without ruling either out.',
```

`src/data/aiInvestigation.tsx:177`

```
- 'Tax owner Jerahmy Winkfield is corroborated at the property through tax, base (10-year residence), trace and utility records — yet the tax mailing address (209 Falcon Dr, Versailles) diverges from the property. At the same time, Donald Cain appears in four loan records (one coded as a renter) and Sheila Shankle shows a 7-year base residence, both unrelated to the owner. Strong owner presence coexisting with unrelated-occupant evidence is what produces the occupancy-risk profile here.',
+ 'Tax owner Jerahmy Winkfield is corroborated at the property through tax, base (10-year residence), trace and utility records, yet the tax mailing address (209 Falcon Dr, Versailles) diverges from the property. At the same time, Donald Cain appears in four loan records (one coded as a renter) and Sheila Shankle shows a 7-year base residence, both unrelated to the owner. Strong owner presence coexisting with unrelated-occupant evidence is what produces the occupancy-risk profile here.',
```

`src/data/aiInvestigation.tsx:186`

```
- 'Two utility accounts run under James Fairchild, a non-owner, and one under the owner; trace records add Sheila Shankle. The owner’s mailing divergence points to absentee status. The limitation is timing: the utility and trace records lack service dates, so current occupancy can’t be established — the non-owner presence is suggestive but not anchored to any period.',
+ 'Two utility accounts run under James Fairchild, a non-owner, and one under the owner; trace records add Sheila Shankle. The owner’s mailing divergence points to absentee status. The limitation is timing: the utility and trace records lack service dates, so current occupancy can’t be established. The non-owner presence is suggestive but not anchored to any period.',
```

`src/data/aiInvestigation.tsx:193`

```
- takeaway: 'No tenure mismatch — the loan records don’t explicitly claim ownership or renting.',
+ takeaway: 'No tenure mismatch. The loan records don’t explicitly claim ownership or renting.',
```

`src/data/aiInvestigation.tsx:202`

```
- takeaway: 'A single-property owner with strong on-site presence — no portfolio risk.',
+ takeaway: 'A single-property owner with strong on-site presence and no portfolio risk.',
```

`src/data/aiInvestigation.tsx:204`

```
- 'The owner holds only one residential liened property, so the portfolio comparison does not apply. Owner presence at the property is strong — a base residence with 10-year length, plus tax and trace records — while the mailing address has no independent presence evidence of its own. This is a single-property scenario with robust owner presence, not a portfolio pattern.',
+ 'The owner holds only one residential liened property, so the portfolio comparison does not apply. Owner presence at the property is strong, resting on a base residence with 10-year length plus tax and trace records, while the mailing address has no independent presence evidence of its own. This is a single-property scenario with robust owner presence, not a portfolio pattern.',
```

### Seed data - batch row errors + schedule hover fact

`src/state/AppState.tsx:67`

```
- return entry.endReason ? `${line} — ${entry.endReason}` : line;
+ return entry.endReason ? `${line}. ${entry.endReason}` : line;
```

`src/state/AppState.tsx:435`

```
- { id: 2, address: '301 Merrimon Ave, Asheville, NC 28804',    status: 'failed', errorReason: 'Geocoder timeout — retry later' },
+ { id: 2, address: '301 Merrimon Ave, Asheville, NC 28804',    status: 'failed', errorReason: 'Geocoder timed out. Retry later.' },
```

`src/state/AppState.tsx:446`

```
- { id: 1, address: '988 Riverside Dr, Asheville, NC 28801', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
- { id: 2, address: '12 Birch Hollow Ln, Asheville, NC 28804', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
- { id: 3, address: '77 Aston Park Ct, Asheville, NC 28805',  status: 'failed', errorReason: 'Geocoder timeout — retry later' },
- { id: 4, address: '301 Sweeten Creek Rd, Asheville, NC 28803', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
+ { id: 1, address: '988 Riverside Dr, Asheville, NC 28801', status: 'failed', errorReason: 'Geocoder timed out. Retry later.' },
+ { id: 2, address: '12 Birch Hollow Ln, Asheville, NC 28804', status: 'failed', errorReason: 'Geocoder timed out. Retry later.' },
+ { id: 3, address: '77 Aston Park Ct, Asheville, NC 28805',  status: 'failed', errorReason: 'Geocoder timed out. Retry later.' },
+ { id: 4, address: '301 Sweeten Creek Rd, Asheville, NC 28803', status: 'failed', errorReason: 'Geocoder timed out. Retry later.' },
```

`src/state/AppState.tsx:637`

```
- 11: { kind: 'failed', reason: 'Geocoder timeout — retry later' },
+ 11: { kind: 'failed', reason: 'Geocoder timed out. Retry later.' },
```

`src/state/AppState.tsx:655`

```
- if (row.id % 7 === 0) return { kind: 'failed', reason: 'AI provider timeout — retry' };
+ if (row.id % 7 === 0) return { kind: 'failed', reason: 'AI provider timed out. Retry.' };
```

### Seed data - factor breakdown + scan summaries (Result)

`src/data/scenarios.tsx:207`

```
- { title: 'Title Similarity', desc: "Listing titles reference 'Maplewood' and 'Blue Ridge' — high lexical overlap with property metadata.", short: "Titles reference 'Maplewood', 'Blue Ridge'", impact: 18 },
- { title: 'Size Mismatch', desc: 'Vrbo listing reports 2.5 baths vs. 2 baths on county record — minor discrepancy.', short: '2.5 baths listed vs. 2 on record', impact: -12 },
+ { title: 'Title Similarity', desc: "Listing titles reference 'Maplewood' and 'Blue Ridge', a high lexical overlap with property metadata.", short: "Titles reference 'Maplewood', 'Blue Ridge'", impact: 18 },
+ { title: 'Size Mismatch', desc: 'Vrbo listing reports 2.5 baths vs. 2 baths on county record, a minor discrepancy.', short: '2.5 baths listed vs. 2 on record', impact: -12 },
```

`src/data/scenarios.tsx:215`

```
- summary: 'One Airbnb listing nearby shares the neighborhood and a keyword. Layout doesn\'t fully match — review may resolve.',
+ summary: 'One Airbnb listing nearby shares the neighborhood and a keyword. Layout doesn\'t fully match, so a review may resolve it.',
```

`src/data/scenarios.tsx:252`

```
- { title: 'Address Match', desc: 'Airbnb listing geocoded within 0.4 mi — neighborhood referenced but exact street masked.', short: 'Within 0.4 mi, exact street masked', impact: 25 },
- { title: 'Bedroom Match', desc: 'Listing reports 1-bed studio; county records 3-bed home — partial mismatch on layout.', short: '1-bed studio vs. 3-bed on record', impact: 10 },
+ { title: 'Address Match', desc: 'Airbnb listing geocoded within 0.4 mi, with the neighborhood referenced but the exact street masked.', short: 'Within 0.4 mi, exact street masked', impact: 25 },
+ { title: 'Bedroom Match', desc: 'Listing reports 1-bed studio; county records 3-bed home, a partial mismatch on layout.', short: '1-bed studio vs. 3-bed on record', impact: 10 },
```

`src/data/scenarios.tsx:255`

```
- { title: 'Size Mismatch', desc: 'Square footage and photo count diverge from county property record — weakens the signal.', short: 'Sq ft and photo count diverge', impact: -14 },
+ { title: 'Size Mismatch', desc: 'Square footage and photo count diverge from county property record, which weakens the signal.', short: 'Sq ft and photo count diverge', impact: -14 },
```

`src/data/scenarios.tsx:268`

```
- { title: 'Owner Profile', desc: 'Owner-occupied (homestead exemption on file) — outside the profile of typical STR operators.', short: 'Homestead exemption on file', impact: -18 },
- { title: 'Bedroom Match', desc: 'No candidate listings surfaced to compare bedroom counts against — search returned empty.', short: 'No candidates surfaced to compare', impact: -10 },
+ { title: 'Owner Profile', desc: 'Owner-occupied (homestead exemption on file), outside the profile of typical STR operators.', short: 'Homestead exemption on file', impact: -18 },
+ { title: 'Bedroom Match', desc: 'No candidate listings surfaced to compare bedroom counts against; the search returned empty.', short: 'No candidates surfaced to compare', impact: -10 },
```

### Side navigation

`src/components/SideNav.tsx:85`

```
- alt="Halcyon Solutions — Decide with certainty."
+ alt="Halcyon Solutions. Decide with certainty."
```

### Sign in / Sign up

`src/pages/AuthScreen.tsx:115`

```
- One address — every listing, every signal, scored in seconds.
+ One address. Every listing, every signal, scored in seconds.
```

`src/pages/AuthScreen.tsx:414`

```
- Demo — <strong style={{ color: 'var(--ink-3)' }}>TEAM-ASHEVILLE</strong> to
+ Demo codes: <strong style={{ color: 'var(--ink-3)' }}>TEAM-ASHEVILLE</strong> to
```

