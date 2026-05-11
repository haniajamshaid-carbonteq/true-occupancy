/* global React, AppShell, PageHeader, Card, Button, Pill, Icon, DataTable, MetricCard, DropdownMenu, ReactRouterDOM,
   VERDICT_ACCENT, splitAddress, AutomateModal, useAppState */
// Batch processing — upload a CSV (or click "Try sample data") to scan
// dozens of properties in one queue. Shows a partially-complete batch:
// some scanned, some scanning, some queued.
//
// NB: do NOT destructure `useHistory` at module top level — HomeScreen.tsx
// already does that, and a second top-level `const { useHistory }` in shared
// script scope throws "Identifier 'useHistory' has already been declared",
// killing the bootstrap. Call `ReactRouterDOM.useHistory()` inline instead.

type Risk = 'clean' | 'warn' | 'risk';
type RowStatus = 'done' | 'running' | 'queued';

interface BatchRow {
  id: number;
  address: string;
  status: RowStatus;
  score?: number;
  risk?: Risk;
  listings?: number;
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
        <h2 className="font-sans font-semibold text-h2 sm:text-h2 tracking-[-0.005em] m-0 mb-2" style={{ color: 'var(--navy)' }}>
          Scan Many Properties at Once.
        </h2>
        <p className="text-ink-3 text-body-sm leading-relaxed max-w-[48ch] m-0 mb-7">
          Drop a CSV with one address per row. We'll cross-check every entry against
          Airbnb, Vrbo, and Facebook Marketplace, then surface the matches in one
          reviewable queue.
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
          Or try a sample batch
        </Button>
      </div>
    </Card>
  );
}

// ---------- Loaded state: header + table ----------

function BatchResults({ batch }: { batch: any }) {
  const { addSchedule, clearBatch } = useAppState();
  const rows: BatchRow[] = batch.rows;
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  const progress = Math.round((done / total) * 100);
  const isComplete = batch.status === 'complete';

  const [automateOpen, setAutomateOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!confirmation) return;
    const t = window.setTimeout(() => setConfirmation(null), 3000);
    return () => window.clearTimeout(t);
  }, [confirmation]);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <Card>
        <div className="px-7 py-6">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div className="min-w-0">
              <div className="font-sans text-eyebrow uppercase tracking-widest text-ink-3 mb-1.5 flex items-center gap-2">
                {isComplete ? (
                  <Pill variant="clean" dot>Complete</Pill>
                ) : (
                  <Pill variant="brand" dot>Live</Pill>
                )}
                <span>Batch · {batch.filename}</span>
              </div>
              <h2 className="font-sans font-semibold text-h2 tracking-[-0.005em] m-0 leading-tight" style={{ color: 'var(--navy)' }}>
                {total} properties
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="default"
                onClick={() => setAutomateOpen(true)}
                icon={<Icon name="cal" size={14} />}
              >
                Automate
              </Button>
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
              <Button variant="primary" icon={<Icon name="upload" />} onClick={clearBatch}>
                New batch
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-sans text-xs text-ink-3 shrink-0 tabular-nums">
              {done}/{total} scanned{!isComplete && running > 0 ? ` · ${running} in progress` : ''}{isComplete ? ' · added to History' : ''}
            </div>
          </div>

          {/* Status counts — same MetricCard primitive as Home KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <MetricCard size="sm" accent="verdict-high" label="Rented"          value={flagged} />
            <MetricCard size="sm" accent="verdict-med"  label="Possibly rented" value={warn} />
            <MetricCard size="sm" accent="verdict-low"  label="Not rented"      value={clean} />
          </div>
        </div>
      </Card>

      {/* Properties — same DataTable primitive as Home + History */}
      <div>
        <div className="flex items-end justify-between mb-3 gap-4">
          <h3
            className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Properties
          </h3>
          <span className="font-sans text-micro text-ink-3">
            Click any completed row to open the case
          </span>
        </div>
        <BatchTable rows={rows} />
      </div>

      <AutomateModal
        open={automateOpen}
        onClose={() => setAutomateOpen(false)}
        target={{ kind: 'batch', filename: batch.filename, total }}
        onConfirm={({ cadenceMonths }: { cadenceMonths: 3 | 4 | 6 | 12 }) => {
          addSchedule({
            kind: 'batch',
            filename: batch.filename,
            total,
            cadenceMonths,
          });
          setAutomateOpen(false);
          setConfirmation(`Batch automation scheduled · every ${cadenceMonths} months`);
        }}
      />

      {confirmation && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-md shadow-md font-sans text-label flex items-center gap-2"
          style={{ background: 'var(--navy)', color: 'white' }}
          role="status"
        >
          <span
            className="w-5 h-5 rounded-full grid place-items-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.16)' }}
            aria-hidden
          >
            <Icon name="check" size={12} />
          </span>
          {confirmation}
        </div>
      )}
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

  return (
    <DataTable
      columns={BATCH_COLUMNS}
      rows={rows}
      rowKey={(r: BatchRow) => String(r.id)}
      onRowClick={openIfDone}
      pageSize={25}
      leadingAccent={(r: BatchRow) =>
        r.status === 'done' && r.risk ? VERDICT_ACCENT[r.risk] : undefined
      }
    />
  );
}

// ---------- Sub-components ----------

const VERDICT_LABEL: Record<Risk, string> = {
  risk: 'Rented',
  warn: 'Possibly rented',
  clean: 'Not rented',
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
const BATCH_COLUMNS: any[] = [
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
    width: '60px',
    align: 'right' as const,
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) =>
      row.status === 'done' ? (
        <span
          className="font-mono tabular-nums font-semibold text-body-sm leading-none"
          style={{ color: 'var(--navy)' }}
        >
          {row.score}
        </span>
      ) : (
        <span className="text-ink-4">—</span>
      ),
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
