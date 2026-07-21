/* global React, ReactRouterDOM, Card, Button, Icon, AI_INVESTIGATIONS,
   useAIInvestigator, startAIInvestigation, resetAIInvestigation,
   parseAIDemoStatus, formatReportDate */
// AIInvestigator — a second-opinion module that runs after the rule-based
// verdict has rendered. Sits between ConfidenceHero and ListingsPanel on
// the three result screens.
//
// The CTA that *kicks off* an investigation lives in <ScanContextBar>
// (top right, next to Download PDF) so the result page stays uncluttered
// in its initial state. This component renders nothing while the bus is
// idle — only once the user opts in does the loading / success / error
// card appear in the page body.
//
// State machine lives in src/data/aiInvestigation.tsx as a small bus so
// the CTA and the body card can share one source of truth without prop
// drilling through AppShell. `forcedStatus` / `forcedResult` props are
// spec-only overrides for the states-spec frames.

type AIStatus =
  | 'idle'
  | 'loading-step-1'
  | 'loading-step-2'
  | 'success'
  | 'error';

interface AIInvestigatorProps {
  scenario: ScenarioKey;
  /** Spec-only override: start in a specific visual state. Used by
   *  states-spec to render the state frames side-by-side. Production
   *  call sites omit this and the module always boots in 'idle'. */
  forcedStatus?: AIStatus;
  /** Spec-only override: skip the async call and use this canned result
   *  for the complete frames. */
  forcedResult?: AIInvestigationResult;
  /** Spec-only override: render the complete frame with the report body
   *  already open, so the spec can show collapsed and expanded together. */
  forcedExpanded?: boolean;
}

const AI_BAND_COPY: Record<AIVerdictBand, { variant: 'clean' | 'warn' | 'risk' | 'brand' | 'default'; label: string; tone: string; soft: string; ink: string }> = {
  manual_verification: {
    variant: 'brand',
    label: 'Manual verification',
    tone: 'var(--brand)',
    soft: 'var(--brand-soft)',
    ink: 'var(--brand-deep)',
  },
  low_evidence: {
    variant: 'default',
    label: 'Low evidence',
    tone: 'var(--ink-3)',
    soft: 'var(--surface-2)',
    ink: 'var(--ink-2)',
  },
  monitor: {
    variant: 'warn',
    label: 'Monitor',
    tone: 'var(--warn)',
    soft: 'var(--warn-soft)',
    ink: 'var(--warn-ink)',
  },
  review: {
    variant: 'risk',
    label: 'Review',
    tone: 'var(--risk)',
    soft: 'var(--risk-soft)',
    ink: 'var(--risk-ink)',
  },
  high_priority_review: {
    variant: 'risk',
    label: 'High priority review',
    tone: 'var(--risk)',
    soft: 'var(--risk-soft)',
    ink: 'var(--risk-ink)',
  },
};

function AIInvestigator({
  scenario,
  forcedStatus,
  forcedResult,
  forcedExpanded,
}: AIInvestigatorProps) {
  // Spec-frame override path: don't touch the bus, render the frozen state.
  if (forcedStatus) {
    return (
      <ForcedFrame
        status={forcedStatus}
        result={forcedResult}
        expanded={forcedExpanded}
      />
    );
  }

  // Production path: subscribe to the shared bus.
  const bus = useAIInvestigator();
  const { search } = ReactRouterDOM.useLocation();
  const demo = parseAIDemoStatus(search);

  // Clear any *live* run state when the viewed scenario changes, so a
  // failed run on /result/high doesn't bleed onto /result/low. Stored
  // reports are untouched — they are per-scenario and permanent.
  React.useEffect(() => {
    if (bus.scenario && bus.scenario !== scenario) resetAIInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  return (
    <>
      <AIStateProbe current={demo} />
      {renderBody()}
    </>
  );

  // Everything below is the original render chain, moved into a closure so
  // the probe can sit above every state without duplicating the branches.
  function renderBody() {
  // Demo override first — see parseAIDemoStatus. These states are otherwise
  // unreachable in the running app because the mock never rejects.
  if (demo === 'loading') return <LoadingCard activeStep={1} />;
  if (demo === 'error') {
    return <ErrorCard onRetry={() => startAIInvestigation(scenario)} />;
  }
  if (demo === 'success') {
    return (
      <ReportCard
        result={AI_INVESTIGATIONS[scenario]}
        generatedAt={new Date().toISOString()}
      />
    );
  }

  // A stored report is final. It outranks live status, because the report
  // is generated once per scan and survives navigation away and back.
  const stored = bus.reports[scenario];
  if (stored) {
    return <ReportCard result={stored.result} generatedAt={stored.generatedAt} />;
  }

  const status = bus.scenario === scenario ? bus.status : 'idle';

  // The rich inline progress / error surface lives here rather than only in
  // the dock. The NotificationDock suppresses its own AI notification while
  // pathname matches /result/* and takes over once the user navigates away.
  if (status === 'loading-step-1' || status === 'loading-step-2') {
    return <LoadingCard activeStep={status === 'loading-step-1' ? 1 : 2} />;
  }
  if (status === 'error') {
    return (
      <ErrorCard
        onRetry={() => startAIInvestigation(scenario)}
      />
    );
  }
  // A run that resolved on this mount, before the bus write settles into
  // `reports` on the next render.
  if (status === 'success' && bus.result) {
    return (
      <ReportCard
        result={bus.result}
        generatedAt={bus.reports[scenario]?.generatedAt || new Date().toISOString()}
      />
    );
  }

  // Never run. The slot always renders something: absence has to be
  // legible, or a colleague opening this scan cannot tell "ran and found
  // little" from "nobody ran it" — a meaningful difference in an audit trail.
  return <IdleCard onRun={() => startAIInvestigation(scenario)} />;
  }
}

// ⚠ TEMPORARY — design review only. Delete this component and its one
// render site above before this ships.
//
// Drives the existing `?ai=` demo param rather than adding a second state
// path, so what you see here is the same branch production takes. Error and
// loading are otherwise unreachable in the running app: the mock never
// rejects, so nothing can exercise ErrorCard's re-run control.
function AIStateProbe({ current }: { current: AIDemoStatus | null }) {
  const history = ReactRouterDOM.useHistory();
  const { pathname } = ReactRouterDOM.useLocation();

  const go = (next: AIDemoStatus | null) => {
    resetAIInvestigation();
    history.replace(next ? `${pathname}?ai=${next}` : pathname);
  };

  const STATES: Array<{ key: AIDemoStatus | null; label: string }> = [
    { key: null, label: 'Idle' },
    { key: 'loading', label: 'Loading' },
    { key: 'success', label: 'Report' },
    { key: 'error', label: 'Error' },
  ];

  return (
    <div className="mb-3 flex items-center gap-2 flex-wrap">
      <span className="font-mono text-micro uppercase tracking-[0.08em] text-ink-3">
        Temp · AI state
      </span>
      {STATES.map((s) => (
        <Button
          key={s.label}
          size="sm"
          variant={current === s.key ? 'primary' : 'default'}
          onClick={() => go(s.key)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}

// Spec frames use this — they don't talk to the bus.
function ForcedFrame({
  status,
  result,
  expanded,
}: {
  status: AIStatus;
  result?: AIInvestigationResult;
  expanded?: boolean;
}) {
  if (status === 'idle') return <IdleCard onRun={() => {}} />;
  if (status === 'loading-step-1' || status === 'loading-step-2') {
    return <LoadingCard activeStep={status === 'loading-step-1' ? 1 : 2} />;
  }
  if (status === 'error') {
    return <ErrorCard onRetry={() => {}} />;
  }
  if (status === 'success' && result) {
    return (
      <ReportCard
        result={result}
        generatedAt={new Date().toISOString()}
        defaultExpanded={expanded}
      />
    );
  }
  return null;
}

// -------------------------------------------------------------------------
// The slot.
//
// Four states share one shell: never-run, running, complete (frozen), and
// failed. The run CTA lives here rather than in ScanContextBar (approved
// 2026-07-21, overriding docs/DESIGN.md §14.9 and the rule recorded in
// design-harness/components/core/working-indicator.md). The old split put
// the button at the top of the page and its result below the fold with no
// scroll and no anchor; keeping both in one slot removes the problem
// rather than papering over it with a scrollIntoView.
//
// Every state renders. The slot never returns null, because absence has to
// be legible: a colleague opening this scan must be able to tell "ran and
// found little" from "nobody ran it".

function SlotEyebrow() {
  return (
    <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
      Occupancy report
    </div>
  );
}

function SlotTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-sans font-semibold m-0 mt-2 leading-tight tracking-[-0.008em]"
      style={{ fontSize: 'var(--text-h4)', color: 'var(--navy)' }}
    >
      {children}
    </h2>
  );
}

// Never run. Leads with what the report gives you rather than with the
// constraint — the one-per-scan rule is real but it is not the reason to
// press the button.
function IdleCard({ onRun }: { onRun: () => void }) {
  return (
    <Card padded>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SlotEyebrow />
          <SlotTitle>Find out who actually lives here</SlotTitle>
          <p className="font-sans text-body-sm text-ink-2 leading-relaxed m-0 mt-2 max-w-3xl">
            Listings show the property is rented. This checks utility, voter
            and tenancy records to establish who lives in it.
          </p>
        </div>
        <Button variant="primary" onClick={onRun} className="shrink-0">
          Run report
        </Button>
      </div>
    </Card>
  );
}

// -------------------------------------------------------------------------
// Loading — two-step list. Reuses card-rise + status-text-pulse helpers
// from motion.css. aria-live announces step transitions for AT.

// LoadingCard — vertical scan timeline. The two backend phases
// (loading-step-1, loading-step-2) are expanded into five visible
// substeps so the progress feels granular, like a scanner ticking
// through a checklist. A local interval advances substeps within each
// phase; the parent bus controls the phase. A soft teal scan beam
// sweeps the rail to keep the surface alive between ticks.
const LOADING_STEPS: Array<{ phase: 1 | 2; label: string; short: string }> = [
  { phase: 1, label: 'Resolving property records',             short: 'Property' },
  { phase: 1, label: 'Selecting applicable occupancy checks',   short: 'Checks' },
  { phase: 1, label: 'Planning the investigation',              short: 'Plan' },
  { phase: 2, label: 'Investigating owner and occupant signals', short: 'Agents' },
  { phase: 2, label: 'Scoring evidence and adjudicating verdict', short: 'Adjudicate' },
  { phase: 2, label: 'Building the investigation report',       short: 'Report' },
];

// Horizontal stepper + skeleton silhouette of the success card. The two
// backend phases (loading-step-1, loading-step-2) are expanded into five
// visible substeps so progress feels granular; the breadcrumb at the top
// shows where the scanner is, and the skeleton below pre-fills the shape
// of the result that is about to land.
function LoadingCard({ activeStep }: { activeStep: 1 | 2 }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    setTick(0);
    const id = window.setInterval(() => setTick((t) => t + 1), 1200);
    return () => window.clearInterval(id);
  }, [activeStep]);

  const phase1Count = LOADING_STEPS.filter((s) => s.phase === 1).length;
  const current =
    activeStep === 1
      ? Math.min(tick, phase1Count - 1)
      : Math.min(phase1Count + tick, LOADING_STEPS.length - 1);

  const currentStep = LOADING_STEPS[current];

  return (
    <Card padded>
      <div aria-live="polite" aria-busy="true">
        {/* Horizontal breadcrumb — completed steps + current */}
        <ol className="list-none m-0 p-0 flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-4">
          {LOADING_STEPS.map((s, i) => {
            const isDone = i < current;
            const isCurrent = i === current;
            const isPending = i > current;
            return (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span
                    aria-hidden
                    className="font-sans text-caption"
                    style={{
                      color: isPending ? 'var(--ink-5)' : 'var(--ink-4)',
                    }}
                  >
                    ›
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 ${
                    !isPending ? 'card-rise' : ''
                  }`}
                  style={{
                    ['--rise-delay' as any]: '0ms',
                    color: isCurrent
                      ? 'var(--ink)'
                      : isDone
                      ? 'var(--ink-2)'
                      : 'var(--ink-4)',
                    fontWeight: isCurrent ? 600 : 500,
                    fontSize: isCurrent
                      ? 'var(--text-body-sm)'
                      : 'var(--text-caption)',
                    opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <span
                    className="rounded-full grid place-items-center shrink-0 transition-all"
                    style={{
                      width: isCurrent ? 18 : 14,
                      height: isCurrent ? 18 : 14,
                      ...(isDone
                        ? {
                            background: 'var(--clean)',
                            color: 'white',
                          }
                        : isCurrent
                        ? {
                            background: 'var(--brand-soft)',
                            color: 'var(--brand-deep)',
                            boxShadow:
                              '0 0 0 3px rgba(10,183,163,0.18), 0 0 0 1px var(--brand)',
                          }
                        : {
                            background: 'var(--surface)',
                            color: 'var(--ink-4)',
                            boxShadow: '0 0 0 1px var(--line)',
                          }),
                    }}
                    aria-hidden
                  >
                    {isDone ? (
                      <Icon name="check" size={9} />
                    ) : isCurrent ? (
                      <Spinner size={10} />
                    ) : (
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: 999,
                          background: 'currentColor',
                        }}
                      />
                    )}
                  </span>
                  {isCurrent ? s.label : s.short}
                </span>
              </React.Fragment>
            );
          })}
        </ol>

        {/* Success-card silhouette — pre-fills the shape of what's about to appear */}
        <div
          aria-hidden
          className="rounded-lg"
          style={{
            padding: 14,
            background: 'var(--surface)',
            boxShadow: '0 0 0 1px var(--line)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="skeleton-pulse rounded-full"
              style={{ width: 72, height: 20, background: 'var(--line)' }}
            />
            <span
              className="skeleton-pulse rounded-md"
              style={{ width: 42, height: 20, background: 'var(--line)' }}
            />
            <span
              className="skeleton-pulse rounded-md ml-auto"
              style={{ width: 96, height: 16, background: 'var(--line)' }}
            />
          </div>
          <div
            className="skeleton-pulse rounded-md mb-2"
            style={{ width: '88%', height: 8, background: 'var(--line)' }}
          />
          <div
            className="skeleton-pulse rounded-md mb-2"
            style={{ width: '74%', height: 8, background: 'var(--line)' }}
          />
          <div
            className="skeleton-pulse rounded-md"
            style={{ width: '60%', height: 8, background: 'var(--line)' }}
          />
        </div>

        {currentStep && (
          <span className="sr-only">
            Step {current + 1} of {LOADING_STEPS.length}: {currentStep.label}
          </span>
        )}
      </div>
    </Card>
  );
}

function Spinner({ size = 14 }: { size?: number }) {
  // A small SVG ring with a rotating quarter-arc. Defined inline so it
  // doesn't depend on additional motion.css helpers.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      style={{ animation: 'ai-spin 800ms linear infinite' }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" />
    </svg>
  );
}

// -------------------------------------------------------------------------
// Success — the meat. Two visual zones:
//   1. Hero band  — brand-teal gradient surface carrying the verdict tile,
//                   confidence ring, and the alignment indicator.
//   2. AI report  — collapsible accordion with findings, actions, caveat.
//                   Collapsed by default for tidy scanning; clicking the
//                   header reveals the detail. Mirrors ConfidenceHero's
//                   "Why This Score" pattern so the two surfaces feel
//                   like a coordinated pair.

function ReportCard({
  result,
  generatedAt,
  defaultExpanded = false,
}: {
  result: AIInvestigationResult;
  generatedAt: string;
  /** Spec-only: render with the body already open. */
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const date = formatReportDate(generatedAt);

  return (
    <Card padded={false} className="card-rise" allowOverflow>
      {/* Header. Leads with the finding, not the module name — once the
          report exists, "Occupancy report" is already carried by the
          eyebrow and the title slot is better spent on what was found. */}
      <div className="p-card">
        <SlotEyebrow />
        <SlotTitle>{result.caseArchetype}</SlotTitle>
        <div className="font-sans text-caption text-ink-3 mt-2">
          {date ? `Generated ${date}. Final.` : 'Final.'}
        </div>
      </div>

      {/* Disclosure. Deliberately the same anatomy as ConfidenceHero's
          "Why This Score": a full-width labelled row at the card's bottom
          edge with a circled chevron, so the two cards on this page
          disclose identically instead of inventing a second pattern.
          Labels are asymmetric because "Collapse" is the honest inverse of
          "Read the full report" — "Hide the full report" reads as a
          warning. */}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between gap-3 border-0 border-t border-line bg-transparent cursor-pointer text-left px-6 py-3 hover:bg-hover-bg transition-colors"
      >
        <span
          className="font-sans font-semibold"
          style={{ fontSize: 'var(--text-body-sm)', color: 'var(--navy)' }}
        >
          {expanded ? 'Collapse' : 'Read the full report'}
        </span>
        <span
          className={`w-6 h-6 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform shrink-0 ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {expanded && <ReportBody result={result} />}
    </Card>
  );
}

// The full report. Everything here was previously behind "View details"
// inside the success card; it now sits under the disclosure row so the
// control stays adjacent to what it opens.
function ReportBody({ result }: { result: AIInvestigationResult }) {
  return (
    <div className="border-t border-line p-card">
      {/* Score tiles lead, archetype + summary sit beside them. The band
          label was dropped from the tile at the client's request — note
          that `verdictBand` no longer renders anywhere in this panel, so
          all five bands now present identically here. The certificate is
          the only surface still expressing it. */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
        <div className="flex gap-3 shrink-0">
          <ScoreTile
            label="Occupancy score"
            value={`${result.score}/${result.scoreMax}`}
          />
          <ScoreTile
            label="Evidence clarity"
            value={`${result.clarityScore}/${result.clarityMax}`}
          />
        </div>
        {/* Summary only — the archetype is the card's own title a few rows
            up, and printing it again here spent the widest column on a
            line the reader had just read. */}
        <p className="font-sans text-body-sm text-ink-2 leading-relaxed m-0 min-w-0 max-w-4xl">
          {result.summary}
        </p>
      </div>

      {/* The only actionable line on the panel, so it sits directly under
          the verdict and is the single loudest thing here — brand-soft
          fill, an icon, and the directive set a full step above body copy.
          Everything else on the panel is neutral, which is what lets this
          carry emphasis without a border. */}
      <div className="mt-8">
        <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-3">
          Do this next
        </div>
        <div
          className="font-sans font-semibold text-h3 leading-tight mt-1.5"
          style={{ color: 'var(--navy)' }}
        >
          {result.nextStepLead}
        </div>
        <p className="font-sans text-body-sm leading-relaxed text-ink-2 m-0 mt-2 max-w-3xl">
          {result.nextStep}
        </p>
      </div>

      {/* Sections are separated by space, not rules. The only hairline in
          the body is the one under the scope note below. */}
      <div className="mt-10">
        <RecommendationBreakdown result={result} />
        <OccupancyHistorySection result={result} />
      </div>

      <p className="font-sans text-caption text-ink-3 leading-relaxed m-0 mt-10 pt-4 border-t border-line">
        {result.scopeNote}
      </p>
    </div>
  );
}

// Numeral-first stat tile. The value carries --navy rather than a band
// tone: colouring it would put the status layer on a number that already
// has a band pill's worth of meaning elsewhere, and the three colour
// layers stay separate (harness §2).
function ScoreTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-brand-2 px-5 py-4 text-center min-w-0">
      <div
        className="font-sans font-semibold text-h3 leading-none tabular-nums"
        style={{ color: 'var(--navy)' }}
      >
        {value}
      </div>
      <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-3 mt-2 whitespace-nowrap">
        {label}
      </div>
    </div>
  );
}

// The "Recommendation rationale" heading and its intro paragraph were
// dropped: the intro restated the score directly above it and repeated the
// scope caveat, which now lives once as the panel footnote. The two columns
// read as a balance without being told they're one.
function RecommendationBreakdown({ result, compact }: { result: AIInvestigationResult; compact?: boolean }) {
  return (
    <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'} gap-6`}>
      <FactorPanel
        title="Raises concern"
        icon="trend-up"
        tone="warn"
        items={result.riskSignals}
      />
      <FactorPanel
        title="Lowers concern"
        icon="trend-down"
        tone="clean"
        items={result.mitigatingSignals}
      />
    </div>
  );
}

// One side of the balance. No card wrapper and no bullet dots — the only
// colour is the soft-tinted icon tile, so direction stays legible without
// putting a status hue on the heading text or on the evidence itself.
// That matters here: this panel explicitly does not determine rental
// status, and colouring the copy reads as a verdict on it.
function FactorPanel({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: 'trend-up' | 'trend-down' | 'alert' | 'shield' | 'warning';
  tone: 'risk' | 'clean' | 'warn';
  items: string[];
}) {
  const ink = tone === 'risk' ? 'var(--risk-ink)' : tone === 'warn' ? 'var(--warn-ink)' : 'var(--clean-ink)';
  const soft = tone === 'risk' ? 'var(--risk-soft)' : tone === 'warn' ? 'var(--warn-soft)' : 'var(--clean-soft)';
  return (
    <section className="rounded-lg border border-line p-4">
      {/* The heading sits on a hairline shelf rather than free-floating —
          without it the two columns read as loose text adrift between the
          action block and the people list. The tinted icon is the only
          colour; the rule and the box do the grounding. */}
      <SectionHeading
        icon={
          <span
            className="w-7 h-7 rounded-md grid place-items-center shrink-0"
            style={{ background: soft, color: ink }}
          >
            <Icon name={icon} size={15} />
          </span>
        }
      >
        {title}
      </SectionHeading>
      <ul className="list-none m-0 p-0 mt-3 pt-3 border-t border-line flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="text-caption text-ink-2 leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OccupancyHistorySection({ result }: { result: AIInvestigationResult }) {
  const owner = result.occupancyHistory.find((person) => person.relationship === 'owner');
  const relatedPeople = result.occupancyHistory.filter((person) => person.relationship !== 'owner');

  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeading>People connected to the property</SectionHeading>
        <span className="font-sans text-caption text-ink-3 tabular-nums shrink-0">
          {result.occupancyHistory.length} total
        </span>
      </div>

      {/* The anchor keeps a tinted row because it is categorically
          different from the rest; everyone else is a plain row. */}
      {owner && (
        <div className="mt-3 rounded-lg border border-brand-2 p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className="font-sans font-semibold text-body-sm m-0 leading-tight"
              style={{ color: 'var(--navy)' }}
            >
              {owner.name}
            </h4>
            <RelationshipPill relationship="owner" />
          </div>
          <p className="font-sans text-caption leading-relaxed text-ink-2 m-0 mt-1">
            {owner.summary}
          </p>
        </div>
      )}

      <div className="mt-1">
        {relatedPeople.map((person) => (
          <OccupancyPersonRow key={person.name} person={person} />
        ))}
      </div>
    </section>
  );
}

// Renders nothing for 'unrelated'. Every non-anchor person in a typical
// report is unrelated, so the label was true of all of them at once and
// carried no per-row information — it just repeated down the list.
function RelationshipPill({
  relationship,
}: {
  relationship: AIInvestigationResult['occupancyHistory'][number]['relationship'];
}) {
  if (relationship === 'unrelated') return null;

  const isOwner = relationship === 'owner';
  return (
    <span
      className="inline-flex items-center h-5 px-2 rounded-full font-sans text-micro font-semibold shrink-0"
      style={
        isOwner
          ? { background: 'var(--brand-soft)', color: 'var(--brand-deep)' }
          : { background: 'var(--surface-2)', color: 'var(--ink-2)', boxShadow: '0 0 0 1px var(--line)' }
      }
    >
      {isOwner ? 'Current owner' : 'Possible household relation'}
    </span>
  );
}

// One non-anchor person. Name column is fixed-width so the summaries form
// a readable second column instead of starting at a ragged left edge.
function OccupancyPersonRow({
  person,
}: {
  person: AIInvestigationResult['occupancyHistory'][number];
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 py-2.5 border-b border-line last:border-b-0">
      <div className="flex items-center gap-2 sm:w-[200px] shrink-0">
        <span
          className="font-sans text-body-sm leading-tight"
          style={{ color: 'var(--navy)' }}
        >
          {person.name}
        </span>
        <RelationshipPill relationship={person.relationship} />
      </div>
      <p className="font-sans text-caption leading-relaxed text-ink-2 m-0 min-w-0">
        {person.summary}
      </p>
    </div>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3
      className="font-sans font-semibold text-ink m-0 flex items-center gap-2"
      style={{ fontSize: 'var(--text-body-sm)' }}
    >
      {icon}
      {children}
    </h3>
  );
}

// -------------------------------------------------------------------------
// Error — soft red surface, retry CTA.

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card padded className="card-rise">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <SlotEyebrow />
          <SlotTitle>The report did not finish</SlotTitle>
          <p className="font-sans text-body-sm text-ink-2 leading-relaxed m-0 mt-2 max-w-3xl">
            The connection dropped while records were being read. Nothing was
            saved, so this scan&rsquo;s report has not been used.
          </p>
        </div>
        <Button variant="default" onClick={onRetry} className="shrink-0">
          Re-run
        </Button>
      </div>
    </Card>
  );
}
