/* global React, MetricCard, Icon */
// VerdictTiles — reconciliation count cards: Consistent / Inconclusive /
// Needs review (declared intent × what the scan found), NOT raw verdict counts.
// Mirrors the dashboard KPI strip visually (shared MetricCard primitive). The
// "Needs review" tile is the red-flag card (risk-toned icon). Optional onSelect
// makes tiles one-click reconciliation filters; optional onAutomate renders an
// "Automation recommended" link under any red tile with a non-zero count.
//
// The nudge is a recommendation, so it resolves once acted on: callers pass
// onAutomate only while nothing is scheduled (BatchScreen gates it on
// !activeSchedule), so the link simply disappears once automation is running.
// It is NOT replaced by a second "Automated" label — the page already shows
// that status once at the top (the AutomationBanner), and repeating it under
// the tile would duplicate it on the same screen.

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
  /** When provided, a red tile with a non-zero count shows an
   *  "Automation recommended" link beneath it that calls this. Pass it only
   *  while no schedule exists for the target — once automation is running the
   *  caller drops it, and the nudge disappears (the status is shown at the top
   *  of the page, so there is no in-tile confirmation to avoid duplication). */
  onAutomate?: () => void;
  className?: string;
}

// The three reconciliation tiles, in order. `tone: 'risk'` marks the red card —
// the one that carries the red flag icon and the automation nudge.
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
  onAutomate,
  className = '',
}: VerdictTilesProps) {
  const valueOf: Record<MatchKey, number> = {
    consistent,
    inconclusive,
    needsReview,
  };
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {TILES.map((t) => {
        const value = valueOf[t.key];
        // The automation nudge belongs under a red tile that actually has
        // properties in it — no point recommending automation for zero rows.
        // The caller only passes onAutomate while nothing is scheduled, so once
        // automation runs this goes false and the link disappears.
        const showAutomate = t.tone === 'risk' && value > 0 && typeof onAutomate === 'function';
        return (
          <div key={t.key} className="flex flex-col gap-1.5">
            <MetricCard
              label={t.label}
              value={value}
              icon={<Icon name={t.icon} />}
              iconTone={t.tone}
              onClick={onSelect ? () => onSelect(t.key) : undefined}
              selected={selected === t.key}
            />
            {showAutomate && (
              <button
                type="button"
                onClick={onAutomate}
                className="self-start inline-flex items-center gap-1 rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                style={{ color: 'var(--brand-link)' }}
              >
                <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                  <Icon name="cal" size={12} />
                </span>
                Automation recommended
                <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                  <Icon name="arrow-right" size={12} />
                </span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
