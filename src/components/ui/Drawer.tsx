/* global React, ReactDOM, Icon */
// Drawer — right-anchored slide-in panel for secondary controls (filters,
// settings, detail flyouts). Mirrors Modal's surface contract — header
// underline, footer top-line, ESC + outside-click close, focus trap, body
// scroll lock — but slides in from the right edge instead of centering.
//
// 380px wide on desktop; full viewport on mobile (<640px).

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Right-aligned footer node — typically Clear + Done buttons. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Width in px on >=640 viewports. Defaults to 380. */
  width?: number;
  labelId?: string;
}

function Drawer({ open, onClose, title, footer, children, width = 380, labelId }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = labelId || React.useId();

  React.useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    setTimeout(() => {
      if (!panelRef.current) return;
      const focusable = panelRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? panelRef.current).focus();
    }, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const overlay = (
    <div className="fixed inset-0 z-[100]" aria-hidden={false}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        style={{ animation: 'route-fade-in 160ms var(--ease-out) both' }}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="absolute top-0 right-0 bottom-0 w-full bg-surface border-l border-line shadow-md outline-none flex flex-col"
        style={{
          maxWidth: width,
          animation: 'drawer-slide-in 220ms var(--ease-out) both',
        }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between gap-4 px-surface-x py-surface-y-h border-b border-line shrink-0">
            <h2
              id={titleId}
              className="font-sans font-semibold text-h4 leading-tight tracking-[-0.005em] m-0"
              style={{ color: 'var(--navy)' }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 -mr-1.5 grid place-items-center rounded-md text-ink-3 hover:bg-hover-bg hover:text-ink-2 transition-colors shrink-0"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-surface-x py-surface-y-b">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between gap-2 px-surface-x py-surface-y-f border-t border-line bg-surface-2/40 shrink-0">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes drawer-slide-in {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}
