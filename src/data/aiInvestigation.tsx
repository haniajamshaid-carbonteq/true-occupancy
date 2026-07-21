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
  /** Imperative one-liner — the only thing the reader is asked to DO. Leads
   *  the action block; `nextStep` carries the qualifying detail underneath. */
  nextStepLead: string;
  nextStep: string;
  /** The "this doesn't determine rental status" caveat, stated ONCE as a
   *  panel footnote. It used to appear three times — in `summary`, inside
   *  `nextStep`, and again above the signal columns — which trained readers
   *  to skip all three. */
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
  dataGaps: Array<{ group: string; items: string[] }>;
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
  score: 5,
  scoreMax: 10,
  rawScore: 6,
  clarityScore: 4,
  clarityMax: 10,
  clarityLabel: 'Low',
  caseArchetype: 'Ambiguous non-owner occupancy',
  summary:
    'Owner presence is supported by utility and long-term residence records, but unrelated occupants and renter-coded loan records create enough ambiguity to warrant review.',
  nextStepLead: 'Route this case for human review',
  nextStep:
    'Resolves with newer occupancy dates, public listing evidence, voter or driver records, or utility service periods that clarify who currently occupies the property.',
  scopeNote:
    'Local records support owner-occupancy review only. None of the above determines rental status without public listing evidence.',
  riskSignals: [
    "DONALD CAIN appears in a loan record at the subject address with own_rent='0' renter coding.",
    'Owner mailing address differs from the subject property address.',
    'Multiple unrelated people appear at the property across loan, base, trace, and utility records.',
  ],
  mitigatingSignals: [
    'Owner WINKFIELD has utility service at the subject address.',
    'Owner has a 10-year residence signal at the property.',
    'Mailing-address separation alone is not enough to classify the owner as absent.',
  ],
  whyNotHigher: [
    'Owner utility service and long-term residence evidence contradict a clear absentee-owner classification.',
    'Missing service dates and person-name ambiguities prevent confidence that non-owner occupancy is current, unrelated, or rental-tied.',
  ],
  whyNotLower: [
    "A non-owner loan record coded as renter establishes a non-owner occupancy pattern that requires oversight.",
    'Owner mailing separation plus concurrent non-owner records means the case is not definitively owner-occupied.',
  ],
  checks: [
    { id: 'property_tax_context', label: 'Property tax context', status: 'context', confidence: 'High', score: 0, evidenceCount: 14, caveatCount: 0 },
    { id: 'owner_identity_and_mailing', label: 'Owner identity and mailing', status: 'triggered', confidence: 'High', score: 6, evidenceCount: 14, caveatCount: 6 },
    { id: 'subject_occupancy_surfaces', label: 'Subject occupancy surfaces', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 12, caveatCount: 4 },
    { id: 'loan_tenure', label: 'Loan tenure', status: 'not_triggered', confidence: 'High', score: 0, evidenceCount: 5, caveatCount: 3 },
    { id: 'portfolio_and_primary_comparison', label: 'Portfolio and primary comparison', status: 'not_triggered', confidence: 'High', score: 0, evidenceCount: 9, caveatCount: 2 },
    { id: 'case_quality_and_synthesis', label: 'Case quality and synthesis', status: 'inconclusive', confidence: 'Medium', score: 0, evidenceCount: 12, caveatCount: 5 },
  ],
  dataGaps: [
    {
      group: 'Missing sources',
      items: ['No driver records found at the selected address.', 'No voter records found at the selected address.', 'No auto rows found at the selected address.'],
    },
    {
      group: 'Unclear timing',
      items: ['Utility and trace records do not include explicit service dates.', 'Base length-of-residence is accumulated years, not a dated occupancy timeline.'],
    },
    {
      group: 'Identity ambiguity',
      items: ['Some person records have incomplete DOBs or name variants.', "CAIN's own_rent coding is mixed across loan rows."],
    },
  ],
  occupancyHistory: [
    {
      name: 'Donald R. Cain',
      relationship: 'unrelated',
      sources: ['BASE', 'LOAN'],
      summary: 'This person also appears connected to another primary address. Their association with this property adds context for review.',
    },
    {
      name: 'Sheila Shankle',
      relationship: 'unrelated',
      sources: ['BASE', 'TRACE'],
      summary: 'This person has appeared in connection with the address over time, though some identifying details are incomplete.',
      lengthOfResidence: '7 yr LOR',
      primary: true,
    },
    {
      name: 'James Fairchild',
      relationship: 'unrelated',
      sources: ['UTILITY'],
      summary: 'This name appears in limited address associations, with some variation in the match.',
    },
    {
      name: 'Jerahmy S. Winkfield',
      relationship: 'owner',
      sources: ['BASE', 'TAX', 'TRACE', 'UTILITY'],
      summary: 'The owner is also associated with this property through longer-running address activity.',
      lengthOfResidence: '10 yr LOR',
    },
  ],
  evidenceRecords: [
    { source: 'TAX', rowid: 68344, tone: 'risk', summary: 'Owner WINKFIELD mailing address is 209 FALCON DR, while situs is 1552 SAMARA GLEN WAY.' },
    { source: 'LOAN', rowid: 74143, tone: 'risk', summary: "DONALD CAIN appears at the subject address with own_rent='0' renter coding." },
    { source: 'BASE', rowid: 175557, tone: 'risk', summary: 'SHEILA SHANKLE has primary-address evidence at the subject with 7-year length of residence.' },
    { source: 'UTILITY', rowid: 1296784, tone: 'mitigating', summary: 'Owner JERAHMY WINKFIELD has a utility account at the subject address.' },
    { source: 'BASE', rowid: 81239, tone: 'mitigating', summary: 'Owner JEREHMY WINKFIELD is recorded at the subject with 10-year residence length.' },
    { source: 'TRACE', rowid: 433909, tone: 'neutral', summary: 'SHEILA SHANKLE trace record appears at subject, but DOB year is missing.' },
  ],
  runMeta: {
    jobId: '4c260cb7-4c6c-48b8-9691-b01f34c2f8d4',
    runAt: '2026-07-09 16:12 UTC',
    durationLabel: '1 min 37 sec',
    sourcesChecked: ['Tax', 'Base', 'Loan', 'Trace', 'Utility'],
    evidenceRefsCount: 66,
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

type AIDemoStatus = 'loading' | 'success' | 'error';

function parseAIDemoStatus(search: string): AIDemoStatus | null {
  if (!search) return null;
  const value = new URLSearchParams(search).get('ai');
  return value === 'loading' || value === 'success' || value === 'error'
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
