/* global React, ReactDOM, Icon */
// Modal — reusable dialog primitive. Header + body + footer slots, portal-
// rendered into <body>, backdrop-blur overlay, ESC + click-outside close,
// and a basic focus trap so keyboard users can't tab out of the dialog.
//
// Visual contract mirrors the rest of the system: surface card with rounded-
// lg radius and shadow-md, header underline + footer top-line in --line,
// padding 24px sides / 20px top-bottom for header + footer, 24px for body.
// No new tokens — all utilities resolve to existing CSS variables.

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Right-aligned footer node — typically Cancel + primary Button. */
  footer?: React.ReactNode;
  children?: React.ReactNode;
  /** Max width in px. Defaults to 480 (single-column form-like dialogs). */
  width?: number;
  /** Optional id for the title element so aria-labelledby can wire up. */
  labelId?: string;
}

function Modal({ open, onClose, title, footer, children, width = 480, labelId }: ModalProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null);
  const titleId = labelId || React.useId();

  // ESC closes; focus trap keeps Tab inside.
  React.useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
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
    // Initial focus: first focusable inside dialog, else the dialog itself.
    setTimeout(() => {
      if (!dialogRef.current) return;
      const focusable = dialogRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'
      );
      (focusable ?? dialogRef.current).focus();
    }, 0);
    // Lock body scroll while open.
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
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      aria-hidden={false}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
        style={{ animation: 'route-fade-in 160ms var(--ease-out) both' }}
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className="relative w-full bg-surface border border-line rounded-lg shadow-md outline-none"
        style={{ maxWidth: width, animation: 'route-fade-in var(--motion-fast) var(--ease-out) both' }}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between gap-4 px-surface-x py-surface-y-h border-b border-line">
            <h2
              id={titleId}
              className="font-sans font-semibold text-h4 leading-tight tracking-h2 m-0"
              style={{ color: 'var(--navy)' }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-control-sm h-control-sm -mr-1.5 grid place-items-center rounded-md text-ink-3 hover:bg-hover-bg hover:text-ink-2 transition-colors shrink-0"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-surface-x py-surface-y-b">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-surface-x py-surface-y-f border-t border-line bg-surface-2/40">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
}
