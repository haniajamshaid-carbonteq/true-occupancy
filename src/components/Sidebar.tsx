/* global React, Avatar, Icon, ReactRouterDOM */

const { NavLink } = ReactRouterDOM;

interface NavItem {
  to: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  badge?: string;
  exact?: boolean;
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: 'Workspace',
    items: [
      { to: '/', label: 'New scan', icon: 'search', exact: true },
      { to: '/batch', label: 'Batch scan', icon: 'layers' },
      { to: '/scan/start', label: 'In progress', icon: 'history', badge: '1' },
      { to: '/result/high', label: 'Flagged', icon: 'flag', badge: '9' },
    ],
  },
  {
    section: 'Spec',
    items: [
      { to: '/scan/start', label: 'Scan · start', icon: 'history' },
      { to: '/scan/mid', label: 'Scan · mid', icon: 'history' },
      { to: '/result/clean', label: 'Result · clean', icon: 'shield' },
      { to: '/result/medium', label: 'Result · medium', icon: 'info' },
      { to: '/result/high', label: 'Result · high', icon: 'alert' },
      { to: '/why-expanded', label: 'Why expanded', icon: 'spark' },
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
      {/* Logo — matches spec: 40px Halcyon mark + product name with italic Occupancy */}
      <div className="flex items-center gap-2.5 font-serif text-[22px]">
        <div className="w-10 h-10 shrink-0">
          <img src="halcyon-mark-v2.png" alt="Halcyon" className="w-full h-full object-contain block" />
        </div>
        <div className="leading-tight text-[18px]">
          True <em className="italic text-brand">Occupancy</em>
          <span className="block font-mono text-[9.5px] tracking-[0.12em] text-ink-3 uppercase mt-0.5">
            by Halcyon
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-4 px-2.5 pt-3 pb-1.5">
              {group.section}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                exact={item.exact}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-sm text-ink-2 text-sm font-medium hover:bg-surface no-underline"
                activeClassName="bg-brand-tint text-brand"
              >
                <Icon name={item.icon} size={16} className="opacity-80" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto font-mono text-[11px] text-ink-4">{item.badge}</span>
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
          <div className="text-[13px] font-medium">J. Marlow</div>
          <div className="text-[11.5px] text-ink-3">Code Compliance · Asheville</div>
        </div>
      </div>
    </aside>
  );
}
