/* global React */
// TableSkeleton — placeholder rows for DataTable while data is loading.
// Renders the same grid as the live table so layout doesn't jump on data
// arrival. Bars use --line with a subtle opacity pulse (motion.css).
//
// Bar widths are pseudo-random per column index so rows don't read as a
// regular comb — varies between 45% and 95%.

interface SkeletonColumn {
  key: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideBelow?: 'sm' | 'md' | 'lg';
}

interface TableSkeletonProps {
  columns: SkeletonColumn[];
  /** How many placeholder rows to render. Defaults to 6. */
  count?: number;
  /** Set true when the DataTable owner is interactive (adds the trailing
   *  16px chevron track so widths line up). */
  interactive?: boolean;
}

const HIDE_CLS_SK: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
};

// Deterministic widths keyed by (rowIndex, colIndex) — same skeleton every
// render so it doesn't flicker. Range 45–95% so cells don't fill edge-to-edge.
function barWidth(row: number, col: number): string {
  const seed = (row * 31 + col * 17) % 100;
  return `${45 + (seed % 50)}%`;
}

function TableSkeleton({ columns, count = 6, interactive = false }: TableSkeletonProps) {
  const grid = columns.map((c) => c.width || '1fr').join(' ') + (interactive ? ' 16px' : '');
  return (
    <>
      {Array.from({ length: count }).map((_, r) => (
        <div
          key={r}
          className="hidden md:grid gap-4 px-6 py-4 border-t border-line"
          style={{ gridTemplateColumns: grid }}
          aria-hidden
        >
          {columns.map((c, ci) => (
            <div
              key={c.key}
              className={[
                'h-3 rounded-sm bg-line skeleton-pulse',
                c.align === 'right' ? 'ml-auto' : c.align === 'center' ? 'mx-auto' : '',
                c.hideBelow ? HIDE_CLS_SK[c.hideBelow] : '',
              ].join(' ')}
              style={{ width: barWidth(r, ci) }}
            />
          ))}
          {interactive && <div />}
        </div>
      ))}
      {/* Mobile card-stack skeleton — mirrors DataTable's card mode */}
      <div className="md:hidden">
        {Array.from({ length: count }).map((_, r) => (
          <div
            key={r}
            className="border-t border-line px-5 py-4 flex flex-col gap-2"
            aria-hidden
          >
            <div className="h-3 rounded-sm bg-line skeleton-pulse" style={{ width: barWidth(r, 0) }} />
            <div className="h-3 rounded-sm bg-line skeleton-pulse" style={{ width: barWidth(r, 1) }} />
          </div>
        ))}
      </div>
    </>
  );
}
