/* global React, MetricCard, Icon */
// VerdictTiles — reconciliation count cards: Consistent / Inconclusive /
// Needs review (declared intent × what the scan found), NOT raw verdict counts.
// Mirrors the dashboard KPI strip visually (shared MetricCard primitive, no
// verdict-dot accent so the typography matches the home KPI tiles). Optional
// onSelect makes the tiles interactive — used in BatchScreen as one-click
// reconciliation filters.

type MatchKey = 'consistent' | 'inconclusive' | 'needsReview';

interface VerdictTilesProps {
  consistent: number;
  inconclusive: number;
  needsReview: number;
  /** Count of red addresses (the curated red-flag subset). When > 0, shown as
   *  a footer sub-count inside the Needs-review tile so it reads as a subset of
   *  that tier, not a separate parallel number. */
  redCount?: number;
  /** When provided, each tile becomes a button that toggles its filter. */
  onSelect?: (v: MatchKey) => void;
  /** Currently selected key (highlights the matching tile). */
  selected?: MatchKey | null;
  className?: string;
}

function VerdictTiles({
  consistent,
  inconclusive,
  needsReview,
  redCount = 0,
  onSelect,
  selected = null,
  className = '',
}: VerdictTilesProps) {
  const handle = (v: MatchKey) => (onSelect ? () => onSelect(v) : undefined);
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <MetricCard
        label="Consistent"
        value={consistent}
        icon={<Icon name="shield" />}
        onClick={handle('consistent')}
        selected={selected === 'consistent'}
      />
      <MetricCard
        label="Inconclusive"
        value={inconclusive}
        icon={<Icon name="alert" />}
        onClick={handle('inconclusive')}
        selected={selected === 'inconclusive'}
      />
      <MetricCard
        label="Needs review"
        value={needsReview}
        hint={redCount > 0 ? `${redCount} red` : undefined}
        icon={<Icon name="flag" />}
        onClick={handle('needsReview')}
        selected={selected === 'needsReview'}
      />
    </div>
  );
}
