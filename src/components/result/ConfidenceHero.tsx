/* global React, ReactRouterDOM, Card, Icon, SCENARIOS, PROPERTY, ReferenceCell, useAppState,
   ServedStamp, formatUsDateTime, formatUsDate, timeAgo, occMatchForRisk,
   INTENDED_OCCUPANCY_LABEL, OCC_VERDICT_LABEL, OCC_STATUS_MATCH_LABEL, OCC_INTENT_SHORT,
   DEFAULT_OCC_CONFIG, displayConfidence */
// ConfidenceHero — promotes the composite confidence score to the top of the
// result page and exposes the factor breakdown ("Why this score") as an
// accordion underneath.
//
// Right rail (May-2026 redesign): just the <ScanReferenceField/>, the
// lender's tracking identifier. The waffle grid, fallback badge, and score
// sparkline were all removed at the client's request — the verdict + score
// copy on the left carries the page on its own.

// Gap left above RunHistory when a history link scrolls the page down to it,
// so the section heading isn't flush against the viewport edge and run one
// reads as the start of the record. Matches the page's own top padding
// (pt-6 / 24px in AppShell's main).
const RUN_HISTORY_SCROLL_GAP = 24;

interface ConfidenceHeroProps {
  scenario: ScenarioKey;
  /** Whether the "Why this score" accordion starts open. Default true. */
  defaultOpen?: boolean;
}

// One factor column in the "Why this score" breakdown. Positive-only render:
// magnitude leads as a bare numeral, no sign and no impact bar — reading the
// four magnitudes as a set is the point of the four-up layout, and a 12px
// Pill doesn't survive a ~150px column.
//
// Magnitude stays --navy (the MetricCard value colour). Colouring it by
// impact direction would push factor rows into the status layer, which the
// system keeps separate from verdict tones — see harness §2.
//
// Mounts with a staggered fade+rise so the columns reveal left-to-right
// (parent re-keys on accordion toggle, so the entrance also fires every time
// the user reopens).
function FactorColumn({
  title,
  short,
  impact,
  index,
  total,
}: {
  title: string;
  short: string;
  impact: number;
  index: number;
  total: number;
}) {
  const abs = Math.abs(impact);

  // Hairline between columns, driven by each column's position in its row —
  // which differs by breakpoint (two-up below md, four-up at md+). A column
  // that opens a row gets no left border and no left pad; one that closes a
  // row gets no right pad. Base classes describe the two-up grid, `md:`
  // overrides describe the four-up.
  const divider = [
    index % 2 === 0 ? 'pl-0' : 'pl-4 border-l border-line',
    index % 2 === 1 ? 'pr-0' : 'pr-4',
    index === 0 ? 'md:pl-0 md:border-l-0' : 'md:pl-4 md:border-l md:border-line',
    index === total - 1 ? 'md:pr-0' : 'md:pr-4',
  ].join(' ');

  return (
    <div
      className={`card-rise ${divider}`}
      style={{ '--rise-delay': `${80 + index * 60}ms` } as React.CSSProperties}
    >
      <div
        className="font-sans font-semibold leading-none tracking-[-0.025em] tabular-nums"
        style={{ fontSize: 'var(--text-h3)', color: 'var(--navy)' }}
      >
        {abs}%
      </div>
      <div className="mt-1.5 font-sans font-semibold text-label text-ink-2 leading-tight">
        {title}
      </div>
      <div className="mt-2 font-sans text-caption text-ink-3 leading-snug" title={short}>
        {short}
      </div>
    </div>
  );
}

function WhyThisScore({
  scenario,
  defaultOpen,
}: {
  scenario: ScenarioKey;
  defaultOpen: boolean;
}) {
  const sc = SCENARIOS[scenario];
  const rows = sc.breakdown;
  const [open, setOpen] = React.useState(defaultOpen);

  // Anatomy is deliberately identical to the occupancy-report slot's
  // disclosure in AIInvestigator.tsx: a full-bleed labelled row on the
  // card's bottom edge, body-sm label, circled chevron, hover tint, and a
  // hairline above the revealed body. The two cards sit adjacent on the
  // result page and previously disclosed in two different ways.
  //
  // Kept as a local copy rather than a shared primitive because
  // states-spec.html loads AIInvestigator.tsx without ConfidenceHero.tsx —
  // a shared helper declared here would be undefined there at runtime.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 border-0 border-t border-line bg-transparent cursor-pointer text-left px-6 py-3 hover:bg-hover-bg transition-colors"
      >
        <span
          className="font-sans font-semibold"
          style={{ fontSize: 'var(--text-body-sm)', color: 'var(--navy)' }}
        >
          Why this score
        </span>
        <span
          className={`w-6 h-6 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      <AccordionPanel open={open}>
        {/* Hairline above the body, matching the report slot. Four-up at
            md+ so the magnitudes read as one horizontal set. Collapses to
            two-up below md — at four columns each cell would fall under
            ~150px and the fragment copy would wrap to four lines. */}
        <div className="border-t border-line p-card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
            {rows.map((r, i) => (
              <FactorColumn
                key={`${open ? 'o' : 'c'}-${i}`}
                title={r.title}
                short={r.short}
                impact={r.impact}
                index={i}
                total={rows.length}
              />
            ))}
          </div>
        </div>
      </AccordionPanel>
    </>
  );
}

// Measures child scrollHeight and animates max-height + opacity for a smooth
// open/close. Children always rendered when `open` is true; collapsed state
// is height 0 + zero opacity.
function AccordionPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      // measure on next frame so children are laid out
      const raf = requestAnimationFrame(() => {
        setMaxHeight(el.scrollHeight);
      });
      return () => cancelAnimationFrame(raf);
    }
    setMaxHeight(0);
  }, [open, children]);

  return (
    <div
      ref={ref}
      className="accordion-content"
      style={{
        maxHeight,
        opacity: open ? 1 : 0,
      }}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}

// Count-up driven by setInterval — eases from 0 → target with cubic
// ease-out. Interval is more reliable than RAF here because the score
// component remounts on every route change (the RouteCrossfade wrapper
// keys on pathname) and the strict-mode double-effect-cancel was leaving
// RAF in a stuck state.
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    setValue(0);
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const id = setInterval(() => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

const VERDICT_TEXT: Record<ScenarioKey, string> = {
  high:   'Rented',
  medium: 'Likely Rented',
  low:    'Not Rented',
};

// Tone → the ink colour used for the small status dot in the "why" block.
const TONE_INK: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'var(--clean-ink)',
  warn: 'var(--warn-deep)',
  risk: 'var(--risk-ink)',
};

// The session keys that together describe "which report is this page showing".
// Snapshotted before a prior-report link navigates away and restored verbatim
// on the way back, so the report re-renders exactly as it was (same freshness
// stamp, same reference, same cached flag). Consumed by the back stack below,
// by ScanContextBar's generic Back, and by PropertyTimelineDrawer — every back
// affordance and every timeline jump goes through the same machinery.
const RESULT_STAMP_KEYS = [
  'scanScenario',
  'scanAddress',
  'scanIntent',
  'scanHistoryId',
  'scanReference',
  'resultServedAt',
  'resultCached',
];

// ---- Report back-stack --------------------------------------------------
// "View that report" can chain: report → older report → older still. Each hop
// pushes a frame describing the page we're leaving; Back pops one frame at a
// time, so the whole chain unwinds to the report you started from rather than
// stranding you one step in. The stack lives in sessionStorage (survives the
// route remount) under `resultReturnStack`, newest frame last.
//
// A frame = { forHistoryId, path, snapshot } — forHistoryId is the run the
// frame's target page shows (so a page knows if the top frame is "its" way
// back), path restores the exact URL (incl. the ?r= nonce), snapshot restores
// the session stamps. These functions are top-level so ScanContextBar and
// PropertyTimelineDrawer (same global scope) share one implementation.

function snapshotResultSession(): Record<string, string> {
  const snap: Record<string, string> = {};
  if (typeof sessionStorage === 'undefined') return snap;
  RESULT_STAMP_KEYS.forEach((k) => {
    const v = sessionStorage.getItem(k);
    if (v !== null) snap[k] = v;
  });
  return snap;
}

function readReturnStack(): any[] {
  if (typeof sessionStorage === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem('resultReturnStack');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReturnStack(stack: any[]): void {
  if (typeof sessionStorage === 'undefined') return;
  if (stack.length) sessionStorage.setItem('resultReturnStack', JSON.stringify(stack));
  else sessionStorage.removeItem('resultReturnStack');
}

function resultPathForScenario(scenario: string): string {
  return scenario === 'low'
    ? '/result/clean'
    : scenario === 'medium'
    ? '/result/medium'
    : '/result/high';
}

// Stamp the session so the result pages render `run` as the served report.
function stampSessionForRun(run: any): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem('scanScenario', run.scenario);
  sessionStorage.setItem('scanAddress', run.address);
  if (run.intent) sessionStorage.setItem('scanIntent', run.intent);
  else sessionStorage.removeItem('scanIntent');
  sessionStorage.setItem('resultServedAt', new Date(run.scannedAt || Date.now()).toISOString());
  sessionStorage.removeItem('resultCached');
  sessionStorage.setItem('scanHistoryId', run.id);
  if (run.reference) sessionStorage.setItem('scanReference', run.reference);
  else sessionStorage.removeItem('scanReference');
}

// Push the current report onto the back stack, stamp for `run`, navigate to it.
// The single entry point used by the hero date links AND the timeline drawer.
function openRunReport(run: any, history: any): void {
  if (!run || typeof sessionStorage === 'undefined') return;
  const frame = {
    forHistoryId: run.id,
    path: history.location.pathname + history.location.search,
    snapshot: snapshotResultSession(),
  };
  writeReturnStack([...readReturnStack(), frame]);
  stampSessionForRun(run);
  // `?r=` nonce so a same-path push still remounts (RouteCrossfade keys on
  // pathname + search).
  history.push(`${resultPathForScenario(run.scenario)}?r=${Date.now()}`);
}

// The frame the current page could step back to, or null. A page shows its
// Back control only when this frame targets the run the page is showing.
function peekReturnFrame(): any {
  const stack = readReturnStack();
  return stack.length ? stack[stack.length - 1] : null;
}

// Pop one frame: restore its snapshot + URL. Gated on the top frame targeting
// `currentHistoryId` so a stale stack from an abandoned chain can't fire.
// Returns true when it navigated.
function popReturnFrame(history: any, currentHistoryId: string | null): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const stack = readReturnStack();
  if (!stack.length) return false;
  const frame = stack[stack.length - 1];
  if (currentHistoryId != null && frame.forHistoryId !== currentHistoryId) return false;
  RESULT_STAMP_KEYS.forEach((k) => {
    if (frame.snapshot && k in frame.snapshot) sessionStorage.setItem(k, frame.snapshot[k]);
    else sessionStorage.removeItem(k);
  });
  writeReturnStack(stack.slice(0, -1));
  history.push(frame.path);
  return true;
}

// Small-number words so the change count reads like prose ("changed twice")
// rather than a bare digit. Falls back to the numeral past three.
function countWord(n: number): string {
  return ['zero', 'once', 'twice', 'three times'][n] || `${n} times`;
}

// Whole-number share of the record — "3 of 5" reads as 60%.
function pctOf(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// One clickable date that opens that scan's report. Used for both the main
// bullet (single-date group) and the sub-bullets (multi-date group) so the
// affordance is identical everywhere.
function PriorDateLink({ run, onOpen }: { run: any; onOpen: (r: any) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(run)}
      title="Open this scan's report"
      className="inline rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
      style={{ color: 'var(--brand-link)' }}
    >
      {formatUsDate(new Date(run.scannedAt || 0).toISOString())}
    </button>
  );
}

// Plain-language "why" — one line that complements the "Intended · Scan found"
// line directly above it, so neither the intent nor the verdict is repeated
// (Trello: de-duplicate the result header). `hasIntent` is false when nothing
// was declared (quick-scan).
function reconciliationWhy(status: 'green' | 'yellow' | 'red', hasIntent: boolean): string {
  if (!hasIntent) {
    return 'No occupancy was declared for this scan, so treat the finding as informational.';
  }
  if (status === 'green') {
    return 'The finding is consistent with the intended occupancy.';
  }
  if (status === 'red') {
    return 'The finding contradicts the intended occupancy — worth a human review.';
  }
  return 'The finding is inconclusive against the intended occupancy and may need a closer look.';
}

function ConfidenceHero({ scenario, defaultOpen = true }: ConfidenceHeroProps) {
  const sc = SCENARIOS[scenario];
  const { findScheduleByTarget, getHistoryForAddress } = useAppState();

  // Is this property already on a recurring re-scan? Resolved the same way
  // ScanContextBar resolves its Automate target, so the hero and the top-bar
  // control can never disagree about whether automation is running.
  const heroAddress =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;
  const activeSchedule = findScheduleByTarget({ kind: 'single', address: heroAddress });

  // Reconciliation is the headline now — declared intent × what the scan found.
  // Intent is stamped in sessionStorage at scan/open time; absent = quick-scan.
  const rawIntent =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanIntent') : null;
  // Demo-only (app.html sets window.__TO_DEMO_STATES__): when a result page is
  // opened without a declared intent, fall back to the org default so the
  // Declared line always renders during review. Production leaves the flag
  // unset, so a genuine quick-scan still shows the "no occupancy declared"
  // informational state — the real no-intent case stays correct.
  const demoIntent =
    typeof window !== 'undefined' && (window as any).__TO_DEMO_STATES__
      ? DEFAULT_OCC_CONFIG.defaultIntent
      : undefined;
  const resolvedRawIntent = rawIntent || demoIntent;
  const intent =
    resolvedRawIntent && INTENDED_OCCUPANCY_LABEL[resolvedRawIntent]
      ? resolvedRawIntent
      : undefined;
  const match = occMatchForRisk(intent, sc.risk);
  const verdictLabel = match ? OCC_VERDICT_LABEL[match.verdict] : VERDICT_TEXT[scenario];
  // The raw verdict — consumed ONLY by the confidence framing (the score is
  // confidence IN the finding, so its wording must track it); never rendered
  // as a result anywhere in the history disclosure or drawers.
  const detectedVerdict = match ? match.verdict : undefined;

  // Earlier scans of this address that reached this same RESULT — surfaced as
  // one quiet line under the why copy so a repeat result reads as corroborated
  // rather than new. Matching is on the reconciliation label, never the raw
  // finding (reconciliation vocabulary only — owner call with dev, Aug-2026).
  // The current run is excluded by its history id (fresh scans get one in
  // ScanMidScreen; History / Run-history clicks stamp one on open), so only
  // genuinely prior runs count.
  const currentHistoryId =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanHistoryId') : null;
  // "Earlier" is chronological, not just "other": when an archived report is
  // open (via History or the prior-report link), runs newer than IT don't
  // count — its served-at stamp is the cutoff. Fresh scans stamp "now", so
  // everything in history remains earlier, exactly as before.
  const servedAtRaw =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('resultServedAt') : null;
  const servedCutoff = servedAtRaw ? new Date(servedAtRaw).getTime() : NaN;
  const priorSameResult = match
    ? getHistoryForAddress(heroAddress).filter((h) => {
        if (currentHistoryId && h.id === currentHistoryId) return false;
        if (!Number.isNaN(servedCutoff) && (h.scannedAt || 0) >= servedCutoff) return false;
        return occMatchForRisk(h.intent, SCENARIOS[h.scenario]?.risk)?.label === match.label;
      })
    : [];
  // Newest first.
  const priorRecentFirst = [...priorSameResult].sort(
    (a, b) => (b.scannedAt || 0) - (a.scannedAt || 0)
  );
  const hasPriorSameResult = priorRecentFirst.length > 0;

  // Group the same-result priors by intent. The RESULT is constant across
  // this list (same reconciliation label as today), but the intended occupancy
  // it was reconciled against can differ scan to scan. Each distinct intent
  // becomes one line ("Intended X — dates"); when several scans share that
  // profile, their dates sit inline as links.
  // Intents are a closed set (≤4 + undeclared), so at most five groups.
  const priorGroups = (() => {
    const map = new Map<string, any>();
    priorRecentFirst.forEach((run) => {
      const key = run.intent || '__none__';
      if (!map.has(key)) {
        map.set(key, { key, intent: run.intent, runs: [] });
      }
      map.get(key).runs.push(run);
    });
    // Order groups by their most recent run, newest first.
    return [...map.values()].sort(
      (a, b) => (b.runs[0]?.scannedAt || 0) - (a.runs[0]?.scannedAt || 0)
    );
  })();
  const PRIOR_DATE_CAP = 4; // sub-bullets shown per group before folding to Run history

  // The single most recent EARLIER run regardless of its result — the "last
  // scan" line always states it (result + the intent it reconciled against),
  // and its result differing from today's marks the movement.
  const mostRecentPriorAny = match
    ? getHistoryForAddress(heroAddress).reduce<any>((best, h) => {
        if (currentHistoryId && h.id === currentHistoryId) return best;
        if (!Number.isNaN(servedCutoff) && (h.scannedAt || 0) >= servedCutoff) return best;
        return !best || (h.scannedAt || 0) > (best.scannedAt || 0) ? h : best;
      }, null)
    : null;
  const lastScanMatch = mostRecentPriorAny
    ? occMatchForRisk(mostRecentPriorAny.intent, SCENARIOS[mostRecentPriorAny.scenario]?.risk)
    : null;
  const resultChanged = Boolean(
    mostRecentPriorAny && lastScanMatch && match && lastScanMatch.label !== match.label
  );

  // Record facts AS OF THIS REPORT, read chronologically: how many times the
  // result flipped, which distinct results appeared, and how often it landed
  // on Needs review. A report states the world at ITS OWN date, so runs newer than
  // the open report are excluded (the open report itself is kept by id) —
  // on the third scan's page the denominators read "of 3", not "of 5".
  // The drawers are the opposite by design: they always show the full record
  // up to today, and say so.
  const addressTimeline = getHistoryForAddress(heroAddress)
    .filter((h) => {
      const t = h.scannedAt || 0;
      if (t > Date.now()) return false;
      if (currentHistoryId && h.id === currentHistoryId) return true;
      if (!Number.isNaN(servedCutoff) && t >= servedCutoff) return false;
      return true;
    })
    .sort((a, b) => (a.scannedAt || 0) - (b.scannedAt || 0));
  let resultChangeCount = 0;
  let prevTimelineLabel: string | undefined;
  const distinctResults: string[] = [];
  let needsReviewCount = 0;
  addressTimeline.forEach((h) => {
    const m = occMatchForRisk(h.intent, SCENARIOS[h.scenario]?.risk);
    if (prevTimelineLabel !== undefined && m?.label !== prevTimelineLabel) resultChangeCount += 1;
    prevTimelineLabel = m?.label;
    if (m && !distinctResults.includes(m.label)) distinctResults.push(m.label);
    if (m?.status === 'red') needsReviewCount += 1;
  });
  const addressScanCount = addressTimeline.length;

  // The earlier-scans corroboration is collapsed by default so the hero stays
  // quiet; the reviewer expands it only when they want the dated links.
  const [showEarlier, setShowEarlier] = React.useState(false);

  const history = ReactRouterDOM.useHistory();

  // Both history links in this disclosure land on the same place — RunHistory's
  // section, which carries id="run-history" and renders whenever the address
  // has ≥2 runs (so it exists wherever this disclosure does). The record is
  // shown ONCE, at the bottom of the page; nothing re-lists it in a flyout.
  //
  // scrollIntoView({ block: 'start' }) pins the heading flush to the viewport
  // edge, which reads as cut off. A small offset keeps the heading, its lead
  // line and the first run row all in view, so the landing point is the start
  // of run one rather than a hard edge.
  function scrollToRunHistory() {
    const el = typeof document !== 'undefined' ? document.getElementById('run-history') : null;
    if (!el) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const top = el.getBoundingClientRect().top + window.pageYOffset - RUN_HISTORY_SCROLL_GAP;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // The frame this page can step back to, if the top of the back stack targets
  // the run we're currently showing. Present through every hop of a chain, so
  // Back unwinds the whole way rather than one step.
  const returnFrame = peekReturnFrame();
  const canGoBack = Boolean(returnFrame) && returnFrame.forHistoryId === currentHistoryId;
  // "Not sure" remains Not sure everywhere: the org's resolve toggle/choice
  // only drives triage colours (scoring), never the declared intent. So a
  // Not-sure result ALWAYS reports what the scan turned out to find — the RAW
  // rented-probability labelled "Rental Confidence" — regardless of the
  // toggle. Every other state flips the number to read as confidence IN the
  // finding, labelled "Confidence".
  const rentalConfidenceMode = intent === 'not-sure';
  const confidenceLabel = rentalConfidenceMode ? 'Rental Confidence' : 'Confidence';
  const confidenceValue = rentalConfidenceMode
    ? sc.score
    : detectedVerdict === 'not-rented'
    ? 100 - sc.score
    : sc.score;
  const confidenceLine = rentalConfidenceMode
    ? detectedVerdict === 'rented'
      ? 'likely a rental'
      : detectedVerdict === 'not-rented'
      ? 'unlikely a rental'
      : 'possibly a rental'
    : detectedVerdict === 'rented'
    ? 'confident this property is being rented'
    : detectedVerdict === 'not-rented'
    ? 'confident this property is not rented'
    : 'likely rented · inconclusive';
  const animatedScore = useCountUp(confidenceValue, 800);

  return (
    <>
      {/* Shown on every report reached through a "View that report" chain —
          pops ONE frame off the back stack, so repeated presses unwind the
          whole chain back to the report you started from. Each hop restores
          that page's snapshot verbatim (freshness/reference survive). */}
      {canGoBack && (
        <button
          type="button"
          onClick={() => popReturnFrame(history, currentHistoryId)}
          className="mb-3 self-start inline-flex items-center gap-1.5 rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
          style={{ color: 'var(--brand-link)' }}
        >
          <span className="[&>svg]:w-3 [&>svg]:h-3 rotate-180 inline-flex" aria-hidden>
            <Icon name="arrow-right" size={12} />
          </span>
          Back to the latest report
        </button>
      )}
    <Card>
      <div className="px-6 py-5" style={{ position: 'relative' }}>
      <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-8">
        <div className="flex flex-col md:flex-[1] md:min-w-0">
          <div className="flex items-start justify-between gap-2">
          <div
            className="font-sans font-semibold leading-[0.95] tracking-[-0.012em]"
            style={{ fontSize: "var(--text-h1)", color: 'var(--navy)' }}
          >
            {match ? match.label : VERDICT_TEXT[scenario]}
          </div>
          </div>
          <div className="mt-3">
            <div
              className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'var(--ink-3)' }}
            >
              {confidenceLabel}
            </div>
            <div className="mt-1 font-sans text-label text-ink-3 tabular-nums">
              <span className="font-semibold text-ink-2">{animatedScore}%</span> {confidenceLine}
            </div>
          </div>

          {/* Why this result — the reconciliation explained. What the label
              means: declared intent vs. what the scan actually found. This is
              the only place the raw verdict (Rented / Possibly / Not rented)
              is spelled out now that lists show the reconciliation instead. */}
          {match && (
            <div className="mt-4">
              <div
                className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'var(--ink-3)' }}
              >
                Why this result
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-caption tabular-nums">
                {intent && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-ink-3">Intended</span>
                    <span className="font-semibold" style={{ color: 'var(--navy)' }}>
                      {INTENDED_OCCUPANCY_LABEL[intent]}
                    </span>
                  </span>
                )}
                {intent && <span className="text-ink-4" aria-hidden>·</span>}
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-ink-3">Scan found</span>
                  <span
                    className="inline-flex items-center gap-1.5 font-semibold"
                    style={{ color: TONE_INK[match.tone] }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: TONE_INK[match.tone] }}
                      aria-hidden
                    />
                    {verdictLabel}
                  </span>
                </span>
              </div>
              <p className="mt-1.5 font-sans text-caption text-ink-2 leading-snug m-0">
                {rentalConfidenceMode
                  ? 'No baseline to reconcile — the score is the observed rental likelihood.'
                  : reconciliationWhy(match.status, Boolean(intent))}
              </p>
              {/* History, entirely collapsed by default (owner: keep the hero
                  uncrowded — reveal only on request). A single toggle sits under
                  the reconciliation line; expanding it shows BOTH the movement
                  callout (if the last scan's result differed) and the dated
                  links to earlier same-result reports. Nothing about the
                  property's past is visible until the reviewer asks for it. The
                  toggle appears whenever there's any history worth revealing. */}
              {(resultChanged || hasPriorSameResult) && (
                <div className="mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowEarlier((v) => !v)}
                    aria-expanded={showEarlier}
                    className="inline-flex items-center gap-1 rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                    style={{ color: 'var(--brand-link)' }}
                  >
                    {showEarlier ? 'View less' : 'View more'}
                    <span
                      className={`inline-flex [&>svg]:w-3 [&>svg]:h-3 transition-transform ${showEarlier ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      <Icon name="chevron" size={12} />
                    </span>
                  </button>

                  {/* The reveal — four sections, in order (owner spec), each
                      with a DEFINED null state so no section vanishes silently.
                      Reconciliation vocabulary only — the raw finding never
                      appears in this disclosure (owner call with dev, Aug-2026):
                        1. The last scan: its result and the intent it ran
                           under, date linked. Movement marker when the result
                           differed.
                        2. Same-result groups by intent ("Intended X — dates"),
                           dates clickable.
                           Null → "No earlier scan reached this result."
                        3. How many times the result was Needs review.
                           Zero → "in none of the N scans."
                        4. How many times the result changed, closed by a "View
                           in Run history" link that scrolls to the Run history
                           section at the bottom of the page — the one place the
                           full record is listed (a flyout used to repeat it;
                           removed Aug-2026 as a duplicate). Zero → "held across
                           all N scans." */}
                  {showEarlier && (
                    <ul className="mt-1.5 mb-0 pl-0 list-none font-sans text-caption text-ink-2 leading-snug tabular-nums flex flex-col gap-1.5">
                      {/* • 1 — the last scan: result + intent, movement-marked
                          when the result differed. Guarded, but a reveal only
                          exists when at least one prior run does. */}
                      {mostRecentPriorAny && lastScanMatch && (
                        <li className="flex items-start gap-2">
                          <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ink-3)' }} aria-hidden />
                          <span>
                            {resultChanged && (
                              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'var(--warn-deep)' }}>
                                <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                                  <Icon name="trend-up" size={12} />
                                </span>
                                Changed since the last scan
                              </span>
                            )}
                            {resultChanged ? (
                              <>{' '}— on{' '}</>
                            ) : (
                              <>The result was the same on the last scan — on{' '}</>
                            )}
                            <PriorDateLink run={mostRecentPriorAny} onOpen={(r) => openRunReport(r, history)} />
                            {': '}
                            <span className="font-semibold">{lastScanMatch.label}</span>
                            {', '}intended{' '}
                            <span className="font-semibold">
                              {mostRecentPriorAny.intent
                                ? OCC_INTENT_SHORT[mostRecentPriorAny.intent as keyof typeof OCC_INTENT_SHORT]
                                : 'not declared'}
                            </span>.
                          </span>
                        </li>
                      )}

                      {/* • 2 — grouped corroboration; each intent profile is a
                          sub-bullet with its dates inline as links. Defined
                          empty state on the same bullet. */}
                      <li>
                        <div className="flex items-start gap-2">
                          <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ink-3)' }} aria-hidden />
                          {hasPriorSameResult ? (
                            <span>
                              Earlier scans with this same result —{' '}
                              {priorRecentFirst.length} of {addressScanCount} (
                              {pctOf(priorRecentFirst.length, addressScanCount)}%):
                            </span>
                          ) : (
                            <span className="text-ink-3">No earlier scan reached this result.</span>
                          )}
                        </div>
                        {hasPriorSameResult && (
                          <ul className="mt-0.5 mb-0 pl-5 list-none flex flex-col gap-0.5">
                            {priorGroups.map((g: any) => {
                              const intentLabel = g.intent
                                ? OCC_INTENT_SHORT[g.intent as keyof typeof OCC_INTENT_SHORT]
                                : 'not declared';
                              const shown = g.runs.slice(0, PRIOR_DATE_CAP);
                              const groupOverflow = g.runs.length - shown.length;
                              return (
                                <li key={g.key} className="flex items-start gap-2">
                                  <span className="mt-[5px] w-1.5 h-1.5 rounded-full border shrink-0" style={{ borderColor: 'var(--ink-4)' }} aria-hidden />
                                  <span>
                                    Intended <span className="font-semibold">{intentLabel}</span>
                                    {' — '}
                                    {shown.map((run: any, i: number) => (
                                      <React.Fragment key={run.id}>
                                        {i > 0 && (
                                          <span className="text-ink-4" aria-hidden>
                                            {' · '}
                                          </span>
                                        )}
                                        <PriorDateLink run={run} onOpen={(r) => openRunReport(r, history)} />
                                      </React.Fragment>
                                    ))}
                                    {groupOverflow > 0 && (
                                      <>
                                        <span className="text-ink-4" aria-hidden>
                                          {' · '}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={scrollToRunHistory}
                                          className="inline rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                                          style={{ color: 'var(--brand-link)' }}
                                        >
                                          {groupOverflow} more in Run history
                                        </button>
                                      </>
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>

                      {/* • 3 — the Needs-review tally, with its defined zero state. */}
                      <li className="flex items-start gap-2">
                        <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ink-3)' }} aria-hidden />
                        <span className="text-ink-3">
                          {needsReviewCount > 0 ? (
                            <>
                              The result was <span className="font-semibold text-ink-2">{OCC_STATUS_MATCH_LABEL.red}</span> in{' '}
                              {String(needsReviewCount).padStart(2, '0')} out of {addressScanCount} scans (
                              {pctOf(needsReviewCount, addressScanCount)}%).
                            </>
                          ) : (
                            <>
                              The result was <span className="font-semibold text-ink-2">{OCC_STATUS_MATCH_LABEL.red}</span> in
                              none of the {addressScanCount} scans.
                            </>
                          )}
                        </span>
                      </li>

                      {/* • 4 — record-wide change count, naming the results,
                          closed by the Details flyout: the whole record as a
                          simple latest-first ledger (date · result · intended,
                          dates linked). */}
                      <li className="flex items-start gap-2">
                        <span className="mt-[5px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--ink-3)' }} aria-hidden />
                        <span className="text-ink-3">
                          {resultChangeCount > 0 ? (
                            <>
                              The result has changed {countWord(resultChangeCount)} across {addressScanCount} scans
                              {distinctResults.length > 1 && <> ({distinctResults.join(' · ')})</>}.
                            </>
                          ) : (
                            <>The result has held across all {addressScanCount} scans.</>
                          )}
                          {' '}
                          <button
                            type="button"
                            onClick={scrollToRunHistory}
                            className="inline rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                            style={{ color: 'var(--brand-link)' }}
                          >
                            View in Run history
                          </button>
                        </span>
                      </li>
                    </ul>
                  )}
                </div>
              )}
              {/* Red single scan → advise setting up a recurring re-scan. Opens
                  the same Automate modal the top-bar button uses (via the shared
                  halcyon:open-automate event handled by AutomationControl).
                  Suppressed once a schedule exists — the top-bar "Automated ·
                  every Nmo" control already carries that status, so a second
                  in-hero indicator would duplicate it on the same screen. */}
              {match.status === 'red' && !activeSchedule && (
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event('halcyon:open-automate'))}
                  className="mt-2 self-start inline-flex items-center gap-1 rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                  style={{ color: 'var(--brand-link)' }}
                >
                  <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                    <Icon name="cal" size={12} />
                  </span>
                  Automation recommended
                  <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                    <Icon name="arrow-right" size={12} />
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Canonical report timestamp — directly beneath the verdict/status. */}
          <div className="mt-4">
            <ServedStamp />
          </div>

          {/* Reference pinned to the bottom-left corner. `mt-auto` floats
              it down to the bottom of the stretched flex column so it
              aligns with the bottom of the description block on the right. */}
          <div className="mt-auto pt-6">
            <ScanReferenceField />
          </div>
        </div>

        {/* Vertical divider — hairline matching --line. Hidden on stacked
            mobile layout because the columns no longer face each other. */}
        <div className="hidden md:block w-px bg-line shrink-0" aria-hidden />

        {/* Right — descriptive copy (2× the left column's width) */}
        <div className="md:flex-[2] md:min-w-0">
          <div className="font-sans text-body font-medium text-ink-2 leading-snug">
            {sc.headline}
          </div>
          <div className="mt-2 font-sans text-label text-ink-3 leading-relaxed">
            {sc.summary}
          </div>
        </div>
      </div>
      </div>

      {/* Why this score — accordion */}
      <WhyThisScore scenario={scenario} defaultOpen={defaultOpen} />
    </Card>
    </>
  );
}

// Inline-editable reference under the summary. Hidden by default when the
// scan has no reference and the user hasn't opted in — a muted
// "+ Add reference" affordance acts as the entry point. Once set, renders
// as a labelled mono identifier that's still click-to-edit.
//
// Persistence layers:
//   * sessionStorage.scanReference — always written, so the PDF cert and
//     any same-session refresh pick it up.
//   * AppState history entry — when the user arrived from /history, we
//     also patch the persisted SingleHistoryEntry via setSingleScanReference.
//     Fresh scans (from HomeScreen) lack a history id and are session-only.
function ScanReferenceField() {
  const { setSingleScanReference } = useAppState();

  // Seed from sessionStorage; tick once on mount so the field reflects
  // whichever flow brought the user here (fresh scan, History click,
  // or the cert's session-store cache).
  const [value, setValue] = React.useState<string | undefined>(() => {
    if (typeof sessionStorage === 'undefined') return undefined;
    return sessionStorage.getItem('scanReference') ?? undefined;
  });

  function handleSave(next?: string) {
    setValue(next);
    // 1. Session — read by CertificateSheet on print.
    if (next) {
      sessionStorage.setItem('scanReference', next);
    } else {
      sessionStorage.removeItem('scanReference');
    }
    // 2. Persisted — only when this result was opened from /history.
    const historyId =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('scanHistoryId')
        : null;
    if (historyId) setSingleScanReference(historyId, next);
  }

  return (
    <div className="inline-flex items-baseline gap-2">
      <span
        className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
        style={{ color: 'var(--ink-3)' }}
      >
        Reference
      </span>
      <ReferenceCell value={value} onSave={handleSave} maxWidth={240} />
    </div>
  );
}
