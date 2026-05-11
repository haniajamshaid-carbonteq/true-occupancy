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
  /** Optional override className for the outer card. */
  className?: string;
}

function MetricCard({
  label,
  value,
  hint,
  delta,
  size = 'md',
  primary = false,
  className = '',
}: MetricCardProps) {
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
    : 'bg-surface border-line shadow-sm';
  const labelColor = primary ? 'rgba(255,255,255,0.85)' : 'var(--ink-3)';
  const valueColor = primary ? '#FFFFFF' : 'var(--navy)';
  const footerDivider = primary ? 'border-white/20' : 'border-line';
  const hintColor = primary ? 'rgba(255,255,255,0.78)' : 'var(--ink-3)';
  const deltaColor = primary
    ? 'rgba(255,255,255,0.95)'
    : delta?.dir === 'up'
    ? 'var(--success-ink)'
    : 'var(--error-ink)';

  return (
    <div
      className={`border rounded-lg p-5 flex flex-col ${surface} ${className}`}
    >
      <div
        className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
        style={{ color: labelColor }}
      >
        {label}
      </div>

      <div
        className={`font-sans font-semibold ${valueClass} leading-none tracking-[-0.025em] tabular-nums mt-3`}
        style={{ color: valueColor }}
      >
        {value}
      </div>

      {hasFooter && (
        <div className={`mt-4 pt-3 border-t ${footerDivider} flex items-center justify-between gap-2 text-caption`}>
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
    </div>
  );
}
