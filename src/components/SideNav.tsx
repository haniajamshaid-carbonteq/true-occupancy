/* global React, Icon, ReactRouterDOM */
// Halcyon side navigation. Persistent left rail on md+, slide-out drawer
// on mobile triggered by a small top bar with the Halcyon mark + hamburger.

const { NavLink, Link } = ReactRouterDOM;

interface NavItem {
  to: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  badge?: string;
  exact?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: '/', label: 'New scan', icon: 'search', exact: true },
  { to: '/batch', label: 'Batch', icon: 'layers' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/result/high', label: 'Flagged', icon: 'flag', badge: '9' },
];

const NAV_WIDTH = 248;

function NavLinkRow({
  item,
  size = 'desktop',
  onNavigate,
}: {
  item: NavItem;
  size?: 'desktop' | 'mobile';
  onNavigate?: () => void;
}) {
  const isMobile = size === 'mobile';
  return (
    <NavLink
      to={item.to}
      exact={item.exact}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-md no-underline transition-colors ${
        isMobile ? 'h-12 px-3 text-[15px]' : 'h-10 px-3 text-[13.5px]'
      } font-medium hover:bg-brand-tint`}
      activeClassName="!bg-brand-tint !text-brand-deep"
      style={{ color: 'var(--navy)' }}
    >
      <Icon name={item.icon} size={isMobile ? 17 : 15} className="opacity-80 shrink-0" />
      <span className="truncate">{item.label}</span>
      {item.badge && (
        <span
          className="ml-auto font-sans text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}
        >
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function BrandLockup({
  size = 'desktop',
  onClick,
}: {
  size?: 'desktop' | 'mobile';
  onClick?: () => void;
}) {
  const markPx = size === 'mobile' ? 32 : 40;
  return (
    <Link
      to="/"
      onClick={onClick}
      className="flex items-center gap-2.5 no-underline shrink-0"
    >
      <div style={{ width: markPx, height: markPx }} className="shrink-0">
        <img
          src="halcyon-mark-v2.png"
          alt="Halcyon Solutions — Decide with certainty."
          className="w-full h-full object-contain block"
        />
      </div>
      <div className="leading-tight">
        <div
          className="font-sans text-[15px] font-bold tracking-[0.04em] uppercase"
          style={{ color: 'var(--navy)' }}
        >
          Halcyon
        </div>
        <div
          className="font-sans text-[11.5px] font-medium tracking-[0.01em]"
          style={{ color: 'var(--brand-deep)' }}
        >
          TrueOccupancy<sup className="text-[0.6em] align-top ml-px">™</sup>
        </div>
      </div>
    </Link>
  );
}

function SideNav() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Desktop side rail (md+) */}
      <aside
        className="hidden md:flex fixed inset-y-0 left-0 flex-col bg-surface border-r border-line z-30"
        style={{ width: NAV_WIDTH }}
      >
        <div className="px-5 pt-6 pb-5 border-b border-line">
          <BrandLockup />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          <div
            className="font-sans text-[10px] uppercase tracking-[0.16em] font-bold px-3 mb-1.5"
            style={{ color: 'var(--ink-3)' }}
          >
            Workspace
          </div>
          {PRIMARY.map((item) => (
            <NavLinkRow key={item.to + item.label} item={item} />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-line">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-brand-tint transition-colors text-left"
          >
            <span
              className="w-9 h-9 rounded-full grid place-items-center text-white text-[12px] font-semibold tabular-nums shrink-0"
              style={{ background: 'var(--navy)' }}
            >
              JM
            </span>
            <span className="leading-tight min-w-0 flex-1">
              <span
                className="block text-[13px] font-semibold truncate"
                style={{ color: 'var(--navy)' }}
              >
                J. Marlow
              </span>
              <span className="block text-[11.5px] text-ink-3 truncate">
                Code Compliance · Asheville
              </span>
            </span>
            <svg
              viewBox="0 0 16 16"
              className="w-3.5 h-3.5 shrink-0 text-ink-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Mobile top bar (hidden on md+) */}
      <header className="md:hidden sticky top-0 z-40 bg-surface border-b border-line">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <BrandLockup size="mobile" />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="w-11 h-11 -mr-2 grid place-items-center rounded-md hover:bg-brand-tint"
            style={{ color: 'var(--navy)' }}
          >
            <span className="relative w-5 h-4 block" aria-hidden>
              <span
                className={`absolute left-0 right-0 h-[1.5px] bg-current rounded transition-all ${
                  open ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 right-0 h-[1.5px] bg-current rounded transition-opacity top-1.5 ${
                  open ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 right-0 h-[1.5px] bg-current rounded transition-all ${
                  open ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside
            className="md:hidden fixed inset-y-0 left-0 z-50 bg-surface border-r border-line flex flex-col"
            style={{ width: 'min(86vw, 320px)' }}
          >
            <div className="px-5 pt-5 pb-4 border-b border-line flex items-center justify-between">
              <BrandLockup size="mobile" onClick={() => setOpen(false)} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 grid place-items-center rounded-md text-ink-3 hover:bg-brand-tint hover:text-navy"
              >
                <span className="relative w-4 h-4 block" aria-hidden>
                  <span className="absolute left-0 right-0 top-1.5 h-[1.5px] bg-current rotate-45" />
                  <span className="absolute left-0 right-0 top-1.5 h-[1.5px] bg-current -rotate-45" />
                </span>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
              <div
                className="font-sans text-[10px] uppercase tracking-[0.16em] font-bold px-3 mb-1.5"
                style={{ color: 'var(--ink-3)' }}
              >
                Workspace
              </div>
              {PRIMARY.map((item) => (
                <NavLinkRow
                  key={item.to + item.label}
                  item={item}
                  size="mobile"
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
