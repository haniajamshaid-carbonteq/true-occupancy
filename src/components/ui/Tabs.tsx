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
  const tablistRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Map<V, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = React.useState<{ left: number; width: number } | null>(null);

  React.useLayoutEffect(() => {
    const container = tablistRef.current;
    const el = tabRefs.current.get(value);
    if (!container || !el) return;
    const measure = () => {
      const cRect = container.getBoundingClientRect();
      const rect = el.getBoundingClientRect();
      setIndicator({ left: rect.left - cRect.left, width: rect.width });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(container);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [value, items.map((i) => `${i.value}:${i.count ?? ''}`).join('|')]);

  return (
    <div className={`flex items-center justify-between gap-4 border-b border-line ${className}`}>
      <div ref={tablistRef} role="tablist" className="relative flex items-center gap-1">
        {items.map((it) => {
          const active = it.value === value;
          return (
            <button
              key={it.value}
              ref={(el) => {
                if (el) tabRefs.current.set(it.value, el);
                else tabRefs.current.delete(it.value);
              }}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(it.value)}
              className={[
                'group inline-flex items-center h-10 px-3.5 font-sans text-label font-medium transition-colors',
                active ? 'text-navy' : 'text-ink-3 hover:text-ink-2',
              ].join(' ')}
              style={active ? { color: 'var(--navy)' } : undefined}
            >
              <span className="inline-flex items-center gap-2 h-full whitespace-nowrap">
                <span>{it.label}</span>
                {typeof it.count === 'number' && (
                  <span
                    className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded transition-colors duration-200"
                    style={{
                      background: active ? 'var(--brand-tint)' : 'var(--surface-2)',
                      color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                    }}
                  >
                    {it.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
        {indicator && (
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-px h-[2px] bg-brand"
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: 'left 220ms var(--ease-out), width 220ms var(--ease-out)',
            }}
          />
        )}
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
