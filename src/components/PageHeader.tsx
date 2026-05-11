/* global React, Icon, Keycap, PROPERTY, openCommandPalette */

interface PageHeaderProps {
  /** Persistent address search trigger (opens the ⌘K palette). */
  showSearch?: boolean;
  /** Show the page title (Halcyon eyebrow + bold sentence-case H1). */
  showTitle?: boolean;
  /** Optional right-aligned slot beside the H1 (e.g. a view-mode toggle). */
  rightSlot?: React.ReactNode;
}

function PageHeader({ showSearch = true, showTitle = true, rightSlot }: PageHeaderProps) {
  const currentAddress =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

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
                className="font-sans text-micro font-semibold tracking-[0.14em] uppercase mb-1.5"
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
        <button
          type="button"
          onClick={() => openCommandPalette()}
          className="group w-full flex items-center gap-3 bg-surface border border-line-strong rounded-[14px] shadow-sm hover:shadow-md transition-shadow text-left h-12 pl-4 pr-3"
          aria-label="Open search"
        >
          <span
            className="grid place-items-center shrink-0 text-ink-3 group-hover:text-brand transition-colors [&>svg]:w-[16px] [&>svg]:h-[16px]"
            aria-hidden
          >
            <Icon name="search" size={16} />
          </span>
          <span className="flex-1 min-w-0 truncate text-body-sm text-ink-3 font-sans">
            {currentAddress}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-micro text-ink-3">
            <Keycap>⌘</Keycap>
            <Keycap>K</Keycap>
          </span>
        </button>
      )}
    </>
  );
}
