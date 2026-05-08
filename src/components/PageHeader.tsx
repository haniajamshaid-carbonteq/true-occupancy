/* global React, Button, Icon, SearchBar, PROPERTY */

interface PageHeaderProps {
  /** Persistent address search bar. */
  showSearch?: boolean;
  /** Show the "True Occupancy" page title. */
  showTitle?: boolean;
  /** Optional right-aligned slot beside the H1 (e.g. a view-mode toggle). */
  rightSlot?: React.ReactNode;
}

function PageHeader({ showSearch = true, showTitle = true, rightSlot }: PageHeaderProps) {
  return (
    <>
      {(showTitle || rightSlot) && (
        <div className={`flex items-end ${showTitle ? 'justify-start sm:justify-between' : 'justify-start'} gap-3 sm:gap-6 mb-5 sm:mb-6`}>
          {showTitle && (
            <div className="hidden sm:block">
              <div
                className="font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase mb-1.5"
                style={{ color: 'var(--brand-deep)' }}
              >
                Halcyon · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
              </div>
              <h1
                className="font-sans font-bold leading-[1.08] tracking-[-0.005em] m-0"
                style={{ fontSize: 'clamp(26px, 5vw, 40px)', color: 'var(--navy)' }}
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
