/* global React, AppShell, Avatar, Button, Icon, Input, Pill, ReactRouterDOM */
// Profile — two-column account screen.
// Left rail: avatar with edit affordance, name/role, vertical section nav
// (Personal Information / Login & Password / Log Out).
// Right panel: Personal Information form with read-only Inputs (prototype —
// Discard / Save are cosmetic). Log Out clears the sessionStorage auth flag
// and bounces to /signin; Back returns to the previous route.

const PROFILE = {
  firstName: 'J.',
  lastName: 'Marlow',
  name: 'J. Marlow',
  role: 'Code Compliance Officer',
  email: 'j.marlow@ashevillenc.gov',
  address: '25 College St',
  phone: '(828) 555-0142',
  dob: '14 Mar 1988',
  location: 'Asheville, NC',
  postal: '28801',
  initials: 'JM',
};

type SectionKey = 'personal' | 'login';

function ProfileScreen() {
  const history = ReactRouterDOM.useHistory();
  const [section, setSection] = React.useState<SectionKey>('personal');

  function goBack() {
    if (history.length > 1) history.goBack();
    else history.push('/');
  }

  function logout() {
    try {
      window.sessionStorage.removeItem('to-signedIn');
    } catch {}
    history.replace('/signin');
  }

  return (
    <AppShell>
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="group inline-flex items-center gap-1 h-9 px-2.5 -ml-2.5 rounded-md bg-transparent border-0 text-label text-ink-2 hover:bg-hover-bg transition-colors shrink-0 cursor-pointer"
        >
          <span
            className="grid place-items-center w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          >
            <svg
              viewBox="0 0 16 16"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m10 4-4 4 4 4" />
            </svg>
          </span>
          <span>Back</span>
        </button>

        <h1
          className="flex-1 min-w-0 font-sans font-semibold leading-[1.1] tracking-[-0.008em] m-0 truncate"
          style={{ fontSize: 'clamp(20px, 3.2vw, 28px)', color: 'var(--navy)' }}
        >
          Profile
        </h1>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-[280px_1fr]">
        <ProfileRail
          active={section}
          onSelect={setSection}
          onLogout={logout}
        />

        <PersonalInformationPanel />
      </div>
    </AppShell>
  );
}

function ProfileRail({
  active,
  onSelect,
  onLogout,
}: {
  active: SectionKey;
  onSelect: (k: SectionKey) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="bg-surface border border-line rounded-2xl shadow-sm p-6 flex flex-col items-stretch gap-6 h-fit">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          <Avatar initials={PROFILE.initials} size={96} />
          <button
            type="button"
            aria-label="Change photo"
            className="absolute -bottom-1 -right-1 w-8 h-8 grid place-items-center rounded-full bg-brand text-white border-2 border-surface hover:bg-brand-deep transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 16 16"
              width={12}
              height={12}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M11.5 2.5a1.5 1.5 0 0 1 2 2L5 13l-3 1 1-3 8.5-8.5Z" />
            </svg>
          </button>
        </div>
        <div>
          <div
            className="font-sans text-h4 font-semibold leading-tight"
            style={{ color: 'var(--navy)' }}
          >
            {PROFILE.name}
          </div>
          <div className="text-body-sm text-ink-3 mt-0.5">{PROFILE.role}</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <RailItem
          icon="user"
          label="Personal Information"
          selected={active === 'personal'}
          onClick={() => onSelect('personal')}
        />
        <RailItem
          icon="lock"
          label="Login & Password"
          selected={active === 'login'}
          onClick={() => onSelect('login')}
        />
        <RailItem
          icon="logout"
          label="Log Out"
          danger
          onClick={onLogout}
        />
      </nav>
    </aside>
  );
}

function RailItem({
  icon,
  label,
  selected = false,
  danger = false,
  onClick,
}: {
  icon: 'user' | 'lock' | 'logout';
  label: string;
  selected?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const base =
    'flex items-center gap-3 h-11 px-3 rounded-lg text-label font-medium font-sans text-left transition-colors cursor-pointer border-0';
  let tone = 'text-ink-2 bg-transparent hover:bg-hover-bg';
  if (selected) tone = 'text-brand-deep bg-brand-tint';
  else if (danger) tone = 'text-ink-2 bg-transparent hover:bg-error-soft hover:text-error-ink';

  return (
    <button type="button" onClick={onClick} className={`${base} ${tone}`}>
      <span className="grid place-items-center w-5 h-5 shrink-0" aria-hidden>
        {icon === 'logout' ? (
          <svg
            viewBox="0 0 24 24"
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 17l5-5-5-5" />
            <path d="M20 12H9" />
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          </svg>
        ) : (
          <Icon name={icon} size={16} />
        )}
      </span>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">{children}</div>;
}

function PersonalInformationPanel() {
  return (
    <section className="bg-surface border border-line rounded-2xl shadow-sm">
      <header className="px-6 sm:px-8 pt-7 pb-5">
        <h2
          className="font-sans text-h3 font-semibold m-0"
          style={{ color: 'var(--navy)' }}
        >
          Personal Information
        </h2>
      </header>

      <div className="px-6 sm:px-8 pb-7 flex flex-col gap-5">
        <FieldGrid>
          <Input label="First Name" type="text" value={PROFILE.firstName} readOnly />
          <Input label="Last Name" type="text" value={PROFILE.lastName} readOnly />
        </FieldGrid>

        <Input
          label="Email"
          type="email"
          value={PROFILE.email}
          readOnly
          leadingIcon={<Icon name="mail" />}
        />

        <Input
          label="Address"
          type="text"
          value={PROFILE.address}
          readOnly
          leadingIcon={<Icon name="pin" />}
        />

        <FieldGrid>
          <Input label="Phone Number" type="tel" value={PROFILE.phone} readOnly />
          <Input
            label="Date of Birth"
            type="text"
            value={PROFILE.dob}
            readOnly
            trailing={
              <span className="text-ink-3 mr-2">
                <Icon name="cal" size={14} />
              </span>
            }
          />
        </FieldGrid>

        <FieldGrid>
          <Input label="Location" type="text" value={PROFILE.location} readOnly />
          <Input label="Postal Code" type="text" value={PROFILE.postal} readOnly />
        </FieldGrid>

        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 pt-2">
          <Button variant="default" className="h-11 justify-center">
            Discard Changes
          </Button>
          <Button variant="primary" className="h-11 justify-center">
            Save Changes
          </Button>
        </div>
      </div>
    </section>
  );
}
