/* global React, ReactRouterDOM, Screen, SpecSection, MockAppStateProvider,
   TableSkeleton, ScreenEmpty, ScreenError, AIInvestigator, AICtaButton, AI_INVESTIGATIONS,
   HomeScreen, HistoryScreen, ScheduledScreen, ScheduleDetailScreen,
   NotificationDock */

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
        <a href="#section-05">AI Investigator</a>
        <a href="#section-06">Reusables</a>
        <a href="#section-07">Notification Dock</a>
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
      <SpecSection num="05" title="AI Investigator" desc="Independent AI second-opinion module that lives between ConfidenceHero and ListingsPanel on the three result pages. Idle → loading → success / error.">
        <ReusableFrame label="05.1" title="Idle · CTA (lives in ScanContextBar)" desc="The CTA is mounted next to Download PDF in the top-right of the result page header — not inline in the page body. Body component renders null when idle.">
          <div className="flex items-center justify-center gap-3 py-6" style={{ background: 'var(--surface-2)' }}>
            <AICtaButton scenario="high" size="sm" />
          </div>
        </ReusableFrame>
        <ReusableFrame label="05.2" title="Loading · step 1" desc="Spinner on the first step; second step pending. aria-live polite announces transitions.">
          <AIInvestigator scenario="high" forcedStatus="loading-step-1" />
        </ReusableFrame>
        <ReusableFrame label="05.3" title="Loading · step 2" desc="Step 1 marked done, spinner on step 2. Total perceived run ~3s in the prototype.">
          <AIInvestigator scenario="high" forcedStatus="loading-step-2" />
        </ReusableFrame>
        <ReusableFrame label="05.4" title="Success · AI agrees (high)" desc="High-confidence Red Flag scenario where AI confirms the rule-based call. Alignment row reads positive (clean-soft).">
          <AIInvestigator scenario="high" forcedStatus="success" forcedResult={AI_INVESTIGATIONS.high} />
        </ReusableFrame>
        <ReusableFrame label="05.5" title="Success · AI disagrees (medium)" desc="The demo highlight: rule-based said Questionable, AI escalates to Red Flag. Alignment row reads warn-soft and names both verdicts.">
          <AIInvestigator scenario="medium" forcedStatus="success" forcedResult={AI_INVESTIGATIONS.medium} />
        </ReusableFrame>
        <ReusableFrame label="05.6" title="Success · AI agrees (clean)" desc="Both engines say Clean — confirms a benign address with no caveat.">
          <AIInvestigator scenario="low" forcedStatus="success" forcedResult={AI_INVESTIGATIONS.low} />
        </ReusableFrame>
        <ReusableFrame label="05.7" title="Error" desc="Network or upstream failure during the investigation. Soft-red surface with a Try again button — module retries without leaving the result page.">
          <AIInvestigator scenario="high" forcedStatus="error" forcedError="network error" />
        </ReusableFrame>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection num="06" title="Reusables" desc="The three new building blocks the variants above are composed from. Each renders at 1× so designers can grab them directly.">
        <ReusableFrame label="06.1" title="TableSkeleton" desc="Drop-in for DataTable while data is loading. Same grid as the real rows so layout doesn't jump on data arrival.">
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
        <ReusableFrame label="06.2" title="ScreenEmpty" desc="Brand-new account / never-had-any state. Use only when there's literally no data — DataTable.empty stays for filter-zero.">
          <ScreenEmpty
            icon="history"
            title="No scans yet"
            message="Your scans and batch runs will appear here once you've run them."
            actionLabel="Scan a property"
            onAction={() => {}}
          />
        </ReusableFrame>
        <ReusableFrame label="06.3" title="ScreenError" desc="Fetch failed. Centered, error-soft palette, primary Retry CTA.">
          <ScreenError
            title="Couldn't load your scans"
            message="Request timed out after 30 seconds."
            onRetry={() => {}}
            onBack={() => {}}
          />
        </ReusableFrame>
      </SpecSection>

      {/* ============================================================== */}
      <SpecSection
        num="07"
        title="Notification Dock"
        desc="Single morphing surface that owns every long-running task — replaces inline BatchHugCard + AIInvestigator loading states. Pinned top-center, out of page layout, dismissible. iOS Dynamic-Island vibe: a compact pill when one task runs, an accordion stack when more than one is queued."
      >
        <DockFrame label="07.1" title="Empty / hidden" desc="No active tasks. The dock takes zero layout — page content sits exactly where it would without notifications.">
          <NotificationDock notifications={[]} contained />
        </DockFrame>

        <DockFrame label="07.2" title="Single · Batch scanning" desc="Collapsed pill, brand spinner, 4 / 12 mono counter, 2px gradient rail along the bottom edge.">
          <NotificationDock
            contained
            notifications={[{
              id: 'b1', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockFrame>

        <DockFrame label="07.3" title="Single · Batch completed" desc="Green check with a 6-second countdown ring (paused at ~50%). Auto-dismisses on success; errors persist.">
          <NotificationDock
            contained
            forcedExpanded={false}
            notifications={[{
              id: 'b2', kind: 'batch', status: 'completed',
              title: 'Batch · 2025-Q1 STRs',
              meta: '12 / 12 scanned',
              startedAt: Date.now() - 60_000,
              finishedAt: Date.now() - 3_000,
              autoDismissAt: Date.now() + 3_000,
              _countdown: 0.5,
              primaryAction: { label: 'View results' },
            } as any]}
          />
        </DockFrame>

        <DockFrame label="07.4" title="Single · Batch completed with errors" desc="Amber accent. Shown expanded so the partial counts and both actions read at a glance.">
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'b3', kind: 'batch', status: 'completed-errors',
              title: 'Batch · 2025-Q1 STRs',
              meta: '9 / 12 scanned · 3 failed',
              failed: 3,
              startedAt: Date.now() - 120_000,
              finishedAt: Date.now() - 4_000,
              primaryAction: { label: 'View results' },
              secondaryAction: { label: 'Retry failed' },
            }]}
          />
        </DockFrame>

        <DockFrame label="07.5" title="Single · Batch error" desc="Clay-red. Persists until the user acts. Retry / partial-results actions live in the expanded view.">
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'b4', kind: 'batch', status: 'error',
              title: 'Batch · 2025-Q1 STRs',
              meta: 'Stopped at row 7 of 12',
              startedAt: Date.now() - 90_000,
              finishedAt: Date.now() - 2_000,
              primaryAction: { label: 'Retry batch' },
              secondaryAction: { label: 'View partial' },
            }]}
          />
        </DockFrame>

        <DockFrame label="07.6" title="Single · AI Investigator · step 1 of 2" desc="Two-segment shimmer rail with the first segment active. Replaces the full-width AIInvestigator LoadingCard inline in the page.">
          <NotificationDock
            contained
            notifications={[{
              id: 'ai1', kind: 'ai-investigator', status: 'running',
              title: 'AI investigation',
              meta: 'Retrieving listings',
              progress: { kind: 'step', step: 1, of: 2 },
              startedAt: Date.now() - 1_200,
            }]}
          />
        </DockFrame>

        <DockFrame label="07.7" title="Single · AI Investigator · step 2 of 2" desc="First segment filled, second segment shimmering. Total perceived run ~3s, same as the original inline loader.">
          <NotificationDock
            contained
            notifications={[{
              id: 'ai2', kind: 'ai-investigator', status: 'running',
              title: 'AI investigation',
              meta: 'Cross-checking signals',
              progress: { kind: 'step', step: 2, of: 2 },
              startedAt: Date.now() - 2_400,
            }]}
          />
        </DockFrame>

        <DockFrame label="07.8" title="Single · AI Investigator · error" desc="Network / upstream failure. Stays visible; one tap to retry without leaving the result page.">
          <NotificationDock
            contained
            forcedExpanded
            notifications={[{
              id: 'ai3', kind: 'ai-investigator', status: 'error',
              title: 'AI investigation',
              meta: 'Network error · request timed out',
              startedAt: Date.now() - 8_000,
              finishedAt: Date.now() - 200,
              primaryAction: { label: 'Retry investigation' },
            }]}
          />
        </DockFrame>

        <DockFrame label="07.9" title="Multiple · 2 tasks · collapsed" desc="Aggregate chip shows the count + stacked-dots glyph + chevron — the affordance to expand.">
          <NotificationDock
            contained
            notifications={[
              { id: 'b5', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                progress: { kind: 'count', done: 7, total: 24 },
                startedAt: Date.now() - 40_000 },
              { id: 'ai4', kind: 'ai-investigator', status: 'running',
                title: 'AI investigation',
                progress: { kind: 'step', step: 1, of: 2 },
                startedAt: Date.now() - 1_500 },
            ]}
          />
        </DockFrame>

        <DockFrame label="07.10" title="Multiple · 2 tasks · expanded" desc="Accordion shell. Header summarises 'N running · N done · N failed'; each row carries its own title, meta, progress, actions.">
          <NotificationDock
            contained
            forcedExpanded
            notifications={[
              { id: 'b6', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                meta: '7 / 24 scanned',
                progress: { kind: 'count', done: 7, total: 24 },
                startedAt: Date.now() - 40_000 },
              { id: 'ai5', kind: 'ai-investigator', status: 'running',
                title: 'AI investigation',
                meta: 'Cross-checking signals · Step 2 of 2',
                progress: { kind: 'step', step: 2, of: 2 },
                startedAt: Date.now() - 2_400 },
            ]}
          />
        </DockFrame>

        <DockFrame label="07.11" title="Multiple · 3 tasks · mixed states" desc="One running, one done (with View results), one errored (with Retry). Demonstrates how the dock coordinates several concurrent jobs without page chrome stacking up.">
          <NotificationDock
            contained
            forcedExpanded
            notifications={[
              { id: 'b7', kind: 'batch', status: 'running',
                title: 'Batch · 2025-Q1 STRs',
                meta: '11 / 24 scanned',
                progress: { kind: 'count', done: 11, total: 24 },
                startedAt: Date.now() - 55_000 },
              { id: 'ai6', kind: 'ai-investigator', status: 'completed',
                title: 'AI investigation',
                meta: '1428 Maplewood Drive · AI confirms verdict',
                startedAt: Date.now() - 8_000,
                finishedAt: Date.now() - 1_000,
                primaryAction: { label: 'View result' } },
              { id: 'b8', kind: 'batch', status: 'error',
                title: 'Batch · feb-export.csv',
                meta: 'Stopped at row 3 of 18',
                startedAt: Date.now() - 30_000,
                finishedAt: Date.now() - 500,
                primaryAction: { label: 'Retry batch' },
                secondaryAction: { label: 'View partial' } },
            ]}
          />
        </DockFrame>

        <DockFrame label="07.12" title="Interaction · hover (collapsed)" desc="Scale-up 1.02 plus a slightly larger shadow. The pill grows toward the user without crowding the page.">
          <NotificationDock
            contained
            forceHover
            notifications={[{
              id: 'b9', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockFrame>

        <DockFrame label="07.13" title="Interaction · keyboard focus" desc="White focus ring at 2px / 60% alpha. Esc collapses · Enter / Space expands · arrow keys traverse rows once expanded.">
          <NotificationDock
            contained
            forceFocused
            notifications={[{
              id: 'b10', kind: 'batch', status: 'running',
              title: 'Batch · 2025-Q1 STRs',
              progress: { kind: 'count', done: 4, total: 12 },
              startedAt: Date.now() - 30_000,
            }]}
          />
        </DockFrame>
      </SpecSection>
    </div>
  );
}

// DockFrame — staged tile for Section 07 frames. Renders a dimmed faux
// page snippet so the floating dock reads in context (rather than against
// raw spec-canvas background). Sized to match the visual density of
// Section 05's ReusableFrame tiles.
function DockFrame({
  label, title, desc, children,
}: { label: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="screen-wrap" style={{ width: 560 }}>
      <div className="screen-meta">
        <span className="label">{label}</span>
        <h3>{title}</h3>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div
        className="screen-frame"
        style={{
          position: 'relative',
          height: 240,
          background:
            'linear-gradient(180deg, var(--bg) 0%, #ECEEF2 60%, #E4E7EC 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Dimmed page snippet — proves the dock floats above content
            without pushing layout. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            padding: '78px 32px 20px',
            opacity: 0.5,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div style={{ width: 92, height: 12, borderRadius: 4, background: 'var(--line-strong)' }} />
            <div style={{ width: 44, height: 8, borderRadius: 4, background: 'var(--line)' }} />
          </div>
          <div
            style={{
              height: 96,
              borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ width: '60%', height: 10, borderRadius: 4, background: 'var(--line-strong)' }} />
            <div style={{ width: '40%', height: 8, borderRadius: 4, background: 'var(--line)' }} />
            <div style={{ width: '85%', height: 8, borderRadius: 4, background: 'var(--line)' }} />
          </div>
        </div>
        {/* Dock sits on top */}
        {children}
      </div>
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
