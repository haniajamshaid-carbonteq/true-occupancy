/* global React */
// Tabs — controlled segmented tab strip used by the dashboard
// (History / Schedule) and the Scheduled page (Single / Batch).
//
// Visual: each tab is a button with a 2-px brand underline when active and
// muted ink-3 text when inactive. Tabs sit on a bottom hairline so the
// underline reads as part of a continuous border, matching the brand-
// underline pattern used elsewhere in the spec.

interface TabItem<V extends string> {
  value: V;
  label: React.ReactNode;
  /** Optional trailing count badge. */
  count?: number;
}

interface TabsProps<V extends string> {
  items: TabItem<V>[];
  value: V;
  onChange: (next: V) => void;
  /** Optional right-aligned slot rendered on the same baseline as the tabs. */
  rightSlot?: React.ReactNode;
  className?: string;
}

function Tabs<V extends string>({ items, value, onChange, rightSlot, className = '' }: TabsProps<V>) {
  return (
    <div className={`flex items-center justify-between gap-4 border-b border-line ${className}`}>
      <div role="tablist" className="flex items-center gap-1 -mb-px">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(it.value)}
              className={[
                'inline-flex items-center gap-2 h-10 px-3.5 font-sans text-label font-medium transition-colors',
                'border-b-2 -mb-px',
                active
                  ? 'border-brand text-navy'
                  : 'border-transparent text-ink-3 hover:text-ink-2',
              ].join(' ')}
              style={active ? { color: 'var(--navy)' } : undefined}
            >
              {it.label}
              {typeof it.count === 'number' && (
                <span
                  className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? 'var(--brand-tint)' : 'var(--surface-2)',
                    color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                  }}
                >
                  {it.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
