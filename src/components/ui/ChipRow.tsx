/* global React */
// ChipRow — labelled row of single-select chip buttons. Same visual contract
// as the inline filter chips on History / Scheduled (h-8, rounded-md, brand-
// tint when active) so the drawer and the row feel like one system.
//
// Single-select for now; multi-select can be added by flipping `value` to a
// Set and toggling membership.

interface ChipOption {
  value: string;
  label: string;
  count?: number;
}

interface ChipRowProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: ChipOption[];
}

function ChipRow({ label, value, onChange, options }: ChipRowProps) {
  return (
    <div>
      <div
        className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-2"
        style={{ color: 'var(--ink-3)' }}
      >
        {label}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-caption font-medium transition-colors ${
                active
                  ? '!bg-brand-tint !border-brand/40'
                  : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
              }`}
              style={{ color: active ? 'var(--brand-deep)' : 'var(--ink-2)' }}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span
                  className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? 'rgba(2,146,190,0.12)' : 'var(--surface-2)',
                    color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                  }}
                >
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Parse a humanized "X ago" label into approximate hours. Returns Infinity
// for unrecognised values so they fall into the "older" bucket rather than
// disappearing on a recency filter.
function parseAgoHours(label: string): number {
  if (!label) return Infinity;
  const s = label.toLowerCase().trim();
  if (s === 'just now') return 0;
  if (s === 'yesterday') return 24;
  const m = s.match(/^(\d+)\s*(min|h|d|w)\b/);
  if (!m) return Infinity;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 'min': return n / 60;
    case 'h':   return n;
    case 'd':   return n * 24;
    case 'w':   return n * 24 * 7;
    default:    return Infinity;
  }
}
