/* global React, Icon, ReactRouterDOM, openCommandPalette, PROPERTY */
// ScanContextBar — replaces the persistent search trigger on detail
// pages (result + why-expanded). Shows a back button plus the address
// currently being viewed, so the user knows what scan they're looking at
// without needing the search bar to keep that context.
//
// The ⌘K palette is still reachable from any page, so a small keycap
// hint is included on the right rather than a full search affordance.

interface ScanContextBarProps {
  /** Optional override; defaults to the address stored at scan time. */
  address?: string;
  /** Optional eyebrow line above the address. */
  eyebrow?: string;
  /** Override the back destination. Defaults to "/". */
  backTo?: string;
  /** Override the back-button label. */
  backLabel?: string;
}

function ScanContextBar({
  address,
  eyebrow = 'Scanned property',
  backTo = '/',
  backLabel = 'Back to scanner',
}: ScanContextBarProps) {
  const history = ReactRouterDOM.useHistory();
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  return (
    <div className="flex items-center gap-3 sm:gap-4 mb-1">
      <button
        type="button"
        onClick={() => history.push(backTo)}
        className="group inline-flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-[10px] border border-line bg-surface text-[13px] text-ink-2 hover:border-line-strong hover:text-ink transition-colors shrink-0"
        aria-label={backLabel}
      >
        <span
          className="grid place-items-center w-5 h-5 transition-transform group-hover:-translate-x-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"
          aria-hidden
        >
          {/* chevron-left — Icons.tsx only ships chevron-right, so an inline arrow */}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="m10 4-4 4 4 4" />
          </svg>
        </span>
        <span className="hidden sm:inline">{backLabel}</span>
        <span className="sm:hidden">Back</span>
      </button>

      <div className="flex-1 min-w-0">
        <div
          className="font-sans text-[10.5px] font-semibold tracking-[0.16em] uppercase"
          style={{ color: 'var(--ink-3)' }}
        >
          {eyebrow}
        </div>
        <div
          className="mt-0.5 truncate font-sans font-semibold text-[15px] sm:text-[16px] leading-tight tracking-[-0.005em]"
          style={{ color: 'var(--navy)' }}
        >
          {resolvedAddress}
        </div>
      </div>

      <button
        type="button"
        onClick={() => openCommandPalette()}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-[10px] text-[12px] text-ink-3 hover:text-ink-2 hover:bg-surface-2 transition-colors shrink-0"
        aria-label="Open search"
      >
        <Icon name="search" size={14} />
        <kbd
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-[5px] border border-line bg-surface-2 font-mono text-[11px] leading-none"
          style={{ boxShadow: '0 1px 0 rgba(20,45,85,0.08)' }}
        >
          ⌘
        </kbd>
        <kbd
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-[5px] border border-line bg-surface-2 font-mono text-[11px] leading-none"
          style={{ boxShadow: '0 1px 0 rgba(20,45,85,0.08)' }}
        >
          K
        </kbd>
      </button>
    </div>
  );
}
