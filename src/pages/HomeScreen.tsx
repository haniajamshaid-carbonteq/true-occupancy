/* global React, AppShell, Button, Icon, SearchBar, CommandSearch, Pill, DataTable, MetricCard, Tabs, Card, ReactRouterDOM, SCENARIOS, useAppState */
// Home — product-first dashboard. The user lands directly on the working
// scanner with real evidence visible (KPI strip, recent scans, flagged for
// review, methodology note). Marketing-landing surfaces (photo hero,
// "How it works" cards, mission quote, sample-result section, four-column
// gradient footer) live in the prior commit history if needed for /about.
//
// Scenario routing is keyed off the ZIP for the demo:
//   28804 -> low      (Not rented · High confidence)
//   28805 -> medium   (Possibly rented · Medium confidence)
//   28806 -> high     (Rented · High confidence)
//   anything else -> low (safe default)

const { useHistory } = ReactRouterDOM;

const ZIP_TO_SCENARIO: Record<string, 'low' | 'medium' | 'high'> = {
  '28804': 'low',
  '28805': 'medium',
  '28806': 'high',
};

function pickScenario(input: string): 'low' | 'medium' | 'high' {
  const zip = (input.match(/\b(\d{5})(?:-\d{4})?\b/) || [])[1];
  if (zip && ZIP_TO_SCENARIO[zip]) return ZIP_TO_SCENARIO[zip];
  return 'low';
}

// --- demo data (believable, not aspirational) -----------------------------

const KPIS: { label: string; value: string; delta?: { dir: 'up' | 'down'; pct: string }; hint: string }[] = [
  { label: 'Scanned today',     value: '34',  delta: { dir: 'up',   pct: '+12%' }, hint: 'vs. yesterday' },
  { label: 'Flagged this week', value: '11',  delta: { dir: 'up',   pct: '+3' },   hint: 'vs. last week' },
  { label: 'Verified clean',    value: '187', delta: { dir: 'up',   pct: '+22' },  hint: 'past 30 days' },
  { label: 'Avg confidence',    value: '92',  delta: { dir: 'down', pct: '-1pt' }, hint: 'vs. 30 d avg' },
];

interface RecentScan {
  id: string;
  address: string;
  scenario: 'low' | 'medium' | 'high';
  platforms: number;
  scannedAgo: string;
}

const RECENT_SCANS: RecentScan[] = [
  { id: 'r1', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAgo: '8 min ago'  },
  { id: 'r2', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAgo: '24 min ago' },
  { id: 'r3', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAgo: '1 h ago'    },
  { id: 'r4', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAgo: '2 h ago'    },
  { id: 'r5', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '3 h ago'    },
  { id: 'r6', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAgo: '4 h ago'    },
];

const FLAGGED_FOR_REVIEW = RECENT_SCANS.filter((r) => r.scenario === 'high').slice(0, 3);

const VERDICT_VARIANT: Record<'low' | 'medium' | 'high', 'clean' | 'warn' | 'risk'> = {
  low: 'clean',
  medium: 'warn',
  high: 'risk',
};

// Descriptive verdicts only — same finding can be positive or negative
// for the lender depending on what they're verifying. Color (via
// VERDICT_VARIANT) still differentiates, but the language stays neutral.
const HOME_VERDICT_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Not rented',
  medium: 'Possibly rented',
  high: 'Rented',
};

const SAMPLE_CHIPS: { zip: string; label: string }[] = [
  { zip: '28804', label: 'Not rented' },
  { zip: '28805', label: 'Possibly rented' },
  { zip: '28806', label: 'Rented' },
];

// --- subcomponents --------------------------------------------------------

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
      style={{ color: 'var(--ink-3)' }}
    >
      {children}
    </div>
  );
}

// KPI tiles route through the shared MetricCard primitive so any other
// metric-style card in the product (Batch summary, Property specs, etc.)
// stays in lockstep on padding, type ramp, and footer rhythm. The leading
// "Scanned today" tile is promoted to primary — it's the headline number
// every investigator opens the dashboard for.
function KpiTile({
  kpi,
  primary,
  index,
}: {
  kpi: typeof KPIS[number];
  primary?: boolean;
  index: number;
}) {
  return (
    <div
      className="card-rise"
      style={{ ['--rise-delay' as any]: `${index * 60}ms` }}
    >
      <MetricCard
        primary={primary}
        label={kpi.label}
        value={kpi.value}
      />
    </div>
  );
}

// Mini horizontal score bar — fills brand or risk depending on band.
function ScoreBar({ score, risk }: { score: number; risk: 'clean' | 'warn' | 'risk' }) {
  const fill =
    risk === 'risk' ? 'var(--risk)' : risk === 'warn' ? 'var(--warn)' : 'var(--brand)';
  return (
    <div className="relative h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: fill }}
      />
    </div>
  );
}

// --- Scan table columns ---------------------------------------------------
// Shared between HomeScreen ("Recent scans") and HistoryScreen ("Scan
// history") so both surfaces stay in lockstep. Each column is a thin
// presentation function over a RecentScan row — one source of truth for
// cell typography, alignment, and hide-on-small-viewport behaviour.

const VERDICT_ACCENT: Record<'low' | 'medium' | 'high', string> = {
  low: 'var(--clean)',
  medium: 'var(--warn)',
  high: 'var(--risk)',
};

// Address strings look like "1428 Maplewood Drive, Asheville, NC 28804".
// First segment is the street, the rest is the locality — split so the
// street can carry the visual weight and the locality sits below in muted
// ink (Stripe / Linear list-row pattern).
function splitAddress(addr: string): [string, string] {
  const idx = addr.indexOf(', ');
  if (idx < 0) return [addr, ''];
  return [addr.slice(0, idx), addr.slice(idx + 2)];
}

function buildScanColumns<T extends { address: string; scenario: 'low' | 'medium' | 'high'; platforms: number; scannedAgo: string }>(): any[] {
  return [
    {
      key: 'address',
      label: 'Address',
      primary: true,
      cell: (row: T) => {
        const [street, locality] = splitAddress(row.address);
        return (
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {street}
            </div>
            {locality && (
              <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
                {locality}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'verdict',
      label: 'Verdict',
      width: '140px',
      hideBelow: 'sm' as const,
      cell: (row: T) => (
        <div
          className="inline-flex items-center gap-2 font-sans text-label leading-none whitespace-nowrap"
          style={{ color: 'var(--ink-2)' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: VERDICT_ACCENT[row.scenario] }}
            aria-hidden
          />
          {HOME_VERDICT_LABEL[row.scenario]}
        </div>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      width: '128px',
      hideBelow: 'sm' as const,
      cell: (row: T) => {
        const sc = SCENARIOS[row.scenario];
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono tabular-nums font-semibold text-label w-[24px] text-right leading-none"
              style={{ color: 'var(--navy)' }}
            >
              {sc.score}
            </span>
            <div className="flex-1 min-w-0">
              <ScoreBar score={sc.score} risk={VERDICT_VARIANT[row.scenario]} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'platforms',
      label: 'Platforms',
      width: '84px',
      align: 'right' as const,
      hideBelow: 'md' as const,
      cell: (row: T) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {row.platforms} / 3
        </span>
      ),
    },
    {
      key: 'scanned',
      label: 'Scanned',
      width: '100px',
      align: 'right' as const,
      hideBelow: 'md' as const,
      cell: (row: T) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {row.scannedAgo}
        </span>
      ),
    },
  ];
}

const SCAN_COLUMNS = buildScanColumns<RecentScan>();
const scanLeadingAccent = (row: { scenario: 'low' | 'medium' | 'high' }) =>
  VERDICT_ACCENT[row.scenario];

function FlaggedRow({ row, onOpen }: { row: RecentScan; onOpen: (row: RecentScan) => void }) {
  const sc = SCENARIOS[row.scenario];
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full flex items-center gap-3 px-4 py-3 border-t border-line first:border-t-0 hover:bg-hover-bg transition-colors text-left"
    >
      <span
        className="w-10 h-10 rounded-md grid place-items-center font-semibold text-label tabular-nums shrink-0"
        style={{ background: 'var(--risk-soft)', color: 'var(--risk-ink)' }}
      >
        {sc.score}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-label font-semibold truncate"
          style={{ color: 'var(--navy)' }}
        >
          {row.address}
        </span>
        <span className="block text-caption text-ink-3 truncate">
          {row.platforms} platforms · {row.scannedAgo}
        </span>
      </span>
      <svg
        viewBox="0 0 16 16"
        className="w-4 h-4 text-ink-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 4 4 4-4 4" />
      </svg>
    </button>
  );
}

// --- Live batch strip -----------------------------------------------------
// Sits between metric cards and the activity tabs when an in-flight batch
// exists in AppState. Compact, full-width strip carrying filename, live
// progress, status counts, and quick actions (Open + Automate).

type StripState = 'live' | 'complete' | 'partial' | 'allFailed';

// Visual config keyed by terminal state — keeps the render logic below
// declarative so adding a new state is a one-row addition rather than a
// fresh branch through the JSX.
const STATE_CONFIG: Record<
  StripState,
  {
    iconWrap: string;
    iconName: 'layers' | 'check' | 'alert' | 'x';
    iconSize: number;
  }
> = {
  live:      { iconWrap: 'bg-brand-soft text-brand',     iconName: 'layers', iconSize: 18 },
  complete:  { iconWrap: 'bg-clean-soft text-clean-ink', iconName: 'check',  iconSize: 20 },
  partial:   { iconWrap: 'bg-warn-soft text-warn-ink',   iconName: 'alert',  iconSize: 18 },
  allFailed: { iconWrap: 'bg-risk-soft text-risk-ink',   iconName: 'x',      iconSize: 18 },
};

function LiveBatchStrip() {
  const history = useHistory();
  const { liveBatch, dismissBatch } = useAppState();
  if (!liveBatch || liveBatch.dismissed) return null;

  const rows = liveBatch.rows;
  const total = rows.length;
  const done    = rows.filter((r: any) => r.status === 'done').length;
  const failed  = rows.filter((r: any) => r.status === 'failed').length;
  const settled = done + failed;
  const pct = Math.round((settled / total) * 100);

  const isRunning = liveBatch.status === 'running';
  const state: StripState =
    isRunning ? 'live'
    : failed === total ? 'allFailed'
    : failed > 0       ? 'partial'
    : 'complete';

  const cfg = STATE_CONFIG[state];
  const isComplete = !isRunning;

  const caption =
    state === 'live'      ? `${settled} of ${total} scanned`
    : state === 'complete' ? `${done} scanned`
    : state === 'partial' ? `${done} scanned · ${failed} failed`
    : `0 of ${total} scanned`;

  const headline =
    state === 'live'      ? 'Batch is being scanned'
    : state === 'complete' ? 'Batch scan complete'
    : state === 'partial' ? 'Batch scanned with errors'
    : 'Batch scan failed';

  function onAction() {
    if (state === 'allFailed') {
      // Send the user back to the upload screen to retry with a fresh CSV.
      dismissBatch();
      history.push('/batch');
      return;
    }
    if (isComplete) {
      dismissBatch();
      history.push('/history');
      return;
    }
    history.push('/batch');
  }
  const actionLabel =
    state === 'allFailed' ? 'Retry batch'
    : state === 'live'    ? 'Open batch'
    : 'View in History';

  return (
    <section className="mb-10 sm:mb-12">
      <Card padded={false} className="card-rise relative">
        {isComplete && (
          <button
            type="button"
            onClick={dismissBatch}
            aria-label="Dismiss batch"
            className="absolute top-2.5 right-2.5 z-10 w-8 h-8 grid place-items-center rounded-md text-ink-3 hover:bg-hover-bg hover:text-ink-2 transition-colors"
          >
            <Icon name="x" size={14} />
          </button>
        )}

        <div className={`px-5 sm:px-6 py-4 sm:py-5 ${isComplete ? 'pr-12 sm:pr-14' : ''}`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${cfg.iconWrap}`} aria-hidden>
              <Icon name={cfg.iconName} size={cfg.iconSize} />
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="font-sans font-semibold text-body sm:text-h4 leading-tight tracking-[-0.005em] truncate"
                style={{ color: 'var(--navy)' }}
              >
                {headline}
              </div>
            </div>

            <div className="shrink-0">
              <Button
                variant={state === 'live' ? 'ghost' : 'primary'}
                onClick={onAction}
                iconRight={
                  state === 'allFailed' ? (
                    <Icon name="replay" size={14} />
                  ) : (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m6 4 4 4-4 4" />
                    </svg>
                  )
                }
              >
                {actionLabel}
              </Button>
            </div>
          </div>

          {state === 'live' && (
            <div className="mt-4 h-1 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {state === 'allFailed' && (
            <div className="mt-4 px-3.5 py-3 rounded-md text-caption bg-risk-soft text-risk-ink leading-relaxed">
              None of the {total} addresses could be scanned. Check the CSV for formatting issues and try again.
            </div>
          )}

          {/* Filename + scan count form the bottom metadata line. Both
              render at caption emphasis so neither overpowers the headline
              (which carries the status semantics). */}
          <div className="mt-4 flex items-center flex-wrap gap-x-2 gap-y-1 font-sans text-caption text-ink-3 tabular-nums">
            <span className="truncate" title={liveBatch.filename}>{liveBatch.filename}</span>
            <span aria-hidden>·</span>
            <span>{caption}</span>
          </div>
        </div>
      </Card>
    </section>
  );
}

// --- Activity tabs (History | Schedule) -----------------------------------

function ActivityTabs() {
  const history = useHistory();
  const { history: histRows, schedules } = useAppState();
  const [tab, setTab] = React.useState<'history' | 'schedule'>('history');

  const histPreview = histRows.slice(0, 6);
  const schedulePreview = schedules.slice(0, 6);

  function openHistoryRow(row: any) {
    if (row.kind === 'batch') {
      history.push(`/batch/${row.id}`);
      return;
    }
    sessionStorage.setItem('scanScenario', row.scenario);
    sessionStorage.setItem('scanAddress', row.address);
    const path =
      row.scenario === 'low'  ? '/result/clean'
      : row.scenario === 'medium' ? '/result/medium'
      : '/result/high';
    history.push(path);
  }

  function openScheduleRow() {
    history.push('/scheduled');
  }

  return (
    <section className="mb-10 sm:mb-12">
      <Tabs
        value={tab}
        onChange={(v: any) => setTab(v)}
        items={[
          { value: 'history',  label: 'History',  count: histRows.length },
          { value: 'schedule', label: 'Scheduled', count: schedules.length },
        ]}
        rightSlot={
          <Button
            variant="ghost"
            onClick={() => history.push(tab === 'history' ? '/history' : '/scheduled')}
            iconRight={
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 4 4 4-4 4" />
              </svg>
            }
          >
            View all
          </Button>
        }
      />

      <div className="mt-4 card-rise" style={{ ['--rise-delay' as any]: '120ms' }}>
        {tab === 'history' ? (
          <DataTable
            columns={DASHBOARD_HISTORY_COLUMNS}
            rows={histPreview}
            rowKey={(r: any) => r.id}
            onRowClick={openHistoryRow}
          />
        ) : (
          <DataTable
            columns={DASHBOARD_SCHEDULE_COLUMNS}
            rows={schedulePreview}
            rowKey={(r: any) => r.id}
            onRowClick={openScheduleRow}
          />
        )}
      </div>
    </section>
  );
}

// Dashboard previews use compact columns — Type + Target + Verdict/Cadence
// + relative-time. Full detail (score bar, platforms) lives on the History
// page; the dashboard is at-a-glance.

const DASHBOARD_HISTORY_COLUMNS: any[] = [
  {
    key: 'type',
    label: 'Type',
    width: '88px',
    cell: (r: any) => <Pill>{r.kind === 'batch' ? 'Batch' : 'Single'}</Pill>,
  },
  {
    key: 'target',
    label: 'Address',
    primary: true,
    cell: (r: any) => {
      if (r.kind === 'batch') {
        return (
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {r.filename}
            </div>
            <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
              {r.total} properties · {r.flagged} flagged
            </div>
          </div>
        );
      }
      const [street, locality] = splitAddress(r.address);
      return (
        <div className="min-w-0">
          <div
            className="font-sans font-semibold text-body-sm leading-tight truncate"
            style={{ color: 'var(--navy)' }}
          >
            {street}
          </div>
          {locality && (
            <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
              {locality}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'verdict',
    label: 'Verdict',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      if (r.kind === 'batch') return <span className="font-mono text-caption text-ink-4">—</span>;
      const variant =
        r.scenario === 'high'  ? 'verdict-high'
        : r.scenario === 'medium' ? 'verdict-med'
        : 'verdict-low';
      return <Pill variant={variant as any}>{HOME_VERDICT_LABEL[r.scenario]}</Pill>;
    },
  },
  {
    key: 'scanned',
    label: 'Scanned',
    width: '100px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">{r.scannedAgo}</span>
    ),
  },
];

const DASHBOARD_SCHEDULE_COLUMNS: any[] = [
  {
    key: 'type',
    label: 'Type',
    width: '88px',
    cell: (r: any) => <Pill>{r.kind === 'batch' ? 'Batch' : 'Single'}</Pill>,
  },
  {
    key: 'target',
    label: 'Target',
    primary: true,
    cell: (r: any) => {
      if (r.kind === 'batch') {
        return (
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {r.filename}
            </div>
            <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
              {r.total} properties
            </div>
          </div>
        );
      }
      const [street, locality] = splitAddress(r.address);
      return (
        <div className="min-w-0">
          <div
            className="font-sans font-semibold text-body-sm leading-tight truncate"
            style={{ color: 'var(--navy)' }}
          >
            {street}
          </div>
          {locality && (
            <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
              {locality}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'cadence',
    label: 'Cadence',
    width: '140px',
    hideBelow: 'sm' as const,
    cell: (r: any) => (
      <span className="font-sans text-label text-ink-2 whitespace-nowrap">
        Every {r.cadenceMonths} months
      </span>
    ),
  },
  {
    key: 'next',
    label: 'Next run',
    width: '100px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">{r.nextRunLabel}</span>
    ),
  },
];

// --- the page -------------------------------------------------------------

function HomeScreen() {
  const history = useHistory();
  const [address, setAddress] = React.useState('');

  function startScan(addr?: string) {
    const value = addr ?? address;
    const scenario = pickScenario(value);
    sessionStorage.setItem('scanScenario', scenario);
    sessionStorage.setItem(
      'scanAddress',
      value || '1428 Maplewood Drive, Asheville, NC 28804'
    );
    history.push('/scan/start');
  }

  function openResult(row: RecentScan) {
    sessionStorage.setItem('scanScenario', row.scenario);
    sessionStorage.setItem('scanAddress', row.address);
    const path =
      row.scenario === 'low'
        ? '/result/clean'
        : row.scenario === 'medium'
        ? '/result/medium'
        : '/result/high';
    history.push(path);
  }

  return (
    <AppShell>
      {/* Page header — eyebrow + H1 + sync status */}
      <header className="flex items-end justify-between gap-6 mb-8 pb-5 border-b border-line">
        <div>
          <h1
            className="font-sans font-semibold leading-[1.1] tracking-[-0.012em] m-0"
            style={{ fontSize: 'clamp(28px, 4.4vw, 40px)', color: 'var(--navy)' }}
          >
            Dashboard
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2 whitespace-nowrap">
            One address — every public listing within a mile, every signal scored.
          </p>
        </div>
      </header>

      {/* Scanner — primary affordance, hero of the platform */}
      <section className="mb-10 sm:mb-12">
        <CommandSearch
          mode="inline"
          value={address}
          onChange={setAddress}
          onRun={(v: string) => startScan(v)}
          sampleChips={SAMPLE_CHIPS.map((c) => ({
            label: `${c.zip} · ${c.label}`,
            value: `1428 Maplewood Drive, Asheville, NC ${c.zip}`,
          }))}
        />
      </section>

      {/* KPI cards — separate inline cards, equal-width grid */}
      <section className="mb-10 sm:mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map((kpi, i) => (
            <KpiTile key={kpi.label} kpi={kpi} primary={i === 0} index={i} />
          ))}
        </div>
      </section>

      {/* Live batch strip — only when a batch is running. Inserted between
          metric cards and the activity tabs so it sits where running work
          would naturally surface. */}
      <LiveBatchStrip />

      {/* Activity — History + Schedule tabs, each capped to 6 rows.
          "View all" links to the matching full-page surface. */}
      <ActivityTabs />

      {/* Utility footer — single hairline strip */}
      <footer className="mt-12 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 border-t border-line">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-5 text-caption text-ink-3">
          <div>
            © 2026 Halcyon Solutions · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup> · Decide with certainty.
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="no-underline hover:text-brand-deep">Privacy</a>
            <a href="#" className="no-underline hover:text-brand-deep">Terms</a>
            <a href="#" className="no-underline hover:text-brand-deep">Status</a>
          </div>
        </div>
      </footer>
    </AppShell>
  );
}
