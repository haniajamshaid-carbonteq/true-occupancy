/* global React, Card, Icon, SCENARIOS, ReferenceCell, useAppState */
// ConfidenceHero — promotes the composite confidence score to the top of the
// result page and exposes the factor breakdown ("Why this score") as an
// accordion underneath.
//
// Right rail (May-2026 redesign): just the <ScanReferenceField/>, the
// lender's tracking identifier. The waffle grid, fallback badge, and score
// sparkline were all removed at the client's request — the verdict + score
// copy on the left carries the page on its own.

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

function ConfidenceHero({ scenario, defaultOpen = true }: ConfidenceHeroProps) {
  const sc = SCENARIOS[scenario];
  const animatedScore = useCountUp(sc.score, 800);

  return (
    // Unpadded so the disclosure row below can run full-bleed to the card
    // edges, the same as the occupancy-report slot. The hero body carries
    // its own padding instead.
    <Card>
      <div className="px-6 py-5">
      {/* Two-column hero. Left column owns the scan identity stack
          (verdict → score → reference pinned to the bottom). Right column
          carries the descriptive copy (headline + summary). A 1 px
          --line divider separates the two so each side reads as its own
          block — matches DESIGN.md §13.3 hairline rhythm. Collapses to a
          stacked layout below md so the verdict stays the lead read on
          narrow viewports. */}
      <div className="flex flex-col md:flex-row md:items-stretch gap-6 md:gap-8">
        {/* Left — identity stack (narrower 1:2 column ratio shifts the
            divider left of geometric centre so the divider feels balanced
            against the dense right-side description). */}
        <div className="flex flex-col md:flex-[1] md:min-w-0">
          <div
            className="font-sans font-semibold leading-[0.95] tracking-[-0.012em]"
            style={{ fontSize: "var(--text-h1)", color: 'var(--navy)' }}
          >
            {VERDICT_TEXT[scenario]}
          </div>
          <div className="mt-3 font-sans text-label text-ink-3 tabular-nums">
            <span className="font-semibold text-ink-2">{animatedScore}%</span> confidence
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
