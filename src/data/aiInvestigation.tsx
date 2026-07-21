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
  nextStep: string;
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
    'Owner presence is supported by utility and long-term residence records, but unrelated occupants and renter-coded loan records create enough ambiguity to warrant review. Local records can support owner-occupancy review, but they do not prove whether the property is a rental.',
  nextStep:
    'Route this case for human review. Do not treat it as a rental determination unless newer occupancy dates, public listing evidence, voter/driver records, or utility service periods clarify who currently occupies the property.',
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
// Shared state bus. The CTA lives in ScanContextBar (top-right, next to
// Download PDF). The result card lives in the page body. They share a
// single source of truth via a module-level state + listener set —
// mirrors the pattern used by CommandPalette for ⌘K open/close.
// `currentScenario` lets the body component reset its view automatically
// when the user navigates between result scenarios.

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
   *  run has started (e.g. user hits "Run again" mid-flight). */
  runId: number;
}

const __aiInitial: AIBusState = {
  status: 'idle',
  scenario: null,
  result: null,
  errorMessage: '',
  runId: 0,
};

let __aiState: AIBusState = __aiInitial;
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
      __setAI({ status: 'success', result: res });
    })
    .catch((err: unknown) => {
      if (__aiState.runId !== runId) return;
      __setAI({
        status: 'error',
        errorMessage:
          err instanceof Error && err.message ? err.message : 'network error',
      });
    });
}

/** Reset the bus to idle. Used by Run-again and on result-screen unmount. */
function resetAIInvestigation() {
  __setAI({ ...__aiInitial, runId: __aiState.runId + 1 });
}

/** React hook — subscribe to the bus. The body component uses this to
 *  render its current state; the CTA in the context bar uses it to know
 *  whether to show "Run AI Investigator" vs "Running…" vs nothing. */
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
