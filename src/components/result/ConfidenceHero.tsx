/* global React, Card, Icon, Pill, SCENARIOS, PROPERTY, ReferenceCell, useAppState */
// ConfidenceHero — promotes the composite confidence score to the top of the
// result page and exposes the factor breakdown ("Why this score") as an
// accordion underneath.
//
// Right rail (May-2026 redesign):
//   * <ScanReferenceField/>, top-aligned — the lender's tracking identifier.
//   * <ConfidenceTrend/> sparkline below it WHEN the property has 2+ scans
//     on file, showing the trajectory of past scores.
//   * Single-scan properties get just the reference; the verdict + score
//     copy on the left carries the page (no badge — was redundant).

interface ConfidenceHeroProps {
  scenario: ScenarioKey;
  /** Whether the "Why this score" accordion starts open. Default true. */
  defaultOpen?: boolean;
}

type HeroVerdict = 'low' | 'medium' | 'high';

const VERDICT_STATUS: Record<HeroVerdict, 'clean' | 'warn' | 'risk'> = {
  low: 'clean',
  medium: 'warn',
  high: 'risk',
};

interface TrendPoint {
  /** Short date label rendered under the dot ("Jun '25", "Today"). */
  label: string;
  scorePct: number;
  verdict: HeroVerdict;
  /** Highlighted dot — the scan being shown. */
  isCurrent: boolean;
}

// Sparkline of confidence scores across this property's prior scans.
// Each dot is filled with its verdict color, connected by a soft line so
// the rise/fall is readable at a glance. The current scan's dot is
// enlarged and ringed. Y-axis spans 0–100; x-axis is equally spaced
// (calendar-accurate spacing isn't worth the room).
function ConfidenceTrend({ points }: { points: TrendPoint[] }) {
  const W = 232;
  const H = 110;
  const PAD_X = 12;
  const PAD_Y = 14;
  const innerW = W - PAD_X * 2;
  const innerH = H - PAD_Y * 2;

  const xFor = (i: number) =>
    points.length === 1 ? W / 2 : PAD_X + (i / (points.length - 1)) * innerW;
  const yFor = (score: number) => PAD_Y + (1 - score / 100) * innerH;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)} ${yFor(p.scorePct)}`)
    .join(' ');

  function statusColor(v: HeroVerdict): string {
    return `var(--${VERDICT_STATUS[v]})`;
  }

  return (
    <div className="shrink-0" style={{ width: W }}>
      <div
        className="font-sans text-eyebrow font-semibold tracking-[0.12em] uppercase mb-1"
        style={{ color: 'var(--ink-3)' }}
      >
        Score history · {points.length} {points.length === 1 ? 'scan' : 'scans'}
      </div>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block"
        role="img"
        aria-label={`Confidence trend across ${points.length} scans`}
      >
        {/* baseline + 50% gridline for context — kept faint */}
        <line
          x1={PAD_X} x2={W - PAD_X}
          y1={yFor(50)} y2={yFor(50)}
          stroke="var(--line)" strokeWidth={0.5} strokeDasharray="2 3"
        />
        <line
          x1={PAD_X} x2={W - PAD_X}
          y1={H - PAD_Y} y2={H - PAD_Y}
          stroke="var(--line)" strokeWidth={0.5}
        />
        {points.length > 1 && (
          <path d={linePath} fill="none" stroke="var(--line-strong)" strokeWidth={1.5} />
        )}
        {points.map((p, i) => {
          const cx = xFor(i);
          const cy = yFor(p.scorePct);
          const color = statusColor(p.verdict);
          return (
            <g key={i}>
              {p.isCurrent && (
                <circle cx={cx} cy={cy} r={9} fill="none" stroke={color} strokeWidth={1.5} opacity={0.35} />
              )}
              <circle
                cx={cx} cy={cy}
                r={p.isCurrent ? 5 : 3.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-0.5 flex" style={{ width: W }}>
        {points.map((p, i) => (
          <div
            key={i}
            className="font-sans tabular-nums text-ink-3 text-center"
            style={{
              flex: 1,
              fontSize: 'var(--text-eyebrow)',
              fontWeight: p.isCurrent ? 600 : 400,
              color: p.isCurrent ? 'var(--ink-2)' : 'var(--ink-3)',
            }}
          >
            <div>{p.scorePct}%</div>
            <div className="leading-tight" style={{ opacity: 0.85 }}>{p.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// One factor row in the "Why this score" breakdown. Positive-only render:
// magnitude shown as a soft teal Pill, no signed sign or impact bar.
// Mounts with a staggered fade+rise so the list reveals in cadence with the
// waffle grid above (parent re-keys rows on accordion toggle, so the entrance
// also fires every time the user reopens).
function FactorRow({
  title,
  desc,
  impact,
  index,
}: {
  title: string;
  desc: string;
  impact: number;
  index: number;
}) {
  const abs = Math.abs(impact);

  return (
    <div
      className="py-3.5 card-rise"
      style={{ '--rise-delay': `${80 + index * 60}ms` } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-sans font-semibold text-body-sm text-ink-2 leading-tight min-w-0">
          {title}
        </div>
        <Pill variant="clean" size="md" className="tabular-nums shrink-0">
          {abs}%
        </Pill>
      </div>
      <div className="mt-1.5 font-sans text-caption text-ink-3 leading-snug">
        {desc}
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

  return (
    <div className="mt-5 pt-5 border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer text-left p-0"
      >
        <h3
          className="font-sans font-semibold m-0"
          style={{ fontSize: 'var(--text-h4)', color: 'var(--navy)' }}
        >
          Why This Score
        </h3>
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
        <div className="mt-3 divide-y divide-line">
          {rows.map((r, i) => (
            <FactorRow
              key={`${open ? 'o' : 'c'}-${i}`}
              title={r.title}
              desc={r.desc}
              impact={r.impact}
              index={i}
            />
          ))}
        </div>
      </AccordionPanel>
    </div>
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

// Tiny relative-string → Date parser for the trend labels. Kept inline so
// the hero doesn't grow a cross-file dependency on CertificateSheet's
// equivalent helper; both are ~15 lines and rot together if they ever
// diverge.
const HERO_UNIT_MS: Record<string, number> = {
  min: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 7 * 86_400_000,
  mo: 30 * 86_400_000,
  y: 365 * 86_400_000,
};
function heroParseScannedAgo(scannedAgo: string, now: Date = new Date()): Date {
  const s = (scannedAgo || '').trim().toLowerCase();
  if (!s || s === 'just now') return now;
  if (s === 'yesterday') return new Date(now.getTime() - HERO_UNIT_MS.d);
  const m = s.match(/^(\d+)\s*(min|h|d|w|mo|y)\s*ago$/);
  if (!m) return now;
  return new Date(now.getTime() - parseInt(m[1], 10) * (HERO_UNIT_MS[m[2]] ?? 0));
}
function heroDotLabel(d: Date, isMostRecent: boolean): string {
  if (isMostRecent) return 'Today';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(-2)}`;
}

function ConfidenceHero({ scenario, defaultOpen = true }: ConfidenceHeroProps) {
  const sc = SCENARIOS[scenario];
  const animatedScore = useCountUp(sc.score, 800);
  // Read raw history and filter inline. We don't use the
  // getHistoryForAddress() selector because it landed on the scan-history-
  // report branch (#48) and isn't on main yet; this PR stays decoupled.
  const { history } = useAppState();

  // Resolve which address this result page is for so we can look up its
  // prior scans. Falls back to PROPERTY.address (the demo property), matching
  // CertificateSheet's resolution order.
  const resolvedAddress =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  // Build trend points from history. Seed is newest-first; sparkline reads
  // left-to-right oldest-to-newest, so reverse. The newest entry is treated
  // as "current" (most recent visible scan = the one the user is reading).
  const trendPoints: TrendPoint[] = React.useMemo(() => {
    const entries = (history ?? []).filter(
      (h: any) => h.kind === 'single' && h.address === resolvedAddress
    );
    if (entries.length === 0) return [];
    return entries
      .slice()
      .reverse()
      .map((h: any, i: number, arr: any[]) => {
        const isCurrent = i === arr.length - 1;
        return {
          label: heroDotLabel(heroParseScannedAgo(h.scannedAgo), isCurrent),
          scorePct: SCENARIOS[h.scenario as HeroVerdict].score,
          verdict: h.scenario as HeroVerdict,
          isCurrent,
        };
      });
  }, [history, resolvedAddress]);

  // Trend needs at least two points to be meaningful — otherwise the
  // sparkline degenerates to one dot, which is just the badge anyway.
  const showTrend = trendPoints.length >= 2;

  return (
    <Card className="px-6 py-5">
      {/* Hero row — verdict + supporting text on the left; reference (and
          optional trend) stacked on the right. Items align to the top so
          the reference sits flush with the verdict's baseline corner. */}
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <div
            className="font-sans font-semibold leading-[0.95] tracking-[-0.025em]"
            style={{ fontSize: "var(--text-h1)", color: 'var(--navy)' }}
          >
            {VERDICT_TEXT[scenario]}
          </div>
          <div className="mt-3 font-sans text-label text-ink-3 tabular-nums">
            <span className="font-semibold text-ink-2">{animatedScore}%</span> confidence
          </div>
          <div className="mt-3 max-w-[44ch]">
            <div className="font-sans text-body font-medium text-ink-2 leading-snug">
              {sc.headline}
            </div>
            <div className="mt-1.5 font-sans text-label text-ink-3 leading-relaxed">
              {sc.summary}
            </div>
          </div>
        </div>

        {/* Right rail. Reference is top-aligned; the trend sparkline (when
            this property has 2+ scans on file) drops in underneath. When
            there's only one scan, the rail is just the Reference field —
            the badge that used to live here was redundant with the verdict
            copy on the left and is gone. */}
        <div className="shrink-0 flex flex-col items-end gap-5">
          {/* Reference — optional user-supplied identifier (loan #, case
              file, client ID). Mirrored to sessionStorage for the PDF cert;
              persisted to history when the result was opened from /history. */}
          <ScanReferenceField />
          {showTrend && <ConfidenceTrend points={trendPoints} />}
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
    <div className="inline-flex items-center gap-2">
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
