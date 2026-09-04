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
   *  three-page backing. Derived in this prototype; a real backend fills a
   *  dedicated `executive_summary` field and this becomes a straight map. */
  executiveSummary?: string[];
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
    currentStatus: 'owner' | 'rental' | 'inconclusive';
    currentStatusLabel: string;
    segments: Array<{
      label: string;
      sublabel: string;
      status: 'owner' | 'rental' | 'inconclusive' | 'unknown';
      weight: number;
    }>;
    events: Array<{ at: string; title: string }>;
  };
  runMeta: {
    jobId: string;
    runAt: string;
    durationLabel: string;
    sourcesChecked: string[];
    evidenceRefsCount: number;
  };
}

// Loading-step timings. Constant here so the prototype animation is
// deterministic; a real backend would drive these via SSE / polling.
const AI_STEP_1_MS = 3600; // "Retrieving property, owner & STR evidence"
const AI_STEP_2_MS = 2800; // "Analyzing evidence & generating report"

const AI_INVESTIGATION_DEEP_DIVE: AIInvestigationResult = {
  verdictBand: 'review',
  recommendationLabel: 'Review',
  score: 8,
  scoreMax: 10,
  rawScore: 13,
  clarityScore: 4,
  clarityMax: 10,
  clarityLabel: 'Low',
  caseArchetype: 'Ambiguous non-owner occupancy',
  summary:
    'The tax and base records confirm the owners (the Lee couple) at the address, with the mailing address on the property itself plus a 2016 purchase and 2018 refinance. Against that, 16 utility and 29 trace records place nine or more unrelated people at a single-family home, corroborated by a non-owner vehicle registration and two Airbnb listings. The pattern fits either active rental operation or dense multi-occupancy, but the records that would settle it are undated or stale (the tax record is from 2018), so current occupancy cannot be determined automatically.',
  scopeNote:
    'These are investigative leads, not a fraud determination. Local records support an occupancy review only; none of them determines rental status on its own.',
  // Fact-first, per Erin (2026-09-03): lead with what we found, cite the
  // record counts as support rather than opening on the quantity.
  riskSignals: [
    'Nine or more unrelated people appear as occupants at a single-family home — corroborated across 16 utility and 29 trace records.',
    'A non-owner (Adriana DeCastro) is auto-registered at the address, and two Airbnb listings match it at 100% and 50% address confidence.',
  ],
  mitigatingSignals: [
    'The records placing non-owners here carry no service dates, and the tax record is six years stale (2018) — neither confirms present-day occupancy.',
    'The owners mail to the property itself, with a 2016 purchase and 2018 refinance on file — genuine owner-presence evidence.',
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
    'The owners (the Lee couple) are documented at the address, but nine or more unrelated people also appear as occupants — the case cannot be settled automatically.',
    'Two Airbnb listings and a non-owner vehicle registration at the address point to possible rental use.',
    'The records that would confirm current occupancy are undated or stale (tax record is from 2018), so present-day status is unproven.',
    'Recommended next step: manual review by a person before any determination.',
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
        'The owners mail to the property itself, yet nine or more unrelated non-owners appear across utility and trace — consistent with either dense multi-occupancy or rental use.',
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
        '17 Monmouth Ave is a residential single-family home (4 bed / 2.5 bath) held by individuals (Jaems and Christina Lee), not an entity or trust. The tax record shows 3 liens totaling $264,438 as of Oct 2018, with LoanDepot.com LLC as the primary lender; base records show a 2016 purchase at $276k and a 2018 refinance at $271k. There are no foreclosure or distress markers. Ownership is stable and conventionally financed — which frames the dense non-owner occupancy as the item that needs verifying, rather than the ownership itself.',
      direction: 'context',
      evidenceCount: 4,
    },
    {
      id: 'owner_identity_and_mailing',
      title: 'Owner identity and mailing',
      takeaway: 'The owners are documented on-site and mail to the property, yet 9+ unrelated people share the address.',
      detail:
        'Tax owners Jaems and Christina Lee are confirmed at the subject with the mailing address on the property itself, and Christina L Lee carries a high homeowner probability in base records — strong owner-presence evidence. Coexisting with that, Adriana DeCastro appears consistently across auto, trace and utility, and multiple unrelated non-owners (April Madayag, Cynthia Elhendawi, Anthony Madayag, John Dixon, Margaret Kahl, Barbara Werner, Cynthia Roberson) appear across utility and trace. Owner-present with the mailing at the subject, but 9+ unrelated occupants, is what produces the occupancy-risk profile.',
      direction: 'risk',
      evidenceCount: 13,
    },
    {
      id: 'subject_occupancy_surfaces',
      title: 'Subject occupancy surfaces',
      takeaway: 'Non-owner utility, trace and auto records place many other people here, but none carry service dates.',
      detail:
        'Nine distinct non-owner utility account holders appear at the subject, plus multiple non-owner trace records and two auto registrations for non-owner Adriana DeCastro (2019 Nissan). Owner James Lee appears in trace (likely family), but there is no owner utility presence. The combination of distinct non-owner utility names, corroborating trace records and a non-owner vehicle registration indicates active non-owner presence; two short-term-rental listings add rental-market context. The limitation is timing — the tax record is stale (Oct 2018) and the utility/trace records are undated, so current occupancy can’t be established.',
      direction: 'risk',
      evidenceCount: 21,
    },
    {
      id: 'legal_address_presence',
      title: 'Legal-address presence',
      takeaway: 'No drive records exist, and the only auto registrations belong to a non-owner — this path can’t be scored.',
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
        'Jaems Lee appears in only two property-owner records — the subject in New Jersey and one in Texas — a footprint too small to establish a multi-property or portfolio risk pattern. This check does not add risk on its own.',
      direction: 'mitigation',
      evidenceCount: 1,
    },
    {
      id: 'case_quality_and_synthesis',
      title: 'Case quality and synthesis',
      takeaway: 'Owner identity is clear, but stale and undated records block a confident occupancy determination.',
      detail:
        'Owner identity is clear (James/Jaems and Christina Lee), but occupancy status can’t be reliably determined. Mortgage/lien exposure is stale (tax recorded Oct 2018). No records carry occupancy dates: base records lack them, trace and utility records are undated, and there are no driver or loan records to anchor the claim. Name ambiguity is partly resolved (the DeCastro/De Castro/Castro variants are one person; James/Jaems Lee are the same), but Willer Castro shows an 8-year base residence yet is absent from tax with a different DOB — his role is undefined. A plausible owner-occupancy narrative is contradicted by high-volume non-owner signals and probable STR use, without dated evidence to reconcile them.',
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
      summary: 'The most persistent non-owner here — appears across a 2019 vehicle registration, utility accounts and many trace records with a consistent phone and DOB.',
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
    { source: 'BASE', rowid: null, tone: 'mitigating', summary: 'Christina L Lee — 2016 purchase at $276k; $271k mortgage (Mortgage Master); 2018 refinance $271k (LoanDepot).' },
    { source: 'AUTO', rowid: null, tone: 'risk', summary: 'Non-owner Adriana DeCastro — 2019 Nissan registered at 17 Monmouth Ave (2 records).' },
    { source: 'UTILITY', rowid: null, tone: 'risk', summary: 'Nine distinct non-owner utility account holders at the subject, several with dated DOBs.' },
    { source: 'TRACE', rowid: null, tone: 'risk', summary: '29 trace records place multiple unrelated people at the address; none carry service dates.' },
    { source: 'BASE', rowid: null, tone: 'neutral', summary: 'Willer Castro — base record at ZIP 07748 with an 8-year residence; not in the tax owner record.' },
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
    { source: 'BASE', summary: 'Christina L Lee — purchase year 2016, purchase price $276k, $271k mortgage (Mortgage Master), 2018 refinance $271k (LoanDepot.com LLC).' },
    { source: 'BASE', summary: 'James A Lee — same mortgage and refinance evidence as Christina L Lee.' },
    { source: 'BASE', summary: 'Willer Castro — base record at ZIP 07748; 8-year residence; not present in the tax owner record.' },
    { source: 'AUTO', summary: 'Adriana DeCastro — 2019 Nissan registered at 17 Monmouth Ave (2 records); no owner auto registration exists.' },
    { source: 'PORTFOLIO', summary: 'Jaems Lee appears in only 2 property-owner records — the subject (NJ) and one in Texas; portfolio too small for a multi-property risk pattern.' },
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
  runMeta: {
    jobId: '7cc36da0-7760-4ae5-ad0b-60ae7d33f252',
    runAt: '2026-09-02 16:22 UTC',
    durationLabel: '2 min 11 sec',
    sourcesChecked: ['Tax', 'Base', 'Trace', 'Utility', 'Auto'],
    evidenceRefsCount: 47,
  },
};

const AI_INVESTIGATIONS: Record<ScenarioKey, AIInvestigationResult> = {
  low: AI_INVESTIGATION_DEEP_DIVE,
  medium: AI_INVESTIGATION_DEEP_DIVE,
  high: AI_INVESTIGATION_DEEP_DIVE,
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
