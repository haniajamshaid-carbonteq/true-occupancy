/* global React, AppShell, PageHeader, Card, Button, Pill, Icon, ReactRouterDOM */
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
  const [loaded, setLoaded] = React.useState(false);

  return (
    <AppShell>
      {loaded ? <BatchResults rows={SAMPLE_BATCH} /> : <BatchUpload onSample={() => setLoaded(true)} />}
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
        <h2 className="font-sans font-bold text-[28px] sm:text-[34px] tracking-[-0.005em] m-0 mb-2" style={{ color: 'var(--navy)' }}>
          Scan many properties at once.
        </h2>
        <p className="text-ink-3 text-[14.5px] leading-relaxed max-w-[48ch] m-0 mb-7">
          Drop a CSV with one address per row. We'll cross-check every entry against
          Airbnb, Vrbo, and Facebook Marketplace, then surface the matches in one
          reviewable queue.
        </p>

        {/* Drop-zone with hover affordance */}
        <label
          htmlFor="batch-csv"
          className="w-full max-w-[520px] cursor-pointer block rounded-lg border-2 border-dashed border-line-strong bg-surface-2 hover:bg-brand-soft hover:border-brand transition-colors px-6 py-8 mb-4"
        >
          <div className="font-medium text-ink-2 mb-1">
            Drop a CSV here, or <span className="text-brand">browse</span>
          </div>
          <div className="font-sans text-[11px] uppercase tracking-widest text-ink-4">
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

function BatchResults({ rows }: { rows: BatchRow[] }) {
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  const progress = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary card */}
      <Card>
        <div className="px-7 py-6">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <div className="font-sans text-[10.5px] uppercase tracking-widest text-ink-3 mb-1.5">
                Batch · asheville-q2-2026.csv
              </div>
              <h2 className="font-sans font-bold text-[32px] tracking-[-0.005em] m-0 leading-tight" style={{ color: 'var(--navy)' }}>
                {total} properties
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button icon={<Icon name="pdf" />}>Export CSV</Button>
              <Button variant="primary" icon={<Icon name="upload" />}>
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
            <div className="font-sans text-xs text-ink-3 shrink-0">
              {done}/{total} scanned · {running > 0 ? `${running} in progress` : 'queued'}
            </div>
          </div>

          {/* Status counts */}
          <div className="grid grid-cols-3 gap-3">
            <SummaryStat tone="risk"  count={flagged} label="Flagged" />
            <SummaryStat tone="warn"  count={warn}    label="Questionable" />
            <SummaryStat tone="clean" count={clean}   label="Clean" />
          </div>
        </div>
      </Card>

      {/* Properties table */}
      <Card>
        <div className="px-7 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-sans font-medium text-[18px] m-0">Properties</h3>
          <span className="font-sans text-[11.5px] text-ink-3">click any row to view detail</span>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_80px_140px_100px_36px] gap-4 px-7 py-3 bg-surface-2 border-b border-line font-sans text-[10.5px] uppercase tracking-widest text-ink-3">
          <div>#</div>
          <div>Address</div>
          <div className="text-right">Score</div>
          <div>Verdict</div>
          <div className="text-right">Listings</div>
          <div />
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <BatchRowItem key={row.id} index={i + 1} row={row} />
        ))}
      </Card>
    </div>
  );
}

// ---------- Sub-components ----------

const SUMMARY_TONE: Record<Risk, string> = {
  risk:  'bg-risk-soft text-risk-ink',
  warn:  'bg-warn-soft text-warn-ink',
  clean: 'bg-clean-soft text-clean-ink',
};

function SummaryStat({ tone, count, label }: { tone: Risk; count: number; label: string }) {
  return (
    <div className={`px-5 py-4 rounded-md ${SUMMARY_TONE[tone]}`}>
      <div className="font-sans font-bold text-[36px] leading-none tracking-[-0.02em] mb-1 tabular-nums">{count}</div>
      <div className="text-[13px] font-medium">{label}</div>
    </div>
  );
}

const VERDICT_LABEL: Record<Risk, string> = {
  risk: 'Red flag',
  warn: 'Questionable',
  clean: 'Clean',
};

// Map a row's risk band to the matching detail-screen route, so the demo
// has somewhere believable to drill into.
const ROUTE_FOR_RISK: Record<Risk, string> = {
  risk: '/result/high',
  warn: '/result/medium',
  clean: '/result/clean',
};

function BatchRowItem({ index, row }: { index: number; row: BatchRow }) {
  const history = ReactRouterDOM.useHistory();
  const isDone = row.status === 'done';
  const isRunning = row.status === 'running';
  const isQueued = row.status === 'queued';

  const onClick = () => {
    if (isDone && row.risk) history.push(ROUTE_FOR_RISK[row.risk]);
  };

  const rowCls = `grid grid-cols-[40px_1fr_80px_140px_100px_36px] gap-4 px-7 py-3.5 border-b border-line items-center ${
    isQueued ? 'opacity-50' : ''
  } ${isDone ? 'cursor-pointer hover:bg-surface-2 transition-colors' : ''}`;

  return (
    <div className={rowCls} onClick={onClick}>
      <div className="font-sans text-[11.5px] text-ink-4">{String(index).padStart(2, '0')}</div>
      <div className="text-[13.5px] font-medium text-ink truncate">{row.address}</div>
      <div className="text-right font-sans font-medium text-[18px] leading-none">
        {isDone ? row.score : <span className="text-ink-4">—</span>}
      </div>
      <div>
        {isDone && row.risk && (
          <Pill
            variant={row.risk === 'risk' ? 'risk' : row.risk === 'warn' ? 'warn' : 'clean'}
          >
            {VERDICT_LABEL[row.risk]}
          </Pill>
        )}
        {isRunning && <Pill variant="brand" dot>Scanning</Pill>}
        {isQueued && <Pill>Queued</Pill>}
      </div>
      <div className="text-right text-[13px] text-ink-2">
        {isDone ? `${row.listings} found` : <span className="text-ink-4">—</span>}
      </div>
      <div className="text-ink-3 grid place-items-center">
        {isDone && <Icon name="arrow-right" size={14} />}
      </div>
    </div>
  );
}
