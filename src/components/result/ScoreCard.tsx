/* global React, Card, RiskBadge, Icon, PROPERTY, SCENARIOS, PLATFORMS */
// ScenarioKey is declared in src/data/scenarios.tsx, AudienceMode in
// ./ModeToggle.tsx. In the no-bundler script context they're shared at
// the top-level type scope — re-declaring here would conflict.

interface ScoreCardProps {
  scenario: ScenarioKey;
  /** Audience view. Defaults to investigator (numeric confidence score). */
  mode?: AudienceMode;
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

// Verdict text uses the brand teal for "No" so a clean result feels positive
// (per spec) instead of just "absence-of-risk green".
const VERDICT_COLOR: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'text-clean',
  warn: 'text-warn',
  risk: 'text-risk',
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

  // Segment ranges (0–100). Four distinct hues so each band reads as its
  // own zone instead of two amber blends.
  const segments = [
    { from: 0,   to: 30,  color: '#5B8A6A' }, // green — clean
    { from: 30,  to: 55,  color: '#E5C45A' }, // yellow — caution
    { from: 55,  to: 75,  color: '#E0884E' }, // orange — questionable
    { from: 75,  to: 100, color: '#C0533C' }, // red — high risk
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
  const riskLabel = risk === 'clean' ? 'Low' : risk === 'warn' ? 'Watch' : 'High';

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

        {/* Indicator dot — no stroke */}
        <circle cx={indicator.x} cy={indicator.y} r={stroke - 4} fill="var(--ink)" />
      </svg>

      {/* Centered readout — score by default, or caller-provided slot */}
      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: size * 0.18 }}
      >
        {centerSlot ?? (
          <>
            <div className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-ink-3 mb-1">
              Confidence
            </div>
            <div className="flex items-baseline gap-1">
              <div className="font-sans font-semibold text-[56px] leading-none tracking-[-0.03em] tabular-nums text-ink">
                {score}
              </div>
              <div className="font-sans text-[16px] text-ink-4 tabular-nums">/ 100</div>
            </div>
            <div className="font-sans font-medium text-[13px] mt-1.5 text-ink-2">
              {riskLabel}
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

function ScoreCard({ scenario, mode = 'investigator' }: ScoreCardProps) {
  const sc = SCENARIOS[scenario];
  const isResident = mode === 'resident';
  const v = VERDICT[sc.risk];

  // Both modes share the half-arc gauge layout. Resident shows the Yes/Maybe/No
  // verdict inside the arc; investigator shows the numeric confidence score.
  return (
    <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
      {isResident ? (
        <div className="flex flex-col items-center mt-2 mb-2">
          <div className="font-sans text-[10.5px] uppercase tracking-[0.2em] text-ink-3 mb-2">
            Rental status
          </div>
          <div
            className={`font-sans font-semibold text-[120px] leading-none tracking-[-0.04em] ${VERDICT_COLOR[sc.risk]}`}
          >
            {v.word}
          </div>
        </div>
      ) : (
        <ScoreHalfGauge score={sc.score} risk={sc.risk} />
      )}

      <div className="mt-3 mb-4">
        <RiskBadge level={sc.risk} glyph={<Icon name={RISK_ICON[sc.risk]} size={11} />}>
          {sc.riskLabel}
        </RiskBadge>
      </div>

      <h3 className="font-sans font-semibold text-[22px] m-0 leading-tight tracking-[-0.01em] mb-2 max-w-[44ch]">
        {isResident ? 'What does this mean?' : sc.headline}
      </h3>
      <p className="m-0 text-ink-2 text-[14px] leading-snug max-w-[56ch]">
        {isResident ? RESIDENT_MEANING[sc.risk] : sc.summary}
      </p>
    </div>
  );
}

// ---- investigator hero ----

function InvestigatorHero({ scenario }: { scenario: ScenarioKey }) {
  const sc = SCENARIOS[scenario];
  return (
    <div className={`px-5 py-4 border-r border-line flex flex-col justify-center gap-2 ${HERO_BG_BY_RISK[sc.risk]}`}>
      <div className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink-3">
        Confidence score
      </div>
      <div className="flex items-baseline gap-2">
        <div className="font-sans font-light text-[56px] leading-none tracking-[-0.04em] tabular-nums">
          {sc.score}
        </div>
        <span className="text-[14px] text-ink-4 tracking-tight">/100</span>
      </div>
      <div className="flex items-center">
        <RiskBadge level={sc.risk} glyph={<Icon name={RISK_ICON[sc.risk]} size={11} />}>
          {sc.riskLabel}
        </RiskBadge>
      </div>
    </div>
  );
}

// ---- resident hero ----

const VERDICT: Record<'clean' | 'warn' | 'risk', { word: string; sub: string }> = {
  risk:  { word: 'Yes',   sub: 'This property appears to be rented out short-term.' },
  warn:  { word: 'Maybe', sub: 'We found a possible match worth a closer look.' },
  clean: { word: 'No',    sub: "We didn't find any active rental listings." },
};

const RESIDENT_MEANING: Record<'clean' | 'warn' | 'risk', string> = {
  risk:  "If you're a neighbor or local official, this may be worth reporting to your municipality. If you're a prospective tenant, the property may not be available for long-term lease.",
  warn:  "We're not certain. Open the details below to see exactly what we found, or run another scan in a few days to see if more listings appear.",
  clean: "Based on the platforms we monitor, this property is not currently being offered as a short-term rental. This sweep refreshes daily.",
};

function ResidentHero({ scenario }: { scenario: ScenarioKey }) {
  const sc = SCENARIOS[scenario];
  const v = VERDICT[sc.risk];

  // Platform display names, only those with at least one listing in this scenario.
  const foundOn: string[] = (PLATFORMS as { id: string; name: string }[])
    .filter((p) => (sc.listings[p.id] || []).length > 0)
    .map((p) => p.name);

  return (
    <div className={`px-5 py-4 border-r border-line flex flex-col justify-center gap-2 ${HERO_BG_BY_RISK[sc.risk]}`}>
      <div className="font-sans text-[10px] uppercase tracking-[0.16em] text-ink-3">
        Rental status
      </div>
      <div
        className={`font-sans font-light text-[52px] leading-none tracking-[-0.03em] ${VERDICT_COLOR[sc.risk]}`}
      >
        {v.word}
      </div>
      {foundOn.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-3">
            Found on
          </span>
          {foundOn.map((n) => (
            <span
              key={n}
              className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-line text-ink-2 font-medium"
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
