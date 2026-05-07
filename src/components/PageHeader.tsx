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
        <div className={`flex items-end ${showTitle ? 'justify-start sm:justify-between' : 'justify-end'} gap-3 sm:gap-6 mb-5 sm:mb-6`}>
          {showTitle && (
            <h1
              className="hidden sm:block font-sans font-light leading-[1.05] tracking-[-0.025em] m-0"
              style={{ fontSize: 'clamp(28px, 7vw, 44px)' }}
            >
              True Occupancy
            </h1>
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
            <Button variant="primary" tabIndex={-1} className="rounded-full sm:rounded-lg w-10 sm:w-auto px-0 sm:px-4 grid place-items-center">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="search" size={14} />
                <span className="hidden sm:inline">Run scan</span>
              </span>
            </Button>
          }
        />
      )}
    </>
  );
}
