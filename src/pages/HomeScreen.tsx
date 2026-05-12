/* global React, AppShell, Button, Icon, SearchBar, CommandSearch, Pill, DataTable, MetricCard, Tabs, Card, ReactRouterDOM, SCENARIOS, useAppState, ScreenError, ScreenEmpty */
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

const KPIS: {
  label: string;
  value: string;
  delta?: { dir: 'up' | 'down'; pct: string };
  hint: string;
  icon: string;
  spark: number[];
}[] = [
  { label: 'Scanned Today',     value: '34',  delta: { dir: 'up',   pct: '+12%' }, hint: 'vs. yesterday',  icon: 'search',     spark: [18, 22, 19, 25, 21, 28, 24, 30, 27, 32, 30, 34] },
  { label: 'Flagged This Week', value: '11',  delta: { dir: 'up',   pct: '+3' },   hint: 'vs. last week',  icon: 'flag',       spark: [4, 5, 3, 6, 5, 7, 6, 8, 7, 9, 10, 11] },
  { label: 'Verified Clean',    value: '187', delta: { dir: 'up',   pct: '+22' },  hint: 'past 30 days',   icon: 'shield',     spark: [140, 148, 152, 158, 161, 165, 168, 172, 176, 178, 183, 187] },
  { label: 'Avg Confidence',    value: '92',  delta: { dir: 'down', pct: '-1pt' }, hint: 'vs. 30 d avg',   icon: 'trend-down', spark: [95, 94, 96, 95, 93, 94, 93, 92, 93, 92, 91, 92] },
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
  low: 'Not Rented',
  medium: 'Possibly Rented',
  high: 'Rented',
};

// Batch execution outcome — distinct from the single-scan verdict above.
// Shared with HistoryScreen so both surfaces speak the same vocabulary.
const BATCH_STATUS_LABEL: Record<'complete' | 'partial' | 'failed', string> = {
  complete: 'Successful',
  partial: 'Partial Failed',
  failed: 'Failed',
};

const BATCH_STATUS_VARIANT: Record<'complete' | 'partial' | 'failed', 'clean' | 'warn' | 'risk'> = {
  complete: 'clean',
  partial: 'warn',
  failed: 'risk',
};

const SAMPLE_CHIPS: { zip: string; label: string }[] = [
  { zip: '28804', label: 'Not Rented' },
  { zip: '28805', label: 'Possibly Rented' },
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
        icon={<Icon name={kpi.icon} />}
        sparkline={kpi.spark}
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

const THUMB_BG: Record<StripState, { bg: string; fg: string }> = {
  live:      { bg: 'var(--brand-soft)', fg: 'var(--brand)' },
  complete:  { bg: 'var(--clean-soft)', fg: 'var(--clean-ink)' },
  partial:   { bg: 'var(--warn-soft)',  fg: 'var(--warn-ink)' },
  allFailed: { bg: 'var(--risk-soft)',  fg: 'var(--risk-ink)' },
};

function HugSpinner() {
  return (
    <span
      aria-hidden
      className="block w-7 h-7 rounded-full animate-spin"
      style={{
        border: '2.5px solid rgba(10,183,163,.22)',
        borderTopColor: 'var(--brand)',
        borderRightColor: 'var(--brand-2)',
      }}
    />
  );
}

function HugCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

function HugAlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4l10 17H2L12 4z" />
      <path d="M12 10v5" />
      <path d="M12 18h.01" strokeWidth={2.5} />
    </svg>
  );
}

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

  const thumb = THUMB_BG[state];

  const headline =
    state === 'live'      ? 'Batch Is Being Scanned'
    : state === 'complete' ? 'Batch Completed'
    : state === 'partial' ? 'Batch Completed With Errors'
    : 'Network Failure';

  const meta =
    state === 'live'      ? `${liveBatch.filename}  ·  ${settled} / ${total} scanned`
    : state === 'complete' ? `${liveBatch.filename}  ·  ${done} / ${total} scanned`
    : state === 'partial' ? `${liveBatch.filename}  ·  ${done} / ${total} scanned  ·  ${failed} failed`
    : `${liveBatch.filename}  ·  stopped at row ${settled} of ${total}`;

  // Once a batch lands in history it has a stable id — deep-link to that
  // detail page so the banner CTAs feel like a continuation, not a jump back
  // to the dashboard's recent-scans list. Mid-run we don't have a history
  // entry yet, so fall back to the live /batch route.
  const detailPath = liveBatch.historyId ? `/batch/${liveBatch.historyId}` : '/batch';
  function goResults() {
    dismissBatch();
    history.push(detailPath);
  }
  function retry() {
    dismissBatch();
    history.push(detailPath);
  }
  function openBatch() {
    history.push(detailPath);
  }

  const chevron = (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
  const replay = (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <path d="M3 20v-5h5" />
    </svg>
  );

  return (
    <section className="mb-section">
      <div
        className="card-rise relative inline-flex items-start gap-[18px] bg-surface border border-line rounded-[14px] shadow-sm max-w-full"
        style={{ padding: '18px 44px 18px 18px', minWidth: 'min(460px, 100%)', maxWidth: 720 }}
      >
        <div
          className="w-14 h-14 shrink-0 rounded-[10px] grid place-items-center"
          style={{ background: thumb.bg, color: thumb.fg }}
          aria-hidden
        >
          {state === 'live' ? <HugSpinner />
            : state === 'complete' ? <HugCheckIcon />
            : <HugAlertIcon />}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h3
            className="font-sans font-semibold leading-tight tracking-[-0.005em] m-0 text-h4"
            style={{ color: 'var(--navy)' }}
          >
            {headline}
          </h3>
          <p className="font-sans text-caption text-ink-3 leading-snug m-0 truncate" title={liveBatch.filename}>
            {meta}
          </p>

          {state === 'live' && (
            <div className="mt-2 h-1 bg-line rounded-full overflow-hidden" aria-label={`${pct} percent`}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-2) 100%)' }}
              />
            </div>
          )}

          {state === 'complete' && (
            <div className="flex gap-2.5 mt-2.5">
              <Button size="sm" variant="primary" onClick={goResults} iconRight={chevron}>View Results</Button>
            </div>
          )}

          {state === 'partial' && (
            <div className="flex gap-2.5 mt-2.5">
              <Button size="sm" variant="primary" onClick={goResults} iconRight={chevron}>View Results</Button>
              <Button size="sm" variant="ghost" onClick={retry}>Retry Failed</Button>
            </div>
          )}

          {state === 'allFailed' && (
            <div className="flex gap-2.5 mt-2.5">
              <Button size="sm" variant="primary" onClick={retry} icon={replay}>Retry Batch</Button>
              <Button size="sm" variant="ghost" onClick={openBatch}>View Partial Results</Button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={dismissBatch}
          aria-label="Dismiss batch"
          className="absolute top-2.5 right-3 w-6 h-6 grid place-items-center rounded-md text-ink-4 hover:bg-surface-2 hover:text-ink-2 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </section>
  );
}

// --- Activity tabs (History | Schedule) -----------------------------------

function RecentScansPanel() {
  const history = useHistory();
  const { history: histRows, loading, error } = useAppState();
  const [tab, setTab] = React.useState<'single' | 'batch'>('single');

  const singles = histRows.filter((r: any) => r.kind !== 'batch');
  const batches = histRows.filter((r: any) => r.kind === 'batch');

  const singlesPreview = singles.slice(0, 6);
  const batchesPreview = batches.slice(0, 6);

  function openSingleRow(row: any) {
    sessionStorage.setItem('scanScenario', row.scenario);
    sessionStorage.setItem('scanAddress', row.address);
    const path =
      row.scenario === 'low'  ? '/result/clean'
      : row.scenario === 'medium' ? '/result/medium'
      : '/result/high';
    history.push(path);
  }

  function openBatchRow(row: any) {
    history.push(`/batch/${row.id}`);
  }

  return (
    <section className="mb-section">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2
          className="font-sans font-semibold text-h4 leading-tight tracking-[-0.01em] m-0"
          style={{ color: 'var(--navy)' }}
        >
          Recent Scans
        </h2>
      </div>
      <Tabs
        value={tab}
        onChange={(v: any) => setTab(v)}
        items={[
          { value: 'single', label: 'Single', count: singles.length },
          { value: 'batch',  label: 'Batch',  count: batches.length },
        ]}
        rightSlot={
          <Button
            variant="ghost"
            onClick={() => history.push('/history')}
            iconRight={
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 4 4 4-4 4" />
              </svg>
            }
          >
            View All
          </Button>
        }
      />

      <div className="mt-4 card-rise" style={{ ['--rise-delay' as any]: '120ms' }}>
        {error ? (
          <ScreenError
            title="Couldn't load recent scans"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : !loading && histRows.length === 0 ? (
          <ScreenEmpty
            icon="history"
            title="No scans yet"
            message="Run your first scan and it'll show up here."
            actionLabel="Scan a property"
            onAction={() => history.push('/')}
          />
        ) : tab === 'single' ? (
          <DataTable
            columns={DASHBOARD_SINGLE_COLUMNS}
            rows={singlesPreview}
            rowKey={(r: any) => r.id}
            onRowClick={openSingleRow}
            loading={loading}
            empty={
              <div className="px-5 py-12 text-center text-label text-ink-3">
                No single scans yet.
              </div>
            }
          />
        ) : (
          <DataTable
            columns={DASHBOARD_BATCH_COLUMNS}
            rows={batchesPreview}
            rowKey={(r: any) => r.id}
            onRowClick={openBatchRow}
            loading={loading}
            empty={
              <div className="px-5 py-12 text-center text-label text-ink-3">
                No batch runs yet.
              </div>
            }
          />
        )}
      </div>
    </section>
  );
}

// Dashboard previews use compact columns — Target + Verdict/Status +
// relative-time. Tabs split single vs batch so the Type pill is redundant.
// Full detail (score bar, platforms) lives on the History page.

const DASHBOARD_SINGLE_COLUMNS: any[] = [
  {
    key: 'target',
    label: 'Address',
    primary: true,
    cell: (r: any) => {
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

const DASHBOARD_BATCH_COLUMNS: any[] = [
  {
    key: 'target',
    label: 'File',
    primary: true,
    cell: (r: any) => (
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
    ),
  },
  {
    key: 'status',
    label: 'Status',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      // Older seed entries pre-date the status field; treat them as
      // successful completions so the column never reads "—".
      const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
      return <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}</Pill>;
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
      <header className="flex items-end justify-between gap-6 mb-section-sub">
        <div>
          <h1
            className="font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Dashboard
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2">
            Identify public rental activity with explainable confidence and evidence-backed results.
          </p>
        </div>
      </header>

      {/* Live batch strip — only when a batch is running. Sits above the
          scanner so running work surfaces immediately. */}
      <LiveBatchStrip />

      {/* Scanner — primary affordance, hero of the platform */}
      <section className="mb-section">
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
      <section className="mb-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map((kpi, i) => (
            <KpiTile key={kpi.label} kpi={kpi} index={i} />
          ))}
        </div>
      </section>

      {/* Recent Scans — Single / Batch tabs, each capped to 6 rows.
          "View all" links to /history. Scheduled lives at /scheduled. */}
      <RecentScansPanel />

      {/* Utility footer — single hairline strip */}
      <footer className="mt-section -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 border-t border-line">
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
