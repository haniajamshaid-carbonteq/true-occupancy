/* global React, AppShell, Button, Icon, SearchBar, CommandSearch, ScanIntentHero, Pill, DataTable, MetricCard, Tabs, Card, ReactRouterDOM, SCENARIOS, useAppState, ScreenError, ScreenEmpty, isRedAddress, RedFlag, BatchRedBadge, timeAgo, seedTime, occMatchForRisk */
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
// KPI model reframed from activity ("scanned today", "verified clean") to
// trust + workload, the questions an investigator actually opens on:
//   1. Flag Precision — do flags hold up after review? (the trust metric)
//   2. Review Queue   — how many ambiguous verdicts await a human call?
//   3. Confidence Mix — how much output is self-serve vs needs my eyes?
// Raw activity counts moved to History, where the work is logged.

interface Kpi {
  label: string;
  value: string;
  delta?: { dir: 'up' | 'down'; pct: string };
  hint: string;
  icon: string;
  spark: number[];
  /** Categorical dot on the eyebrow, for queue-style metrics. */
  accent?: 'verdict-high' | 'verdict-med' | 'verdict-low';
  /** When set, the tile becomes a button routing here. */
  to?: string;
}

const KPIS: Kpi[] = [
  { label: 'Flag Precision', value: '84%', delta: { dir: 'up', pct: '+6pt' }, hint: 'confirmed after review', icon: 'shield', spark: [74, 77, 76, 79, 78, 80, 79, 82, 81, 84] },
  { label: 'Review Queue',   value: '7',   delta: { dir: 'down', pct: '-2' }, hint: 'oldest waiting 5 d',     icon: 'flag',   spark: [12, 11, 13, 10, 9, 10, 8, 9, 8, 7], accent: 'verdict-med', to: '/history' },
];

// Confidence distribution — the shape the old "Avg Confidence" mean hid.
// "Decisive" = high-confidence Rented OR Not-Rented (self-serve). "Needs
// review" = the ambiguous Possibly-Rented band that costs human time.
interface ConfBand {
  key: string;
  label: string;
  count: number;
  color: string;
}

const CONFIDENCE_TOTAL = 232;
const CONFIDENCE_BANDS: ConfBand[] = [
  { key: 'decisive', label: 'Decisive',     count: 168, color: 'var(--brand)' },
  { key: 'review',   label: 'Needs review', count: 41,  color: 'var(--warn)' },
  { key: 'low',      label: 'Inconclusive', count: 23,  color: 'var(--ink-4)' },
];

// --- monitoring data ------------------------------------------------------
// State changes are the payoff of scheduled re-scans: a property whose
// verdict flipped since its last run. Escalations (→ Rented) are the
// high-value alerts; resolutions (→ Not Rented) close cases. Nothing else
// in the product surfaces this today — it's the whole reason to re-scan.
interface StateChange {
  id: string;
  address: string;
  from: 'low' | 'medium' | 'high';
  to: 'low' | 'medium' | 'high';
  detail: string;
  detectedAgo: string;
}

const STATE_CHANGES: StateChange[] = [
  { id: 'c1', address: '73 Beaucatcher Rd, Asheville, NC 28805', from: 'low',    to: 'high', detail: 'New Airbnb + Vrbo listings now geocode to the parcel', detectedAgo: '2 d ago' },
  { id: 'c2', address: '19 Edgemont Rd, Asheville, NC 28801',    from: 'medium', to: 'high', detail: 'Host handle now matches the owner of record',         detectedAgo: '3 d ago' },
  { id: 'c3', address: '410 Kimberly Ave, Asheville, NC 28804',  from: 'low',    to: 'high', detail: 'Facebook Marketplace weekly-rental post appeared',     detectedAgo: '4 d ago' },
  { id: 'c4', address: '88 Cumberland Ave, Asheville, NC 28801', from: 'high',   to: 'low',  detail: 'All matched listings removed — case can be closed',    detectedAgo: '6 d ago' },
];

interface RecentScan {
  id: string;
  address: string;
  scenario: 'low' | 'medium' | 'high';
  platforms: number;
  scannedAt: number;
}

const RECENT_SCANS: RecentScan[] = [
  { id: 'r1', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAt: seedTime('8min')  },
  { id: 'r2', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAt: seedTime('24min') },
  { id: 'r3', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAt: seedTime('1h')    },
  { id: 'r4', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAt: seedTime('2h')    },
  { id: 'r5', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAt: seedTime('3h')    },
  { id: 'r6', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAt: seedTime('4h')    },
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
  kpi: Kpi;
  primary?: boolean;
  index: number;
}) {
  const history = useHistory();
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
        accent={kpi.accent}
        delta={kpi.delta ? { dir: kpi.delta.dir, value: kpi.delta.pct } : undefined}
        hint={kpi.hint}
        onClick={kpi.to ? () => history.push(kpi.to!) : undefined}
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

function buildScanColumns<T extends { address: string; scenario: 'low' | 'medium' | 'high'; platforms: number; scannedAt: number }>(): any[] {
  return [
    {
      key: 'address',
      label: 'Address',
      primary: true,
      cell: (row: T) => {
        const [street, locality] = splitAddress(row.address);
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-inline min-w-0">
              <span
                className="font-sans font-semibold text-body-sm leading-tight truncate"
                style={{ color: 'var(--navy)' }}
              >
                {street}
              </span>
              {isRedAddress(row.address) && <RedFlag address={row.address} />}
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
          {timeAgo(row.scannedAt)}
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
          {row.platforms} platforms · {timeAgo(row.scannedAt)}
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
    if (row.intent) sessionStorage.setItem('scanIntent', row.intent);
    else sessionStorage.removeItem('scanIntent');
    // Dashboard's recent scans are all current — clear any stale stamp left
    // by a previously-opened old report so this reads fresh.
    sessionStorage.removeItem('resultServedAt');
    sessionStorage.removeItem('resultCached');
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
          <div className="flex items-center gap-inline min-w-0">
            <span
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {street}
            </span>
            {isRedAddress(r.address) && <RedFlag address={r.address} />}
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
    // Result — reconciliation of declared intent × scan verdict. Raw verdict
    // moved to the property page.
    key: 'result',
    label: 'Result',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      const m = occMatchForRisk(r.intent, SCENARIOS[r.scenario].risk);
      return m ? <Pill variant={m.tone as any}>{m.label}</Pill> : <span className="text-ink-4">—</span>;
    },
  },
  {
    key: 'scanned',
    label: 'Scanned',
    width: '100px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">{timeAgo(r.scannedAt)}</span>
    ),
  },
];

const DASHBOARD_BATCH_COLUMNS: any[] = [
  {
    key: 'target',
    label: 'File',
    primary: true,
    cell: (r: any) => {
      const nRed = (r.rows || []).filter((x: any) => isRedAddress(x.address)).length;
      return (
        <div className="min-w-0">
          <div className="flex items-center gap-inline min-w-0">
            <span
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {r.filename}
            </span>
            <BatchRedBadge count={nRed} />
          </div>
          <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
            {r.total} properties · {r.flagged} flagged
          </div>
        </div>
      );
    },
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
      <span className="font-mono tabular-nums text-caption text-ink-3">{timeAgo(r.scannedAt)}</span>
    ),
  },
];

// --- Confidence Mix card --------------------------------------------------
// Sibling to the MetricCard tiles (same surface/padding), but the body is a
// stacked bar + legend instead of one number — because the distribution is
// the insight the mean threw away. Spans two columns in the KPI grid.

function ConfidenceDistribution() {
  const total = CONFIDENCE_TOTAL;
  const decisivePct = Math.round((CONFIDENCE_BANDS[0].count / total) * 100);
  return (
    <div className="bg-surface border border-line rounded-lg p-card-tight shadow-sm flex flex-col h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase" style={{ color: 'var(--ink-3)' }}>
          Confidence Mix
        </div>
        <span className="w-7 h-7 rounded-md grid place-items-center shrink-0 bg-brand-soft text-brand [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
          <Icon name="trend-up" />
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-sans font-semibold text-h1 leading-none tracking-[-0.025em] tabular-nums" style={{ color: 'var(--navy)' }}>
          {decisivePct}%
        </span>
        <span className="text-caption text-ink-3">decisive · {total} scans · 30 d</span>
      </div>

      {/* Stacked bar — one segment per band, width ∝ share. */}
      <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden flex" style={{ background: 'var(--surface-2)' }}>
        {CONFIDENCE_BANDS.map((b) => (
          <div
            key={b.key}
            style={{ width: `${(b.count / total) * 100}%`, background: b.color }}
            title={`${b.label}: ${b.count}`}
          />
        ))}
      </div>

      {/* Legend — dot + label + count, one per band. */}
      <div className="mt-4 pt-3 border-t border-line grid grid-cols-3 gap-2">
        {CONFIDENCE_BANDS.map((b) => (
          <div key={b.key} className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.color }} aria-hidden />
              <span className="text-micro text-ink-3 truncate">{b.label}</span>
            </div>
            <div className="mt-0.5 font-mono tabular-nums text-label font-semibold" style={{ color: 'var(--navy)' }}>
              {b.count}
              <span className="text-micro text-ink-4 font-sans font-normal ml-1">
                {Math.round((b.count / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Monitoring panel -----------------------------------------------------
// The recurring-scan payoff surface. Main column: verdict changes caught
// since each property's last run (escalations in risk tone, resolutions in
// clean). Right rail: monitoring health — schedules, overdue runs, stale
// coverage, evidence freshness.

const MON_TONE_COLOR: Record<'risk' | 'warn' | 'clean' | 'neutral', string> = {
  risk: 'var(--risk)',
  warn: 'var(--warn)',
  clean: 'var(--clean)',
  neutral: 'var(--ink-2)',
};

function StateChangeRow({ row, onOpen }: { row: StateChange; onOpen: (row: StateChange) => void }) {
  const escalation = row.to === 'high';
  const tone = escalation ? 'var(--risk)' : 'var(--clean)';
  const toneSoft = escalation ? 'var(--risk-soft)' : 'var(--clean-soft)';
  const [street] = splitAddress(row.address);
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full flex items-center gap-3 px-4 py-3 border-t border-line first:border-t-0 hover:bg-hover-bg transition-colors text-left"
    >
      <span className="w-9 h-9 rounded-md grid place-items-center shrink-0" style={{ background: toneSoft, color: tone }} aria-hidden>
        <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          {escalation ? <path d="M8 13V3M8 3 4 7M8 3l4 4" /> : <path d="M8 3v10M8 13l4-4M8 13l-4-4" />}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-label font-semibold truncate" style={{ color: 'var(--navy)' }}>
          {street}
        </span>
        <span className="block text-caption text-ink-3 truncate">{row.detail}</span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-caption whitespace-nowrap" style={{ color: 'var(--ink-2)' }}>
          {HOME_VERDICT_LABEL[row.from]}
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-ink-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 4 4 4-4 4" />
          </svg>
          <span className="font-semibold" style={{ color: tone }}>{HOME_VERDICT_LABEL[row.to]}</span>
        </span>
        <span className="text-micro text-ink-4 tabular-nums">{row.detectedAgo}</span>
      </span>
    </button>
  );
}

function MonitoringPanel() {
  const history = useHistory();
  const { schedules } = useAppState();
  const escalations = STATE_CHANGES.filter((c) => c.to === 'high').length;

  // Health rail — schedules count is real (from state); the rest are mock
  // monitoring telemetry a backend would supply.
  const stats: { icon: string; label: string; value: string; tone: 'risk' | 'warn' | 'clean' | 'neutral' }[] = [
    { icon: 'cal',     label: 'Active schedules',    value: `${schedules.length} running`,   tone: 'neutral' },
    { icon: 'history', label: 'Overdue re-scans',    value: '2 past due',                     tone: 'risk' },
    { icon: 'search',  label: 'Stale coverage',      value: '37 parcels · 90 d+',             tone: 'warn' },
    { icon: 'shield',  label: 'Evidence freshness',  value: 'Median 2 d',                     tone: 'clean' },
  ];

  function openChange(row: StateChange) {
    sessionStorage.setItem('scanScenario', row.to);
    sessionStorage.setItem('scanAddress', row.address);
    const path = row.to === 'low' ? '/result/clean' : row.to === 'medium' ? '/result/medium' : '/result/high';
    history.push(path);
  }

  return (
    <section className="mb-section">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-sans font-semibold text-h4 leading-tight tracking-[-0.01em] m-0" style={{ color: 'var(--navy)' }}>
            Monitoring
          </h2>
          <p className="text-caption text-ink-3 m-0 mt-1">
            Verdict changes caught by scheduled re-scans · {escalations} new escalation{escalations === 1 ? '' : 's'}
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => history.push('/scheduled')}
          iconRight={
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m6 4 4 4-4 4" />
            </svg>
          }
        >
          Manage schedules
        </Button>
      </div>

      <Card className="card-rise" style={{ ['--rise-delay' as any]: '120ms' } as any}>
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Main — state changes */}
          <div className="lg:col-span-2 lg:border-r border-line">
            {STATE_CHANGES.map((row) => (
              <StateChangeRow key={row.id} row={row} onOpen={openChange} />
            ))}
          </div>

          {/* Rail — monitoring health */}
          <div className="border-t lg:border-t-0 border-line p-4 flex flex-col gap-3">
            <div className="text-eyebrow font-semibold tracking-[0.16em] uppercase text-ink-3">
              Monitoring health
            </div>
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-md grid place-items-center shrink-0 bg-surface-2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
                  <Icon name={s.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-micro text-ink-3 truncate">{s.label}</span>
                  <span className="block text-label font-semibold truncate" style={{ color: MON_TONE_COLOR[s.tone] }}>
                    {s.value}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}

// --- the page -------------------------------------------------------------

function HomeScreen() {
  const history = useHistory();

  function startScan(addr?: string, intent?: string) {
    const value = addr ?? '';
    const scenario = pickScenario(value);
    sessionStorage.setItem('scanScenario', scenario);
    sessionStorage.setItem(
      'scanAddress',
      value || '1428 Maplewood Drive, Asheville, NC 28804'
    );
    // The declared intended occupancy travels with the order so the result
    // can reconcile observed-vs-declared. '' when not declared (e.g. a scan
    // kicked off from a history/monitoring row rather than the intake hero).
    sessionStorage.setItem('scanIntent', intent ?? '');
    // Clear any reference / history-id carried over from a previous visit
    // so the new scan starts with a blank Reference field on the result page.
    sessionStorage.removeItem('scanReference');
    sessionStorage.removeItem('scanHistoryId');
    history.push('/scan/start');
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

      {/* Scanner — primary affordance, hero of the platform. ScanIntentHero
          wraps the same command bar and adds the required intended-occupancy
          declaration, so every order carries the reference the result
          reconciles against. */}
      <section className="mb-section">
        <ScanIntentHero
          onRun={(addr: string, intent: string) => startScan(addr, intent)}
          sampleChips={SAMPLE_CHIPS.map((c) => ({
            label: `${c.zip} · ${c.label}`,
            value: `1428 Maplewood Drive, Asheville, NC ${c.zip}`,
          }))}
        />
      </section>

      {/* KPI cards — trust + workload metrics. Flag Precision leads as the
          primary tile; Review Queue is the workload count; Confidence Mix
          spans two columns to host the stacked distribution. */}
      <section className="mb-section">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiTile kpi={KPIS[0]} primary index={0} />
          <KpiTile kpi={KPIS[1]} index={1} />
          <div className="sm:col-span-2 card-rise" style={{ ['--rise-delay' as any]: '120ms' }}>
            <ConfidenceDistribution />
          </div>
        </div>
      </section>

      {/* Monitoring — verdict changes caught by scheduled re-scans + health */}
      <MonitoringPanel />

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
