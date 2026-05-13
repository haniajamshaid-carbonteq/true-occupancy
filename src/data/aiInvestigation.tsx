/* global React */
// AI Investigator data layer. Provides per-scenario mock results, the
// async entrypoint `runAIInvestigation(scenarioId)`, and a small shared
// state bus + `useAIInvestigator` hook so the CTA (in ScanContextBar)
// and the result card (in the page body) stay in sync. Wraps the mock so
// swapping to a real backend is a single edit inside `runAIInvestigation`.

type AIVerdict = 'clean' | 'warn' | 'risk';
type AIConfidenceLabel = 'Low' | 'Medium' | 'High';

interface AIInvestigationResult {
  /** AI's independent verdict on the same scenario, using the same risk
   *  taxonomy as the rule-based engine so the two can be compared directly. */
  verdict: AIVerdict;
  /** Human label for the verdict pill (UI mirrors the rule-based copy). */
  verdictLabel: string;
  /** 0–100. */
  confidence: number;
  confidenceLabel: AIConfidenceLabel;
  /** 3–5 short factual sentences. Rendered as ✓-led bullets. */
  findings: string[];
  /** 2–4 imperative next-step bullets. Rendered with →. */
  actions: string[];
  /** Optional caution surfaced in a warn callout under the lists. */
  caveat?: string;
}

// Loading-step timings. Constant here so the prototype animation is
// deterministic; a real backend would drive these via SSE / polling.
const AI_STEP_1_MS = 2600; // "Retrieving property, owner & STR evidence"
const AI_STEP_2_MS = 1900; // "Analyzing evidence & generating report"

const AI_INVESTIGATIONS: Record<ScenarioKey, AIInvestigationResult> = {
  low: {
    verdict: 'clean',
    verdictLabel: 'Not Rented',
    confidence: 88,
    confidenceLabel: 'High',
    findings: [
      'No active listings on Airbnb, Vrbo, or Facebook Marketplace match this parcel.',
      'County records show owner-occupied homestead exemption — no change of use filed.',
      'No STR permit application has been submitted in the past 24 months.',
    ],
    actions: [
      'Re-scan in 90 days as part of the standard compliance cadence.',
      'No further action required.',
    ],
  },
  medium: {
    // AI disagrees with the rule-based "Questionable" verdict — bumps up.
    verdict: 'risk',
    verdictLabel: 'Likely Rented',
    confidence: 89,
    confidenceLabel: 'High',
    findings: [
      'Partial-match Airbnb listing in same neighborhood shows photo overlap of 64% with property record imagery.',
      'Host handle on the partial-match listing has 72% fuzzy match to owner of record.',
      'Owner purchased a second nearby property in 2024 — pattern consistent with portfolio operators.',
      'No active STR permit on file despite likely commercial use.',
    ],
    actions: [
      'Issue a notice-of-inquiry to the owner referencing the partial-match listing.',
      'Cross-reference DBPR licenses for any other properties tied to this owner.',
      'Schedule a 30-day follow-up scan to catch listing reactivation.',
    ],
    caveat: 'Photo-fingerprint overlap is suggestive but not conclusive. Field verification is recommended before enforcement action.',
  },
  high: {
    verdict: 'risk',
    verdictLabel: 'Rented',
    confidence: 95,
    confidenceLabel: 'High',
    findings: [
      'Sold Jan 2022 for $749k; current AVM range ~$670k–$758k.',
      'ChampionsGate permits STRs; Osceola requires license, inspection, and 13.5% combined tax.',
      'Nearby comps confirm STR prevalence — 1485 Casiola is permitted 5BD/14-guest; 1470 is a 9BD vacation rental.',
      '4 matched listings across 3 platforms geocode within 25 ft of the parcel centroid.',
    ],
    actions: [
      'Query Osceola County Property Appraiser for current owner and deed of record.',
      'Search DBPR licenses for APN 31252751240001 0750 or the exact street address.',
      'Initiate code-compliance case file — sufficient evidence for formal action.',
    ],
    caveat: 'Additional field evidence may be needed for a definitive determination at the parcel level.',
  },
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
