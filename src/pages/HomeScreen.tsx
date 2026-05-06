/* global React, AppShell, Sidebar, Button, Icon, SearchBar, ReactRouterDOM */
// Home / landing screen.
// Hero + centered search bar; below, a muted "how it works" row that
// suggests what the tool does without competing with the input.

const { useHistory } = ReactRouterDOM;

const STEPS = [
  {
    label: 'Step 01',
    title: 'Enter an address',
    body: 'Paste any U.S. street address, parcel ID, or geocoded coordinates.',
  },
  {
    label: 'Step 02',
    title: 'We sweep the platforms',
    body: 'Cross-check Airbnb, Vrbo, and Facebook Marketplace within a 1 mile radius — in seconds.',
  },
  {
    label: 'Step 03',
    title: 'Read the verdict',
    body: 'Get a 0–100 confidence score with every contributing signal, ready to share or export.',
  },
];

function HomeScreen() {
  const history = useHistory();

  return (
    <AppShell sidebar={<Sidebar />}>
      <div className="min-h-[calc(100vh-7rem)] flex flex-col items-center justify-center px-6">
        {/* Hero */}
        <div className="text-center max-w-[58ch] mb-10">
          <h1 className="font-serif text-7xl font-normal leading-[1.02] tracking-[-0.02em] m-0 mb-5">
            True <em className="italic text-brand">Occupancy</em>
          </h1>
          <p className="text-[17px] text-ink-3 leading-relaxed m-0">
            Check whether a property is being rented short-term on Airbnb, Vrbo, or
            Facebook Marketplace — all from a single address.
          </p>
        </div>

        {/* Centered search */}
        <div className="w-full max-w-[680px] mb-20">
          <SearchBar
            icon={<Icon name="search" size={18} />}
            placeholder="Enter a property address — e.g. 1428 Maplewood Drive, Asheville, NC"
            trailing={
              <Button variant="primary" onClick={() => history.push('/scan/start')}>
                Run scan
              </Button>
            }
          />
        </div>

        {/* Muted how-it-works */}
        <div className="w-full max-w-[920px] grid grid-cols-3 gap-x-12 opacity-60">
          {STEPS.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-[11px] uppercase tracking-widest text-ink-3 mb-2">
                {s.label}
              </div>
              <div className="font-serif text-xl font-normal text-ink-2 mb-1.5">
                {s.title}
              </div>
              <p className="text-[13px] text-ink-3 leading-relaxed m-0">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
