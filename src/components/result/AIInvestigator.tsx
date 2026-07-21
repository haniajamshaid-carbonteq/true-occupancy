/* global React, Card, Button, Pill, Icon, SCENARIOS,
   useAIInvestigator, startAIInvestigation, resetAIInvestigation */
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
   *  for the success/error frames. */
  forcedResult?: AIInvestigationResult;
  /** Spec-only override: error message for the error frame. */
  forcedError?: string;
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
  forcedError,
}: AIInvestigatorProps) {
  // Spec-frame override path: don't touch the bus, render the frozen state.
  if (forcedStatus) {
    return (
      <ForcedFrame
        scenario={scenario}
        status={forcedStatus}
        result={forcedResult}
        errorMessage={forcedError || 'network error'}
      />
    );
  }

  // Production path: subscribe to the shared bus.
  const bus = useAIInvestigator();
  // Reset whenever the scenario being viewed changes (user navigates between
  // /result/clean ↔ /result/high) so stale results don't carry over.
  React.useEffect(() => {
    if (bus.scenario && bus.scenario !== scenario) resetAIInvestigation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]);

  const status = bus.scenario === scenario ? bus.status : 'idle';

  // Idle = render nothing; the CTA in ScanContextBar carries the entire
  // affordance until the user opts in.
  if (status === 'idle') return null;
  // On the result page itself, render the rich inline progress / error
  // surface so the user has a clear in-context signal. The NotificationDock
  // detects this and suppresses its own AI notification while pathname
  // matches /result/* — it only takes over once the user navigates away.
  if (status === 'loading-step-1' || status === 'loading-step-2') {
    return <LoadingCard activeStep={status === 'loading-step-1' ? 1 : 2} />;
  }
  if (status === 'error') {
    return (
      <ErrorCard
        message={bus.errorMessage}
        onRetry={() => startAIInvestigation(scenario)}
      />
    );
  }
  if (status === 'success' && bus.result) {
    return (
      <SuccessCard
        scenario={scenario}
        result={bus.result}
        onRunAgain={resetAIInvestigation}
      />
    );
  }
  return null;
}

// Spec frames use this — they don't talk to the bus.
function ForcedFrame({
  scenario,
  status,
  result,
  errorMessage,
}: {
  scenario: ScenarioKey;
  status: AIStatus;
  result?: AIInvestigationResult;
  errorMessage: string;
}) {
  if (status === 'idle') return <IdleHint />;
  if (status === 'loading-step-1' || status === 'loading-step-2') {
    return <LoadingCard activeStep={status === 'loading-step-1' ? 1 : 2} />;
  }
  if (status === 'error') {
    return <ErrorCard message={errorMessage} onRetry={() => {}} />;
  }
  if (status === 'success' && result) {
    return <SuccessCard scenario={scenario} result={result} onRunAgain={() => {}} />;
  }
  return null;
}

// Used only in the spec frames — shows what the bar-mounted CTA looks like
// in isolation, since the live page doesn't render anything here when idle.
function IdleHint() {
  return (
    <div className="rounded-lg border border-dashed border-line p-4 text-center">
      <div className="font-sans text-caption text-ink-3">
        Idle — the CTA lives in <code className="font-mono">ScanContextBar</code>.
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Shared header (brand-teal AI glyph + title + tagline). Used by idle,
// loading, and error states. The success state uses its own hero band.

function ModuleHeader({
  trailing,
  tagline,
}: {
  trailing?: React.ReactNode;
  tagline?: string;
}) {
  return (
    <header className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="w-9 h-9 rounded-xl grid place-items-center shrink-0 relative overflow-hidden"
          style={{
            background:
              'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
            color: 'white',
            boxShadow: '0 1px 2px rgba(15,42,76,.10), 0 4px 12px rgba(10,183,163,.18)',
          }}
          aria-hidden
        >
          <Icon name="spark" size={18} />
        </span>
        <div className="min-w-0">
          <h2
            className="font-sans font-semibold text-ink m-0 leading-none"
            style={{ fontSize: 'var(--text-h4)' }}
          >
            AI Investigation
          </h2>
          {tagline && (
            <div
              className="font-sans text-eyebrow uppercase tracking-[0.08em] mt-1.5"
              style={{ color: 'var(--brand-deep)' }}
            >
              {tagline}
            </div>
          )}
        </div>
      </div>
      {trailing}
    </header>
  );
}

// -------------------------------------------------------------------------
// Idle — explainer + CTA. Reads as "you have a second tool available."

// Custom "AI-flavored" CTA: brand gradient, soft outer halo, sparkle icon
// with a slow shimmer. Distinct from the standard Button variants so it
// reads as something special — not "another primary button." Mounted by
// <ScanContextBar> next to Download PDF; subscribes to the bus so it
// flips to a "Running…" indicator while the investigation is in flight
// and hides itself entirely once the result card is visible.
function AICtaButton({
  scenario,
  size = 'md',
}: {
  scenario: ScenarioKey;
  size?: 'sm' | 'md';
}) {
  const bus = useAIInvestigator();
  const myStatus = bus.scenario === scenario ? bus.status : 'idle';
  const running =
    myStatus === 'loading-step-1' || myStatus === 'loading-step-2';
  // Hide once the result is rendered — the result card has its own
  // Run-again control, so duplicating the CTA in the bar would be noise.
  if (myStatus === 'success') return null;

  const HEIGHT = size === 'sm' ? 32 : 36;
  const FONT = size === 'sm' ? 'var(--text-caption)' : 'var(--text-label)';
  const PAD = size === 'sm' ? '0 12px 0 10px' : '0 12px 0 12px';

  return (
    <button
      type="button"
      onClick={() => startAIInvestigation(scenario)}
      disabled={running}
      className="ai-cta inline-flex items-center gap-1.5 rounded-lg font-sans font-semibold cursor-pointer border-0 transition-transform active:scale-[0.97] shrink-0 disabled:opacity-90 disabled:cursor-progress"
      style={{
        height: HEIGHT,
        padding: PAD,
        color: 'white',
        fontSize: FONT,
        letterSpacing: '0.01em',
        background:
          'linear-gradient(135deg, var(--brand) 0%, var(--brand-deep) 100%)',
      }}
    >
      <span
        className={`inline-flex items-center justify-center ${
          running ? '' : 'ai-cta-spark'
        }`}
        style={{ width: 14, height: 14 }}
        aria-hidden
      >
        {running ? <Spinner size={12} /> : <Icon name="ai-star" size={14} />}
      </span>
      {running ? 'Investigating...' : 'Run occupancy investigation'}
    </button>
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

function SuccessCard({
  result,
  onRunAgain,
}: {
  scenario: ScenarioKey;
  result: AIInvestigationResult;
  onRunAgain: () => void;
}) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <Card padded={false} className="card-rise" allowOverflow>
      <InvestigationResultPanel
        result={result}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((value) => !value)}
        onRunAgain={onRunAgain}
      />
    </Card>
  );
}

function InvestigationResultPanel({
  result,
  expanded,
  onToggleExpanded,
  onRunAgain,
}: {
  result: AIInvestigationResult;
  expanded: boolean;
  onToggleExpanded: () => void;
  onRunAgain: () => void;
}) {
  const band = AI_BAND_COPY[result.verdictBand];
  return (
    <>
      <div className="p-card">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}
                aria-hidden
              >
                <Icon name="ai-star" size={16} />
              </span>
              <Pill variant={band.variant} dot>{band.label}</Pill>
            </div>
            <h2 className="font-sans font-semibold text-h3 leading-tight m-0 mt-3 tracking-[-0.012em]" style={{ color: 'var(--navy)' }}>
              Occupancy investigation
            </h2>
            <p className="font-sans text-body-sm text-ink-2 leading-relaxed m-0 mt-2 max-w-4xl">
              {result.summary}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRunAgain}
              icon={<Icon name="replay" />}
            >
              Run again
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onToggleExpanded}
              iconRight={<Icon name="chevron" />}
              className={expanded ? '[&>span:last-child]:rotate-180' : ''}
            >
              {expanded ? 'Hide details' : 'View details'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <ScoreTile
            label="Occupancy-review score"
            value={`${result.score}/${result.scoreMax}`}
            helper={`${band.label.toLowerCase()} band`}
            tone={band.tone}
          />
          <ScoreTile
            label="Case archetype"
            value={result.caseArchetype}
            helper="occupancy context"
            tone="var(--navy)"
            compact
          />
        </div>

        <div className="mt-4 rounded-lg border border-line p-4 flex items-start gap-3" style={{ background: 'var(--brand-soft)' }}>
          <span className="w-7 h-7 rounded-md grid place-items-center shrink-0" style={{ background: 'var(--surface)', color: 'var(--brand-deep)' }}>
            <Icon name="arrow-right" size={15} />
          </span>
          <div className="min-w-0">
            <div className="font-sans font-semibold text-body-sm" style={{ color: 'var(--navy)' }}>Recommended action</div>
            <p className="font-sans text-caption leading-relaxed text-ink-2 m-0 mt-1">
              {result.nextStep}
            </p>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-line p-card">
          <RecommendationBreakdown result={result} />
          <OccupancyHistorySection result={result} />
        </div>
      )}
    </>
  );
}

function ScoreTile({
  label,
  value,
  helper,
  tone = 'var(--brand)',
  compact,
}: {
  label: string;
  value: string;
  helper: string;
  tone?: string;
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-lg border border-line bg-surface-2 p-3 min-w-0"
    >
      <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-3">
        {label}
      </div>
      <div
        className={`font-sans font-semibold leading-tight mt-1 ${compact ? 'text-body-sm' : 'text-h4'} truncate`}
        style={{ color: compact ? 'var(--navy)' : tone }}
        title={value}
      >
        {value}
      </div>
      <div className="font-sans text-caption text-ink-3 mt-1 truncate">{helper}</div>
    </div>
  );
}

function RecommendationBreakdown({ result, compact }: { result: AIInvestigationResult; compact?: boolean }) {
  return (
    <div>
      <SectionHeading
        icon={
          <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}>
            <Icon name="sliders" size={14} />
          </span>
        }
      >
        Recommendation rationale
      </SectionHeading>
      <p className="font-sans text-caption text-ink-3 leading-relaxed m-0 mt-2 max-w-4xl">
        These are the factors behind the {AI_BAND_COPY[result.verdictBand].label.toLowerCase()} band and the {result.score}/{result.scoreMax} occupancy-review score. This does not determine rental status without public listing evidence.
      </p>
      <div className={`grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-2'} gap-4 mt-3`}>
        <FactorPanel
          title="Raises concern"
          icon="alert"
          tone="risk"
          items={result.riskSignals}
        />
        <FactorPanel
          title="Lowers concern"
          icon="shield"
          tone="clean"
          items={result.mitigatingSignals}
        />
      </div>
    </div>
  );
}

function FactorPanel({
  title,
  icon,
  tone,
  items,
}: {
  title: string;
  icon: 'alert' | 'shield' | 'warning';
  tone: 'risk' | 'clean' | 'warn';
  items: string[];
}) {
  const color = tone === 'risk' ? 'var(--risk)' : tone === 'warn' ? 'var(--warn)' : 'var(--clean)';
  const soft = tone === 'risk' ? 'var(--risk-soft)' : tone === 'warn' ? 'var(--warn-soft)' : 'var(--clean-soft)';
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <SectionHeading
        icon={
          <span className="w-6 h-6 rounded-md grid place-items-center" style={{ background: soft, color }}>
            <Icon name={icon} size={14} />
          </span>
        }
      >
        {title}
      </SectionHeading>
      <ul className="list-none m-0 p-0 mt-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-caption text-ink-2 leading-snug">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: color }} />
            <span>{item}</span>
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
    <section className="mt-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div>
          <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3">
            Property context
          </div>
          <h3 className="font-sans font-semibold text-h3 leading-tight m-0 mt-2" style={{ color: 'var(--navy)' }}>
            Relationship to owner or borrower
          </h3>
          <p className="font-sans text-body-sm text-ink-2 leading-relaxed m-0 mt-2 max-w-4xl">
            These people have appeared in connection with the property. Their relationship to the owner or borrower helps explain occupancy ambiguity, but it does not prove current residence or rental use.
          </p>
        </div>
        <div className="shrink-0">
          <HistoryStat label="People" value={String(result.occupancyHistory.length)} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {owner && (
          <section className="rounded-lg border border-line bg-surface-2 p-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
              <span
                className="w-8 h-8 rounded-md grid place-items-center shrink-0"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}
                aria-hidden
              >
                <Icon name="pin" size={16} />
              </span>
              <div className="min-w-0 lg:w-[260px] shrink-0">
                <div className="font-sans text-eyebrow font-semibold uppercase tracking-[0.14em] text-ink-3">Owner / borrower anchor</div>
                <h4 className="font-sans font-semibold text-body m-0 mt-1 leading-tight" style={{ color: 'var(--navy)' }}>{owner.name}</h4>
              </div>
              <div className="hidden lg:block w-px self-stretch bg-line" aria-hidden />
              <div className="min-w-0">
                <p className="font-sans text-caption leading-relaxed text-ink-2 m-0 mt-2">
                  {owner.summary}
                </p>
              </div>
            </div>
          </section>
        )}
        <div className="flex items-center justify-between gap-3">
          <SectionHeading>Other people associated</SectionHeading>
          <span className="font-mono text-micro text-ink-3 uppercase tracking-[0.08em]">
            {relatedPeople.length} found
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {relatedPeople.map((person) => (
            <OccupancyPersonCard key={person.name} person={person} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 min-w-[76px]">
      <div
        className="font-mono text-h4 font-semibold leading-none tabular-nums"
        style={{ color: 'var(--navy)' }}
      >
        {value}
      </div>
      <div className="font-sans text-micro text-ink-3 mt-1 uppercase tracking-[0.08em]">
        {label}
      </div>
    </div>
  );
}

function OccupancyPersonCard({
  person,
}: {
  person: AIInvestigationResult['occupancyHistory'][number];
}) {
  const isOwner = person.relationship === 'owner';
  const relationshipLabel =
    person.relationship === 'owner'
      ? 'Owner'
      : person.relationship === 'likely_family'
      ? 'Possible household relation'
      : 'No known relation';
  const surface = person.primary ? 'var(--surface-2)' : 'var(--surface)';
  const pillStyle = isOwner
    ? { background: 'var(--brand-soft)', color: 'var(--brand-deep)' }
    : { background: 'var(--surface-2)', color: 'var(--ink-2)', boxShadow: '0 0 0 1px var(--line)' };

  return (
    <article
      className="relative rounded-lg border border-line p-4 overflow-hidden"
      style={{ background: surface }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-sans font-semibold text-body m-0 leading-tight" style={{ color: 'var(--navy)' }}>
              {person.name}
            </h4>
            <span
              className="inline-flex items-center h-6 px-2.5 rounded-full font-sans text-micro font-bold uppercase tracking-[0.08em]"
              style={pillStyle}
            >
              {relationshipLabel}
            </span>
          </div>
          <p className="font-sans text-caption leading-relaxed text-ink-2 m-0 mt-3">
            {person.summary}
          </p>
        </div>
      </div>
    </article>
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

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card
      padded
      className="card-rise"
      style={{
        background: 'var(--risk-soft)',
        borderColor: 'var(--risk)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="w-7 h-7 rounded-full grid place-items-center shrink-0"
          style={{ background: 'var(--surface)', color: 'var(--risk)' }}
          aria-hidden
        >
          <Icon name="alert" size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <h2
            className="font-sans font-semibold m-0 leading-none"
            style={{
              fontSize: 'var(--text-h4)',
              color: 'var(--risk-ink)',
            }}
          >
            Investigation failed
          </h2>
          <p
            className="font-sans text-body-sm m-0 mt-1.5 leading-snug"
            style={{ color: 'var(--risk-ink)' }}
          >
            {message || 'network error'}
          </p>
          <div className="mt-3.5">
            <Button variant="default" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
