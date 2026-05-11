/* global React, AppShell, PageHeader, Card, Button, Pill, Icon, DataTable, DropdownMenu, Drawer, ChipRow, ReactRouterDOM,
   VERDICT_ACCENT, splitAddress, AutomationControl, VerdictTiles, useAppState */
// Batch processing — upload a CSV (or click "Try sample data") to scan
// dozens of properties in one queue. Shows a partially-complete batch:
// some scanned, some scanning, some queued.
//
// NB: do NOT destructure `useHistory` at module top level — HomeScreen.tsx
// already does that, and a second top-level `const { useHistory }` in shared
// script scope throws "Identifier 'useHistory' has already been declared",
// killing the bootstrap. Call `ReactRouterDOM.useHistory()` inline instead.

type Risk = 'clean' | 'warn' | 'risk';
type RowStatus = 'done' | 'running' | 'queued' | 'failed';

interface BatchRow {
  id: number;
  address: string;
  status: RowStatus;
  score?: number;
  risk?: Risk;
  listings?: number;
  errorReason?: string;
}

const SAMPLE_BATCH: BatchRow[] = [
  { id: 1,  address: '1428 Maplewood Drive, Asheville, NC 28804', status: 'done', score: 87, risk: 'risk',  listings: 4 },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'done', score: 12, risk: 'clean', listings: 0 },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'done', score: 54, risk: 'warn',  listings: 1 },
  { id: 4,  address: '145 Westchester Dr, Asheville, NC 28803',   status: 'done', score: 76, risk: 'risk',  listings: 3 },
  { id: 5,  address: '23 Tunnel Rd, Asheville, NC 28805',         status: 'done', score: 8,  risk: 'clean', listings: 0 },
  { id: 6,  address: '67 Charlotte Hwy, Asheville, NC 28803',     status: 'done', score: 91, risk: 'risk',  listings: 5 },
  { id: 7,  address: '215 Edgewood Rd, Asheville, NC 28804',      status: 'done', score: 42, risk: 'warn',  listings: 1 },
  { id: 8,  address: '88 Cumberland Ave, Asheville, NC 28801',    status: 'done', score: 18, risk: 'clean', listings: 0 },
  { id: 9,  address: '301 Merrimon Ave, Asheville, NC 28804',     status: 'running' },
  { id: 10, address: '450 Patton Ave, Asheville, NC 28806',       status: 'running' },
  { id: 11, address: '12 Hillside St, Asheville, NC 28801',       status: 'queued' },
  { id: 12, address: '156 Sand Hill Rd, Asheville, NC 28806',     status: 'queued' },
  { id: 13, address: '89 Beverly Rd, Asheville, NC 28805',        status: 'queued' },
  { id: 14, address: '720 Haywood Rd, Asheville, NC 28806',       status: 'queued' },
];

function BatchScreen() {
  const { liveBatch, startSampleBatch } = useAppState();

  return (
    <AppShell>
      {/* Page header — consistent across empty + loaded states */}
      <header className="flex items-end justify-between gap-6 mb-section-sub">
        <div>
          <h1
            className="font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Batch Upload
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2 whitespace-nowrap">
            Upload a CSV of addresses to scan against Airbnb, Vrbo, and Facebook Marketplace.
          </p>
        </div>
      </header>

      {liveBatch ? (
        <BatchResults batch={liveBatch} />
      ) : (
        <BatchUpload onSample={startSampleBatch} />
      )}
    </AppShell>
  );
}

// ---------- Empty state: upload zone ----------

function BatchUpload({ onSample }: { onSample: () => void }) {
  return (
    <Card>
      <div className="px-6 py-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-brand-soft text-brand grid place-items-center mb-5">
          <Icon name="upload" size={24} />
        </div>
        <h2 className="font-sans font-semibold text-h3 sm:text-h3 tracking-[-0.005em] m-0 mb-2" style={{ color: 'var(--navy)' }}>
          Scan Many Properties at Once.
        </h2>
        <p className="text-ink-3 text-body-sm leading-relaxed max-w-[68ch] m-0 mb-7">
          Drop a CSV with one address per row. We&rsquo;ll cross-check every entry against Airbnb, Vrbo, and Facebook Marketplace, then surface the matches in one reviewable queue.
        </p>

        {/* Drop-zone with hover affordance */}
        <label
          htmlFor="batch-csv"
          className="w-full max-w-[520px] cursor-pointer block rounded-lg border-2 border-dashed border-line bg-surface hover:bg-brand-soft hover:border-brand transition-colors px-6 py-8 mb-4"
        >
          <div className="font-medium text-ink-2 mb-1">
            Drop a CSV here, or <span className="text-brand">browse</span>
          </div>
          <div className="font-sans text-micro uppercase tracking-widest text-ink-4">
            Required column: address · Up to 500 rows
          </div>
          <input
            id="batch-csv"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={onSample}
          />
        </label>

        <Button variant="ghost" onClick={onSample} icon={<Icon name="layers" />}>
          Or Try a Sample Batch
        </Button>
      </div>
    </Card>
  );
}

// ---------- Loaded state: header + table ----------

function BatchResults({ batch, readOnly }: { batch: any; readOnly?: boolean }) {
  const routerHistory = ReactRouterDOM.useHistory();
  const { clearBatch, retryBatchRow } = useAppState();
  const rows: BatchRow[] = batch.rows;
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  const progress = Math.round((done / total) * 100);
  const isComplete = batch.status === 'complete';

  const failedRows = rows.filter((r) => r.status === 'failed');
  const failedCount = failedRows.length;
  const onRetryAllFailed = readOnly
    ? undefined
    : () => {
        failedRows.forEach((r) => retryBatchRow(r.id));
      };

  type StatusFilter = 'all' | 'done' | 'running' | 'queued' | 'failed';
  type VerdictFilter = 'all' | 'risk' | 'warn' | 'clean';
  type ScoreBand = 'all' | 'low' | 'med' | 'high';
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
  const [verdictFilter, setVerdictFilter] = React.useState<VerdictFilter>('all');
  const [scoreBand, setScoreBand] = React.useState<ScoreBand>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const advancedCount =
    (statusFilter  !== 'all' ? 1 : 0) +
    (verdictFilter !== 'all' ? 1 : 0) +
    (scoreBand     !== 'all' ? 1 : 0);

  const filteredRows = rows.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (verdictFilter !== 'all') {
      if (r.status !== 'done' || r.risk !== verdictFilter) return false;
    }
    if (scoreBand !== 'all') {
      const s = r.score ?? -1;
      if (s < 0) return false;
      if (scoreBand === 'low'  && s > 33) return false;
      if (scoreBand === 'med'  && (s < 34 || s > 66)) return false;
      if (scoreBand === 'high' && s < 67) return false;
    }
    if (query) {
      if (!r.address.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const toggleVerdict = (v: 'risk' | 'warn' | 'clean') =>
    setVerdictFilter((cur) => (cur === v ? 'all' : v));

  function clearAdvanced() {
    setStatusFilter('all');
    setVerdictFilter('all');
    setScoreBand('all');
  }

  return (
    <div className="flex flex-col gap-section-tight">
      {/* Summary card */}
      <Card allowOverflow>
        <div className="px-card-loose py-card">
          <div className="flex items-start justify-between gap-6 mb-section-tight">
            <div className="min-w-0">
              <h2 className="font-sans font-semibold text-h3 tracking-[-0.005em] m-0 leading-tight" style={{ color: 'var(--navy)' }}>
                {isComplete ? (
                  <span className="status-text-in">{total} properties scanned</span>
                ) : (
                  <span className="status-text-pulse">
                    Scanning {done} of {total}
                    <span className="status-dots" aria-hidden="true">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  </span>
                )}
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <AutomationControl
                target={{ kind: 'batch', filename: batch.filename, total }}
              />
              <DropdownMenu
                title="Download Report"
                trigger={(open: boolean) => (
                  <Button
                    icon={<Icon name="pdf" />}
                    iconRight={
                      <svg
                        viewBox="0 0 12 12"
                        className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="m3 5 3 3 3-3" />
                      </svg>
                    }
                  >
                    Download
                  </Button>
                )}
                items={[
                  {
                    label: 'PDF report',
                    hint: 'Lender-ready certificate with live evidence links',
                    icon: <Icon name="pdf" />,
                    onClick: () => window.print(),
                  },
                  {
                    label: 'CSV',
                    hint: 'Tabular data for spreadsheets',
                    icon: <Icon name="layers" />,
                    onClick: () => {},
                  },
                  {
                    label: 'ZIP archive',
                    hint: 'PDF + CSV + per-listing screenshots',
                    icon: <Icon name="layers" />,
                    onClick: () => {},
                  },
                ]}
              />
              <Button
                variant="primary"
                icon={<Icon name="upload" />}
                onClick={() => {
                  clearBatch();
                  routerHistory.push('/batch');
                }}
              >
                New Batch
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-section-tight">
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-sans text-xs text-ink-3 shrink-0 tabular-nums">
              {done}/{total} scanned{!isComplete && running > 0 ? ` · ${running} in progress` : ''}
            </div>
          </div>

        </div>
      </Card>

      {/* Status counts — sit outside the summary card, mirroring the dashboard KPI strip */}
      <VerdictTiles
        flagged={flagged}
        warn={warn}
        clean={clean}
        onSelect={toggleVerdict}
        selected={verdictFilter === 'all' ? null : verdictFilter}
      />

      {/* Properties — same DataTable primitive as Home + History */}
      <div>
        <div className="flex items-end justify-between mb-stack-md gap-4 flex-wrap">
          <h3
            className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Properties
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRetryAllFailed && failedCount > 0 && (
              <button
                type="button"
                onClick={onRetryAllFailed}
                aria-label={`Retry ${failedCount} failed ${failedCount === 1 ? 'scan' : 'scans'}`}
                title={`Retry ${failedCount} failed ${failedCount === 1 ? 'scan' : 'scans'}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-caption font-medium transition-colors shrink-0 bg-risk-soft text-risk-ink border-transparent hover:opacity-90"
              >
                <Icon name="replay" size={14} />
                <span className="hidden sm:inline">Retry Failed</span>
                <span className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded bg-white/60">
                  {failedCount}
                </span>
              </button>
            )}
            <div className="relative flex-1 sm:flex-initial sm:w-[260px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
                <Icon name="search" size={14} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Filter by address"
                className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-line text-label outline-none focus:border-brand placeholder:text-ink-4"
              />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open filters"
              className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-caption font-medium transition-colors shrink-0 ${
                advancedCount > 0
                  ? '!bg-brand-tint !border-brand/40'
                  : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
              }`}
              style={{ color: advancedCount > 0 ? 'var(--brand-deep)' : 'var(--ink-2)' }}
            >
              <Icon name="sliders" size={14} />
              <span className="hidden sm:inline">Filters</span>
              {advancedCount > 0 && (
                <span
                  className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded border border-line"
                  style={{ background: 'rgba(2,146,190,0.12)', color: 'var(--brand-deep)' }}
                >
                  {advancedCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <BatchTable rows={filteredRows} />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        footer={
          <>
            <Button variant="ghost" onClick={clearAdvanced} disabled={advancedCount === 0}>
              Clear All
            </Button>
            <Button variant="primary" onClick={() => setDrawerOpen(false)}>
              Done
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <ChipRow
            label="Status"
            value={statusFilter}
            onChange={(v: string) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: 'all',     label: 'Any' },
              { value: 'done',    label: 'Scanned' },
              { value: 'running', label: 'Scanning' },
              { value: 'queued',  label: 'Queued' },
              { value: 'failed',  label: 'Failed' },
            ]}
          />
          <ChipRow
            label="Verdict"
            value={verdictFilter}
            onChange={(v: string) => setVerdictFilter(v as VerdictFilter)}
            options={[
              { value: 'all',   label: 'Any' },
              { value: 'risk',  label: 'Rented' },
              { value: 'warn',  label: 'Possibly Rented' },
              { value: 'clean', label: 'Not Rented' },
            ]}
          />
          <ChipRow
            label="Score band"
            value={scoreBand}
            onChange={(v: string) => setScoreBand(v as ScoreBand)}
            options={[
              { value: 'all',  label: 'Any' },
              { value: 'low',  label: '0–33' },
              { value: 'med',  label: '34–66' },
              { value: 'high', label: '67–100' },
            ]}
          />
        </div>
      </Drawer>

    </div>
  );
}

function BatchTable({ rows }: { rows: BatchRow[] }) {
  const history = ReactRouterDOM.useHistory();

  function openIfDone(row: BatchRow) {
    if (row.status === 'done' && row.risk) {
      history.push(ROUTE_FOR_RISK[row.risk]);
    }
  }

  const columns = React.useMemo(() => buildBatchColumns(), []);

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r: BatchRow) => String(r.id)}
      onRowClick={openIfDone}
      pageSize={25}
      leadingAccent={(r: BatchRow) =>
        r.status === 'done' && r.risk
          ? VERDICT_ACCENT[r.risk]
          : r.status === 'failed'
          ? VERDICT_ACCENT.risk
          : undefined
      }
    />
  );
}

// ---------- Sub-components ----------

const VERDICT_LABEL: Record<Risk, string> = {
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

// Map a row's risk band to the matching detail-screen route, so the demo
// has somewhere believable to drill into.
const ROUTE_FOR_RISK: Record<Risk, string> = {
  risk: '/result/high',
  warn: '/result/medium',
  clean: '/result/clean',
};

// Column definitions for the BatchTable. Mirrors the SCAN_COLUMNS shape
// from HomeScreen so both data tables share rhythm, hover treatment, and
// the table↔card switch via the global DataTable primitive.
function buildBatchColumns(): any[] {
  const cols: any[] = [
  {
    key: 'index',
    label: '#',
    width: '36px',
    hideOnMobile: true,
    cell: (_row: BatchRow, i: number) => (
      <span className="font-mono text-micro text-ink-4 tabular-nums">
        {String(i + 1).padStart(2, '0')}
      </span>
    ),
  },
  {
    key: 'address',
    label: 'Address',
    primary: true,
    cell: (row: BatchRow) => {
      const [street, locality] = splitAddress(row.address);
      const dim = row.status === 'queued';
      return (
        <div className={`min-w-0 ${dim ? 'opacity-60' : ''}`}>
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
    key: 'score',
    label: 'Score',
    width: '128px',
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) => {
      if (row.status !== 'done') {
        return <span className="text-ink-4">—</span>;
      }
      return (
        <div className="flex items-center gap-inline">
          <span
            className="font-mono tabular-nums font-semibold text-label w-[24px] text-right leading-none"
            style={{ color: 'var(--navy)' }}
          >
            {row.score}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="relative h-1 w-full rounded-full overflow-hidden"
              style={{ background: 'var(--surface-2)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-2"
                style={{ width: `${Math.min(100, Math.max(0, row.score ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    key: 'verdict',
    label: 'Verdict',
    width: '150px',
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) => {
      if (row.status === 'done' && row.risk) {
        const variant =
          row.risk === 'risk'  ? 'verdict-high'
          : row.risk === 'warn'  ? 'verdict-med'
          : 'verdict-low';
        return <Pill variant={variant as any}>{VERDICT_LABEL[row.risk]}</Pill>;
      }
      if (row.status === 'running') {
        return <Pill variant="brand" dot>Scanning</Pill>;
      }
      if (row.status === 'failed') {
        return (
          <Pill variant="risk" title={row.errorReason}>
            Failed
          </Pill>
        );
      }
      return <Pill>Queued</Pill>;
    },
  },
  {
    key: 'listings',
    label: 'Listings',
    width: '88px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (row: BatchRow) =>
      row.status === 'done' ? (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {row.listings} found
        </span>
      ) : (
        <span className="text-ink-4">—</span>
      ),
  },
];
  return cols;
}
