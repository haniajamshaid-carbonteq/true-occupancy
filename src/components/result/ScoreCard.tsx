/* global React, Card, Icon, PROPERTY, SCENARIOS */
// Confidence hero.
//   Hierarchy (per design spec, top → bottom):
//     1. Rental status      — biggest text, qualitative ("Likely Rented")
//     2. Confidence band    — medium, colored ("High confidence")
//     3. Numeric percent    — small, supporting ("92%")
//   The numeric score supports the textual assessment; it never dominates.
//   Tone is keyed on the confidence band, not on the rental status —
//   color signals "how sure we are", not "how bad it is" (legal neutrality).
//
// ScenarioKey is declared in src/data/scenarios.tsx — shared at top-level
// type scope across the script bundle.

interface ScoreCardProps {
  scenario: ScenarioKey;
}

type ConfidenceBand = 'high' | 'moderate' | 'low' | 'no-evidence';

interface ConfidenceProfile {
  rentalStatus: string;
  band: ConfidenceBand;
  bandLabel: string;
  /** 0–100. Confidence in the rental-status finding. */
  percent: number;
}

// Demo mapping from the existing 3 scenarios. In production this is
// derived from upstream signals, not hard-coded per scenario.
const CONFIDENCE_PROFILE: Record<ScenarioKey, ConfidenceProfile> = {
  high:   { rentalStatus: 'Likely Rented',            band: 'high',        bandLabel: 'High confidence',     percent: 92 },
  medium: { rentalStatus: 'Possibly Rented',          band: 'moderate',    bandLabel: 'Moderate confidence', percent: 74 },
  low:    { rentalStatus: 'No Public Evidence Found', band: 'no-evidence', bandLabel: 'No public signals',   percent: 95 },
};

interface BandTone {
  /** Soft tinted background for the hero. */
  heroBg: string;
  /** Colored text used for the confidence-band label. */
  bandInk: string;
  /** Solid swatch dot color preceding the band label. */
  bandDot: string;
  /** Numeric percent block — chip border + text. */
  pctBorder: string;
  pctInk: string;
}

// Precomputed Tailwind classes — Play CDN scans literal classnames, so
// avoid string interpolation when building utility classes.
//   High        → deep blue   (brand teal is the closest token in the system)
//   Moderate    → amber       (warn)
//   Low         → gray        (ink-2)
//   No evidence → light gray  (ink-4)
const BAND_TONE: Record<ConfidenceBand, BandTone> = {
  'high':        { heroBg: 'bg-brand-soft',  bandInk: 'text-brand',    bandDot: 'bg-brand',    pctBorder: 'border-brand',   pctInk: 'text-brand' },
  'moderate':    { heroBg: 'bg-warn-soft',   bandInk: 'text-warn-ink', bandDot: 'bg-warn',     pctBorder: 'border-warn',    pctInk: 'text-warn-ink' },
  'low':         { heroBg: 'bg-surface-2',   bandInk: 'text-ink-2',    bandDot: 'bg-ink-3',    pctBorder: 'border-line-strong', pctInk: 'text-ink-2' },
  'no-evidence': { heroBg: 'bg-surface-2',   bandInk: 'text-ink-3',    bandDot: 'bg-ink-4',    pctBorder: 'border-line',    pctInk: 'text-ink-3' },
};

function ScoreCard({ scenario }: ScoreCardProps) {
  return (
    <Card className="grid grid-cols-[380px_1fr]">
      <ConfidenceHero scenario={scenario} />
      <ContextPanel scenario={scenario} />
    </Card>
  );
}

function ConfidenceHero({ scenario }: { scenario: ScenarioKey }) {
  const profile = CONFIDENCE_PROFILE[scenario];
  const tone = BAND_TONE[profile.band];
  return (
    <div className={`px-7 py-7 border-r border-line flex flex-col gap-5 ${tone.heroBg}`}>
      {/* 0. Eyebrow */}
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        Rental status
      </div>

      {/* 1. Rental status — biggest, qualitative */}
      <h2 className="font-serif text-[40px] font-normal m-0 leading-[1.05] tracking-[-0.01em] text-ink">
        {profile.rentalStatus}
      </h2>

      {/* 2 + 3. Confidence band + numeric percent — band label dominant,
              percent treated as a supporting chip. */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${tone.bandDot}`} />
          <span className={`text-[15px] font-medium ${tone.bandInk}`}>
            {profile.bandLabel}
          </span>
        </span>
        <span
          className={`font-mono text-[13px] px-2.5 py-1 rounded-sm border ${tone.pctBorder} ${tone.pctInk} bg-surface`}
          title="Confidence in this finding"
        >
          {profile.percent}%
        </span>
      </div>
    </div>
  );
}

function ContextPanel({ scenario }: { scenario: ScenarioKey }) {
  const sc = SCENARIOS[scenario];
  return (
    <div className="px-7 py-6 flex flex-col gap-2.5">
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 flex items-center gap-2">
        <Icon name="pin" size={12} />
        {PROPERTY.address}
      </div>
      <h3 className="font-serif text-[19px] font-normal m-0">{sc.headline}</h3>
      <p className="m-0 text-ink-2 text-[13.5px] leading-relaxed">{sc.summary}</p>
    </div>
  );
}
