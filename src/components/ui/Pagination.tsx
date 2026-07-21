/* global React */
// Pagination — the table footer bar: "Showing 1–10 of 42" on the left,
// prev / page-of / next controls on the right. Extracted verbatim from the
// private footer inside DataTable so non-table surfaces can reuse it.
//
// Stateless: the owner holds `page` and reacts to `onPageChange`. Range
// text is derived from `page` / `pageSize` / `total`, so the caller never
// has to compute firstIdx / lastIdx itself.
//
// Note: the prev/next buttons have no visible focus style — that gap is
// carried over from the original DataTable footer, not introduced here.

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Zero-based current page index. */
  page: number;
  /** Rows per page — used for the "Showing x–y" range. */
  pageSize: number;
  /** Total row count across all pages. */
  total: number;
  /** Called with the new zero-based page index. Already clamped. */
  onPageChange: (page: number) => void;
  /** Appended to the footer container's classes. */
  className?: string;
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className = '',
  ...rest
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstIdx = page * pageSize + 1;
  const lastIdx = Math.min(total, page * pageSize + pageSize);

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-line bg-surface-2/40 ${className}`}
      {...rest}
    >
      <div className="font-sans text-caption text-ink-3 tabular-nums">
        Showing <span className="text-ink-2 font-medium">{firstIdx}</span>
        {firstIdx !== lastIdx && <>–<span className="text-ink-2 font-medium">{lastIdx}</span></>}
        {' '}of <span className="text-ink-2 font-medium">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          aria-label="Previous page"
          className="w-control-sm h-control-sm grid place-items-center rounded-md text-ink-2 hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m10 4-4 4 4 4" />
          </svg>
        </button>
        <span className="font-sans text-caption text-ink-3 px-2 tabular-nums">
          Page <span className="text-ink-2 font-medium">{page + 1}</span> of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="w-control-sm h-control-sm grid place-items-center rounded-md text-ink-2 hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 4 4 4-4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
