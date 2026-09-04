/* global React, MetricCard, Icon */
// VerdictTiles — reconciliation count cards: Consistent / Inconclusive /
// Needs review (declared intent × what the scan found), NOT raw verdict counts.
// Mirrors the dashboard KPI strip visually (shared MetricCard primitive). The
// "Needs review" tile is the red-flag card (risk-toned icon). Optional onSelect
// makes tiles one-click reconciliation filters.
//
// The strip carries counts and filters only. It used to also carry an
// "Automation recommended" row, which duplicated the Automate CTA sitting at
// the top of the same page. The recommendation now lives on that CTA — a
// "Recommended" pill with the reason on hover — so the strip stays quiet and
// there is one place to both learn of and act on the recommendation. Callers
// derive the recommendation from the same config-driven categories and pass it
// to <AutomationControl recommended> (see BatchScreen).

type MatchKey = 'consistent' | 'inconclusive' | 'needsReview';

interface VerdictTilesProps {
  consistent: number;
  inconclusive: number;
  needsReview: number;
  /** @deprecated superseded by the matrix — kept so existing callers don't break. */
  redCount?: number;
  /** When provided, each tile becomes a button that toggles its filter. */
  onSelect?: (v: MatchKey) => void;
  /** Currently selected key (highlights the matching tile). */
  selected?: MatchKey | null;
  className?: string;
}

// The three reconciliation tiles, in order. `tone: 'risk'` marks the red card —
// the one that carries the red flag icon.
const TILES: { key: MatchKey; label: string; icon: string; tone: 'clean' | 'warn' | 'risk' }[] = [
  { key: 'consistent',  label: 'Consistent',   icon: 'shield', tone: 'clean' },
  { key: 'inconclusive', label: 'Inconclusive', icon: 'alert',  tone: 'warn' },
  { key: 'needsReview',  label: 'Needs review', icon: 'flag',   tone: 'risk' },
];

function VerdictTiles({
  consistent,
  inconclusive,
  needsReview,
  onSelect,
  selected = null,
  className = '',
}: VerdictTilesProps) {
  const valueOf: Record<MatchKey, number> = {
    consistent,
    inconclusive,
    needsReview,
  };
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {TILES.map((t) => (
        <MetricCard
          key={t.key}
          label={t.label}
          value={valueOf[t.key]}
          icon={<Icon name={t.icon} />}
          iconTone={t.tone}
          onClick={onSelect ? () => onSelect(t.key) : undefined}
          selected={selected === t.key}
        />
      ))}
    </div>
  );
}
