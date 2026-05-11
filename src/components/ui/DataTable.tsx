/* global React */
// DataTable — single source of truth for every tabular surface in the
// product (recent scans, history, batch upload). On viewports >= md it
// renders as a CSS-grid table with a quiet header (no filled background
// bar) and an optional 2px leading edge accent per row. Below md it
// collapses to a card stack: the column flagged `primary: true` becomes
// the card title, hidden columns appear in a metadata footer.
//
// Why a single primitive: every table in the app should share row
// rhythm, hover treatment, accent colour application, and the
// table-to-card breakpoint so density and feel stay consistent.

interface ColumnDef<T> {
  /** Stable key used for React reconciliation and grid track sizing. */
  key: string;
  /** Header label; rendered in the quiet uppercase mono style. */
  label?: string;
  /** Cell renderer for desktop (and default for mobile). */
  cell: (row: T, index: number) => React.ReactNode;
  /** Optional dedicated mobile-card renderer. Falls back to cell(). */
  mobileCell?: (row: T, index: number) => React.ReactNode;
  /** CSS grid track value (e.g. '1fr', '120px', '92px'). Default '1fr'. */
  width?: string;
  /** 'right' for numeric columns; default 'left'. */
  align?: 'left' | 'right';
  /** Hide on viewports below this breakpoint. md = the table↔card switch. */
  hideBelow?: 'sm' | 'md' | 'lg';
  /** Becomes the card title on mobile. Exactly one column should set this. */
  primary?: boolean;
  /** Skip in the mobile metadata footer (e.g. when the value is purely
   *  decorative). The primary column is always shown as the card title. */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Click handler — entire row becomes a button when set. */
  onRowClick?: (row: T) => void;
  /** Returns a CSS color for the row's 2px leading-edge accent stripe.
   *  Use this for status — it replaces the need for a colored capsule cell. */
  leadingAccent?: (row: T) => string | undefined;
  /** Empty-state node, shown when rows.length === 0. */
  empty?: React.ReactNode;
  /** Optional className appended to the table container. */
  className?: string;
}

const HIDE_CLS: Record<NonNullable<ColumnDef<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:block',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
};

function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  leadingAccent,
  empty,
  className = '',
}: DataTableProps<T>) {
  const desktopCols = columns.map((c) => c.width || '1fr').join(' ');
  // 16px trailing chevron track when interactive. Leading-accent stripe
  // was removed per design pass — verdict semantics live in the verdict
  // cell's dot+text, no need to duplicate them on the row's left edge.
  const gridTemplate = `${desktopCols}${onRowClick ? ' 16px' : ''}`;
  const interactive = !!onRowClick;
  const headerLabels = columns.some((c) => c.label);

  const RowEl: any = interactive ? 'button' : 'div';

  if (rows.length === 0) {
    return (
      <div
        className={`bg-surface border border-line rounded-lg overflow-hidden ${className}`}
      >
        {empty ?? (
          <div className="px-5 py-12 text-center text-label text-ink-3">
            No rows.
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border border-line rounded-lg overflow-hidden ${className}`}
    >
      {/* === Desktop header (md+) ===
          Tinted strip (surface-2) with airier vertical padding. The strip
          itself reads as a clear band; the outer card border + this
          header's bottom hairline visually merge into a single edge —
          no doubled-border feel. */}
      {headerLabels && (
        <div
          className="hidden md:grid gap-4 px-6 py-4 bg-surface-2 border-b border-line"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((c) => (
            <div
              key={c.key}
              className={[
                'font-sans text-eyebrow font-semibold uppercase tracking-[0.16em] text-ink-3 leading-none',
                c.align === 'right' ? 'text-right' : '',
                c.hideBelow ? HIDE_CLS[c.hideBelow] : '',
              ].join(' ')}
            >
              {c.label}
            </div>
          ))}
          {interactive && <div />}
        </div>
      )}

      {/* === Rows === */}
      {rows.map((row, i) => {
        const accent = leadingAccent?.(row);
        return (
          <RowEl
            key={rowKey(row, i)}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onRowClick!(row) : undefined}
            className={[
              'group relative w-full text-left',
              'border-t border-line',
              interactive
                ? 'cursor-pointer transition-colors hover:bg-hover-bg'
                : '',
              // Mobile (card) layout
              'block md:hidden px-4 py-3.5',
            ].join(' ')}
          >
            {/* Mobile card body */}
            <MobileCard
              row={row}
              index={i}
              columns={columns}
              accent={accent}
              interactive={interactive}
            />
          </RowEl>
        );
      })}

      {/* === Desktop rows (separate render for the grid layout) ===
          No leading-edge accent stripe — verdict color now lives only
          in the verdict cell's dot+text. Plain hairline divider above
          each row + the card's outer border below the last row. */}
      {rows.map((row, i) => {
        return (
          <RowEl
            key={'d-' + rowKey(row, i)}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onRowClick!(row) : undefined}
            className={[
              'group relative w-full text-left',
              'border-t border-line',
              interactive
                ? 'cursor-pointer transition-colors hover:bg-hover-bg'
                : '',
              // Desktop table grid
              'hidden md:grid gap-4 px-6 py-3.5 items-center',
            ].join(' ')}
            style={{ gridTemplateColumns: gridTemplate }}
          >
            {columns.map((c) => (
              <div
                key={c.key}
                className={[
                  'min-w-0',
                  c.align === 'right' ? 'text-right' : '',
                  c.hideBelow ? HIDE_CLS[c.hideBelow] : '',
                ].join(' ')}
              >
                {c.cell(row, i)}
              </div>
            ))}
            {interactive && (
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 text-ink-4 justify-self-end opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m6 4 4 4-4 4" />
              </svg>
            )}
          </RowEl>
        );
      })}
    </div>
  );
}

// Mobile card body: primary column as title, others stacked beneath as
// label/value pairs. No leading accent — verdict signal now carried by
// the verdict cell in the metadata grid.
function MobileCard<T>({
  row,
  index,
  columns,
  accent: _accent,
  interactive,
}: {
  row: T;
  index: number;
  columns: ColumnDef<T>[];
  accent: string | undefined;
  interactive: boolean;
}) {
  const primary = columns.find((c) => c.primary);
  const meta = columns.filter((c) => !c.primary && !c.hideOnMobile);
  return (
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {primary
            ? (primary.mobileCell ?? primary.cell)(row, index)
            : null}
        </div>
        {interactive && (
          <svg
            viewBox="0 0 16 16"
            className="w-3.5 h-3.5 text-ink-4 shrink-0 mt-1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="m6 4 4 4-4 4" />
          </svg>
        )}
      </div>
      {meta.length > 0 && (
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
          {meta.map((c) => (
            <div
              key={c.key}
              className="flex items-baseline justify-between gap-2 text-caption"
            >
              {c.label && (
                <dt className="font-mono text-eyebrow uppercase tracking-[0.12em] text-ink-4 shrink-0">
                  {c.label}
                </dt>
              )}
              <dd className="text-ink-2 min-w-0 truncate text-right">
                {(c.mobileCell ?? c.cell)(row, index)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
