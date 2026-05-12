/* global React, ReactRouterDOM, Screen, SpecSection, MockAppStateProvider,
   TableSkeleton, ScreenEmpty, ScreenError,
   HomeScreen, HistoryScreen, ScheduledScreen, ScheduleDetailScreen */

const { Route } = ReactRouterDOM;

// ScheduleDetailScreen calls useParams<{id}>(), which only returns a value
// when the component is rendered inside a matching <Route>. Wrap it.
function ScheduleDetailFrame() {
  return (
    <Route path="/scheduled/:id">
      <ScheduleDetailScreen />
    </Route>
  );
}
// States spec — every data-bearing screen × empty / loading / error.
// Mounts the same production pages from src/pages, wrapped in a
// MockAppStateProvider that injects controlled values. The skeleton +
// empty + error renderings come from the real components — so this
// canvas stays honest as the live app evolves.

// Single seed used by the "Populated" reference frames so the variants
// read against a real data shape, not a fixture stub.
const SAMPLE_HISTORY: any[] = [
  { id: 'p1', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high',   platforms: 3, scannedAgo: '8 min ago' },
  { id: 'p2', kind: 'single', address: '212 Westbrook Lane, Asheville, NC 28805',   scenario: 'medium', platforms: 2, scannedAgo: '24 min ago' },
  { id: 'p3', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high',   platforms: 3, scannedAgo: '3 h ago' },
  { id: 'p4', kind: 'single', address: '502 N Liberty St, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '4 h ago' },
];

const SAMPLE_SCHEDULES: any[] = [
  { id: 'sp1', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high', cadenceMonths: 6,  nextRunLabel: 'Nov 12, 2026', createdAgo: '8 min ago', runHistoryIds: ['p1'] },
  { id: 'sp2', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24,         cadenceMonths: 3, nextRunLabel: 'Aug 12, 2026', createdAgo: '2 h ago',   runHistoryIds: [] },
];

function StatesSpecApp() {
  return (
    <div className="spec-canvas">
      <nav className="nav-anchor">
        <span className="brand">True Occupancy · states spec</span>
        <a href="#section-01">Dashboard</a>
        <a href="#section-02">History</a>
        <a href="#section-03">Scheduled</a>
        <a href="#section-04">Schedule Detail</a>
        <a href="#section-05">Reusables</a>
      </nav>

      <header className="spec-header">
        <div className="eyebrow">Halcyon · True Occupancy</div>
        <h1>States <em>spec</em></h1>
        <p>
          Empty, loading, and error variants for every data-bearing screen.
          Each frame mounts the real production page wrapped in a{' '}
          <code>MockAppStateProvider</code> with controlled values — what
          you see here is exactly what users will see once a backend
          drives the same flags. Add a new state by adding a new{' '}
          <code>&lt;Screen&gt;</code> below.
        </p>
      </header>

      {/* ============================================================== */}
      <SpecSection num="01" title="Dashboard" desc="Recent scans panel — empty, loading, and error variants of the same table.">
        <Screen label="01.1" title="Populated" initialPath="/" desc="Reference state: a handful of recent scans across single + batch.">
          <MockAppStateProvider value={{ history: SAMPLE_HISTORY, schedules: SAMPLE_SCHEDULES }}>
            <HomeScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="01.2" title="Empty · brand-new user" initialPath="/" desc="No history at all. Recent Scans renders a ScreenEmpty block with a CTA, not the table.">
          <MockAppStateProvider value={{ history: [], schedules: [] }}>
            <HomeScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="01.3" title="Loading" initialPath="/" desc="Skeleton rows in the Recent Scans table while the initial fetch is in flight.">
          <MockAppStateProvider value={{ history: [], schedules: [], loading: true }}>
            <HomeScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="01.4" title="Error" initialPath="/" desc="Recent scans fetch failed. ScreenError takes the table's place.">
          <MockAppStateProvider value={{ history: [], schedules: [], error: "We couldn't reach the scan service. Check your connection and try again." }}>
            <HomeScreen />
          </MockAppStateProvider>
        </Screen>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="02" title="History" desc="Single + Batch tabs, filterable. Empty / loading / error replace the table entirely.">
        <Screen label="02.1" title="Populated" initialPath="/history">
          <MockAppStateProvider value={{ history: SAMPLE_HISTORY, schedules: SAMPLE_SCHEDULES }}>
            <HistoryScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="02.2" title="Empty · no scans ever" initialPath="/history" desc="Distinct from the existing filter-zero message — this is the brand-new-account state.">
          <MockAppStateProvider value={{ history: [], schedules: [] }}>
            <HistoryScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="02.3" title="Loading" initialPath="/history">
          <MockAppStateProvider value={{ history: [], schedules: [], loading: true }}>
            <HistoryScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="02.4" title="Error" initialPath="/history">
          <MockAppStateProvider value={{ history: [], schedules: [], error: 'Request timed out after 30 seconds.' }}>
            <HistoryScreen />
          </MockAppStateProvider>
        </Screen>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="03" title="Scheduled" desc="Recurring automations.">
        <Screen label="03.1" title="Populated" initialPath="/scheduled">
          <MockAppStateProvider value={{ history: SAMPLE_HISTORY, schedules: SAMPLE_SCHEDULES }}>
            <ScheduledScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="03.2" title="Empty · no schedules" initialPath="/scheduled">
          <MockAppStateProvider value={{ history: [], schedules: [] }}>
            <ScheduledScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="03.3" title="Loading" initialPath="/scheduled">
          <MockAppStateProvider value={{ history: [], schedules: [], loading: true }}>
            <ScheduledScreen />
          </MockAppStateProvider>
        </Screen>
        <Screen label="03.4" title="Error" initialPath="/scheduled">
          <MockAppStateProvider value={{ history: [], schedules: [], error: 'Failed to load automations.' }}>
            <ScheduledScreen />
          </MockAppStateProvider>
        </Screen>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="04" title="Schedule Detail" desc="Per-automation view. Empty state = a newly-created automation with no runs yet.">
        <Screen label="04.1" title="Populated · 1 prior run" initialPath="/scheduled/sp1">
          <MockAppStateProvider value={{ history: SAMPLE_HISTORY, schedules: SAMPLE_SCHEDULES }}>
            <ScheduleDetailFrame />
          </MockAppStateProvider>
        </Screen>
        <Screen label="04.2" title="Empty · no runs yet" initialPath="/scheduled/sp2" desc="Fresh automation, hasn't run yet. Header reads correctly; run history table shows its filter-zero message.">
          <MockAppStateProvider value={{ history: [], schedules: SAMPLE_SCHEDULES }}>
            <ScheduleDetailFrame />
          </MockAppStateProvider>
        </Screen>
        <Screen label="04.3" title="Loading" initialPath="/scheduled/sp1" desc="Header and run-history table both swap for skeleton placeholders while data loads.">
          <MockAppStateProvider value={{ history: [], schedules: [], loading: true }}>
            <ScheduleDetailFrame />
          </MockAppStateProvider>
        </Screen>
        <Screen label="04.4" title="Error" initialPath="/scheduled/sp1">
          <MockAppStateProvider value={{ history: [], schedules: [], error: 'Schedule not found or fetch failed.' }}>
            <ScheduleDetailFrame />
          </MockAppStateProvider>
        </Screen>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="05" title="Reusables" desc="The three new building blocks the variants above are composed from. Each renders at 1× so designers can grab them directly.">
        <ReusableFrame label="05.1" title="TableSkeleton" desc="Drop-in for DataTable while data is loading. Same grid as the real rows so layout doesn't jump on data arrival.">
          <div className="bg-surface border border-line rounded-lg overflow-hidden">
            <TableSkeleton
              columns={[
                { key: 'a', width: '160px' },
                { key: 'b', width: '1fr' },
                { key: 'c', width: '120px', align: 'right' },
              ]}
              count={5}
            />
          </div>
        </ReusableFrame>
        <ReusableFrame label="05.2" title="ScreenEmpty" desc="Brand-new account / never-had-any state. Use only when there's literally no data — DataTable.empty stays for filter-zero.">
          <ScreenEmpty
            icon="history"
            title="No scans yet"
            message="Your scans and batch runs will appear here once you've run them."
            actionLabel="Scan a property"
            onAction={() => {}}
          />
        </ReusableFrame>
        <ReusableFrame label="05.3" title="ScreenError" desc="Fetch failed. Centered, error-soft palette, primary Retry CTA.">
          <ScreenError
            title="Couldn't load your scans"
            message="Request timed out after 30 seconds."
            onRetry={() => {}}
            onBack={() => {}}
          />
        </ReusableFrame>
      </SpecSection>
    </div>
  );
}

function ReusableFrame({
  label, title, desc, children,
}: { label: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="screen-wrap" style={{ width: 560 }}>
      <div className="screen-meta">
        <span className="label">{label}</span>
        <h3>{title}</h3>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div className="screen-frame" style={{ padding: 32, background: 'var(--surface)' }}>
        {children}
      </div>
    </div>
  );
}
