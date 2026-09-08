/* global React */
// AI Investigator data layer. Provides per-scenario mock results, the
// async entrypoint `runAIInvestigation(scenarioId)`, and a small shared
// state bus + `useAIInvestigator` hook so the CTA (in ScanContextBar)
// and the result card (in the page body) stay in sync. Wraps the mock so
// swapping to a real backend is a single edit inside `runAIInvestigation`.

type AIVerdictBand =
  | 'manual_verification'
  | 'low_evidence'
  | 'monitor'
  | 'review'
  | 'high_priority_review';
type AIClarityLabel = 'Low' | 'Medium' | 'High';

interface AIInvestigationResult {
  verdictBand: AIVerdictBand;
  recommendationLabel: string;
  score: number;
  scoreMax: number;
  rawScore: number;
  clarityScore: number;
  clarityMax: number;
  clarityLabel: AIClarityLabel;
  caseArchetype: string;
  summary: string;
  /** The recommendation directive (lead + detail) is NOT stored per case —
   *  it is derived from `verdictBand`, so all five bands read consistently.
   *  See AI_BAND_NEXT_STEP in AIInvestigator.tsx. */
  /** The "this doesn't determine rental status" caveat, stated ONCE as a
   *  panel footnote. It used to appear three times — in `summary`, inside
   *  the next-step detail, and again above the signal columns — which
   *  trained readers to skip all three. */
  scopeNote: string;
  riskSignals: string[];
  mitigatingSignals: string[];
  whyNotHigher: string[];
  whyNotLower: string[];
  checks: Array<{
    id: string;
    label: string;
    status: 'triggered' | 'inconclusive' | 'not_triggered' | 'context' | 'skipped';
    confidence: AIClarityLabel;
    score: number;
    evidenceCount: number;
    caveatCount: number;
  }>;
  /** The concern-raising subset only — contradictions, inconsistent
   *  records, and missing/undated evidence an officer should weigh before
   *  trusting the verdict. Deliberately curated, not the full caveat dump:
   *  the raw run emits ~18 caveats, most of them boilerplate; this carries
   *  only the ones that change how the case reads. `kind` selects the group
   *  icon; `group` is the human label. */
  dataGaps: Array<{ group: string; kind: 'conflict' | 'inconsistency' | 'gap'; items: string[] }>;
  /** The full per-heuristic write-ups, shown collapsed in a "Detailed
   *  analysis" accordion. `takeaway` is the one-line preview; `detail` is the
   *  essay revealed on expand; `direction` drives the row icon/tone so a
   *  neutral heuristic (context/quality) isn't coloured as concerning. */
  detailedAnalysis: Array<{
    id: string;
    title: string;
    takeaway: string;
    detail: string;
    direction: 'risk' | 'mitigation' | 'context' | 'quality';
    evidenceCount: number;
  }>;
  occupancyHistory: Array<{
    name: string;
    relationship: 'owner' | 'unrelated' | 'likely_family';
    sources: string[];
    summary: string;
    lengthOfResidence?: string;
    primary?: boolean;
  }>;
  evidenceRecords: Array<{
    source: string;
    rowid: number | null;
    summary: string;
    tone: 'risk' | 'mitigating' | 'neutral';
  }>;
  /** "What you need to know" — the executive-summary bullets that lead the
   *  drawer body and the downloaded PDF's first page. Meeting ask (Jim,
   *  2026-09-03): give the reader the summary a loan processor would
   *  otherwise paste into ChatGPT, so the answer is legible before the
   *  three-page backing. Each bullet may carry a `tone` so the one-pager can
   *  mark, point by point, whether it aligns with the occupancy concern
   *  ('concern'), cuts against it ('mitigating'), or is context ('info') —
   *  plain strings render as context for backward compatibility. */
  executiveSummary?: Array<string | { text: string; tone: 'concern' | 'mitigating' | 'info' }>;
  /** Records examined per source — for the PDF's "Records examined" block
   *  and a breadth line. Straight from the run's
   *  resolved_address.evidence_map.source_counts. Zero-count sources are
   *  kept so "Drive 0 / Loan 0" reads as "checked, none found", which is
   *  itself a finding here (no legal-address corroboration exists). */
  sourceCounts?: Array<{ label: string; count: number }>;
  /** Curated backing records for the PDF's evidence appendix — the rows that
   *  carry real signal (tax lien, mortgage/refi, auto registration,
   *  portfolio), NOT the raw 40-plus "firstname=" trace/utility dump. The
   *  appendix is the "document that backs the assertion" (Jim); the noisy
   *  per-name rows are represented by the source counts instead. */
  evidencePack?: Array<{ source: string; summary: string }>;
  /** At-a-glance ownership + occupancy band for the top of the drawer:
   *  a plain "who holds it right now" statement, a colour-coded ribbon of
   *  how occupancy read over time (owner-occupied vs possible-rental), and
   *  the dated milestones behind it. `status` drives the segment/pill colour
   *  — kept honest: an undated, inconclusive case shows 'inconclusive'
   *  (amber), never a confident 'rental'. */
  ownershipTimeline?: {
    currentOwner: string;
    currentStatus: 'owner' | 'rental' | 'inconclusive' | 'unknown';
    currentStatusLabel: string;
    segments: Array<{
      label: string;
      sublabel: string;
      status: 'owner' | 'rental' | 'inconclusive' | 'unknown';
      weight: number;
    }>;
    events: Array<{ at: string; title: string }>;
  };
  /** Structured adjudication signal from the run (adjudication.records_read
   *  in the raw payload — new in the 2026-09 batch runs): the
   *  machine-readable occupancy read that now headlines the digest, drawer
   *  and PDF instead of the jargon archetype string. `drivingHeuristicIds`
   *  marks which checks actually drove the verdict, so the detailed-analysis
   *  list can badge them as key checks. */
  occupancySignal?: {
    signal: 'owner_occupancy' | 'non_owner_occupancy' | 'conflicting' | 'no_signal';
    strength: 'weak' | 'moderate' | 'strong';
    reasoning: string;
    drivingHeuristicIds: string[];
  };
  runMeta: {
    jobId: string;
    runAt: string;
    durationLabel: string;
    sourcesChecked: string[];
    evidenceRefsCount: number;
  };
}

// -------------------------------------------------------------------------
// Occupancy-signal presentation helpers — SHARED by the digest card, the
// drawer body and the PDF (this file loads before all three). One mapping,
// so the signal can never read amber on one surface and red on another.
//
// RAG rule: conflicting → amber; non-owner → red only when strong, else
// amber; owner-occupied → teal; no signal → neutral grey. A thin case is
// calm, never alarming — of the 24 batch runs, 21 are conflicting·moderate,
// so amber is the product's working state, not an error state.

type OccSignalKind = 'owner_occupancy' | 'non_owner_occupancy' | 'conflicting' | 'no_signal';
type OccSignalTone = 'clean' | 'warn' | 'risk' | 'neutral';

const OCC_SIGNAL_LABEL: Record<OccSignalKind, string> = {
  owner_occupancy: 'Owner-occupied',
  non_owner_occupancy: 'Non-owner occupancy',
  conflicting: 'Conflicting signals',
  no_signal: 'Not enough evidence',
};

function occSignalMeta(
  signal: OccSignalKind,
  strength: 'weak' | 'moderate' | 'strong'
): { label: string; tone: OccSignalTone } {
  const label = OCC_SIGNAL_LABEL[signal] || 'Not enough evidence';
  let tone: OccSignalTone = 'neutral';
  if (signal === 'owner_occupancy') tone = 'clean';
  else if (signal === 'conflicting') tone = 'warn';
  else if (signal === 'non_owner_occupancy') tone = strength === 'strong' ? 'risk' : 'warn';
  return { label, tone };
}

/** Token vars per tone — soft fill, readable ink, solid dot. */
const OCC_SIGNAL_TONE_VARS: Record<OccSignalTone, { soft: string; ink: string; dot: string }> = {
  clean: { soft: 'var(--clean-soft)', ink: 'var(--clean-ink)', dot: 'var(--clean)' },
  warn: { soft: 'var(--warn-soft)', ink: 'var(--warn-ink)', dot: 'var(--warn)' },
  risk: { soft: 'var(--risk-soft)', ink: 'var(--risk-ink)', dot: 'var(--risk)' },
  neutral: { soft: 'var(--surface-2)', ink: 'var(--ink-2)', dot: 'var(--ink-4)' },
};

/** What each strength grade MEANS — rendered wherever the chip appears so
 *  "moderate signal" is never an undefined term. Wording is grounded in the
 *  language the runs themselves use: weak = "no substantive evidence",
 *  moderate = "substantive rows on both sides that cannot be ordered in
 *  time", strong = "corroborated across multiple independent source
 *  families". */
const OCC_STRENGTH_DEF: Record<'weak' | 'moderate' | 'strong', string> = {
  weak: 'Thin evidence, with no corroboration between sources.',
  moderate:
    'Solid evidence from more than one source, but undated or conflicting records leave it unsettled.',
  strong: 'Multiple independent sources agree, and nothing meaningful points the other way.',
};

/** "51 records across 5 sources" — trust-through-volume line, derived from
 *  sourceCounts so it always matches the Records-examined block. */
function occRecordsSummary(result: AIInvestigationResult): string | null {
  const sc = result.sourceCounts || [];
  const total = sc.reduce((n, s) => n + (s.count || 0), 0);
  const sources = sc.filter((s) => s.count > 0).length;
  if (!total) return null;
  return `${total} records across ${sources} source${sources === 1 ? '' : 's'}`;
}

/** The one-line synthesis tying the listing scan to the records read. The
 *  two lenses answer the same question from different angles; this sentence
 *  says whether they corroborate, one adds to the other, or they disagree.
 *  Voice stays verdict-neutral — it recommends a next step, never grades. */
function occCombinedSynthesis(
  listing: 'rented' | 'likely' | 'not-rented' | null,
  signal: OccSignalKind
): string {
  const listingsPositive = listing === 'rented' || listing === 'likely';
  if (listing === null) {
    if (signal === 'non_owner_occupancy') return 'The records point to non-owner occupancy.';
    if (signal === 'conflicting') return 'The records support both owner presence and non-owner occupancy. A person should review.';
    if (signal === 'owner_occupancy') return 'The records support owner occupancy.';
    return 'The records are too thin to establish who occupies this address.';
  }
  if (listingsPositive) {
    if (signal === 'non_owner_occupancy')
      return 'The listing scan and the records agree: non-owner use at this address.';
    if (signal === 'conflicting')
      return 'Listings suggest rental use. The records can’t confirm who lives there now, so a person should review.';
    if (signal === 'owner_occupancy')
      return 'Listings suggest rental use; the records support owner presence. The two reads disagree, so review before acting.';
    return 'Listings suggest rental use. The records are too thin to back that either way.';
  }
  // listing says not rented
  if (signal === 'non_owner_occupancy')
    return 'No active listings, but the records show non-owner occupancy. Still worth a review.';
  if (signal === 'conflicting')
    return 'No active listings, and the records are mixed. Inconclusive on both reads.';
  if (signal === 'owner_occupancy')
    return 'No active listings, and the records support owner presence. Both reads agree.';
  return 'No active listings, and the records are too thin to add a read.';
}

// Loading-step timings. Constant here so the prototype animation is
// deterministic; a real backend would drive these via SSE / polling.
const AI_STEP_1_MS = 3600; // "Retrieving property, owner & STR evidence"
const AI_STEP_2_MS = 2800; // "Analyzing evidence & generating report"

const AI_INVESTIGATION_DEEP_DIVE: AIInvestigationResult = {
  verdictBand: 'review',
  recommendationLabel: 'Review',
  // Scores follow the NEWER full run of this address (demo-response-full,
  // 2026-09): calibrated 7 (raw 11), clarity 5 — not the older 8/4 summary.
  score: 7,
  scoreMax: 10,
  rawScore: 11,
  clarityScore: 5,
  clarityMax: 10,
  clarityLabel: 'Medium',
  caseArchetype: 'Ambiguous non-owner occupancy',
  summary:
    'The tax and base records confirm the owners (the Lee couple) at the address, with the mailing address on the property itself plus a 2016 purchase and 2018 refinance. Against that, 16 utility and 29 trace records place nine or more unrelated people at a single-family home, corroborated by a non-owner vehicle registration and two Airbnb listings. The pattern fits either active rental operation or dense multi-occupancy, but the records that would settle it are undated or stale (the tax record is from 2018), so current occupancy cannot be determined automatically.',
  scopeNote:
    'These are investigative leads, not a fraud determination. Local records support an occupancy review only; none of them determines rental status on its own.',
  // Fact-first, per Erin (2026-09-03): lead with what we found, cite the
  // record counts as support rather than opening on the quantity.
  riskSignals: [
    'Nine or more unrelated people appear as occupants at a single-family home, corroborated across 16 utility and 29 trace records.',
    'A non-owner (Adriana DeCastro) is auto-registered at the address, and two Airbnb listings match it at 100% and 50% address confidence.',
  ],
  mitigatingSignals: [
    'The records placing non-owners here carry no service dates, and the tax record is six years stale (2018). Neither confirms present-day occupancy.',
    'The owners mail to the property itself, with a 2016 purchase and 2018 refinance on file. That is direct owner-presence evidence.',
  ],
  whyNotHigher: [
    'Undated utility and trace records cannot confirm current vs. historical occupancy; the tax record is 6+ years stale, limiting confidence in present-day status.',
    'Owner utility presence is absent and no loan or drive records exist, so owner legal-address presence and current financing cannot be established.',
  ],
  whyNotLower: [
    'Two Airbnb listings plus 16 utility and 29 trace records for nine or more unrelated non-owners create a substantial occupancy-risk signal requiring review.',
    'A non-owner auto registration and multiple distinct utility account holders corroborate active non-owner presence beyond trace-only evidence.',
  ],
  executiveSummary: [
    { text: 'The owners (the Lee couple) are documented at the address, but nine or more unrelated people also appear as occupants. The case cannot be settled automatically.', tone: 'concern' },
    { text: 'Two Airbnb listings and a non-owner vehicle registration at the address point to possible rental use.', tone: 'concern' },
    { text: 'The records that would confirm current occupancy are undated or stale (tax record is from 2018), so present-day status is unproven.', tone: 'mitigating' },
    { text: 'Next step: manual review before any determination.', tone: 'info' },
  ],
  checks: [
    { id: 'property_tax_context', label: 'Property tax context', status: 'context', confidence: 'High', score: 0, evidenceCount: 4, caveatCount: 0 },
    { id: 'owner_identity_and_mailing', label: 'Owner identity and mailing', status: 'triggered', confidence: 'High', score: 7, evidenceCount: 13, caveatCount: 4 },
    { id: 'subject_occupancy_surfaces', label: 'Subject occupancy surfaces', status: 'triggered', confidence: 'Medium', score: 6, evidenceCount: 21, caveatCount: 4 },
    { id: 'legal_address_presence', label: 'Legal-address presence', status: 'not_triggered', confidence: 'High', score: 0, evidenceCount: 0, caveatCount: 3 },
    { id: 'portfolio_and_primary_comparison', label: 'Portfolio and primary comparison', status: 'not_triggered', confidence: 'Low', score: 0, evidenceCount: 1, caveatCount: 1 },
    { id: 'case_quality_and_synthesis', label: 'Case quality and synthesis', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 5, caveatCount: 5 },
  ],
  dataGaps: [
    {
      group: 'Contradictions',
      kind: 'conflict',
      items: [
        'The owners mail to the property itself, yet nine or more unrelated non-owners appear across utility and trace, consistent with either dense multi-occupancy or rental use.',
        'Willer Castro shows an 8-year residence at the address in base records but is absent from the tax owner record and the people-at-address summary; the role is unclear.',
      ],
    },
    {
      group: 'Records that disagree',
      kind: 'inconsistency',
      items: [
        '“Adriana DeCastro”, “Adriana Decastro” and “Adriana Castro” appear as spelling variants of one person, not three occupants.',
        'The April and Cynthia Madayag variants differ by date of birth and appear to be distinct individuals despite the similar names.',
      ],
    },
    {
      group: 'Missing or undated evidence',
      kind: 'gap',
      items: [
        'Utility and trace records carry no service dates, so current occupancy can’t be pinned to a period.',
        'The tax record is 6+ years old (Oct 2018); ownership, liens and mailing address may since have changed.',
        'No driver or loan records exist, so owner legal-address presence and current financing cannot be corroborated.',
      ],
    },
  ],
  detailedAnalysis: [
    {
      id: 'property_tax_context',
      title: 'Property tax context',
      takeaway: 'A single-family home held by individuals, with moderate lien exposure and no distress markers.',
      detail:
        '17 Monmouth Ave is a residential single-family home (4 bed / 2.5 bath) held by individuals (Jaems and Christina Lee), not an entity or trust. The tax record shows 3 liens totaling $264,438 as of Oct 2018, with LoanDepot.com LLC as the primary lender; base records show a 2016 purchase at $276k and a 2018 refinance at $271k. There are no foreclosure or distress markers. Ownership is stable and conventionally financed, which frames the dense non-owner occupancy as the item that needs verifying, rather than the ownership itself.',
      direction: 'context',
      evidenceCount: 4,
    },
    {
      id: 'owner_identity_and_mailing',
      title: 'Owner identity and mailing',
      takeaway: 'The owners are documented on-site and mail to the property, yet 9+ unrelated people share the address.',
      detail:
        'Tax owners Jaems and Christina Lee are confirmed at the subject with the mailing address on the property itself, and Christina L Lee carries a high homeowner probability in base records, which is strong owner-presence evidence. Coexisting with that, Adriana DeCastro appears consistently across auto, trace and utility, and multiple unrelated non-owners (April Madayag, Cynthia Elhendawi, Anthony Madayag, John Dixon, Margaret Kahl, Barbara Werner, Cynthia Roberson) appear across utility and trace. Owner-present with the mailing at the subject, but 9+ unrelated occupants, is what produces the occupancy-risk profile.',
      direction: 'risk',
      evidenceCount: 13,
    },
    {
      id: 'subject_occupancy_surfaces',
      title: 'Subject occupancy surfaces',
      takeaway: 'Non-owner utility, trace and auto records place many other people here, but none carry service dates.',
      detail:
        'Nine distinct non-owner utility account holders appear at the subject, plus multiple non-owner trace records and two auto registrations for non-owner Adriana DeCastro (2019 Nissan). Owner James Lee appears in trace (likely family), but there is no owner utility presence. The combination of distinct non-owner utility names, corroborating trace records and a non-owner vehicle registration indicates active non-owner presence; two short-term-rental listings add rental-market context. The limitation is timing: the tax record is stale (Oct 2018) and the utility/trace records are undated, so current occupancy can’t be established.',
      direction: 'risk',
      evidenceCount: 21,
    },
    {
      id: 'legal_address_presence',
      title: 'Legal-address presence',
      takeaway: 'No drive records exist, and the only auto registrations belong to a non-owner, so this path can’t be scored.',
      detail:
        'There are zero drive records at the subject, which removes the primary legal-address evidence path. Auto registrations are present but only for non-owner Adriana DeCastro, not for the tax owners. The tax record confirms the owners’ mailing address at the subject but that is owner-presence context, not a legal-address-presence signal. With no owner drive records, no owner auto registrations and no non-owner drive records, this check cannot be triggered on legal-address evidence either way.',
      direction: 'context',
      evidenceCount: 0,
    },
    {
      id: 'portfolio_and_primary_comparison',
      title: 'Portfolio and primary comparison',
      takeaway: 'The owner’s footprint is too small for a multi-property risk pattern.',
      detail:
        'Jaems Lee appears in only two property-owner records: the subject in New Jersey and one in Texas. That footprint is too small to establish a multi-property or portfolio risk pattern. This check does not add risk on its own.',
      direction: 'mitigation',
      evidenceCount: 1,
    },
    {
      id: 'case_quality_and_synthesis',
      title: 'Case quality and synthesis',
      takeaway: 'Owner identity is clear, but stale and undated records block a confident occupancy determination.',
      detail:
        'Owner identity is clear (James/Jaems and Christina Lee), but occupancy status can’t be reliably determined. Mortgage/lien exposure is stale (tax recorded Oct 2018). No records carry occupancy dates: base records lack them, trace and utility records are undated, and there are no driver or loan records to anchor the claim. Name ambiguity is partly resolved (the DeCastro/De Castro/Castro variants are one person; James/Jaems Lee are the same), but Willer Castro shows an 8-year base residence yet is absent from tax with a different DOB, so his role is undefined. A plausible owner-occupancy narrative is contradicted by high-volume non-owner signals and probable STR use, without dated evidence to reconcile them.',
      direction: 'quality',
      evidenceCount: 5,
    },
  ],
  occupancyHistory: [
    {
      name: 'Christina L. Lee',
      relationship: 'owner',
      sources: ['TAX', 'BASE', 'TRACE'],
      summary: 'Tax owner with the mailing address on the property itself, a 2016 purchase and a high homeowner probability in base records.',
    },
    {
      name: 'James Lee',
      relationship: 'likely_family',
      sources: ['BASE', 'TRACE'],
      summary: 'Shares the owner surname and appears in base and trace at the address; likely a family member, though the relationship is not definitively confirmed.',
    },
    {
      name: 'Adriana DeCastro',
      relationship: 'unrelated',
      sources: ['AUTO', 'TRACE', 'UTILITY'],
      summary: 'The most persistent non-owner here. Appears across a 2019 vehicle registration, utility accounts and many trace records with a consistent phone and DOB.',
    },
    {
      name: 'April Madayag',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Appears across trace and utility records at the address; the April variants likely refer to the same person.',
    },
    {
      name: 'Cynthia Elhendawi',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Non-owner utility account holder with a dated date of birth, corroborated in trace records.',
    },
    {
      name: 'Anthony F. Madayag',
      relationship: 'unrelated',
      sources: ['UTILITY'],
      summary: 'Non-owner utility account holder at the subject address.',
    },
    {
      name: 'John Dixon',
      relationship: 'unrelated',
      sources: ['UTILITY'],
      summary: 'Non-owner utility account holder at the subject address.',
    },
    {
      name: 'Margaret Kahl',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Appears in both utility and trace records at the address.',
    },
    {
      name: 'Willer Castro',
      relationship: 'unrelated',
      sources: ['BASE'],
      summary: 'Shows an 8-year residence in base records but is absent from the tax owner record and people-at-address summary; role undefined.',
    },
  ],
  evidenceRecords: [
    { source: 'TAX', rowid: null, tone: 'neutral', summary: 'Residential single-family; 3 liens totaling $264,438; lender LoanDepot.com LLC; recorded Oct 2018.' },
    { source: 'BASE', rowid: null, tone: 'mitigating', summary: 'Christina L Lee; 2016 purchase at $276k; $271k mortgage (Mortgage Master); 2018 refinance $271k (LoanDepot).' },
    { source: 'AUTO', rowid: null, tone: 'risk', summary: 'Non-owner Adriana DeCastro; 2019 Nissan registered at 17 Monmouth Ave (2 records).' },
    { source: 'UTILITY', rowid: null, tone: 'risk', summary: 'Nine distinct non-owner utility account holders at the subject, several with dated DOBs.' },
    { source: 'TRACE', rowid: null, tone: 'risk', summary: '29 trace records place multiple unrelated people at the address; none carry service dates.' },
    { source: 'BASE', rowid: null, tone: 'neutral', summary: 'Willer Castro; base record at ZIP 07748 with an 8-year residence; not in the tax owner record.' },
  ],
  // resolved_address.evidence_map.source_counts — zero-count sources kept:
  // "Drive 0 / Loan 0" reads as "checked, none found", itself a finding here
  // (no legal-address corroboration exists).
  sourceCounts: [
    { label: 'Trace', count: 29 },
    { label: 'Utility', count: 16 },
    { label: 'Base', count: 3 },
    { label: 'Auto', count: 2 },
    { label: 'Tax', count: 1 },
    { label: 'Loan', count: 0 },
    { label: 'Drive', count: 0 },
  ],
  // Curated backing rows for the PDF evidence appendix — the ones that carry
  // real signal, not the raw per-name trace/utility dump (which the source
  // counts above represent instead).
  evidencePack: [
    { source: 'TAX', summary: 'Residential single-family property; 3 liens totaling $264,438; lender LoanDepot.com LLC; recording date Oct 2018.' },
    { source: 'BASE', summary: 'Christina L Lee; purchase year 2016, purchase price $276k, $271k mortgage (Mortgage Master), 2018 refinance $271k (LoanDepot.com LLC).' },
    { source: 'BASE', summary: 'James A Lee; same mortgage and refinance evidence as Christina L Lee.' },
    { source: 'BASE', summary: 'Willer Castro; base record at ZIP 07748; 8-year residence; not present in the tax owner record.' },
    { source: 'AUTO', summary: 'Adriana DeCastro; 2019 Nissan registered at 17 Monmouth Ave (2 records); no owner auto registration exists.' },
    { source: 'PORTFOLIO', summary: 'Jaems Lee appears in only 2 property-owner records; the subject (NJ) and one in Texas; portfolio too small for a multi-property risk pattern.' },
  ],
  ownershipTimeline: {
    currentOwner: 'Christina & Jaems Lee',
    currentStatus: 'inconclusive',
    currentStatusLabel: 'Occupancy inconclusive',
    segments: [
      { label: 'Owner-occupied', sublabel: '2016 – 2018', status: 'owner', weight: 28 },
      { label: 'Possible rental · unverified', sublabel: '2018 – today', status: 'inconclusive', weight: 72 },
    ],
    events: [
      { at: '2016', title: 'Purchased by the Lee couple ($276k)' },
      { at: '2018', title: 'Refinanced ($271k); last tax record on file' },
      { at: 'After 2018', title: '9+ unrelated occupants, two Airbnb listings and a non-owner vehicle appear' },
      { at: 'Today', title: 'Owner of record remains the Lee couple; occupancy unverified' },
    ],
  },
  occupancySignal: {
    signal: 'conflicting',
    strength: 'moderate',
    reasoning:
      'Tax and identity records establish the Lee couple at the subject with the mailing address on the property itself, while utility and address-history records document nine or more unrelated occupants. Both readings rest on substantive records; missing service dates make it impossible to order them in time.',
    drivingHeuristicIds: [
      'owner_identity_and_mailing',
      'subject_occupancy_surfaces',
      'case_quality_and_synthesis',
    ],
  },
  runMeta: {
    jobId: '7cc36da0-7760-4ae5-ad0b-60ae7d33f252',
    runAt: '2026-09-02 16:22 UTC',
    durationLabel: '2 min 11 sec',
    sourcesChecked: ['Tax', 'Base', 'Trace', 'Utility', 'Auto'],
    evidenceRefsCount: 47,
  },
};

// -------------------------------------------------------------------------
// 934 Dayton Ave — the RED case from the 2026-09 batch: a trust-held
// absentee rental with a strong non-owner signal. Paired with the 'high'
// listing scenario so the combined read demonstrates corroboration
// (listings AND records both point to non-owner use).
const AI_INVESTIGATION_ABSENTEE: AIInvestigationResult = {
  verdictBand: 'high_priority_review',
  recommendationLabel: 'Priority review',
  score: 8,
  scoreMax: 10,
  rawScore: 27,
  clarityScore: 6,
  clarityMax: 10,
  clarityLabel: 'Medium',
  caseArchetype: 'Clear absentee rental',
  summary:
    'The property is owned by a trust with a mailing address in a different ZIP code and a portfolio of 33 properties: an absentee-ownership pattern. At least 15 unrelated people appear at the address across identity, vehicle-registration, driver-license, mortgage-application, utility and address-history records, with no owner-occupancy evidence anywhere. Occupants have filed conflicting own-vs-rent claims on loan applications, indicating occupancy-misrepresentation risk.',
  scopeNote:
    'These are investigative leads, not a fraud determination. Local records support an occupancy review only; none of them determines rental status on its own.',
  riskSignals: [
    'No owner-occupancy evidence exists in any source, while the trust owner mails to a different ZIP and holds 33 properties. A clear absentee pattern.',
    'At least 15 unrelated occupants are corroborated across five independent source families.',
    'Non-owners filed conflicting own-vs-rent claims on loan applications: one occupant claimed to own the home on 6 applications and to rent it on 9.',
  ],
  mitigatingSignals: [
    'The occupancy density (17 unrelated people) could indicate a rooming house or informal arrangement rather than a standard concealed rental.',
    'The tax record is 15+ years stale (2008); the ownership structure and financing may since have changed.',
  ],
  whyNotHigher: [
    'Occupancy density and conflicting own/rent claims suggest a possible rooming-house or informal arrangement rather than a standard rental, limiting clarity on intent.',
    'The tax record is 15+ years stale; no mortgage or lien records exist to confirm current encumbrance or refinance activity.',
  ],
  whyNotLower: [
    'Non-owner occupancy is corroborated across five independent source families, establishing a strong occupancy signal.',
    'Owner mailing in a different ZIP, a 33-property portfolio, and a complete absence of owner-occupancy evidence establish a clear absentee-ownership pattern.',
  ],
  executiveSummary: [
    { text: 'The owner is a trust with a 33-property portfolio, mailing to a different ZIP. No owner presence appears in any record at this address.', tone: 'concern' },
    { text: 'At least 15 unrelated people are documented here across identity, vehicle, driver-license, loan, utility and address-history records.', tone: 'concern' },
    { text: 'Occupants filed conflicting loan claims: one person claimed to own the home on 6 applications and to rent it on 9.', tone: 'concern' },
    { text: 'Next step: top of the review queue.', tone: 'info' },
  ],
  occupancySignal: {
    signal: 'non_owner_occupancy',
    strength: 'strong',
    reasoning:
      'Identity, vehicle-registration, driver-license, mortgage-application, utility and address-history records document at least 15 unrelated non-owner individuals at the subject address, with no owner-occupancy evidence and the owner mailing in a different ZIP code.',
    drivingHeuristicIds: [
      'owner_identity_and_mailing',
      'subject_occupancy_surfaces',
      'legal_address_presence',
      'loan_tenure',
    ],
  },
  checks: [
    { id: 'property_tax_context', label: 'Property tax context', status: 'context', confidence: 'High', score: 0, evidenceCount: 40, caveatCount: 2 },
    { id: 'owner_identity_and_mailing', label: 'Owner identity and mailing', status: 'triggered', confidence: 'High', score: 8, evidenceCount: 40, caveatCount: 2 },
    { id: 'subject_occupancy_surfaces', label: 'Subject occupancy surfaces', status: 'triggered', confidence: 'High', score: 8, evidenceCount: 40, caveatCount: 2 },
    { id: 'legal_address_presence', label: 'Legal-address presence', status: 'triggered', confidence: 'High', score: 6, evidenceCount: 40, caveatCount: 1 },
    { id: 'loan_tenure', label: 'Loan tenure', status: 'triggered', confidence: 'Medium', score: 4, evidenceCount: 40, caveatCount: 2 },
    { id: 'portfolio_and_primary_comparison', label: 'Portfolio and primary comparison', status: 'triggered', confidence: 'Medium', score: 4, evidenceCount: 38, caveatCount: 1 },
    { id: 'case_quality_and_synthesis', label: 'Case quality and synthesis', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 40, caveatCount: 5 },
  ],
  dataGaps: [
    {
      group: 'Contradictions',
      kind: 'conflict',
      items: [
        'Non-owner occupants claim both to own and to rent the property across loan applications.',
        '17 unrelated occupants is inconsistent with the single-family classification on the tax record.',
      ],
    },
    {
      group: 'Records that disagree',
      kind: 'inconsistency',
      items: [
        'Duplicate person records carry conflicting attributes across sources and could not all be reconciled.',
      ],
    },
    {
      group: 'Missing or undated evidence',
      kind: 'gap',
      items: [
        'The tax record is 15+ years old (Sep 2008); no current mortgage or lien records exist.',
        'Loan applications carry no dates, so the conflicting tenure claims cannot be sequenced.',
      ],
    },
  ],
  detailedAnalysis: [
    {
      id: 'property_tax_context',
      title: 'Property tax context',
      takeaway: 'A single-family home held by a trust with a 33-property portfolio. Investor ownership.',
      detail:
        'The subject is a residential single-family home owned by a trust entity (the Schilling Trust, Tyler Lee Schilling) that holds a portfolio of 33 properties. Portfolio-scale ownership, combined with the owner mailing to a different ZIP, frames this as absentee investor ownership rather than owner-occupancy. The tax record on file dates to September 2008.',
      direction: 'context',
      evidenceCount: 40,
    },
    {
      id: 'owner_identity_and_mailing',
      title: 'Owner identity and mailing',
      takeaway: 'The trust owner mails to a different ZIP and never appears in any occupancy record.',
      detail:
        'The owner of record is the Schilling Trust with a mailing address at 222 Walton Ave, Lexington KY 40502, distinct from the subject at 934 Dayton Ave, 40505. The owner maintains a 33-property portfolio and has no presence in identity, utility, driver or address-history records at the subject, while multiple unrelated non-owners occupy it with strong corroboration.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'subject_occupancy_surfaces',
      title: 'Subject occupancy surfaces',
      takeaway: 'At least 12 unrelated people appear in trace and utility records; the owner appears in none.',
      detail:
        'Multiple unrelated non-owners appear in both trace and utility records at the subject, indicating active non-owner occupancy. The tax owner has no occupancy evidence at the subject and maintains a mailing address elsewhere, consistent with absentee ownership over a dense, multi-occupant household.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'legal_address_presence',
      title: 'Legal-address presence',
      takeaway: 'Non-owners hold driver-license and vehicle records here: 92 driver records for one occupant alone.',
      detail:
        'Multiple unrelated non-owners hold driver-license and vehicle-registration records at the subject address, establishing non-owner legal-address presence. Gary Hiles alone appears in 92 driver-license records at the address. The tax owner has no driver or vehicle evidence at the subject.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'loan_tenure',
      title: 'Loan tenure',
      takeaway: 'Occupants filed conflicting own-vs-rent claims: the occupancy-misrepresentation flag.',
      detail:
        'Non-owner occupants claim conflicting tenure across loan applications. Gary Hiles, who is not the tax owner, submitted at least six applications claiming ownership and nine claiming rental at the same address. Carol Robbins, Mary Hiles and Nick McComber, also non-owners, submitted applications claiming ownership.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'portfolio_and_primary_comparison',
      title: 'Portfolio and primary comparison',
      takeaway: 'A 33-property portfolio with no owner presence at the subject: a rental-inventory pattern.',
      detail:
        'The trust is linked to 33 residential properties across Lexington, Kentucky. Its mailing address differs materially from the subject, and the subject shows no owner-presence evidence in any source. It is the profile of one unit inside a rental portfolio rather than a primary residence.',
      direction: 'risk',
      evidenceCount: 38,
    },
    {
      id: 'case_quality_and_synthesis',
      title: 'Case quality and synthesis',
      takeaway: 'Strong non-owner signal, but stale tax data and undated applications limit sequencing.',
      detail:
        'Case quality is limited by stale tax data (2008), missing mortgage/lien anchors, absent application dates, duplicate person records with conflicting attributes, and an occupancy density (17 unrelated persons) inconsistent with the single-family classification. The property reads as an absentee-owned rental or rooming house; the non-owner signal itself is strongly corroborated.',
      direction: 'quality',
      evidenceCount: 40,
    },
  ],
  occupancyHistory: [
    {
      name: 'Schilling Trust (Tyler Lee Schilling)',
      relationship: 'owner',
      sources: ['TAX'],
      summary:
        'Owner of record; mails to 222 Walton Ave, Lexington (a different ZIP); holds a 33-property portfolio; no occupancy evidence at this address.',
    },
    {
      name: 'Gary Hiles',
      relationship: 'unrelated',
      sources: ['DRIVE', 'LOAN', 'TRACE'],
      summary:
        'The dominant occupant on record: 92 driver-license records here, plus 15 loan applications: 6 claiming to own the home, 9 claiming to rent it.',
    },
    {
      name: 'Bobby R. Payne',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Appears across address-history and multiple utility service records at the subject.',
    },
    {
      name: 'Brenda L. Payne',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Appears across address-history and multiple utility service records at the subject.',
    },
    {
      name: 'Carol Robbins',
      relationship: 'unrelated',
      sources: ['LOAN'],
      summary: 'Non-owner who filed loan applications claiming ownership at the subject address.',
    },
    {
      name: 'Mary Hiles',
      relationship: 'unrelated',
      sources: ['LOAN'],
      summary: 'Non-owner who filed loan applications claiming ownership at the subject address.',
    },
    {
      name: 'Nick McComber',
      relationship: 'unrelated',
      sources: ['LOAN'],
      summary: 'Non-owner who filed loan applications claiming ownership at the subject address.',
    },
  ],
  evidenceRecords: [
    { source: 'TAX', rowid: null, tone: 'risk', summary: 'Owner: Schilling Trust; mailing 222 Walton Ave, Lexington KY 40502; does not match subject; recorded Sep 2008.' },
    { source: 'LOAN', rowid: null, tone: 'risk', summary: 'Gary Hiles; 15 loan applications at the subject: 6 claiming ownership, 9 claiming rental.' },
    { source: 'DRIVE', rowid: null, tone: 'risk', summary: 'Gary Hiles; 92 driver-license records at the subject address; the owner has none.' },
    { source: 'UTILITY', rowid: null, tone: 'risk', summary: 'Eight non-owner utility accounts at the subject; no owner utility presence.' },
  ],
  sourceCounts: [
    { label: 'Loan', count: 123 },
    { label: 'Drive', count: 92 },
    { label: 'Trace', count: 22 },
    { label: 'Base', count: 9 },
    { label: 'Utility', count: 8 },
    { label: 'Auto', count: 3 },
    { label: 'Tax', count: 1 },
  ],
  evidencePack: [
    { source: 'TAX', summary: 'Owner: Schilling Trust (Tyler Lee Schilling); mailing 222 Walton Ave, Lexington KY 40502; does not match the subject; recorded Sep 2008.' },
    { source: 'PORTFOLIO', summary: 'The trust is linked to 33 residential properties across Lexington, KY.' },
    { source: 'LOAN', summary: 'Gary Hiles; 15 loan applications at the subject: 6 claiming ownership, 9 claiming rental.' },
    { source: 'DRIVE', summary: 'Gary Hiles; 92 driver-license records at the subject address; the owner holds none here.' },
    { source: 'LOAN', summary: 'Carol Robbins, Mary Hiles and Nick McComber; non-owners filing loan applications claiming ownership at the subject.' },
    { source: 'UTILITY', summary: 'Eight non-owner utility accounts at the subject; no owner utility presence.' },
  ],
  ownershipTimeline: {
    currentOwner: 'Schilling Trust (Tyler Lee Schilling)',
    currentStatus: 'rental',
    currentStatusLabel: 'Non-owner occupied',
    segments: [
      { label: 'Trust-held · absentee owner', sublabel: '2008 – today', status: 'rental', weight: 100 },
    ],
    events: [
      { at: '2008', title: 'Tax record: Schilling Trust, mailing in a different ZIP (last record on file)' },
      { at: 'Since 2008', title: '15+ unrelated occupants across identity, driver, loan, utility and trace records' },
      { at: 'Undated', title: 'Conflicting own-vs-rent loan claims filed by non-owner occupants' },
      { at: 'Today', title: 'Owner of record remains the trust; no owner presence in any record' },
    ],
  },
  runMeta: {
    jobId: '934-dayton-ave-40505',
    runAt: '2026-09-06 14:05 UTC',
    durationLabel: '1 min 58 sec',
    sourcesChecked: ['Tax', 'Base', 'Loan', 'Drive', 'Auto', 'Trace', 'Utility'],
    evidenceRefsCount: 258,
  },
};

// -------------------------------------------------------------------------
// 647 Chestnut St — the GREY case from the batch: no tax record at all, so
// ownership cannot be established and the signal is honestly "no read".
// Paired with the 'low' listing scenario (no listings + no records signal).
const AI_INVESTIGATION_LOW_EVIDENCE: AIInvestigationResult = {
  verdictBand: 'low_evidence',
  recommendationLabel: 'No action needed',
  score: 2,
  scoreMax: 10,
  rawScore: 0,
  clarityScore: 3,
  clarityMax: 10,
  clarityLabel: 'Low',
  caseArchetype: 'Insufficient ownership data',
  summary:
    'No property-tax owner record exists for this address, eliminating the primary anchor for ownership verification. Identity and address-history records show two residents with 8–10 years of tenure, and utility records identify four individuals, but nothing in tax, mortgage, loan or vehicle records carries an ownership claim, so owner-occupancy versus rental use cannot be determined.',
  scopeNote:
    'These are investigative leads, not a fraud determination. Local records support an occupancy review only; none of them determines rental status on its own.',
  riskSignals: [
    'Two people (Betty S. Simpson, Joyce A. Brown) appear only in utility accounts, with no corroboration from any other source.',
    'With no tax record on file, occupancy cannot be checked against an owner at all.',
  ],
  mitigatingSignals: [
    'Della H. Brown and Michael Smith show 8–10 years of corroborated tenure. An established household, not a vacancy or a data error.',
    'Four utility account holders with multi-year tenure suggest ordinary household occupancy.',
  ],
  whyNotHigher: [
    'No property-tax record, mortgage application or loan document establishes owner identity or an occupancy claim, preventing escalation above the low-evidence band.',
    'Utility-only records for two of the four occupants lack dates and corroboration, and cannot distinguish owner from renter.',
  ],
  whyNotLower: [
    'Two individuals appear in both identity and address-history records with 8–10 years of tenure, indicating genuine occupancy rather than administrative error.',
    'Four distinct individuals in utility records suggest an active household rather than a vacant or abandoned property.',
  ],
  executiveSummary: [
    { text: 'No property-tax owner record exists for this address, so there is no anchor to establish who owns it.', tone: 'info' },
    { text: 'Two long-tenured residents (8–10 years) appear in identity and address-history records; two more appear in utility accounts only.', tone: 'mitigating' },
    { text: 'Nothing distinguishes owner from renter: no tax, mortgage, loan or vehicle record carries an ownership claim.', tone: 'info' },
    { text: 'Next step: none. Revisit only if stronger records surface.', tone: 'info' },
  ],
  occupancySignal: {
    signal: 'no_signal',
    strength: 'weak',
    reasoning:
      'Identity and address-history records show two individuals with 8–10 years of tenure and utility records identify four individuals, but no property-tax owner record exists to establish who owns the property or whether any resident is the owner.',
    drivingHeuristicIds: [
      'property_tax_context',
      'subject_occupancy_surfaces',
      'case_quality_and_synthesis',
    ],
  },
  checks: [
    { id: 'property_tax_context', label: 'Property tax context', status: 'context', confidence: 'Low', score: 0, evidenceCount: 7, caveatCount: 3 },
    { id: 'subject_occupancy_surfaces', label: 'Subject occupancy surfaces', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 11, caveatCount: 2 },
    { id: 'case_quality_and_synthesis', label: 'Case quality and synthesis', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 18, caveatCount: 4 },
  ],
  dataGaps: [
    {
      group: 'Missing or undated evidence',
      kind: 'gap',
      items: [
        'No property-tax record exists for the address; the primary ownership anchor is absent.',
        'Utility entries are undated and cannot be distinguished as current or historical.',
        'No mortgage, loan, driver or vehicle records exist to corroborate against.',
      ],
    },
    {
      group: 'Records that disagree',
      kind: 'inconsistency',
      items: [
        'Two of the four named occupants appear in utility accounts only, with no second source to confirm identity or tenure.',
      ],
    },
  ],
  detailedAnalysis: [
    {
      id: 'property_tax_context',
      title: 'Property tax context',
      takeaway: 'No tax record exists; classification, ownership and lien status cannot be assessed.',
      detail:
        'Property-tax records are absent for 647 Chestnut St, preventing assessment of residential classification, owner identity, lien and mortgage exposure, foreclosure markers, entity ownership and portfolio count. Base records show two individuals with 8–10 years of tenure at the address, but tenure alone establishes occupancy, not ownership.',
      direction: 'context',
      evidenceCount: 7,
    },
    {
      id: 'subject_occupancy_surfaces',
      title: 'Subject occupancy surfaces',
      takeaway: 'An established household is documented, but nobody can be identified as the owner.',
      detail:
        'Two individuals (Della H. Brown and Michael Smith) appear in both address-history and identity records with 8–10 years of tenure, indicating established occupancy. Two more (Betty S. Simpson and Joyce A. Brown) appear only in utility service records. With no owner record to compare against, the occupancy cannot be classified as owner or non-owner.',
      direction: 'risk',
      evidenceCount: 11,
    },
    {
      id: 'case_quality_and_synthesis',
      title: 'Case quality and synthesis',
      takeaway: 'The data gap is the finding: without a tax anchor, no defensible determination is possible.',
      detail:
        'No property-tax records exist for the subject, eliminating the primary anchor for owner identification and mortgage status. Four individuals appear in identity and utility records; two lack any second-source corroboration. The absence of tax, loan, driver and vehicle records prevents a defensible owner-versus-renter determination; the case reads as an ordinary household whose ownership simply isn’t on file.',
      direction: 'quality',
      evidenceCount: 18,
    },
  ],
  occupancyHistory: [
    {
      name: 'Della H. Brown',
      relationship: 'unrelated',
      sources: ['BASE', 'TRACE'],
      summary: '8–10 years of corroborated tenure across identity and address-history records; relationship to any owner unknown; no owner is on file.',
    },
    {
      name: 'Michael Smith',
      relationship: 'unrelated',
      sources: ['BASE', 'TRACE'],
      summary: '8–10 years of corroborated tenure across identity and address-history records; relationship to any owner unknown.',
    },
    {
      name: 'Betty S. Simpson',
      relationship: 'unrelated',
      sources: ['UTILITY'],
      summary: 'Utility accounts only; no corroboration from any other source.',
    },
    {
      name: 'Joyce A. Brown',
      relationship: 'unrelated',
      sources: ['UTILITY'],
      summary: 'Utility accounts only; no corroboration from any other source.',
    },
  ],
  evidenceRecords: [
    { source: 'BASE', rowid: null, tone: 'neutral', summary: 'Della H. Brown; identity/residence record with 8–10 year tenure at the subject.' },
    { source: 'BASE', rowid: null, tone: 'neutral', summary: 'Michael Smith; identity/residence record with 8–10 year tenure at the subject.' },
    { source: 'UTILITY', rowid: null, tone: 'neutral', summary: 'Betty S. Simpson and Joyce A. Brown; utility accounts only; no second source.' },
  ],
  sourceCounts: [
    { label: 'Utility', count: 3 },
    { label: 'Trace', count: 2 },
    { label: 'Base', count: 2 },
    { label: 'Loan', count: 0 },
    { label: 'Drive', count: 0 },
    { label: 'Auto', count: 0 },
    { label: 'Tax', count: 0 },
  ],
  evidencePack: [
    { source: 'TAX', summary: 'No property-tax record exists for 647 Chestnut St; ownership cannot be established.' },
    { source: 'BASE', summary: 'Della H. Brown; identity/residence record, 8–10 year tenure at the subject.' },
    { source: 'BASE', summary: 'Michael Smith; identity/residence record, 8–10 year tenure at the subject.' },
    { source: 'UTILITY', summary: 'Betty S. Simpson and Joyce A. Brown; utility accounts only; no corroboration in any other source.' },
  ],
  ownershipTimeline: {
    currentOwner: 'Unknown (no tax record on file)',
    currentStatus: 'unknown',
    currentStatusLabel: 'Ownership unknown',
    segments: [
      { label: 'Occupied · ownership unknown', sublabel: '~2016 – today', status: 'unknown', weight: 100 },
    ],
    events: [
      { at: '~2016', title: 'Earliest corroborated tenure; Della H. Brown and Michael Smith (8–10 years)' },
      { at: 'Undated', title: 'Four utility account holders; two with no other corroboration' },
      { at: 'Today', title: 'No tax record on file; the owner cannot be established' },
    ],
  },
  runMeta: {
    jobId: '647-chestnut-st-40508',
    runAt: '2026-09-06 14:12 UTC',
    durationLabel: '58 sec',
    sourcesChecked: ['Base', 'Trace', 'Utility'],
    evidenceRefsCount: 19,
  },
};

// Route → case mapping. Each listing scenario is paired with the batch-run
// case that exercises a different arm of the combined read:
//   high   (listings: Rented)        × non-owner·strong  → corroboration, RED
//   medium (listings: Likely Rented) × conflicting·mod   → review, AMBER
//   low    (listings: Not Rented)    × no-signal·weak    → both quiet, GREY
const AI_INVESTIGATIONS: Record<ScenarioKey, AIInvestigationResult> = {
  low: AI_INVESTIGATION_LOW_EVIDENCE,
  medium: AI_INVESTIGATION_DEEP_DIVE,
  high: AI_INVESTIGATION_ABSENTEE,
};

/**
 * Run an AI investigation against a scenario. Resolves with the result
 * after the two mock loading steps have elapsed.
 *
 * Backend swap point: replace the timed Promise chain below with a real
 * fetch (or SSE consumer) that emits step transitions via the
 * `onStep` callback. The hook/bus below already handles
 * 'loading-step-1' → 'loading-step-2' → 'success' / 'error' transitions
 * on the same callback contract.
 */
function runAIInvestigation(
  scenarioId: ScenarioKey,
  onStep?: (step: 1 | 2) => void
): Promise<AIInvestigationResult> {
  return new Promise((resolve) => {
    onStep?.(1);
    window.setTimeout(() => {
      onStep?.(2);
      window.setTimeout(() => {
        resolve(AI_INVESTIGATIONS[scenarioId]);
      }, AI_STEP_2_MS);
    }, AI_STEP_1_MS);
  });
}

// -------------------------------------------------------------------------
// Persistence.
//
// The report is generated once per scan and is never re-run, so it has to
// outlive the result screen's mount — otherwise navigating away and back
// shows an action the user can never take again as "never taken", which
// on an irreversible action is data loss, not a cosmetic bug.
//
// Two layers, mirroring the scanReference field in ConfidenceHero:
//   * sessionStorage.occupancyReports — keyed by scenario, so moving
//     between /result/high and /result/low keeps each scan's own report.
//   * AppState history entry — patched by the caller via
//     setSingleScanReport when the result was opened from /history and a
//     scanHistoryId is in session. Fresh scans are session-only.

const AI_STORE_KEY = 'occupancyReports';

interface StoredReport {
  result: AIInvestigationResult;
  /** ISO timestamp. Formatted for display by formatReportDate below —
   *  a frozen artifact needs a date or a reader six months later has no
   *  way to judge how stale it is. */
  generatedAt: string;
}

type StoredReports = Partial<Record<ScenarioKey, StoredReport>>;

function readStoredReports(): StoredReports {
  if (typeof sessionStorage === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(AI_STORE_KEY) || '{}') as StoredReports;
  } catch {
    // A corrupt blob must not take the result page down with it.
    return {};
  }
}

function writeStoredReport(scenario: ScenarioKey, report: StoredReport) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      AI_STORE_KEY,
      JSON.stringify({ ...readStoredReports(), [scenario]: report })
    );
    // Let listeners outside the AI bus (e.g. ScanContextBar's Download menu)
    // know a report now exists for this scan, so the "Occupancy report (AI)"
    // download item can enable itself without a manual refresh.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('halcyon:occupancyreport', { detail: { scenario } }));
    }
  } catch {
    // Quota or private-mode failure. The in-memory bus still holds the
    // report for this mount; losing the session copy is survivable.
  }
}

/** "21 Jul 2026" — matches the date voice used on history rows. */
function formatReportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
}

// -------------------------------------------------------------------------
// Shared state bus. The run CTA and the report both live in the same slot
// on the result page (docs/DESIGN.md §14.9 previously put the CTA in
// ScanContextBar; moving it into the slot was approved 2026-07-21 so the
// button and its outcome occupy one place). The bus is still shared so the
// NotificationDock can mirror an in-flight run when the user navigates away.
//
// `reports` is the frozen record. `status` only ever describes a live run;
// a scenario with a stored report is complete regardless of what status
// says, which is what getAIReport() below encodes.

type AIStatus =
  | 'idle'
  | 'loading-step-1'
  | 'loading-step-2'
  | 'success'
  | 'error';

interface AIBusState {
  status: AIStatus;
  scenario: ScenarioKey | null;
  result: AIInvestigationResult | null;
  errorMessage: string;
  /** Monotonic id used to ignore stale async resolutions when a newer
   *  run has started (e.g. the user retries a failed run mid-flight). */
  runId: number;
  /** Frozen reports, seeded from sessionStorage on boot. */
  reports: StoredReports;
}

const __aiInitial: AIBusState = {
  status: 'idle',
  scenario: null,
  result: null,
  errorMessage: '',
  runId: 0,
  reports: {},
};

let __aiState: AIBusState = { ...__aiInitial, reports: readStoredReports() };
const __aiListeners = new Set<(s: AIBusState) => void>();

function __setAI(next: Partial<AIBusState>) {
  __aiState = { ...__aiState, ...next };
  __aiListeners.forEach((l) => l(__aiState));
}

/** Kick off an investigation against the given scenario. Idempotent —
 *  re-calling while one is in flight starts a fresh run. */
function startAIInvestigation(scenario: ScenarioKey) {
  const runId = __aiState.runId + 1;
  __setAI({
    status: 'loading-step-1',
    scenario,
    result: null,
    errorMessage: '',
    runId,
  });
  runAIInvestigation(scenario, (step) => {
    if (__aiState.runId !== runId) return;
    if (step === 2) __setAI({ status: 'loading-step-2' });
  })
    .then((res) => {
      if (__aiState.runId !== runId) return;
      const report: StoredReport = {
        result: res,
        generatedAt: new Date().toISOString(),
      };
      writeStoredReport(scenario, report);
      __setAI({
        status: 'success',
        result: res,
        reports: { ...__aiState.reports, [scenario]: report },
      });
    })
    .catch((err: unknown) => {
      if (__aiState.runId !== runId) return;
      // A failed run must not consume the scan's one report — nothing is
      // written to storage here, so the slot returns to its runnable state
      // behind the retry. See the error copy in AIInvestigator.
      __setAI({
        status: 'error',
        errorMessage:
          err instanceof Error && err.message ? err.message : 'network error',
      });
    });
}

/** The frozen report for a scenario, or undefined if it was never run. */
function getAIReport(scenario: ScenarioKey): StoredReport | undefined {
  return __aiState.reports[scenario];
}

/** Clear the live run state without touching stored reports. Called when
 *  the viewed scenario changes so a failed run on /result/high doesn't
 *  bleed onto /result/low. */
function resetAIInvestigation() {
  __setAI({
    status: 'idle',
    scenario: null,
    result: null,
    errorMessage: '',
    runId: __aiState.runId + 1,
  });
}

// -------------------------------------------------------------------------
// Demo override.
//
// Every result in this prototype is hardcoded and runAIInvestigation never
// rejects, so the error state is unreachable by clicking. A query param on
// any result route forces a state so it can be reviewed in the running app
// rather than only in states-spec.html:
//
//   #/result/high?ai=error      the failed run + retry
//   #/result/high?ai=loading    the six-substep progress card
//   #/result/high?ai=success    a completed report without waiting
//
// HashRouter puts the query after the hash, so this reads the router's
// search string rather than window.location.search.

type AIDemoStatus = 'idle' | 'loading' | 'success' | 'error';

function parseAIDemoStatus(search: string): AIDemoStatus | null {
  if (!search) return null;
  const value = new URLSearchParams(search).get('ai');
  return value === 'idle' ||
    value === 'loading' ||
    value === 'success' ||
    value === 'error'
    ? value
    : null;
}

/** React hook — subscribe to the bus. The body component uses this to
 *  render its current state; the NotificationDock uses it to mirror an
 *  in-flight run once the user has navigated away from the result page. */
function useAIInvestigator(): AIBusState {
  const [state, setState] = React.useState<AIBusState>(__aiState);
  React.useEffect(() => {
    const listener = (s: AIBusState) => setState(s);
    __aiListeners.add(listener);
    // Pick up any state that changed between render and effect mount.
    if (__aiState !== state) setState(__aiState);
    return () => {
      __aiListeners.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
