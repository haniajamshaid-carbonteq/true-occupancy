/* global React, Icon, ReactRouterDOM */
// Top navigation bar. On mobile collapses into a hamburger drawer; on
// tablet/desktop the full nav is visible inline.

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
  { to: '/scan/start', label: 'In progress', icon: 'history', badge: '1' },
  { to: '/result/high', label: 'Flagged', icon: 'flag', badge: '9' },
];

function TopNav() {
  const [open, setOpen] = React.useState(false);

  // Close the drawer on route change.
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 md:px-8 h-14 sm:h-16 flex items-center gap-4 sm:gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0">
            <img
              src="halcyon-mark-v2.png"
              alt="Halcyon"
              className="w-full h-full object-contain block"
            />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-auto hidden md:flex items-center gap-1">
          {PRIMARY.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              exact={item.exact}
              className="flex items-center gap-2 px-3 h-9 rounded-md text-ink-2 text-[13px] font-medium hover:bg-surface-2 no-underline"
              activeClassName="bg-brand-tint text-brand"
            >
              <Icon name={item.icon} size={14} className="opacity-80" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="font-sans text-[10.5px] text-ink-4 ml-0.5">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="ml-auto md:hidden w-11 h-11 -mr-2 grid place-items-center text-ink-2 hover:bg-surface-2 rounded-md"
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

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-line bg-surface px-4 py-3 flex flex-col gap-0.5">
          {PRIMARY.map((item) => (
            <NavLink
              key={item.to + item.label}
              to={item.to}
              exact={item.exact}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 h-12 rounded-md text-ink-2 text-[15px] font-medium hover:bg-surface-2 no-underline"
              activeClassName="bg-brand-tint text-brand"
            >
              <Icon name={item.icon} size={16} className="opacity-80" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto font-sans text-[12px] text-ink-4">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
