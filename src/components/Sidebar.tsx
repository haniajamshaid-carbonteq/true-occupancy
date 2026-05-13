/* global React, Avatar, Icon, Pill, ReactRouterDOM */

const { NavLink } = ReactRouterDOM;

interface NavItem {
  to: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  badge?: string;
  exact?: boolean;
}

const NAV: { section?: string; items: NavItem[] }[] = [
  {
    items: [
      { to: '/', label: 'New Scan', icon: 'search', exact: true },
      { to: '/batch', label: 'Batch Scan', icon: 'layers' },
      { to: '/scan/start', label: 'In Progress', icon: 'history', badge: '1' },
    ],
  },
  {
    section: 'Spec',
    items: [
      { to: '/scan/start', label: 'Scan · Start', icon: 'history' },
      { to: '/scan/mid', label: 'Scan · Mid', icon: 'history' },
      { to: '/result/clean', label: 'Result · Clean', icon: 'shield' },
      { to: '/result/medium', label: 'Result · Medium', icon: 'info' },
      { to: '/result/high', label: 'Result · High', icon: 'alert' },
      { to: '/why-expanded', label: 'Why Expanded', icon: 'spark' },
    ],
  },
  {
    section: 'Reference',
    items: [{ to: '/components', label: 'Components', icon: 'square' }],
  },
];

function Sidebar() {
  return (
    <aside className="bg-surface-2 border-r border-line px-5 py-7 flex flex-col gap-7">
      {/* Logo — Halcyon parent / TrueOccupancy product hierarchy per brand book §2 */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 shrink-0">
          <img src="docs/brand/halcyon-mark-v2.png" alt="Halcyon Solutions" className="w-full h-full object-contain block" />
        </div>
        <div className="leading-tight">
          <div
            className="font-sans text-body font-bold tracking-[0.04em] uppercase"
            style={{ color: 'var(--navy)' }}
          >
            Halcyon
          </div>
          <div
            className="font-sans text-micro font-medium tracking-[0.01em] mt-0.5"
            style={{ color: 'var(--brand-deep)' }}
          >
            TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map((group, i) => (
          <div key={group.section ?? `group-${i}`}>
            {group.section && (
              <div className="font-mono text-eyebrow uppercase tracking-wider text-ink-4 px-2.5 pt-3 pb-1.5">
                {group.section}
              </div>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                exact={item.exact}
                className="flex items-center gap-inline-loose px-2.5 py-2 rounded-md text-ink-2 text-sm font-medium hover:bg-hover-bg transition-colors no-underline"
                activeClassName="bg-brand-tint text-brand"
              >
                <Icon name={item.icon} size={16} className="opacity-80" />
                <span>{item.label}</span>
                {item.badge && (
                  <Pill size="sm" className="ml-auto">{item.badge}</Pill>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-line flex items-center gap-2.5">
        <Avatar initials="JM" size={32} />
        <div className="leading-tight">
          <div className="text-label font-medium">J. Marlow</div>
          <div className="text-micro text-ink-3">Code Compliance · Asheville</div>
        </div>
      </div>
    </aside>
  );
}
