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

// Decide alignment: does the AI verdict match the rule-based one for this
// scenario? Used to power the "AI agrees" / "AI's call differs" row.
function computeAlignment(
  scenario: ScenarioKey,
  aiVerdict: 'clean' | 'warn' | 'risk'
): { agrees: boolean; ruleLabel: string; aiLabel: string } {
  const sc = SCENARIOS[scenario];
  const RULE_LABEL: Record<'clean' | 'warn' | 'risk', string> = {
    clean: 'Clean',
    warn: 'Questionable',
    risk: 'Red Flag',
  };
  return {
    agrees: aiVerdict === sc.risk,
    ruleLabel: RULE_LABEL[sc.risk],
    aiLabel: RULE_LABEL[aiVerdict],
  };
}

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
        boxShadow:
          '0 1px 2px rgba(15,42,76,.10), 0 6px 18px rgba(10,183,163,.28), inset 0 0 0 1px rgba(255,255,255,.18)',
      }}
    >
      <span
        className={`inline-flex items-center justify-center ${
          running ? '' : 'ai-cta-spark'
        }`}
        style={{ width: 14, height: 14 }}
        aria-hidden
      >
        {running ? <Spinner size={12} /> : <Icon name="spark" size={14} />}
      </span>
      {running ? 'Investigating…' : 'Run AI Investigator'}
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
const LOADING_STEPS: Array<{ phase: 1 | 2; label: string }> = [
  { phase: 1, label: 'Locating parcel & owner records' },
  { phase: 1, label: 'Pulling deed history & STR permits' },
  { phase: 1, label: 'Scanning Airbnb, Vrbo & Marketplace' },
  { phase: 2, label: 'Matching photos & metadata signals' },
  { phase: 2, label: 'Computing confidence & drafting report' },
];

function LoadingCard({ activeStep }: { activeStep: 1 | 2 }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    setTick(0);
    const id = window.setInterval(() => setTick((t) => t + 1), 380);
    return () => window.clearInterval(id);
  }, [activeStep]);

  const phase1Count = LOADING_STEPS.filter((s) => s.phase === 1).length;
  const current =
    activeStep === 1
      ? Math.min(tick, phase1Count - 1)
      : Math.min(phase1Count + tick, LOADING_STEPS.length - 1);

  return (
    <Card padded>
      <ModuleHeader tagline="Scanning evidence…" />
      <div className="relative pl-1" aria-live="polite" aria-busy="true">
        {/* Connector rail through the dots */}
        <div
          className="absolute w-px ai-scan-rail"
          style={{ left: 10, top: 10, bottom: 10, background: 'var(--line)' }}
          aria-hidden
        />
        {/* Sweeping scan beam */}
        <div
          className="absolute rounded-full pointer-events-none ai-scan-beam"
          style={{
            left: 4,
            width: 12,
            height: 12,
            background:
              'radial-gradient(circle, rgba(10,183,163,0.55) 0%, rgba(10,183,163,0) 70%)',
          }}
          aria-hidden
        />
        <ol className="list-none m-0 p-0 flex flex-col gap-3 relative">
          {LOADING_STEPS.map((s, i) => {
            const state =
              i < current ? 'done' : i === current ? 'running' : 'pending';
            return (
              <LoadingStep key={i} label={s.label} state={state} index={i} />
            );
          })}
        </ol>
      </div>
    </Card>
  );
}

function LoadingStep({
  label,
  state,
  index,
}: {
  label: string;
  state: 'pending' | 'running' | 'done';
  index: number;
}) {
  return (
    <li
      className="flex items-start gap-3 relative card-rise"
      style={{ ['--rise-delay' as any]: `${index * 60}ms` }}
    >
      <span
        className="rounded-full grid place-items-center shrink-0 relative z-10 transition-all"
        style={{
          width: 20,
          height: 20,
          ...(state === 'done'
            ? { background: 'var(--clean)', color: 'white' }
            : state === 'running'
              ? {
                  background: 'var(--brand-soft)',
                  color: 'var(--brand-deep)',
                  boxShadow:
                    '0 0 0 3px rgba(10,183,163,0.18), 0 0 0 1px var(--brand)',
                }
              : {
                  background: 'var(--surface)',
                  color: 'var(--ink-4)',
                  boxShadow: 'inset 0 0 0 1.5px var(--line)',
                }),
        }}
        aria-hidden
      >
        {state === 'done' ? (
          <Icon name="check" size={11} />
        ) : state === 'running' ? (
          <Spinner size={11} />
        ) : (
          <span
            className="rounded-full"
            style={{ width: 4, height: 4, background: 'currentColor' }}
          />
        )}
      </span>
      <div
        className="font-sans text-body-sm leading-snug transition-colors flex-1 min-w-0"
        style={{
          color:
            state === 'pending'
              ? 'var(--ink-4)'
              : state === 'running'
                ? 'var(--ink)'
                : 'var(--ink-2)',
          fontWeight: state === 'running' ? 600 : 500,
          paddingTop: 1,
        }}
      >
        {label}
      </div>
    </li>
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
  scenario,
  result,
  onRunAgain,
}: {
  scenario: ScenarioKey;
  result: AIInvestigationResult;
  onRunAgain: () => void;
}) {
  const align = computeAlignment(scenario, result.verdict);
  // Default open when AI disagrees with the rule-based call (high-signal
  // moment the user should not have to click to see), otherwise collapsed.
  const [open, setOpen] = React.useState(!align.agrees);

  return (
    <Card padded={false} className="card-rise" allowOverflow>
      <SuccessHero result={result} align={align} onRunAgain={onRunAgain} />

      <ReportAccordion
        open={open}
        onToggle={() => setOpen((v) => !v)}
        findingsCount={result.findings.length}
        actionsCount={result.actions.length}
      >
        <div className="px-card pb-card pt-3 space-y-4">
          <FindingsList findings={result.findings} verdict={result.verdict} />
          <ActionsList actions={result.actions} />
          {result.caveat && <CaveatNote text={result.caveat} />}
        </div>
      </ReportAccordion>
    </Card>
  );
}

// ---- Success hero -------------------------------------------------------
// Compact header block — verdict label + inline confidence numeric +
// alignment chip. No background gradient, no decorative ring. The
// Run-again control sits in the top-right alongside the verdict pill so
// the action is reachable without scrolling past the report body.

function SuccessHero({
  result,
  align,
  onRunAgain,
}: {
  result: AIInvestigationResult;
  align: { agrees: boolean; ruleLabel: string; aiLabel: string };
  onRunAgain: () => void;
}) {
  const verdict = result.verdict;
  return (
    <div className="relative p-card pb-4">
      <ModuleHeader
        tagline={align.agrees ? 'Second opinion · confirmed' : 'Second opinion · escalated'}
        trailing={
          <div className="flex items-center gap-2 shrink-0">
            <Pill variant={verdict} dot>
              {result.verdictLabel}
            </Pill>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRunAgain}
              icon={<Icon name="replay" />}
            >
              Run again
            </Button>
          </div>
        }
      />

      <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1 mt-3">
        <div
          className="font-sans font-semibold leading-[0.95] tracking-[-0.025em]"
          style={{ fontSize: 'var(--text-h2)', color: 'var(--navy)' }}
        >
          {result.verdictLabel}
        </div>
        <div
          className="font-sans text-label tabular-nums leading-none"
          style={{ color: 'var(--ink-3)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
            {result.confidence}%
          </span>{' '}
          {result.confidenceLabel.toLowerCase()} confidence
        </div>
      </div>

      <AlignmentRow
        agrees={align.agrees}
        ruleLabel={align.ruleLabel}
        aiLabel={align.aiLabel}
      />
    </div>
  );
}

function AlignmentRow({
  agrees,
  ruleLabel,
  aiLabel,
}: {
  agrees: boolean;
  ruleLabel: string;
  aiLabel: string;
}) {
  // Single-line callout. Soft tint mirrors meaning:
  // clean-soft = AI agrees, warn-soft = AI escalated (notable but not alarm).
  const palette = agrees
    ? {
        background: 'var(--clean-soft)',
        color: 'var(--clean-ink)',
        iconName: 'check' as const,
        ring: 'var(--clean)',
      }
    : {
        background: 'var(--warn-soft)',
        color: 'var(--warn-ink)',
        iconName: 'alert' as const,
        ring: 'var(--warn)',
      };
  return (
    <div
      className="mt-3 inline-flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5"
      style={{
        background: palette.background,
        color: palette.color,
      }}
    >
      <span
        className="w-4 h-4 rounded-full grid place-items-center shrink-0"
        style={{ background: palette.ring, color: 'white' }}
        aria-hidden
      >
        <Icon name={palette.iconName} size={10} />
      </span>
      <span className="font-sans text-caption font-medium leading-none">
        {agrees ? (
          <>
            AI agrees with the{' '}
            <strong className="font-semibold">{ruleLabel}</strong> verdict
          </>
        ) : (
          <>
            AI escalated from{' '}
            <strong className="font-semibold">{ruleLabel}</strong> →{' '}
            <strong className="font-semibold">{aiLabel}</strong>
          </>
        )}
      </span>
    </div>
  );
}

// ---- Report accordion ---------------------------------------------------

function ReportAccordion({
  open,
  onToggle,
  findingsCount,
  actionsCount,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  findingsCount: number;
  actionsCount: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = React.useState<number | 'auto'>(open ? 'auto' : 0);
  React.useEffect(() => {
    if (!ref.current) return;
    if (open) {
      const h = ref.current.scrollHeight;
      setMaxH(h);
      // After the transition, swap to 'auto' so dynamic content inside
      // (longer text, etc.) won't get clipped on resize.
      const t = window.setTimeout(() => setMaxH('auto'), 320);
      return () => window.clearTimeout(t);
    }
    // Closing: if we're currently 'auto', set the measured height first
    // so the next tick can transition down to 0.
    if (maxH === 'auto') {
      setMaxH(ref.current.scrollHeight);
      requestAnimationFrame(() => setMaxH(0));
    } else {
      setMaxH(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer text-left p-card hover:bg-hover-bg transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-5 h-5 rounded-md grid place-items-center shrink-0"
            style={{
              background: 'var(--surface-2)',
              color: 'var(--ink-3)',
            }}
            aria-hidden
          >
            <Icon name="layers" size={12} />
          </span>
          <h3
            className="font-sans font-semibold text-ink m-0"
            style={{ fontSize: 'var(--text-body)' }}
          >
            AI report
          </h3>
          <span
            className="font-sans text-caption text-ink-4 tabular-nums"
          >
            · {findingsCount} {findingsCount === 1 ? 'finding' : 'findings'} · {actionsCount} {actionsCount === 1 ? 'action' : 'actions'}
          </span>
        </div>
        <span
          className={`w-6 h-6 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>
      <div
        className="accordion-content"
        style={{
          maxHeight: maxH === 'auto' ? 'none' : `${maxH}px`,
          opacity: open ? 1 : 0,
        }}
      >
        <div ref={ref}>{children}</div>
      </div>
    </div>
  );
}

// ---- Findings + Actions lists ------------------------------------------

function FindingsList({
  findings,
  verdict,
}: {
  findings: string[];
  verdict: 'clean' | 'warn' | 'risk';
}) {
  return (
    <section>
      <SectionHeading
        icon={
          <span
            className="w-5 h-5 rounded-full grid place-items-center"
            style={{
              background: `var(--${verdict}-soft)`,
              color: `var(--${verdict}-ink)`,
            }}
          >
            <Icon name="check" size={12} />
          </span>
        }
      >
        Key findings
      </SectionHeading>
      <ul className="list-none m-0 p-0 mt-3 flex flex-col gap-2">
        {findings.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg p-3 card-rise"
            style={{
              background: 'var(--surface-2)',
              ['--rise-delay' as any]: `${i * 60}ms`,
            }}
          >
            <span
              className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-px"
              style={{
                background: `var(--${verdict})`,
                color: 'white',
              }}
              aria-hidden
            >
              <Icon name="check" size={11} />
            </span>
            <span className="font-sans text-body-sm text-ink-2 leading-snug">
              {f}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionsList({ actions }: { actions: string[] }) {
  return (
    <section>
      <SectionHeading
        icon={
          <span
            className="w-5 h-5 rounded-full grid place-items-center"
            style={{
              background: 'var(--brand-soft)',
              color: 'var(--brand-deep)',
            }}
          >
            <Icon name="arrow-right" size={12} />
          </span>
        }
      >
        Recommended actions
      </SectionHeading>
      <ol className="list-none m-0 p-0 mt-3 flex flex-col gap-2">
        {actions.map((a, i) => (
          <li
            key={i}
            className="flex items-start gap-3 card-rise"
            style={{ ['--rise-delay' as any]: `${100 + i * 60}ms` }}
          >
            <span
              className="w-6 h-6 rounded-full grid place-items-center shrink-0 mt-px font-sans font-semibold tabular-nums"
              style={{
                background: 'var(--brand-soft)',
                color: 'var(--brand-deep)',
                fontSize: 'var(--text-micro)',
              }}
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="font-sans text-body-sm text-ink-2 leading-snug pt-0.5">
              {a}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CaveatNote({ text }: { text: string }) {
  return (
    <div
      className="rounded-lg flex items-start gap-2.5 p-3"
      style={{
        background: 'var(--warn-soft)',
        color: 'var(--warn-ink)',
      }}
      role="note"
    >
      <span
        className="w-5 h-5 rounded-full grid place-items-center shrink-0 mt-0.5"
        style={{ background: 'var(--warn)', color: 'white' }}
        aria-hidden
      >
        <Icon name="alert" size={12} />
      </span>
      <div className="min-w-0">
        <div
          className="font-sans font-semibold text-caption uppercase tracking-[0.06em] mb-0.5"
        >
          Caveat
        </div>
        <div className="font-sans text-body-sm leading-snug">{text}</div>
      </div>
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
      style={{ fontSize: 'var(--text-body)' }}
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
