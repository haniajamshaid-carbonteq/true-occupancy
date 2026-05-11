/* global React */
// MetricCard — single primitive for every metric/KPI tile in the product.
// Used by HomeScreen (KPI strip with deltas) and BatchScreen (status
// counts in the summary card). Keeps spacing, typography, and the
// header/body/footer rhythm identical across surfaces.
//
// Composition:
//   HEADER  ─ tiny accent dot + uppercase eyebrow label
//   BODY    ─ tabular numeral, dominant
//   FOOTER  ─ optional delta + hint, separated by a hairline
//
// `accent` colours the small header dot. Use `'up' | 'down'` for
// directional KPI semantics (green/red), or one of the verdict tones
// (`clean | warn | risk`) when the metric carries categorical meaning.

interface MetricDelta {
  dir: 'up' | 'down';
  /** Display string, e.g. '+12%', '-1pt'. */
  value: string;
}

type MetricAccent =
  // Neutral verdict triplet — paints the small header dot in the matching
  // categorical hue without colouring the value/footer.
  | 'verdict-high' | 'verdict-med' | 'verdict-low';

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  /** Hint text in the footer-right. Renders the footer when present. */
  hint?: string;
  /** Optional signed delta in the footer-left. Renders the footer when present. */
  delta?: MetricDelta;
  /** 'md' for KPI tiles (42px value). 'sm' for compact summary stats (34px). */
  size?: 'sm' | 'md';
  /** Promote the card visually — paints the surface with the brand teal,
   *  flips text to white. Use for the headline KPI in a row of metrics. */
  primary?: boolean;
  /** Optional categorical accent — renders a small dot to the left of the
   *  eyebrow label in the verdict tone. */
  accent?: MetricAccent;
  /** Optional decorative icon — rendered top-right in a soft tinted square. */
  icon?: React.ReactNode;
  /** Optional inline sparkline data — renders as a mini line chart between
   *  the value and the footer. Trend direction colours the stroke. */
  sparkline?: number[];
  /** Override the sparkline trend tone. Defaults to delta direction, then brand. */
  sparklineTone?: 'up' | 'down' | 'brand';
  /** Optional override className for the outer card. */
  className?: string;
  /** When provided, the card renders as a button and fires this on click. */
  onClick?: () => void;
  /** Selected state for interactive cards — brand-tinted border + faint tint bg. */
  selected?: boolean;
}

function Sparkline({
  data,
  stroke,
  fill,
}: { data: number[]; stroke: string; fill: string }) {
  if (data.length < 2) return null;
  const W = 100;
  const H = 28;
  const PAD = 1.5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (data.length - 1);
  const pts = data.map((v, i) => {
    const x = PAD + i * stepX;
    const y = PAD + (H - PAD * 2) * (1 - (v - min) / range);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(2)} ${H} L${pts[0][0].toFixed(2)} ${H} Z`;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-7 mt-3 block"
      aria-hidden
    >
      <path className="sparkline-area" d={area} fill={fill} />
      <path
        className="sparkline-line"
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  );
}

const ACCENT_VAR: Record<MetricAccent, string> = {
  'verdict-high': 'var(--verdict-high)',
  'verdict-med':  'var(--verdict-med)',
  'verdict-low':  'var(--verdict-low)',
};

function MetricCard({
  label,
  value,
  hint,
  delta,
  size = 'md',
  primary = false,
  accent,
  icon,
  sparkline,
  sparklineTone,
  className = '',
  onClick,
  selected = false,
}: MetricCardProps) {
  const interactive = typeof onClick === 'function';
  const hasFooter = !!(delta || hint);
  const valueClass =
    size === 'sm'
      ? 'text-h2 sm:text-h2'
      : 'text-h1 sm:text-h1';

  // Primary variant: brand gradient (teal → sky-blue, the same wash used
  // on Halcyon's hero band per design-system §6) with white-on-gradient
  // type. Delta direction stays legible via the arrow + sign — the
  // green/red would fight the gradient if applied as fill colour.
  const surface = primary
    ? 'text-white border-transparent shadow-md bg-gradient-to-r from-brand to-brand-2'
    : selected
    ? '!bg-surface !border-brand shadow-sm'
    : 'bg-surface border-line shadow-sm';
  const interactiveClasses = interactive
    ? 'text-left w-full cursor-pointer transition-colors hover:border-line-strong hover:bg-hover-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-1'
    : '';
  const labelColor = primary ? 'rgba(255,255,255,0.85)' : 'var(--ink-3)';
  const valueColor = primary ? '#FFFFFF' : 'var(--navy)';
  const footerDivider = primary ? 'border-white/20' : 'border-line';
  const hintColor = primary ? 'rgba(255,255,255,0.78)' : 'var(--ink-3)';
  const deltaColor = primary
    ? 'rgba(255,255,255,0.95)'
    : delta?.dir === 'up'
    ? 'var(--success-ink)'
    : 'var(--error-ink)';

  const Tag: any = interactive ? 'button' : 'div';
  const tagProps: any = interactive
    ? { type: 'button', onClick, 'aria-pressed': selected }
    : {};

  // One-shot pulse on numeric value changes. Skips the initial mount so
  // tiles don't jitter when the screen first appears.
  const [pulseKey, setPulseKey] = React.useState(0);
  const prevValueRef = React.useRef(value);
  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setPulseKey((k) => k + 1);
    }
  }, [value]);

  const tone = sparklineTone ?? (delta?.dir === 'down' ? 'down' : delta?.dir === 'up' ? 'up' : 'brand');
  const sparkStroke = primary
    ? 'rgba(255,255,255,0.95)'
    : tone === 'up'
    ? 'var(--success-ink)'
    : tone === 'down'
    ? 'var(--error-ink)'
    : 'var(--brand)';
  const sparkFill = primary
    ? 'rgba(255,255,255,0.18)'
    : tone === 'up'
    ? 'rgba(46,160,67,0.10)'
    : tone === 'down'
    ? 'rgba(207,34,46,0.10)'
    : 'rgba(15,143,184,0.10)';
  const iconWrap = primary
    ? 'bg-white/15 text-white'
    : 'bg-brand-soft text-brand';

  return (
    <Tag
      {...tagProps}
      className={`border rounded-lg p-card-tight flex flex-col ${surface} ${interactiveClasses} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase inline-flex items-center gap-1.5"
          style={{ color: labelColor }}
        >
          {accent && (
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: ACCENT_VAR[accent] }}
              aria-hidden
            />
          )}
          {label}
        </div>
        {icon && (
          <span
            className={`w-7 h-7 rounded-md grid place-items-center shrink-0 ${iconWrap} [&>svg]:w-3.5 [&>svg]:h-3.5`}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      <div
        key={pulseKey}
        className={`font-sans font-semibold ${valueClass} leading-none tracking-[-0.025em] tabular-nums mt-3 origin-left ${
          pulseKey > 0 ? 'verdict-pulse' : ''
        }`}
        style={{ color: valueColor }}
      >
        {value}
      </div>

      {sparkline && sparkline.length > 1 && (
        <Sparkline data={sparkline} stroke={sparkStroke} fill={sparkFill} />
      )}

      {hasFooter && (
        <div className={`mt-4 pt-3 border-t ${footerDivider} flex items-center justify-between gap-2 text-caption text-left`}>
          {delta ? (
            <span
              className="inline-flex items-center gap-1 font-semibold tabular-nums"
              style={{ color: deltaColor }}
            >
              <svg
                viewBox="0 0 12 12"
                className="w-2.5 h-2.5"
                fill="currentColor"
                aria-hidden
              >
                {delta.dir === 'up' ? (
                  <path d="M6 2 11 9H1z" />
                ) : (
                  <path d="M6 10 1 3h10z" />
                )}
              </svg>
              {delta.value}
            </span>
          ) : (
            <span />
          )}
          {hint && (
            <span className="truncate" style={{ color: hintColor }}>
              {hint}
            </span>
          )}
        </div>
      )}
    </Tag>
  );
}
