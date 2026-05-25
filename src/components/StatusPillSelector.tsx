/* global React, Icon */
// StatusPillSelector — multi-select pills for "which verdicts to re-scan
// each cycle". Three pills: Rented / Possibly Rented / Not Rented.
//
// Selected: brand-tint fill + brand border + trailing check.
// Unselected: surface bg + line border, ink-3 text.
//
// Counts pending (first scan still running): pass `countsPending` to render
// each count slot as an em-dash. Toggling is still allowed so the user can
// pre-pick before the scan finishes.

type RiskStatus = 'risk' | 'warn' | 'clean';

interface StatusOption {
  value: RiskStatus;
  /** Display label (e.g. "Rented", "Possibly Rented", "Not Rented"). */
  label: string;
  /** Count in the latest scan. `null` = pending. */
  count: number | null;
}

interface StatusPillSelectorProps {
  options: StatusOption[];
  value: RiskStatus[];
  onChange: (next: RiskStatus[]) => void;
  /** Render counts as `—` when true. Pre-selection is still allowed. */
  countsPending?: boolean;
  disabled?: boolean;
  /** Optional aria-label for the group; sensible default applied if absent. */
  ariaLabel?: string;
}

function StatusPillSelector({
  options,
  value,
  onChange,
  countsPending = false,
  disabled = false,
  ariaLabel = 'Re-scan which property statuses',
}: StatusPillSelectorProps) {
  function toggle(v: RiskStatus) {
    if (disabled) return;
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  const allSelected = value.length === options.length && options.length > 0;
  const anyCountPending =
    countsPending || options.some((o) => o.count === null);
  const totalCount = options.reduce((sum, o) => sum + (o.count ?? 0), 0);
  const totalCountLabel = anyCountPending ? '—' : String(totalCount);

  function toggleAll() {
    if (disabled) return;
    onChange(allSelected ? [] : options.map((o) => o.value));
  }

  const pillBase =
    'inline-flex items-center gap-2 h-8 px-control-x rounded-md font-sans text-label font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const allCls = allSelected
    ? `${pillBase} !bg-brand-tint !border-brand/40 border text-ink`
    : `${pillBase} bg-surface border border-line text-ink-3 hover:border-line-strong hover:text-ink-2`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={allSelected}
        disabled={disabled}
        onClick={toggleAll}
        className={allCls}
      >
        <span>All</span>
        <span className="tabular-nums text-ink-4">({totalCountLabel})</span>
        {allSelected && (
          <span
            className="inline-flex shrink-0 -mr-1 text-brand-deep [&>svg]:w-3 [&>svg]:h-3"
            aria-hidden
          >
            <Icon name="check" size={12} />
          </span>
        )}
      </button>
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const countLabel = countsPending || opt.count === null ? '—' : String(opt.count);
        // While "All" is active, the individual pills are redundant — disable
        // them so deselecting one requires first dropping out of the All mode.
        const optDisabled = disabled || allSelected;
        const cls = selected
          ? `${pillBase} !bg-brand-tint !border-brand/40 border text-ink`
          : `${pillBase} bg-surface border border-line text-ink-3 hover:border-line-strong hover:text-ink-2`;

        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={optDisabled}
            onClick={() => toggle(opt.value)}
            className={cls}
          >
            <span>{opt.label}</span>
            <span className="tabular-nums text-ink-4">({countLabel})</span>
            {selected && (
              <span
                className="inline-flex shrink-0 -mr-1 text-brand-deep [&>svg]:w-3 [&>svg]:h-3"
                aria-hidden
              >
                <Icon name="check" size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
