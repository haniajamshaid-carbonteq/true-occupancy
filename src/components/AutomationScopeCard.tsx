/* global React, Icon, Cadence, ScopeRetention, cadenceLabel */
// AutomationScopeCard — live summary of what the user just chose in the
// Automate modal. Sits directly under StatusPillSelector + cadence inputs
// and re-renders on every toggle.
//
// Three tones:
//   default   — surface-2, ink-2 copy. Shown when ≥1 status is selected.
//   warn      — warn-soft, warn-ink copy. Shown when the selection is empty
//               (nothing would be re-scanned).
//   pending   — surface-2, ink-3 copy. Shown when first scan is still
//               running, so counts aren't known yet.
//
// Always renders the cadence + next-run date. The "X of Y" count is hidden
// in the `pending` variant since we don't have numbers yet.

interface ScopeBreakdown {
  /** Subset of risk/warn/clean → count in the latest scan. */
  risk: number;
  warn: number;
  clean: number;
}

interface AutomationScopeCardProps {
  /** Statuses currently selected. */
  selected: Array<'risk' | 'warn' | 'clean'>;
  /** Address counts from the latest scan, one per status. */
  counts: ScopeBreakdown;
  /** Number of address rows in the batch's most recent scan. */
  total: number;
  /** Cadence (count + unit). Formatted via cadenceLabel for the "every X" copy. */
  cadence: Cadence;
  /** Retention rule — drives the note line ("stays monitored" vs "drops out"). */
  retention: ScopeRetention;
  /** Pre-formatted next-run date label (e.g. "Aug 18, 2026"). */
  nextRunLabel: string;
  /** First scan still running — counts not known yet. */
  countsPending?: boolean;
}

const STATUS_LABEL: Record<'risk' | 'warn' | 'clean', string> = {
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

// Note line under the count — phrased on the consequence of the retention
// rule, mirroring the locked modal copy.
const RETENTION_NOTE: Record<ScopeRetention, string> = {
  monitor: 'Properties remain monitored even if statuses change.',
  remove: 'Properties drop out once they no longer match the selected statuses.',
};

function AutomationScopeCard({
  selected,
  counts,
  total,
  cadence,
  retention,
  nextRunLabel,
  countsPending = false,
}: AutomationScopeCardProps) {
  const inScope =
    (selected.includes('risk') ? counts.risk : 0) +
    (selected.includes('warn') ? counts.warn : 0) +
    (selected.includes('clean') ? counts.clean : 0);

  const empty = selected.length === 0;

  // Tooltip with per-status breakdown — shown on hover of the "X of Y".
  const tipLines = selected
    .map((s) => `${STATUS_LABEL[s]}: ${counts[s]}`)
    .join('\n');
  const tip = selected.length > 0 ? `Per-status breakdown:\n${tipLines}` : undefined;

  // ---- WARN tone: empty selection -----------------------------------------
  if (empty) {
    return (
      <div
        role="status"
        className="rounded-md border border-transparent bg-warn-soft text-warn-ink px-4 py-3 flex items-start gap-2.5"
      >
        <span className="inline-flex shrink-0 mt-0.5 [&>svg]:w-4 [&>svg]:h-4" aria-hidden>
          <Icon name="alert" size={16} />
        </span>
        <p className="m-0 font-sans text-body-sm leading-relaxed">
          Pick at least one status to include — otherwise nothing will be rescanned.
        </p>
      </div>
    );
  }

  // ---- PENDING tone: counts not known yet ---------------------------------
  if (countsPending) {
    return (
      <div className="rounded-md border border-line bg-surface-2 px-4 py-3 flex items-start gap-2.5">
        <span className="inline-flex shrink-0 mt-0.5 text-ink-3 [&>svg]:w-4 [&>svg]:h-4" aria-hidden>
          <Icon name="info" size={16} />
        </span>
        <p className="m-0 font-sans text-body-sm text-ink-2 leading-relaxed">
          Address counts pending — first scan is still running. We'll apply this scope
          when it completes (cadence: {cadenceLabel(cadence)}).
        </p>
      </div>
    );
  }

  // ---- DEFAULT tone: normal summary ---------------------------------------
  return (
    <div className="rounded-md border border-line bg-surface-2 px-4 py-3">
      <p className="m-0 font-sans text-body-sm text-ink-2 leading-relaxed">
        Will re-scan{' '}
        <span
          className="font-semibold text-ink underline decoration-dotted underline-offset-2 cursor-help"
          title={tip}
          aria-label={tip?.replace(/\n/g, ' · ')}
        >
          {inScope} of {total}
        </span>{' '}
        addresses {cadenceLabel(cadence)}.
      </p>
      <p className="m-0 mt-1 font-sans text-caption text-ink-3 leading-snug">
        {RETENTION_NOTE[retention]}
      </p>
      <p className="m-0 mt-1 font-mono tabular-nums text-caption text-ink-3">
        Next run ~ {nextRunLabel}.
      </p>
    </div>
  );
}
