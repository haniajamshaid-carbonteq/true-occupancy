/* global React, Screen, SpecSection, AppShell, Card, MockAppStateProvider,
   ScanConfigScreen, RedAddressesScreen, RedPropertyPanel, ServedStamp,
   DEFAULT_OCC_CONFIG */

// Occupancy spec — every state of the intended-occupancy work in one page.
//
// These frames mount the REAL components from src/pages and src/components,
// driven only by props. Nothing here is a fixture copy of the UI, so the
// canvas stays honest as the components change.

const RED_ROWS: any[] = [
  {
    id: 'r1',
    address: '412 Cumberland Ave, Asheville, NC 28801',
    intent: 'owner-occupied',
    verdict: 'rented',
    confidence: 81,
    servedAt: '2026-07-29T16:02:00',
    source: 'Automation · Asheville Q2',
    recurring: 'monthly',
  },
  {
    id: 'r2',
    address: '7 Beaucatcher Rd, Asheville, NC 28805',
    intent: 'second-home',
    verdict: 'rented',
    confidence: 88,
    servedAt: '2026-07-25T09:40:00',
    source: 'Batch · asheville-q2-2026.csv',
    recurring: 'monthly',
  },
  {
    id: 'r3',
    address: '153 Merrimon Ave, Asheville, NC 28804',
    intent: 'owner-occupied',
    verdict: 'rented',
    confidence: 74,
    servedAt: '2026-07-20T11:15:00',
    source: 'Single scan',
    recurring: 'monthly',
    scansStopped: true,
  },
];

/** Pages mount their own AppShell (the convention in src/pages), and AppShell
 *  mounts the notification dock, which reads useAppState(). So frames supply
 *  an inert mock store and nothing else — wrapping in AppShell here would
 *  nest two shells. */
function Shell({ children }: { children?: React.ReactNode }) {
  return (
    <MockAppStateProvider value={{ history: [], schedules: [], liveBatch: null }}>
      {children}
    </MockAppStateProvider>
  );
}

// Drawer frames render RedPropertyPanel, not RedPropertyDrawer: Drawer
// portals to document.body, so inside a scaled spec frame it would escape
// and stack over the whole canvas. Both share one content implementation,
// so what you review here is what the drawer shows.
function DrawerFrame({ mode }: { mode: string }) {
  const [m, setM] = React.useState(mode);
  React.useEffect(() => setM(mode), [mode]);
  return (
    <Shell>
      <AppShell>
        <div className="mt-section pb-section flex justify-center">
          <RedPropertyPanel
            property={RED_ROWS[0]}
            mode={m as any}
            onModeChange={(next: string) => setM(next)}
          />
        </div>
      </AppShell>
    </Shell>
  );
}

function StampFrame() {
  return (
    <Shell>
      <AppShell>
      <div className="mt-section flex flex-col gap-stack-md pb-section">
        <h1 className="font-sans text-h2 font-semibold" style={{ color: 'var(--navy)' }}>
          Report timestamps
        </h1>
        <Card padded>
          <p className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--ink-3)' }}>
            Within the freshness threshold
          </p>
          <ServedStamp servedAt="2026-07-31T14:45:00" />
        </Card>
        <Card padded>
          <p className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-2" style={{ color: 'var(--ink-3)' }}>
            Past the organisation&rsquo;s freshness threshold
          </p>
          <ServedStamp servedAt="2026-06-12T10:00:00" />
        </Card>
      </div>
      </AppShell>
    </Shell>
  );
}

function OccupancySpecApp() {
  return (
    <div className="spec-canvas">
      <nav className="nav-anchor">
        <span className="brand">True Occupancy · occupancy spec</span>
        <a href="#section-01">Scan configuration</a>
        <a href="#section-02">Red addresses</a>
        <a href="#section-03">Red property drawer</a>
        <a href="#section-04">Timestamps</a>
      </nav>

      <header className="spec-header">
        <div className="eyebrow">Halcyon · True Occupancy</div>
        <h1>
          Intended occupancy <em>spec</em>
        </h1>
        <p>
          Every state of the configurable occupancy work, in one page. Frames mount the real
          components from <code>src/pages</code> and <code>src/components</code>, driven only by
          props — so this canvas stays honest as the components change. Both screens are now
          reachable in the app itself, via <code>Red addresses</code> and{' '}
          <code>Configuration</code> in the side nav.
        </p>
      </header>

      <SpecSection
        num="01"
        title="Scan configuration"
        desc="The org-level admin surface. Universal default, thresholds, outcome matrix, recurring scans and freshness. Investigation depth (cost/quality) is deferred to next week — the field stays on the config model, only the control is out."
      >
        <Screen
          label="01.1"
          title="Default"
          initialPath="/settings/scan"
          height={1640}
          desc="Shipped defaults. Owner-occupied assumed, 30/70 bands, red-only recurring."
        >
          <Shell>
            <ScanConfigScreen />
          </Shell>
        </Screen>

        <Screen
          label="01.2"
          title="Matrix expanded"
          initialPath="/settings/scan"
          height={1840}
          desc="A category opened for editing. Each verdict becomes a ChipRow, because a grid of value pickers would need a select — a logged gap in the system."
        >
          <Shell>
            <ScanConfigScreen defaultOpenIntent="rental" />
          </Shell>
        </Screen>

        <Screen
          label="01.3"
          title="Unsaved changes · impact preview"
          initialPath="/settings/scan"
          height={1760}
          desc="Nobody should edit a threshold blind. The footer names how many properties would be reclassified, and that issued reports keep their original scoring."
        >
          <Shell>
            <ScanConfigScreen forceDirty impactCount={34} />
          </Shell>
        </Screen>

        <Screen
          label="01.4"
          title="Invalid thresholds"
          initialPath="/settings/scan"
          height={1790}
          desc="Bands crossed. Inline error next to the fields, save disabled — validation never goes to the dock or a toast."
        >
          <Shell>
            <ScanConfigScreen seedInvalid forceDirty />
          </Shell>
        </Screen>

        <Screen
          label="01.5"
          title="No access"
          initialPath="/settings/scan"
          height={720}
          desc="Required by the page-class state floor. A member hitting the admin route."
        >
          <Shell>
            <ScanConfigScreen canEdit={false} />
          </Shell>
        </Screen>
      </SpecSection>

      <SpecSection
        num="02"
        title="Red addresses"
        desc="Properties whose scan contradicts what was declared. Populated, both empties, loading and error."
      >
        <Screen
          label="02.1"
          title="Populated"
          initialPath="/red-addresses"
          height={780}
          desc="Every row is red by definition, so the table spends its width on declared-vs-found rather than a colour column."
        >
          <Shell>
            <RedAddressesScreen rows={RED_ROWS} />
          </Shell>
        </Screen>

        <Screen
          label="02.2"
          title="Empty · first use"
          initialPath="/red-addresses"
          height={760}
          desc="Reads as reassurance, not absence. Nothing has gone wrong."
        >
          <Shell>
            <RedAddressesScreen rows={[]} />
          </Shell>
        </Screen>

        <Screen
          label="02.3"
          title="Empty · no results"
          initialPath="/red-addresses"
          height={740}
          desc="Neutral and factual, with the means to widen the search. A different message from first-use, per the voice rules."
        >
          <Shell>
            <RedAddressesScreen rows={[]} filtered />
          </Shell>
        </Screen>

        <Screen
          label="02.4"
          title="Loading"
          initialPath="/red-addresses"
          height={920}
          desc="Skeleton rows from the shared DataTable, not a spinner over content."
        >
          <Shell>
            <RedAddressesScreen rows={[]} loading />
          </Shell>
        </Screen>

        <Screen
          label="02.5"
          title="Error"
          initialPath="/red-addresses"
          height={740}
          desc="Names the cause and reassures that nothing changed on the properties themselves."
        >
          <Shell>
            <RedAddressesScreen rows={[]} error />
          </Shell>
        </Screen>
      </SpecSection>

      <SpecSection
        num="03"
        title="Red property drawer"
        desc="One action: stop the recurring scan. The property stays red — an operator can't dismiss a red finding, only stop re-checking it."
      >
        <Screen
          label="03.1"
          title="Detail"
          initialPath="/red-addresses"
          height={780}
          desc="The contradiction leads, with the single action stated by its consequence, not just its name."
        >
          <DrawerFrame mode="detail" />
        </Screen>

        <Screen
          label="03.2"
          title="Stop recurring scans"
          initialPath="/red-addresses"
          height={740}
          desc="The finding stands; only the scanning stops. Reason required."
        >
          <DrawerFrame mode="stop" />
        </Screen>

        <Screen
          label="03.3"
          title="Confirmed"
          initialPath="/red-addresses"
          height={700}
          desc="Property stays on the red list; it just won't be re-scanned automatically."
        >
          <DrawerFrame mode="done-stop" />
        </Screen>
      </SpecSection>

      <SpecSection
        num="04"
        title="Report timestamps"
        desc="One canonical line — 'first served to your organization' — with absolute date/time + relative age. No generated/cached/cross-org wording. Past the threshold, a warning + Run New Report."
      >
        <Screen
          label="04.1"
          title="Both states"
          initialPath="/result/high"
          height={560}
          desc="Within threshold (just the served line) and past threshold (adds the warning + Run New Report). Same pattern on scan results and AI reports."
        >
          <StampFrame />
        </Screen>
      </SpecSection>
    </div>
  );
}
