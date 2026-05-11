/* global React */
// DropdownMenu — a single primitive for every "click button, see menu of
// actions" surface. Honours the project's mobile rule: on viewports < md
// the menu opens as a bottom sheet (slide-up from the bottom edge with
// a scrim), not as a floating popover.
//
// API:
//   <DropdownMenu
//     trigger={(open) => <Button>Download</Button>}
//     items={[{ label, icon, onClick, disabled?, destructive? }]}
//     align="end"             // 'start' | 'end' on desktop
//     title="Download report" // optional bottom-sheet title
//   />
//
// The trigger receives the open boolean so callers can mirror state
// (e.g. flip a chevron). The menu closes on outside click, Escape, and
// after any item activates.

const { useState, useRef, useEffect } = React;

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  /** Optional secondary line below the label (mobile sheet only). */
  hint?: string;
}

interface DropdownMenuProps {
  trigger: React.ReactNode | ((open: boolean) => React.ReactNode);
  items: MenuItem[];
  align?: 'start' | 'end';
  /** Bottom-sheet title on mobile. Defaults to no title. */
  title?: string;
  /** Tailwind width utility for the desktop popover. Defaults to 'w-56'. */
  menuWidth?: string;
}

function DropdownMenu({
  trigger,
  items,
  align = 'end',
  title,
  menuWidth = 'w-56',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Lock body scroll while the bottom sheet is open on mobile.
  useEffect(() => {
    if (!open) return;
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function activate(item: MenuItem) {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
  }

  const triggerNode = typeof trigger === 'function' ? trigger(open) : trigger;
  const desktopAlign = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div ref={containerRef} className="relative inline-block">
      <span onClick={() => setOpen((v) => !v)} className="inline-flex">
        {triggerNode}
      </span>

      {open && (
        <>
          {/* Mobile bottom-sheet: scrim + slide-up panel */}
          <div
            className="fixed inset-0 z-50 md:hidden bg-ink-2/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="menu"
            className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-surface rounded-t-2xl border-t border-line shadow-lg pb-[max(env(safe-area-inset-bottom),16px)] pt-2 px-2 animate-[sheet-in_180ms_cubic-bezier(0.22,1,0.36,1)]"
          >
            <div className="mx-auto w-9 h-1 rounded-full bg-line-strong mb-3" aria-hidden />
            {title && (
              <div className="px-3 pb-2 font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase text-ink-3">
                {title}
              </div>
            )}
            {items.map((item, i) => (
              <SheetItem key={i} item={item} onActivate={activate} />
            ))}
          </div>

          {/* Desktop popover */}
          <div
            role="menu"
            className={`hidden md:block absolute mt-2 ${desktopAlign} ${menuWidth} bg-surface border border-line rounded-lg shadow-md p-1 z-40 animate-[menu-in_120ms_cubic-bezier(0.22,1,0.36,1)] origin-top`}
          >
            {title && (
              <div className="px-2.5 py-1.5 font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase text-ink-4">
                {title}
              </div>
            )}
            {items.map((item, i) => (
              <PopoverItem key={i} item={item} onActivate={activate} />
            ))}
          </div>
        </>
      )}

      {/* Keyframes (scoped via Tailwind arbitrary classes above) */}
      <style>{`
        @keyframes sheet-in {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes menu-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

function PopoverItem({
  item,
  onActivate,
}: {
  item: MenuItem;
  onActivate: (item: MenuItem) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={() => onActivate(item)}
      className={[
        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md',
        'text-left font-sans text-label leading-none',
        'transition-colors',
        item.disabled
          ? 'opacity-40 cursor-not-allowed'
          : item.destructive
          ? 'text-error-ink hover:bg-error-soft hover:text-error-ink'
          : 'text-ink-2 hover:bg-brand-tint hover:text-brand-deep',
      ].join(' ')}
    >
      {item.icon && (
        <span className="inline-flex shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">
          {item.icon}
        </span>
      )}
      <span className="flex-1 truncate">{item.label}</span>
    </button>
  );
}

function SheetItem({
  item,
  onActivate,
}: {
  item: MenuItem;
  onActivate: (item: MenuItem) => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={() => onActivate(item)}
      className={[
        'w-full flex items-center gap-3 px-3 py-3.5 rounded-lg',
        'text-left font-sans text-body',
        'transition-colors',
        item.disabled
          ? 'opacity-40 cursor-not-allowed'
          : item.destructive
          ? 'text-error-ink active:bg-error-soft'
          : 'text-ink-2 active:bg-brand-tint',
      ].join(' ')}
    >
      {item.icon && (
        <span className="inline-flex shrink-0 w-9 h-9 rounded-lg bg-surface-2 grid place-items-center text-ink-2 [&>svg]:w-[18px] [&>svg]:h-[18px]">
          {item.icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block font-medium truncate">{item.label}</span>
        {item.hint && (
          <span className="block text-caption text-ink-3 mt-0.5 truncate">
            {item.hint}
          </span>
        )}
      </span>
    </button>
  );
}
