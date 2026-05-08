/* global React, Card, RiskBadge, Icon, PROPERTY, SCENARIOS, PLATFORMS */
// ScenarioKey is declared in src/data/scenarios.tsx and shared at the
// top-level type scope in this no-bundler script context.

interface ScoreCardProps {
  scenario: ScenarioKey;
}

const HERO_BG_BY_RISK: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'bg-gradient-to-b from-clean-soft to-surface',
  warn: 'bg-gradient-to-b from-warn-soft to-surface',
  risk: 'bg-gradient-to-b from-risk-soft to-surface',
};

const RISK_ICON: Record<'clean' | 'warn' | 'risk', 'check' | 'info' | 'alert'> = {
  clean: 'check',
  warn: 'info',
  risk: 'alert',
};

const ARC_RING_BY_RISK: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'var(--clean)',
  warn: 'var(--warn)',
  risk: 'var(--risk)',
};

// Multi-segment half-arc gauge — like a credit-score meter.
// Three colored bands (green → amber → red) with gaps, plus a circular
// indicator that lands at the current score's position on the arc.
function ScoreHalfGauge({
  score,
  risk,
  size = 280,
  centerSlot,
}: {
  score: number;
  risk: 'clean' | 'warn' | 'risk';
  size?: number;
  /** Override the default Confidence + score readout. Used by resident mode. */
  centerSlot?: React.ReactNode;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Neutral certainty bands — same hue across the arc so the gauge reads
  // as descriptive (where on the scale) rather than evaluative
  // (good/bad). Verdict color is carried by the indicator dot only.
  const segments = [
    { from: 0,   to: 30,  color: 'var(--line-strong)' },
    { from: 30,  to: 55,  color: 'var(--line-strong)' },
    { from: 55,  to: 75,  color: 'var(--line-strong)' },
    { from: 75,  to: 100, color: 'var(--line-strong)' },
  ];

  const polar = (pct: number) => {
    // pct 0..100 → angle 180..360 (top half, sweeping left-to-right)
    const angle = Math.PI + (pct / 100) * Math.PI;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // SVG arc path between two pcts.
  const arcPath = (from: number, to: number) => {
    const a = polar(from);
    const b = polar(to);
    const largeArc = to - from > 50 ? 1 : 0;
    return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y}`;
  };

  // Visible gap between segments (in % of full 0-100 range) — matches the
  // credit-score reference where bands sit clearly apart.
  const gap = 4;
  const indicator = polar(Math.max(0.5, Math.min(99.5, score)));
  const indicatorColor = ARC_RING_BY_RISK[risk];
  const verdictLabel =
    risk === 'clean'
      ? 'Not rented · High confidence'
      : risk === 'warn'
      ? 'Possibly rented · Medium confidence'
      : 'Rented · High confidence';

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size / 2 + 24 }}
    >
      <svg width={size} height={size / 2 + 24} aria-hidden style={{ overflow: 'visible' }}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={arcPath(s.from + (i === 0 ? 0 : gap / 2), s.to - (i === segments.length - 1 ? 0 : gap / 2))}
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Indicator dot — verdict color carries the meaning */}
        <circle cx={indicator.x} cy={indicator.y} r={stroke - 2} fill={indicatorColor} stroke="var(--surface)" strokeWidth={2} />
      </svg>

      {/* Centered readout — score by default, or caller-provided slot */}
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: size * 0.18 }}
      >
        {centerSlot ?? (
          <>
            <div className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-ink-3 mb-1">
              Signal strength
            </div>
            <div className="flex items-baseline gap-1">
              <div className="font-sans font-semibold text-[56px] leading-none tracking-[-0.03em] tabular-nums text-ink">
                {score}
              </div>
              <div className="font-sans text-[16px] text-ink-4 tabular-nums">/ 100</div>
            </div>
            <div className="font-sans font-medium text-[13px] mt-1.5 text-ink-2 max-w-[24ch]">
              {verdictLabel}
            </div>
          </>
        )}
      </div>

      {/* Range labels at the arc tips */}
      <div
        className="absolute font-sans text-[11px] text-ink-4 tabular-nums"
        style={{ left: 0, top: size / 2 + 4 }}
      >
        0
      </div>
      <div
        className="absolute font-sans text-[11px] text-ink-4 tabular-nums"
        style={{ right: 0, top: size / 2 + 4 }}
      >
        100
      </div>
    </div>
  );
}

// Mini half-arc gauge for the WhyCard rows.
function MiniHalfGauge({
  score,
  risk,
  size = 56,
}: {
  score: number;
  risk: 'clean' | 'warn' | 'risk';
  size?: number;
}) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const arcLen = circumference / 2;
  const dash = arcLen * (score / 100);
  const color = ARC_RING_BY_RISK[risk];
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size / 2 + 4 }}
    >
      <svg
        width={size}
        height={size}
        className="absolute left-0 -rotate-180"
        aria-hidden
      >
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arcLen} ${circumference}`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div
        className="absolute inset-0 flex items-end justify-center pb-1"
        style={{ height: size / 2 }}
      >
        <div className="font-sans font-semibold text-[14px] leading-none tabular-nums">
          {score}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ scenario }: ScoreCardProps) {
  const sc = SCENARIOS[scenario];

  return (
    <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
      <ScoreHalfGauge score={sc.score} risk={sc.risk} />

      <h3 className="font-sans font-semibold text-[22px] m-0 leading-tight tracking-[-0.01em] mb-2 mt-5 max-w-[44ch]">
        {sc.headline}
      </h3>
      <p className="m-0 text-ink-2 text-[14px] leading-snug max-w-[56ch]">
        {sc.summary}
      </p>
    </div>
  );
}

