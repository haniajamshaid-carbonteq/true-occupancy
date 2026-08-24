/* global React, MetricCard, Icon */
// VerdictTiles — reconciliation count cards: Consistent / Inconclusive /
// Needs review (declared intent × what the scan found), NOT raw verdict counts.
// Mirrors the dashboard KPI strip visually (shared MetricCard primitive). The
// "Needs review" tile is the red-flag card (risk-toned icon). Optional onSelect
// makes tiles one-click reconciliation filters; optional onAutomate renders a
// single "Automation recommended" row beneath the strip.
//
// Which categories the nudge names is config-driven, not hardwired to the red
// tile. The admin's occupancy config can schedule automated re-scans for more
// than one reconciliation status (its `recurring` cadence per status); the
// caller passes those categories as `automateCategories`. When two or more
// carry rows, the nudge lists them — "Automation recommended (Needs review +
// Consistent)" — and an info button discloses that the config is what labels
// that combination for automation. This lives in ONE combined row below the
// tiles, not repeated under each tile, so the strip stays quiet.
//
// The nudge is a recommendation, so it resolves once acted on: callers pass
// onAutomate only while nothing is scheduled (BatchScreen gates it on
// !activeSchedule), so the row simply disappears once automation is running.
// It is NOT replaced by a second "Automated" label — the page already shows
// that status once at the top (the AutomationBanner), and repeating it here
// would duplicate it on the same screen.

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
  /** When provided, a combined "Automation recommended" row appears below the
   *  strip that calls this. Pass it only while no schedule exists for the
   *  target — once automation is running the caller drops it and the row
   *  disappears (the status is shown at the top of the page, so there is no
   *  in-strip confirmation to avoid duplication). */
  onAutomate?: () => void;
  /** The reconciliation categories the config recommends automation for
   *  (derived from the occupancy config's per-status `recurring` cadence).
   *  The nudge names whichever of these actually have rows. Defaults to the
   *  red tile alone, preserving the prior single-category behaviour. */
  automateCategories?: MatchKey[];
  className?: string;
}

// The three reconciliation tiles, in order. `tone: 'risk'` marks the red card —
// the one that carries the red flag icon and the automation nudge.
const TILES: { key: MatchKey; label: string; icon: string; tone: 'clean' | 'warn' | 'risk' }[] = [
  { key: 'consistent',  label: 'Consistent',   icon: 'shield', tone: 'clean' },
  { key: 'inconclusive', label: 'Inconclusive', icon: 'alert',  tone: 'warn' },
  { key: 'needsReview',  label: 'Needs review', icon: 'flag',   tone: 'risk' },
];

// Joins category labels the way the nudge reads them: "A", "A + B", "A + B + C".
function joinLabels(labels: string[]): string {
  return labels.join(' + ');
}

function VerdictTiles({
  consistent,
  inconclusive,
  needsReview,
  onSelect,
  selected = null,
  onAutomate,
  automateCategories = ['needsReview'],
  className = '',
}: VerdictTilesProps) {
  const valueOf: Record<MatchKey, number> = {
    consistent,
    inconclusive,
    needsReview,
  };
  const labelOf: Record<MatchKey, string> = {
    consistent: 'Consistent',
    inconclusive: 'Inconclusive',
    needsReview: 'Needs review',
  };

  // Info disclosure is opt-in on the row: the reason (config labels this combo
  // for automation) sits behind the ⓘ so the strip stays quiet by default.
  const [reasonOpen, setReasonOpen] = React.useState(false);

  // The nudge names only categories the config recommends automation for AND
  // that actually carry rows — no point recommending a re-scan of zero rows.
  // Kept in TILES order so the combo reads consistently. onAutomate is passed
  // only while nothing is scheduled, so the whole row disappears once running.
  const activeCategories = TILES.map((t) => t.key).filter(
    (k) => automateCategories.includes(k) && valueOf[k] > 0,
  );
  const showAutomate = activeCategories.length > 0 && typeof onAutomate === 'function';
  const comboLabels = activeCategories.map((k) => labelOf[k]);
  // Name the combo once there is more than one category; a single category
  // keeps the original, shorter copy.
  const comboSuffix = comboLabels.length > 1 ? ` (${joinLabels(comboLabels)})` : '';
  const reasonText =
    comboLabels.length > 1
      ? `Your occupancy config labels this result combination — ${joinLabels(
          comboLabels,
        )} — for automated re-scans, so running automation across these categories is recommended.`
      : `Your occupancy config labels ${comboLabels[0]} results for automated re-scans, so running automation is recommended.`;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="grid grid-cols-3 gap-3">
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

      {showAutomate && (
        <div className="flex flex-col items-end gap-1.5">
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={onAutomate}
              className="inline-flex items-center gap-1 rounded font-sans text-caption font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
              style={{ color: 'var(--brand-link)' }}
            >
              <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                <Icon name="cal" size={12} />
              </span>
              Automation recommended{comboSuffix}
              <span className="[&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                <Icon name="arrow-right" size={12} />
              </span>
            </button>
            <button
              type="button"
              onClick={() => setReasonOpen((v) => !v)}
              aria-expanded={reasonOpen}
              aria-label="Why is automation recommended?"
              className="inline-flex items-center justify-center rounded-full text-ink-3 hover:text-ink-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 [&>svg]:w-4 [&>svg]:h-4"
            >
              <Icon name="info" size={16} />
            </button>
          </div>
          {reasonOpen && (
            <div
              role="note"
              className="max-w-sm rounded-md border border-line bg-surface-2 px-3 py-2 flex items-start gap-2"
            >
              <span className="inline-flex shrink-0 mt-0.5 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
                <Icon name="info" size={14} />
              </span>
              <p className="m-0 font-sans text-caption text-ink-2 leading-relaxed text-left">
                {reasonText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
