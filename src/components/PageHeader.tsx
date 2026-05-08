/* global React, Button, Icon, SearchBar, PROPERTY */

interface PageHeaderProps {
  /** Persistent address search bar. */
  showSearch?: boolean;
  /** Show the page title (Halcyon eyebrow + bold sentence-case H1). */
  showTitle?: boolean;
  /** Optional right-aligned slot beside the H1 (e.g. a view-mode toggle). */
  rightSlot?: React.ReactNode;
}

function PageHeader({ showSearch = true, showTitle = true, rightSlot }: PageHeaderProps) {
  return (
    <>
      {(showTitle || rightSlot) && (
        <div
          className={`flex items-end ${
            showTitle ? 'justify-start sm:justify-between' : 'justify-start'
          } gap-3 sm:gap-6 mb-6 pb-5 border-b border-line`}
        >
          {showTitle && (
            <div className="hidden sm:block">
              <div
                className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase mb-1.5"
                style={{ color: 'var(--brand-deep)' }}
              >
                Halcyon · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
              </div>
              <h1
                className="font-sans font-semibold leading-[1.1] tracking-[-0.008em] m-0"
                style={{ fontSize: 'clamp(24px, 4.4vw, 32px)', color: 'var(--navy)' }}
              >
                Verify property occupancy.
              </h1>
            </div>
          )}
          {rightSlot && <div className="shrink-0 min-w-0">{rightSlot}</div>}
        </div>
      )}

      {showSearch && (
        <SearchBar
          key={(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) || PROPERTY.address}
          defaultValue={(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) || PROPERTY.address}
          readOnly
          trailing={
            <Button variant="primary" tabIndex={-1} className="rounded-full sm:rounded-lg w-9 sm:w-auto !p-0 sm:!px-4 !flex items-center justify-center gap-1.5">
              <Icon name="search" size={14} />
              <span className="hidden sm:inline">Run scan</span>
            </Button>
          }
        />
      )}
    </>
  );
}
