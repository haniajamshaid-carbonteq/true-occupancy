/* global React, Icon, ReactRouterDOM */
// Top navigation bar — replaces the left Sidebar across the app.

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
  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-line">
      <div className="max-w-[1320px] mx-auto px-8 h-16 flex items-center gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline shrink-0">
          <div className="w-8 h-8 shrink-0">
            <img
              src="halcyon-mark-v2.png"
              alt="Halcyon"
              className="w-full h-full object-contain block"
            />
          </div>
          <div className="font-sans font-light text-[18px] leading-none tracking-[-0.02em] text-ink">
            True Occupancy
          </div>
        </Link>

        {/* Primary nav — pushed right */}
        <nav className="ml-auto flex items-center gap-1">
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
                <span className="font-mono text-[10.5px] text-ink-4 ml-0.5">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
