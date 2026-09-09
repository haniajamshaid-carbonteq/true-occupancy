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
  /** The run's own `score_breakdown.final_score` (risk + mitigation +
   *  quality points). Internal: it is what `verdictBand` is banded from, and
   *  it is NOT rendered. The calibrated occupancy score and evidence-clarity
   *  grade that used to sit beside it were dropped from every surface
   *  (client ask, 2026-09-09) in favour of `corroboration.agreement`, the
   *  only 0-100 figure the run actually emits. */
  rawScore: number;
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
   *  plain strings render as context for backward compatibility.
   *
   *  Do NOT close these with a "Next step: …" bullet. The directive is
   *  derived once from `verdictBand` (AI_BAND_NEXT_STEP) and rendered as its
   *  own block on every surface — on PDF page 1 it sat ten points above the
   *  callout saying the same thing twice. */
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
    /** Categorical strength (older runs). Newer runs carry the numeric
     *  strengthScore instead; occStrengthCategory() resolves either. */
    strength?: 'weak' | 'moderate' | 'strong';
    /** 0-10 nonowner_occupancy_strength from the WITH-AGREEMENT run shape. */
    strengthScore?: number;
    reasoning: string;
    drivingHeuristicIds: string[];
  };
  /** The backend's own scan-vs-records tie (top-level `corroboration` in the
   *  WITH-AGREEMENT run shape): the listing-scan verdict, a 0-100 agreement
   *  figure, and a categorical state. When present it REPLACES the
   *  client-derived listing lens and synthesis in the combined read; older
   *  runs without it fall back to the derived pair. */
  corroboration?: {
    scanVerdict: 'rented' | 'likely' | 'not_rented' | 'inconclusive';
    agreement: number;
    state: 'agree' | 'mixed' | 'disagree';
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

/** Resolve a strength category from either shape: the categorical field
 *  (older runs) or the 0-10 nonowner_occupancy_strength (WITH-AGREEMENT
 *  runs). Bands: 8+ strong, 4-7 moderate, under 4 weak. */
function occStrengthCategory(sig: {
  strength?: 'weak' | 'moderate' | 'strong';
  strengthScore?: number;
}): 'weak' | 'moderate' | 'strong' {
  if (typeof sig.strengthScore === 'number') {
    return sig.strengthScore >= 8 ? 'strong' : sig.strengthScore >= 4 ? 'moderate' : 'weak';
  }
  return sig.strength || 'weak';
}

/** Display label for a backend scan verdict. */
const OCC_SCAN_VERDICT_LABEL: Record<string, string> = {
  rented: 'Rented',
  likely: 'Likely Rented',
  not_rented: 'Not Rented',
  inconclusive: 'Inconclusive',
};

const OCC_CORROBORATION_META: Record<
  'agree' | 'mixed' | 'disagree',
  { label: string; shortLabel: string; tone: OccSignalTone; line: string }
> = {
  agree: {
    label: 'Aligned evidence',
    shortLabel: 'Aligned',
    tone: 'clean',
    line: 'the listing scan and the records agree',
  },
  mixed: {
    label: 'Mixed evidence',
    shortLabel: 'Mixed',
    tone: 'warn',
    line: 'the listing scan and the records partly agree',
  },
  disagree: {
    label: 'Conflicting evidence',
    shortLabel: 'Conflicting',
    tone: 'risk',
    line: 'the listing scan and the records disagree',
  },
};

/** Synthesis line when the backend supplies its own corroboration verdict.
 *  Says what the tie MEANS; it deliberately does not restate the agreement
 *  figure, which every surface now renders as a score of its own. Printing
 *  it in both places put the same number on screen twice. */
function occCorroborationLine(state: 'agree' | 'mixed' | 'disagree'): string {
  if (state === 'agree') return 'The listing scan and the records agree.';
  if (state === 'disagree')
    return 'The listing scan and the records disagree. Review before acting.';
  return 'The listing scan and the records partly agree, so a person should review.';
}

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
  // Raw score follows the NEWER full run of this address
  // (demo-response-full, 2026-09), not the older summary.
  rawScore: 11,
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
    strengthScore: 6,
    reasoning:
      'Tax and identity records establish the Lee couple at the subject with the mailing address on the property itself, while utility and address-history records document nine or more unrelated occupants. Both readings rest on substantive records; missing service dates make it impossible to order them in time.',
    drivingHeuristicIds: [
      'owner_identity_and_mailing',
      'subject_occupancy_surfaces',
      'case_quality_and_synthesis',
    ],
  },
  corroboration: { scanVerdict: 'likely', agreement: 60, state: 'mixed' },
  runMeta: {
    jobId: '7cc36da0-7760-4ae5-ad0b-60ae7d33f252',
    runAt: '2026-09-02 16:22 UTC',
    durationLabel: '2 min 11 sec',
    sourcesChecked: ['Tax', 'Base', 'Trace', 'Utility', 'Auto'],
    evidenceRefsCount: 47,
  },
};

// -------------------------------------------------------------------------
// 1105 Clovelly Ct, Lexington KY 40517 — the RED case, from the 2026-09-08
// WITH-AGREEMENT run. The tax owner holds title and mails to the subject
// itself, but six unrelated people hold the utility accounts and one of
// them filed a mortgage application reporting "OWN". Both readings rest on
// real rows and nothing is dated, so the records read `conflicting` while
// the band still lands at high_priority_review.
//
// Paired with the 'high' listing scenario: the scan says Rented, the
// records say conflicting, and the run's own `corroboration` block ties the
// two at 60 — mixed. That agreement figure is the score this case surfaces;
// the run emits no clarity grade and its raw 27 points are internal.
const AI_INVESTIGATION_MIXED: AIInvestigationResult = {
  verdictBand: 'high_priority_review',
  recommendationLabel: 'Priority review',
  // score_breakdown: risk 27 + mitigation 0 + quality 0 = 27, band
  // high_priority_review. Kept for the record; the surfaced score is
  // `corroboration.agreement`, which is the only 0-100 figure the run emits.
  rawScore: 27,
  caseArchetype: 'Mixed evidence',
  summary:
    'The property-tax owner (Catherine Furry) maintains a mailing address at the subject and holds title with a high homeowner-probability rating and a 4-year residence tenure, but appears absent from occupancy records. Six unrelated individuals occupy the property with corroborating utility service accounts and address-history records, and a non-owner (Brett Richardson) filed a mortgage application claiming ownership status: a direct tenure mismatch. The records present substantive evidence of both owner presence and non-owner occupancy, creating a conflicting occupancy signal that the available data cannot resolve. Stale tax records (2017), identity ambiguity for Brett Richardson, and the absence of occupancy dates prevent a definitive determination.',
  scopeNote:
    'These are investigative leads, not a fraud determination. Local records support an occupancy review only; none of them determines rental status on its own.',
  riskSignals: [
    'A non-owner (Brett Richardson) filed a mortgage application at this address reporting "OWN" status, contradicting the owner named on the tax record.',
    'Six unrelated people hold utility service accounts here — Brett Richardson, Brent Music, Michael D. Smith, Thomas Richardson, Sheila L. Richardson and Sarah Anne Novotny — corroborated across 35 address-history records.',
    'The same non-owner holds three Kentucky driver licences at the address. The tax owner holds none, and has no utility or address-history presence at all.',
  ],
  mitigatingSignals: [
    'The tax owner, Catherine Furry, mails to the subject address itself and carries a homeowner-probability rating of 9 with a 4-year residence tenure in identity records.',
    'No portfolio pattern exists: a search of every Furry-surname tax record in Lexington returned this address only, and no lien, foreclosure or distress marker appears.',
  ],
  whyNotHigher: [
    'Identity ambiguity for Brett Richardson — conflicting birth years across base versus trace and utility records — and the absence of dated occupancy records prevent escalation to a clear absentee rental.',
    'The tax record is stale (September 2017); current ownership and mortgage status are unknown, which limits confidence in the owner-presence signal.',
  ],
  whyNotLower: [
    'A non-owner loan application claiming ownership, corroborated by driver-licence and utility records, is a direct occupancy-tenure risk that warrants priority review.',
    'Multiple unrelated occupants with utility accounts and address-history records corroborate non-owner occupancy across independent source types.',
  ],
  executiveSummary: [
    { text: 'A non-owner living at this address filed a mortgage application claiming to own it. The tax record names someone else.', tone: 'concern' },
    { text: 'Six unrelated people hold utility accounts at this single-family home. None of them is the owner.', tone: 'concern' },
    { text: 'The owner, Catherine Furry, still mails to this address and reads as a homeowner in identity records, so owner presence is not ruled out.', tone: 'mitigating' },
    { text: 'Nothing in the occupancy records carries a date, so owner presence and non-owner occupancy cannot be ordered in time.', tone: 'info' },
  ],
  occupancySignal: {
    signal: 'conflicting',
    strengthScore: 6,
    reasoning:
      'Property-tax records establish Catherine Furry as the owner with mailing address at the subject, and base identity records show high homeowner probability and 4 years of residence, supporting owner presence. Simultaneously six unrelated individuals appear in utility service accounts and address-history records at the same address, and Brett Richardson filed a mortgage application claiming ownership status. Both readings rest on real rows; the records cannot be ordered in time to determine which occupancy is current.',
    drivingHeuristicIds: [
      'owner_identity_and_mailing',
      'subject_occupancy_surfaces',
      'legal_address_presence',
      'loan_tenure',
    ],
  },
  corroboration: { scanVerdict: 'rented', agreement: 60, state: 'mixed' },
  checks: [
    { id: 'property_tax_context', label: 'Property tax context', status: 'context', confidence: 'Medium', score: 3, evidenceCount: 40, caveatCount: 5 },
    { id: 'owner_identity_and_mailing', label: 'Owner identity and mailing', status: 'triggered', confidence: 'High', score: 7, evidenceCount: 40, caveatCount: 4 },
    { id: 'subject_occupancy_surfaces', label: 'Subject occupancy surfaces', status: 'triggered', confidence: 'High', score: 7, evidenceCount: 40, caveatCount: 5 },
    { id: 'legal_address_presence', label: 'Legal-address presence', status: 'triggered', confidence: 'High', score: 6, evidenceCount: 40, caveatCount: 4 },
    { id: 'loan_tenure', label: 'Loan tenure', status: 'triggered', confidence: 'High', score: 7, evidenceCount: 21, caveatCount: 5 },
    { id: 'portfolio_and_primary_comparison', label: 'Portfolio and primary comparison', status: 'not_triggered', confidence: 'High', score: 0, evidenceCount: 40, caveatCount: 4 },
    { id: 'case_quality_and_synthesis', label: 'Case quality and synthesis', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 40, caveatCount: 6 },
  ],
  dataGaps: [
    {
      group: 'Contradictions',
      kind: 'conflict',
      items: [
        'A non-owner reports "OWN" status on a mortgage application while the tax record names a different owner.',
        'Owner-presence evidence (tax mailing match, homeowner probability 9) and six unrelated utility account holders sit on real records at the same address.',
      ],
    },
    {
      group: 'Records that disagree',
      kind: 'inconsistency',
      items: [
        'Nine base records for Brett Richardson carry birth years of 1945, 1949 or none, while trace and utility records consistently show 1976-04-01: one name, possibly more than one person.',
        'Loan records under that name list different employers and occupations across three applications.',
        'Thomas Richardson appears in 11 near-identical trace records sharing one phone number, which reads as data redundancy rather than distinct occupancy events.',
      ],
    },
    {
      group: 'Missing or undated evidence',
      kind: 'gap',
      items: [
        'The tax record is from September 2017; no mortgage, lien or valuation detail is on file.',
        'Trace and utility records carry no service dates, so occupancy cannot be sequenced against the owner.',
        'No vehicle registration exists at the address for anyone, removing one route to corroborating who lives here.',
      ],
    },
  ],
  detailedAnalysis: [
    {
      id: 'property_tax_context',
      title: 'Property tax context',
      takeaway: 'A single-family home owned by an individual, with no liens — but the tax record is seven years old.',
      detail:
        'The subject is a residential single-family home (not a condo) with no visible liens, foreclosure markers or distress indicators in tax records. The owner is an individual, Catherine Diane Furry, not an entity or trust. The tax recording date is September 2017, seven-plus years old, and base records show Catherine Furry with a homeowner probability of 9 and 4 years of residence, with no mortgage or refinance amounts populated. The presence of multiple unrelated occupants with utility and loan records suggests possible rental use, but the stale recording date limits confidence in current ownership status.',
      direction: 'context',
      evidenceCount: 40,
    },
    {
      id: 'owner_identity_and_mailing',
      title: 'Owner identity and mailing',
      takeaway: 'The owner mails to the property itself, yet six unrelated people hold records here.',
      detail:
        'Tax records identify Catherine Diane Furry as the sole owner with a mailing address matching the subject (1105 Clovelly Ct, Lexington KY 40517), which indicates active owner presence. Against that, the property shows substantial non-owner occupancy: Brett Richardson appears across base, driver-licence, loan and utility records with a loan application claiming ownership; Michael D. Smith appears in base and utility with a high homeowner probability and 15-year residence; Brent Music appears across ten-plus trace records and utility; and Thomas Richardson, Sheila L. Richardson and Sarah Anne Novotny appear in utility records. The Richardsons share a phone number, suggesting a family relationship among themselves, but no surname bridge connects any of them to the owner.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'subject_occupancy_surfaces',
      title: 'Subject occupancy surfaces',
      takeaway: 'Six non-owners hold utility accounts; the owner has no utility or address-history presence.',
      detail:
        'Multiple unrelated non-owners occupy the subject address with strong corroborating evidence while the tax owner shows no occupancy presence. Six distinct non-owner individuals appear in utility service records with dates of birth and phone numbers, indicating active accounts: Sheila Richardson, Brent Music, Brett Richardson, Thomas Richardson, Sarah Novotny and Michael Smith. Address-history records document repeated occupancy by Thomas Richardson, Brent Music and "Brent & Jamie Music". Brett Richardson shows the strongest non-owner presence, appearing across identity records, driver licences, loan applications and utility accounts.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'legal_address_presence',
      title: 'Legal-address presence',
      takeaway: 'A non-owner holds three Kentucky driver licences at the address; the owner holds none.',
      detail:
        'Brett Richardson, an unrelated non-owner, holds three Kentucky driver licences with addresses at the subject property. Those records are correlated with the loan applications in which he reports "OWN" status, and are further corroborated by identity records and utility accounts. The tax owner has no driver-licence or vehicle-registration record at the subject, and no vehicle registrations exist there for anyone. A non-owner holding the legal address while claiming ownership on a loan file is the occupancy-fraud shape.',
      direction: 'risk',
      evidenceCount: 40,
    },
    {
      id: 'loan_tenure',
      title: 'Loan tenure',
      takeaway: 'A non-owner filed a mortgage application at this address reporting "OWN".',
      detail:
        'Brett Richardson, who is not the property-tax owner, filed a loan application at 1105 Clovelly Ct reporting "OWN" status, with a loan amount of $700 against a monthly income of $2,300. That is a direct occupancy-tenure mismatch and the primary risk signal in this case. The identity is confirmed across loan, identity/residence, address-history, utility and licence records, and the address match is exact. The tax owner is present in identity and address-history records at the same address, but owner presence does not neutralise a false ownership claim on a loan file.',
      direction: 'risk',
      evidenceCount: 21,
    },
    {
      id: 'portfolio_and_primary_comparison',
      title: 'Portfolio and primary comparison',
      takeaway: 'No portfolio pattern: the owner is linked to this property and no other.',
      detail:
        'This heuristic does not trigger. Catherine Furry is linked to only one residential property in the local dataset. A search of every Furry-surname tax record in Lexington returned 1105 Clovelly Ct alone, so there is no second liened property and no competing owner-linked property whose owner-presence evidence could outweigh the subject. Her presence here is direct and canonical: tax owner with a matching mailing address, plus a base identity record carrying homeowner probability 9 and 4 years of tenure.',
      direction: 'mitigation',
      evidenceCount: 40,
    },
    {
      id: 'case_quality_and_synthesis',
      title: 'Case quality and synthesis',
      takeaway: 'Stale tax data, an unresolved identity collision and undated records cap what this case can conclude.',
      detail:
        'Case quality is compromised by material gaps. The tax record is stale (September 2017) with no mortgage or lien detail. A critical identity ambiguity exists for Brett Richardson: nine base records show birth years of 1945, 1949 or none, while trace and utility records consistently show 1976-04-01, indicating either data corruption or two people conflated under one name. Occupancy timing cannot be established at all — trace and utility records carry no dates, and base supplies only a snapshot length-of-residence figure. Nine distinct people appear across record types, with "Brent & Jamie Music" recorded jointly in five trace rows and Thomas Richardson in 11 duplicates. Without dated occupancy records or a resolution of the identity collision, the case cannot support a defensible determination either way.',
      direction: 'quality',
      evidenceCount: 40,
    },
  ],
  occupancyHistory: [
    {
      name: 'Catherine Diane Furry',
      relationship: 'owner',
      sources: ['TAX', 'BASE', 'TRACE'],
      summary:
        'Owner of record since September 2017; the mailing address on the tax record is the subject property itself. Homeowner probability 9. No utility, driver-licence or vehicle presence here.',
      lengthOfResidence: '4 years',
      primary: true,
    },
    {
      name: 'Brett Richardson',
      relationship: 'unrelated',
      sources: ['BASE', 'DRIVE', 'LOAN', 'TRACE', 'UTILITY'],
      summary:
        'The strongest non-owner presence: three Kentucky driver licences, three loan applications (one reporting "OWN"), plus identity, address-history and utility records. Birth year conflicts between base (1945/1949) and utility (1976).',
    },
    {
      name: 'Thomas Richardson',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary:
        'Utility account (DOB 1947-01-01, phone 606-271-8638) and repeated address-history records. Also recorded as "Tom Richardson".',
    },
    {
      name: 'Brent Music',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary:
        'Utility account (DOB 1956-09-01) and ten-plus address-history records; also recorded jointly as "Brent & Jamie Music", with no independent record for Jamie.',
    },
    {
      name: 'Michael D. Smith',
      relationship: 'unrelated',
      sources: ['BASE', 'TRACE', 'UTILITY'],
      summary:
        'Identity, address-history and utility records (DOB 1951-06-01), carrying a high homeowner probability and a 15-year residence tenure of his own.',
      lengthOfResidence: '15 years',
    },
    {
      name: 'Sheila L. Richardson',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary:
        'Utility account (DOB 1949-07-01) sharing the phone number 859-271-8638 with Brett and Thomas Richardson.',
    },
    {
      name: 'Sarah Anne Novotny',
      relationship: 'unrelated',
      sources: ['TRACE', 'UTILITY'],
      summary: 'Utility account (DOB 1979-07-10) plus address-history records at the subject.',
    },
  ],
  evidenceRecords: [
    { source: 'LOAN', rowid: 0, tone: 'risk', summary: 'Brett Richardson; mortgage application at 1105 Clovelly Ct reporting "OWN" status; loan amount $700, monthly income $2,300.' },
    { source: 'DRIVE', rowid: null, tone: 'risk', summary: 'Brett Richardson; three Kentucky driver licences at the subject address. The owner holds none.' },
    { source: 'UTILITY', rowid: null, tone: 'risk', summary: 'Six non-owner utility accounts at the subject; the owner has no utility presence.' },
    { source: 'TAX', rowid: 0, tone: 'mitigating', summary: 'Catherine Diane Furry; sole owner; mailing 1105 Clovelly Ct, Lexington KY 40517 — matches the subject; recorded 27 Sep 2017.' },
    { source: 'AUTO', rowid: null, tone: 'neutral', summary: 'No vehicle registration records exist at the subject address for any person.' },
  ],
  sourceCounts: [
    { label: 'Trace', count: 35 },
    { label: 'Base', count: 11 },
    { label: 'Utility', count: 8 },
    { label: 'Drive', count: 3 },
    { label: 'Loan', count: 3 },
    { label: 'Tax', count: 1 },
    { label: 'Auto', count: 0 },
  ],
  evidencePack: [
    { source: 'TAX', summary: 'Catherine Diane Furry; sole owner; mailing 1105 Clovelly Ct, Lexington KY 40517, matching the subject; recorded 27 Sep 2017; residential single-family, no liens or foreclosure markers.' },
    { source: 'LOAN', summary: 'Brett Richardson; mortgage application at 1105 Clovelly Ct reporting "OWN" status; loan amount $700, monthly income $2,300.' },
    { source: 'DRIVE', summary: 'Brett Richardson; three Kentucky driver licences at the subject (293003492, 2930996372, 6108098493), correlated with the loan records.' },
    { source: 'UTILITY', summary: 'Utility accounts at the subject for Brett Richardson (DOB 1976-04-01), Brent Music (1956-09-01), Thomas Richardson (1947-01-01), Sheila L. Richardson (1949-07-01), Sarah Anne Novotny (1979-07-10) and Michael D. Smith (1951-06-01).' },
    { source: 'BASE', summary: 'Catherine Furry; homeowner probability 9, length of residence 4 years. Michael D. Smith; high homeowner probability, 15-year residence. Nine Brett Richardson records with conflicting birth years.' },
    { source: 'TRACE', summary: '35 address-history records at the subject, led by Thomas Richardson and Brent Music; Thomas Richardson accounts for 11 near-identical rows.' },
    { source: 'PORTFOLIO', summary: 'A search of every Furry-surname tax record in Lexington returned 1105 Clovelly Ct only. No second property is linked to the owner.' },
    { source: 'AUTO', summary: 'No vehicle registration records exist at the subject address for any person.' },
  ],
  ownershipTimeline: {
    currentOwner: 'Catherine Diane Furry',
    currentStatus: 'inconclusive',
    currentStatusLabel: 'Occupancy unresolved',
    segments: [
      { label: 'Owner of record · mails to the subject', sublabel: 'Sep 2017 – today', status: 'owner', weight: 45 },
      { label: 'Unrelated occupants on utility & trace', sublabel: 'Undated', status: 'inconclusive', weight: 55 },
    ],
    events: [
      { at: 'Sep 2017', title: 'Tax record: Catherine Diane Furry, mailing at the subject (last record on file)' },
      { at: 'Undated', title: 'Six unrelated people open utility service accounts at the address' },
      { at: 'Undated', title: 'Brett Richardson files a mortgage application reporting "OWN" status' },
      { at: 'Today', title: 'Owner presence and non-owner occupancy both stand on real records; neither can be dated' },
    ],
  },
  runMeta: {
    jobId: '1105-clovelly-ct-40517',
    runAt: '2026-09-08 11:16 UTC',
    durationLabel: '1 min 30 sec',
    sourcesChecked: ['Tax', 'Base', 'Loan', 'Drive', 'Auto', 'Trace', 'Utility'],
    evidenceRefsCount: 261,
  },
};

// -------------------------------------------------------------------------
// 647 Chestnut St — the GREY case from the batch: no tax record at all, so
// ownership cannot be established and the signal is honestly "no read".
// Paired with the 'low' listing scenario (no listings + no records signal).
const AI_INVESTIGATION_LOW_EVIDENCE: AIInvestigationResult = {
  verdictBand: 'low_evidence',
  recommendationLabel: 'No action needed',
  rawScore: 0,
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
  ],
  // No `corroboration` block on purpose: exercises the fallback path where
  // the combined read derives the listing lens client-side.
  occupancySignal: {
    signal: 'no_signal',
    strength: 'weak',
    strengthScore: 2,
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
//   high   (listings: Rented)        × conflicting·6/10  → 60% mixed, RED band
//   medium (listings: Likely Rented) × conflicting·mod   → review, AMBER
//   low    (listings: Not Rented)    × no-signal·weak    → both quiet, GREY
const AI_INVESTIGATIONS: Record<ScenarioKey, AIInvestigationResult> = {
  low: AI_INVESTIGATION_LOW_EVIDENCE,
  medium: AI_INVESTIGATION_DEEP_DIVE,
  high: AI_INVESTIGATION_MIXED,
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
