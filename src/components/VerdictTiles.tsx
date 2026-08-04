/* global React, MetricCard, Icon */
// VerdictTiles — Rented / Possibly rented / Not rented count cards.
// Mirrors the dashboard KPI strip visually (shared MetricCard primitive,
// no verdict-dot accent so the typography matches the home KPI tiles).
// Optional onSelect makes the tiles interactive — used in BatchScreen
// as one-click verdict filters.

type Verdict = 'risk' | 'warn' | 'clean';

interface VerdictTilesProps {
  flagged: number;
  warn: number;
  clean: number;
  /** Count of red addresses (scan contradicts declared occupancy). When > 0,
   *  shown as a footer sub-count inside the Rented tile so it reads as a
   *  subset of `flagged`, not a separate parallel number. */
  redCount?: number;
  /** When provided, each tile becomes a button that toggles its verdict. */
  onSelect?: (v: Verdict) => void;
  /** Currently selected verdict (highlights the matching tile). */
  selected?: Verdict | null;
  className?: string;
}

function VerdictTiles({
  flagged,
  warn,
  clean,
  redCount = 0,
  onSelect,
  selected = null,
  className = '',
}: VerdictTilesProps) {
  const handle = (v: Verdict) => (onSelect ? () => onSelect(v) : undefined);
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      <MetricCard
        label="Rented"
        value={flagged}
        hint={redCount > 0 ? `${redCount} red` : undefined}
        icon={<Icon name="flag" />}
        onClick={handle('risk')}
        selected={selected === 'risk'}
      />
      <MetricCard
        label="Possibly Rented"
        value={warn}
        icon={<Icon name="alert" />}
        onClick={handle('warn')}
        selected={selected === 'warn'}
      />
      <MetricCard
        label="Not Rented"
        value={clean}
        icon={<Icon name="shield" />}
        onClick={handle('clean')}
        selected={selected === 'clean'}
      />
    </div>
  );
}
