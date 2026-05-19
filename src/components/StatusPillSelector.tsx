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

// Per-status visual mapping. The `dotColor` carries the SEMANTIC (which
// status this chip represents); the chip's SELECTION state is always
// expressed in brand colors — matching the Cadence radio cards above and
// the rest of the app's selection language (ChipRow, filter chips, etc.).
//
// Glyph basis (moon-phase / Apple-Calendar convention):
//   ● Rented           — fully filled circle  (full risk present)
//   ◐ Possibly Rented  — half-filled circle   (partial / unclear)
//   ○ Not Rented       — outlined circle      (no rental detected)
//
// "Filled-ness" maps to "how much rental activity was found", so the
// glyph carries the semantic even in monochrome / for color-blind users.
const STATUS_VISUAL: Record<
  RiskStatus,
  {
    /** Glyph color in either state — anchors the status semantic. */
    dotColor: string;
    /** Inline SVG for the status glyph. */
    dot: React.ReactNode;
  }
> = {
  risk: {
    dotColor: 'text-risk',
    dot: (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5" fill="currentColor" />
      </svg>
    ),
  },
  warn: {
    dotColor: 'text-warn',
    // Half-filled: full outline + a half-disc on the left.
    dot: (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" aria-hidden>
        <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth={1.5} />
        <path d="M8 3 A5 5 0 0 0 8 13 Z" fill="currentColor" />
      </svg>
    ),
  },
  clean: {
    dotColor: 'text-clean',
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

        // Selection state uses brand-tint + brand border — same convention
        // as the Cadence radio cards above and the ChipRow primitive used
        // for filter chips elsewhere in the app. The status (risk / warn /
        // clean) belongs to the GLYPH, not the chip outline.
        const base =
          'inline-flex items-center gap-2 h-9 px-3.5 rounded-md font-sans text-label font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
        const cls = selected
          ? `${base} !bg-brand-tint !border-brand/50 border text-ink`
          : `${base} bg-surface border border-line text-ink-3 hover:border-line-strong hover:text-ink-2`;

        // Glyph color anchors the status semantic in both states. Slightly
        // dimmer when unselected so the row reads as one quiet group.
        const dotCls = selected ? visual.dotColor : `opacity-50 ${visual.dotColor}`;

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
