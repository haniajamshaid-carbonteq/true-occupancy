/* global React, Icon */
// StatusPillSelector — multi-select pills for "which verdicts to re-scan
// each cycle". Three pills, color-keyed to the existing status palette:
//
//   ● Rented           — risk  tone   (filled circle glyph)
//   ◐ Possibly Rented  — warn  tone   (half-filled circle glyph)
//   ○ Not Rented       — clean tone   (outlined circle glyph)
//
// Selected: filled with `{status}-soft` background + `{status}-ink` text,
//           leading status glyph + trailing check.
// Unselected: surface bg + line border, ink-3 text, dim glyph, no check.
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

// Per-status visual mapping. `dot` is the inline SVG for the leading glyph;
// rendered at 14px so it sits comfortably beside the label.
const STATUS_VISUAL: Record<
  RiskStatus,
  { selectedClass: string; unselectedDotClass: string; dot: React.ReactNode }
> = {
  risk: {
    selectedClass: '!bg-risk-soft !border-transparent text-risk-ink',
    unselectedDotClass: 'text-risk',
    dot: (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5" fill="currentColor" />
      </svg>
    ),
  },
  warn: {
    selectedClass: '!bg-warn-soft !border-transparent text-warn-ink',
    unselectedDotClass: 'text-warn',
    // Half-filled: full circle outline + half disc on the left.
    dot: (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <path d="M8 3 A5 5 0 0 0 8 13 Z" fill="currentColor" />
      </svg>
    ),
  },
  clean: {
    selectedClass: '!bg-clean-soft !border-transparent text-clean-ink',
    unselectedDotClass: 'text-clean',
    dot: (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth={1.6} />
      </svg>
    ),
  },
};

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

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-2"
    >
      {options.map((opt) => {
        const selected = value.includes(opt.value);
        const visual = STATUS_VISUAL[opt.value];
        const countLabel = countsPending || opt.count === null ? '—' : String(opt.count);

        const base =
          'inline-flex items-center gap-2 h-9 px-3.5 rounded-md border font-sans text-label font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        const cls = selected
          ? `${base} ${visual.selectedClass}`
          : `${base} bg-surface border-line text-ink-2 hover:bg-hover-bg hover:border-line-strong`;

        const dotCls = selected ? '' : `opacity-70 ${visual.unselectedDotClass}`;

        return (
          <button
            key={opt.value}
            type="button"
            role="checkbox"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            className={cls}
          >
            <span className={`inline-flex shrink-0 ${dotCls}`}>{visual.dot}</span>
            <span>{opt.label}</span>
            <span className="tabular-nums text-ink-3">({countLabel})</span>
            {selected && (
              <span className="inline-flex shrink-0 -mr-1 opacity-80 [&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                <Icon name="check" size={12} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
