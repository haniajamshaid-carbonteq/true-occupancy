/* global React, Button, Icon, SearchBar, PROPERTY */

interface PageHeaderProps {
  /** Persistent address search bar. */
  showSearch?: boolean;
  /** Optional right-aligned slot beside the H1 (e.g. a view-mode toggle). */
  rightSlot?: React.ReactNode;
}

function PageHeader({ showSearch = true, rightSlot }: PageHeaderProps) {
  return (
    <>
      <div className={`flex items-end justify-between gap-6 mb-6`}>
        <h1 className="font-sans font-light text-[44px] leading-[1.05] tracking-[-0.025em] m-0">
          True Occupancy
        </h1>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      {showSearch && (
        <SearchBar
          icon={<Icon name="search" size={18} />}
          key={(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) || PROPERTY.address}
          defaultValue={(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) || PROPERTY.address}
          readOnly
          trailing={<Button variant="primary" tabIndex={-1}>Run scan</Button>}
        />
      )}
    </>
  );
}
