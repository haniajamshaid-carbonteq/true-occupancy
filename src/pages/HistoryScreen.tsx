/* global React, ReactRouterDOM, AppShell, Sidebar, PageHeader, Card, Button, Pill, Icon, SearchBar, CertDownloadIcon */
// History screen.
//   /history              — search + filter + table of every scan
//   /history/:address_id  — one address's timeline with diff badges
//
// Flow: search address/batch → open property timeline → view a snapshot →
// download PDF evidence → compare runs → re-run / schedule.

// ---------- Types & vocabulary ----------

// Internal classification matches the upstream signals model. Display
// labels (below) use the legally-neutral vocabulary — "rental status" +
// "confidence band" — instead of risk/red-flag language.
type ScanLikelihood = 'likely' | 'possibly' | 'no-evidence';
type ConfidenceBand = 'high' | 'moderate' | 'low' | 'no-evidence';
type ScanTrigger = 'manual' | 'scheduled';
type HistoryPlatformId = 'airbnb' | 'vrbo' | 'fb';

interface HistoryScan {
  id: string;
  runId: number;
  /** Full datetime — scan completion timestamp. */
  date: Date;
  batchId: string;
  batchName: string;
  /** Underlying score 0–100. Not surfaced as the primary number anymore. */
  score: number;
  likelihood: ScanLikelihood;
  /** 0–100. Confidence in the likelihood finding. */
  confidence: number;
  platforms: HistoryPlatformId[];
  listingsCount: number;
  trigger: ScanTrigger;
}

interface AddressRecord {
  id: string;
  address: string;
  /** Newest scan first. */
  scans: HistoryScan[];
}

const HISTORY_ADDRESSES: AddressRecord[] = [
  {
    id: '1428-maplewood-dr',
    address: '1428 Maplewood Drive, Asheville, NC 28804',
    scans: [
      { id: 'mw-4', runId: 4, date: new Date('2026-05-11T02:14:00'), batchId: 'b3', batchName: 'asheville-q2-2026',  score: 87, likelihood: 'likely',      confidence: 92, platforms: ['airbnb', 'vrbo', 'fb'], listingsCount: 4, trigger: 'scheduled' },
      { id: 'mw-3', runId: 3, date: new Date('2026-01-11T03:02:00'), batchId: 'b2', batchName: 'asheville-q1-2026',  score: 78, likelihood: 'likely',      confidence: 80, platforms: ['airbnb', 'vrbo'],       listingsCount: 3, trigger: 'scheduled' },
      { id: 'mw-2', runId: 2, date: new Date('2025-09-11T02:48:00'), batchId: 'b2', batchName: 'asheville-q3-2025',  score: 64, likelihood: 'possibly',    confidence: 71, platforms: ['airbnb'],               listingsCount: 2, trigger: 'scheduled' },
      { id: 'mw-1', runId: 1, date: new Date('2025-05-11T10:30:00'), batchId: 'b1', batchName: 'asheville-q2-2025',  score: 32, likelihood: 'no-evidence', confidence: 60, platforms: [],                       listingsCount: 0, trigger: 'manual' },
    ],
  },
  {
    id: '67-charlotte-hwy',
    address: '67 Charlotte Hwy, Asheville, NC 28803',
    scans: [
      { id: 'ch-3', runId: 3, date: new Date('2026-05-11T14:22:00'), batchId: 'b3', batchName: 'spot-check-may-2026', score: 91, likelihood: 'likely',   confidence: 89, platforms: ['airbnb', 'vrbo', 'fb'], listingsCount: 5, trigger: 'manual' },
      { id: 'ch-2', runId: 2, date: new Date('2026-02-08T03:11:00'), batchId: 'b2', batchName: 'asheville-q1-2026',   score: 88, likelihood: 'likely',   confidence: 76, platforms: ['airbnb', 'fb'],         listingsCount: 4, trigger: 'scheduled' },
      { id: 'ch-1', runId: 1, date: new Date('2025-08-22T02:33:00'), batchId: 'b1', batchName: 'asheville-q3-2025',   score: 72, likelihood: 'possibly', confidence: 68, platforms: ['airbnb'],               listingsCount: 2, trigger: 'scheduled' },
    ],
  },
  {
    id: '215-edgewood-rd',
    address: '215 Edgewood Rd, Asheville, NC 28804',
    scans: [
      { id: 'eg-2', runId: 2, date: new Date('2026-05-11T02:51:00'), batchId: 'b3', batchName: 'asheville-q2-2026', score: 42, likelihood: 'possibly',    confidence: 41, platforms: ['airbnb'], listingsCount: 1, trigger: 'scheduled' },
      { id: 'eg-1', runId: 1, date: new Date('2025-11-04T11:18:00'), batchId: 'b1', batchName: 'asheville-q4-2025', score: 28, likelihood: 'no-evidence', confidence: 70, platforms: [],         listingsCount: 0, trigger: 'manual' },
    ],
  },
  {
    id: '502-n-liberty-st',
    address: '502 N Liberty St, Asheville, NC 28801',
    scans: [
      { id: 'nl-2', runId: 2, date: new Date('2026-05-11T02:08:00'), batchId: 'b3', batchName: 'asheville-q2-2026', score: 12, likelihood: 'no-evidence', confidence: 95, platforms: [], listingsCount: 0, trigger: 'scheduled' },
      { id: 'nl-1', runId: 1, date: new Date('2025-05-11T03:24:00'), batchId: 'b1', batchName: 'asheville-q2-2025', score: 18, likelihood: 'no-evidence', confidence: 88, platforms: [], listingsCount: 0, trigger: 'scheduled' },
    ],
  },
  {
    id: '800-hilliard-ave',
    address: '800 Hilliard Ave, Asheville, NC 28801',
    scans: [
      { id: 'hl-2', runId: 2, date: new Date('2026-05-11T02:36:00'), batchId: 'b3', batchName: 'asheville-q2-2026', score: 54, likelihood: 'possibly', confidence: 73, platforms: ['airbnb'], listingsCount: 1, trigger: 'scheduled' },
      { id: 'hl-1', runId: 1, date: new Date('2025-09-11T02:42:00'), batchId: 'b2', batchName: 'asheville-q3-2025', score: 48, likelihood: 'possibly', confidence: 78, platforms: ['airbnb'], listingsCount: 1, trigger: 'scheduled' },
    ],
  },
];

const HISTORY_PLATFORM_LABEL: Record<HistoryPlatformId, string> = {
  airbnb: 'Airbnb',
  vrbo:   'Vrbo',
  fb:     'Facebook',
};

const LIKELIHOOD_LABEL: Record<ScanLikelihood, string> = {
  likely:        'Likely Rented',
  possibly:      'Possibly Rented',
  'no-evidence': 'No Public Evidence',
};

// Pill variant for visual continuity — internal CSS names, surface labels
// use the neutral vocabulary above.
const LIKELIHOOD_VARIANT: Record<ScanLikelihood, 'risk' | 'warn' | 'default'> = {
  likely:        'risk',
  possibly:      'warn',
  'no-evidence': 'default',
};

const LIKELIHOOD_DOT: Record<ScanLikelihood, string> = {
  likely:        'bg-risk',
  possibly:      'bg-warn',
  'no-evidence': 'bg-ink-4',
};
const LIKELIHOOD_TONE: Record<ScanLikelihood, string> = {
  likely:        'bg-risk-soft text-risk-ink',
  possibly:      'bg-warn-soft text-warn-ink',
  'no-evidence': 'bg-surface-2 text-ink-3',
};

const LIKELIHOOD_ROUTE: Record<ScanLikelihood, string> = {
  likely:        '/result/high',
  possibly:      '/result/medium',
  'no-evidence': '/result/clean',
};

function confidenceBand(score: number, likelihood: ScanLikelihood): ConfidenceBand {
  if (likelihood === 'no-evidence') return 'no-evidence';
  if (score >= 80) return 'high';
  if (score >= 60) return 'moderate';
  return 'low';
}

const CONFIDENCE_LABEL: Record<ConfidenceBand, string> = {
  high:          'High',
  moderate:      'Moderate',
  low:           'Low',
  'no-evidence': 'No signal',
};

const CONFIDENCE_TONE: Record<ConfidenceBand, string> = {
  high:          'text-brand',
  moderate:      'text-warn-ink',
  low:           'text-ink-2',
  'no-evidence': 'text-ink-3',
};

function formatHistoryDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatHistoryDateTime(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ---------- Top-level screen ----------

function HistoryScreen() {
  const params = ReactRouterDOM.useParams() as { address_id?: string };
  const selected = params.address_id
    ? HISTORY_ADDRESSES.find((a) => a.id === params.address_id) ?? null
    : null;

  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader showSearch={false} />
      <div className="mt-5">
        {selected ? <AddressDetail address={selected} /> : <ScansBrowse />}
      </div>
    </AppShell>
  );
}

// ---------- Browse: search + filters + table ----------

interface ScanRow {
  scan: HistoryScan;
  addressId: string;
  address: string;
}

function allScanRows(): ScanRow[] {
  const rows: ScanRow[] = [];
  for (const a of HISTORY_ADDRESSES) {
    for (const s of a.scans) {
      rows.push({ scan: s, addressId: a.id, address: a.address });
    }
  }
  // Newest first
  return rows.sort((a, b) => b.scan.date.getTime() - a.scan.date.getTime());
}

type DateRangeFilter = 'all' | '7d' | '30d' | '90d' | '1y';
type LikelihoodFilter = 'all' | ScanLikelihood;
type ConfidenceFilter = 'all' | ConfidenceBand;
type TriggerFilter = 'all' | ScanTrigger;
type BatchStatusFilter = 'all' | 'completed' | 'in-progress';

interface FilterState {
  dateRange: DateRangeFilter;
  likelihood: LikelihoodFilter;
  confidence: ConfidenceFilter;
  batch: string; // batch name or 'all'
  batchStatus: BatchStatusFilter;
  trigger: TriggerFilter;
}

const INITIAL_FILTERS: FilterState = {
  dateRange:   'all',
  likelihood:  'all',
  confidence:  'all',
  batch:       'all',
  batchStatus: 'all',
  trigger:     'all',
};

const DATE_RANGE_LABEL: Record<DateRangeFilter, string> = {
  all: 'All time', '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '1y': 'Last year',
};

function dateRangeStart(range: DateRangeFilter): Date | null {
  if (range === 'all') return null;
  const now = new Date('2026-05-11T23:59:59');
  const d = new Date(now);
  if (range === '7d')  d.setDate(d.getDate() - 7);
  if (range === '30d') d.setDate(d.getDate() - 30);
  if (range === '90d') d.setDate(d.getDate() - 90);
  if (range === '1y')  d.setFullYear(d.getFullYear() - 1);
  return d;
}

function applyFilters(rows: ScanRow[], query: string, f: FilterState): ScanRow[] {
  const q = query.trim().toLowerCase();
  const start = dateRangeStart(f.dateRange);

  return rows.filter((r) => {
    if (q) {
      const hitAddress = r.address.toLowerCase().includes(q);
      const hitBatch = r.scan.batchName.toLowerCase().includes(q);
      if (!hitAddress && !hitBatch) return false;
    }
    if (start && r.scan.date < start) return false;
    if (f.likelihood !== 'all' && r.scan.likelihood !== f.likelihood) return false;
    if (f.confidence !== 'all' && confidenceBand(r.scan.confidence, r.scan.likelihood) !== f.confidence) return false;
    if (f.batch !== 'all' && r.scan.batchName !== f.batch) return false;
    if (f.trigger !== 'all' && r.scan.trigger !== f.trigger) return false;
    // batchStatus is informational only in the prototype — every demo scan
    // is "completed". The filter is wired but won't reduce the set.
    return true;
  });
}

function ScansBrowse() {
  const [query, setQuery] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [filters, setFilters] = React.useState<FilterState>(INITIAL_FILTERS);

  // 250ms debounce so the table doesn't churn on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const allRows = React.useMemo(() => allScanRows(), []);
  const filtered = React.useMemo(
    () => applyFilters(allRows, debounced, filters),
    [allRows, debounced, filters],
  );

  const batchNames = React.useMemo(() => {
    const set = new Set(allRows.map((r) => r.scan.batchName));
    return Array.from(set).sort();
  }, [allRows]);

  const activeFilterCount = Object.entries(filters)
    .filter(([, v]) => v !== 'all').length + (debounced.trim() ? 1 : 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <Card>
        <div className="px-7 pt-7 pb-3">
          <h2 className="font-serif text-[28px] font-normal m-0 mb-1.5">History</h2>
          <p className="text-ink-3 text-[14px] leading-relaxed m-0 max-w-[62ch]">
            Every scan, searchable and filterable. Find an address or a batch,
            open the property timeline, or jump straight to the PDF evidence.
          </p>
        </div>
        <div className="px-7 pb-5">
          <SearchBar
            icon={<Icon name="search" size={18} />}
            placeholder="Search by address or batch name"
            value={query}
            onChange={(e: { target: HTMLInputElement }) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="px-7 pb-7 flex flex-wrap items-center gap-2">
          <FilterChip
            label="Date"
            value={filters.dateRange}
            renderValue={(v) => DATE_RANGE_LABEL[v]}
            options={(['all', '7d', '30d', '90d', '1y'] as DateRangeFilter[]).map((v) => ({
              value: v, label: DATE_RANGE_LABEL[v],
            }))}
            onChange={(v) => setFilters((s) => ({ ...s, dateRange: v }))}
          />
          <FilterChip
            label="Result"
            value={filters.likelihood}
            renderValue={(v) => v === 'all' ? 'Any' : LIKELIHOOD_LABEL[v]}
            options={[
              { value: 'all', label: 'Any' },
              { value: 'likely', label: 'Likely Rented' },
              { value: 'possibly', label: 'Possibly Rented' },
              { value: 'no-evidence', label: 'No Public Evidence' },
            ] as { value: LikelihoodFilter; label: string }[]}
            onChange={(v) => setFilters((s) => ({ ...s, likelihood: v }))}
          />
          <FilterChip
            label="Confidence"
            value={filters.confidence}
            renderValue={(v) => v === 'all' ? 'Any' : CONFIDENCE_LABEL[v]}
            options={[
              { value: 'all', label: 'Any' },
              { value: 'high', label: 'High' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'low', label: 'Low' },
              { value: 'no-evidence', label: 'No signal' },
            ] as { value: ConfidenceFilter; label: string }[]}
            onChange={(v) => setFilters((s) => ({ ...s, confidence: v }))}
          />
          <FilterChip
            label="Batch"
            value={filters.batch}
            renderValue={(v) => v === 'all' ? 'All batches' : v}
            options={[
              { value: 'all', label: 'All batches' },
              ...batchNames.map((b) => ({ value: b, label: b })),
            ]}
            onChange={(v) => setFilters((s) => ({ ...s, batch: v }))}
          />
          <FilterChip
            label="Batch status"
            value={filters.batchStatus}
            renderValue={(v) => v === 'all' ? 'Any' : v === 'completed' ? 'Completed' : 'In progress'}
            options={[
              { value: 'all', label: 'Any' },
              { value: 'completed', label: 'Completed' },
              { value: 'in-progress', label: 'In progress' },
            ] as { value: BatchStatusFilter; label: string }[]}
            onChange={(v) => setFilters((s) => ({ ...s, batchStatus: v }))}
          />
          <FilterChip
            label="Trigger"
            value={filters.trigger}
            renderValue={(v) => v === 'all' ? 'Any' : v === 'manual' ? 'Manual' : 'Scheduled'}
            options={[
              { value: 'all', label: 'Any' },
              { value: 'manual', label: 'Manual' },
              { value: 'scheduled', label: 'Scheduled' },
            ] as { value: TriggerFilter; label: string }[]}
            onChange={(v) => setFilters((s) => ({ ...s, trigger: v }))}
          />

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => { setFilters(INITIAL_FILTERS); setQuery(''); }}
              className="ml-1 font-mono text-[11.5px] uppercase tracking-widest text-ink-3 hover:text-ink-2 transition-colors inline-flex items-center gap-1"
            >
              <Icon name="x" size={11} />
              Clear all
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="px-7 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-serif text-[20px] font-normal m-0">Scans</h3>
          <span className="font-mono text-[11.5px] text-ink-3">
            {filtered.length} of {allRows.length} {allRows.length === 1 ? 'scan' : 'scans'}
          </span>
        </div>

        <div className="grid grid-cols-[1.6fr_180px_160px_180px_60px_100px] gap-4 px-7 py-3 bg-surface-2 border-b border-line font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <div>Address</div>
          <div>Scan date & time</div>
          <div>Result</div>
          <div>Batch</div>
          <div className="text-center">PDF</div>
          <div className="text-right">Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-7 py-12 text-center">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-2">
              No matching scans
            </div>
            <p className="text-[13.5px] text-ink-2 m-0">
              Try widening your filters or clearing the search.
            </p>
          </div>
        ) : (
          filtered.map((row) => <ScanTableRow key={row.scan.id} row={row} />)
        )}
      </Card>
    </div>
  );
}

function ScanTableRow({ row }: { row: ScanRow }) {
  const history = ReactRouterDOM.useHistory();
  const { scan, address, addressId } = row;
  const band = confidenceBand(scan.confidence, scan.likelihood);

  const onView = () => history.push(`/history/${addressId}`);
  const onRerun = () => history.push(`/?prefill=${encodeURIComponent(address)}`);

  return (
    <div className="group grid grid-cols-[1.6fr_180px_160px_180px_60px_100px] gap-4 px-7 py-3.5 border-b border-line items-center">
      {/* Address */}
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink truncate">{address}</div>
        <div className="font-mono text-[10.5px] text-ink-3 mt-0.5">
          Run #{scan.runId} · {scan.trigger}
        </div>
      </div>

      {/* Scan date & time */}
      <div className="text-[13px] text-ink-2 leading-tight">
        {formatHistoryDateTime(scan.date)}
      </div>

      {/* Result + confidence */}
      <div className="flex flex-col gap-1">
        <Pill variant={LIKELIHOOD_VARIANT[scan.likelihood]}>
          {LIKELIHOOD_LABEL[scan.likelihood]}
        </Pill>
        <span className={`font-mono text-[10.5px] uppercase tracking-widest ${CONFIDENCE_TONE[band]}`}>
          {CONFIDENCE_LABEL[band]} · {scan.confidence}%
        </span>
      </div>

      {/* Batch */}
      <div className="font-mono text-[12px] text-ink-2 truncate">{scan.batchName}</div>

      {/* PDF */}
      <div className="grid place-items-center">
        <CertDownloadIcon
          payload={{
            address,
            date: scan.date,
            score: scan.score,
            risk: scan.likelihood === 'likely' ? 'risk' : scan.likelihood === 'possibly' ? 'warn' : 'clean',
            context: `${scan.batchName} · Run #${scan.runId}`,
          }}
          label="Save this scan's certificate"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5">
        <RowActionButton icon="arrow-right" label="View timeline" onClick={onView} />
        <RowActionButton icon="replay" label="Re-run scan" onClick={onRerun} />
      </div>
    </div>
  );
}

function RowActionButton({
  icon,
  label,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); onClick(); }}
      title={label}
      aria-label={label}
      className="w-7 h-7 grid place-items-center rounded-sm border border-line bg-surface text-ink-3 hover:text-ink hover:border-line-strong transition-colors"
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

// ---------- FilterChip — dropdown-as-pill ----------

interface FilterChipProps<V extends string> {
  label: string;
  value: V;
  renderValue: (v: V) => string;
  options: { value: V; label: string }[];
  onChange: (v: V) => void;
}

function FilterChip<V extends string>({
  label,
  value,
  renderValue,
  options,
  onChange,
}: FilterChipProps<V>) {
  const [open, setOpen] = React.useState(false);
  const isActive = value !== 'all';
  const chipCls = isActive
    ? 'bg-brand-tint border-brand text-ink hover:border-brand'
    : 'bg-surface border-line text-ink-2 hover:border-line-strong';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-sm border text-[12.5px] font-medium transition-colors ${chipCls}`}
      >
        <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">{label}</span>
        <span>{renderValue(value)}</span>
        <Icon name="chevron" size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 bg-surface border border-line rounded-md shadow-md min-w-[200px] max-h-[280px] overflow-y-auto">
            {options.map((opt) => {
              const selected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full text-left px-3.5 py-2 hover:bg-surface-2 border-b border-line last:border-b-0 flex items-center justify-between gap-3 text-[13px] ${selected ? 'text-brand' : 'text-ink-2'}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {selected && <Icon name="check" size={12} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Address detail: header + timeline ----------

function AddressDetail({ address }: { address: AddressRecord }) {
  const history = ReactRouterDOM.useHistory();
  const latest = address.scans[0];

  // Pre-fill the canonical address. Home screen reads `?prefill=` to
  // populate its scan input.
  const onRunNewScan = () => {
    history.push(`/?prefill=${encodeURIComponent(address.address)}`);
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="px-7 py-6 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => history.push('/history')}
              className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 hover:text-ink-2 mb-2 inline-flex items-center gap-1"
            >
              <span className="inline-flex rotate-180">
                <Icon name="arrow-right" size={11} />
              </span>
              Back to history
            </button>
            <h2 className="font-serif text-[26px] font-normal m-0 leading-tight">
              {address.address}
            </h2>
            <div className="text-[13px] text-ink-3 mt-2">
              {address.scans.length} scans · most recent {formatHistoryDate(latest.date)} ·{' '}
              <span className={`font-medium ${latest.likelihood === 'likely' ? 'text-risk-ink' : latest.likelihood === 'possibly' ? 'text-warn-ink' : 'text-ink-2'}`}>
                {LIKELIHOOD_LABEL[latest.likelihood]}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            <Button variant="primary" onClick={onRunNewScan} icon={<Icon name="spark" />}>
              Run new scan
            </Button>
          </div>
        </div>
      </Card>

      <ScanTimeline address={address} />
    </div>
  );
}

// ---------- ScanTimeline + diff logic ----------

interface ScanDiff {
  resultFlip?: { from: ScanLikelihood; to: ScanLikelihood };
  /** Signed integer percentage points. Set only when |delta| >= threshold. */
  confidenceDelta?: number;
  platformsAdded?: HistoryPlatformId[];
  platformsRemoved?: HistoryPlatformId[];
}

const CONFIDENCE_DELTA_THRESHOLD = 5;

function diffScans(prev: HistoryScan, curr: HistoryScan): ScanDiff {
  const diff: ScanDiff = {};
  if (prev.likelihood !== curr.likelihood) {
    diff.resultFlip = { from: prev.likelihood, to: curr.likelihood };
  }
  const confDelta = curr.confidence - prev.confidence;
  if (Math.abs(confDelta) >= CONFIDENCE_DELTA_THRESHOLD) {
    diff.confidenceDelta = confDelta;
  }
  const prevSet = new Set(prev.platforms);
  const currSet = new Set(curr.platforms);
  const added = curr.platforms.filter((p) => !prevSet.has(p));
  const removed = prev.platforms.filter((p) => !currSet.has(p));
  if (added.length) diff.platformsAdded = added;
  if (removed.length) diff.platformsRemoved = removed;
  return diff;
}

function diffEmpty(d: ScanDiff): boolean {
  return (
    !d.resultFlip &&
    d.confidenceDelta === undefined &&
    !d.platformsAdded &&
    !d.platformsRemoved
  );
}

function ScanTimeline({ address }: { address: AddressRecord }) {
  return (
    <Card>
      <div className="px-7 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon name="history" size={18} />
          <h3 className="font-serif text-[20px] font-normal m-0">Scan timeline</h3>
        </div>
        <span className="font-mono text-[11.5px] text-ink-3">newest first</span>
      </div>

      <div className="px-7 py-6">
        {address.scans.map((scan, i) => {
          const isOldest = i === address.scans.length - 1;
          const olderScan = isOldest ? null : address.scans[i + 1];
          const diff = olderScan ? diffScans(olderScan, scan) : null;

          return (
            <React.Fragment key={scan.id}>
              <TimelineEntry scan={scan} isInitial={isOldest} address={address.address} />
              {diff && !diffEmpty(diff) && <DiffStrip diff={diff} />}
              {diff && diffEmpty(diff) && <DiffStripUnchanged />}
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
}

function TimelineEntry({
  scan,
  isInitial,
  address,
}: {
  scan: HistoryScan;
  isInitial: boolean;
  address: string;
}) {
  const history = ReactRouterDOM.useHistory();
  const band = confidenceBand(scan.confidence, scan.likelihood);
  return (
    <div className="flex items-stretch gap-4">
      <TimelineRail kind="dot" likelihood={scan.likelihood} hideTail={isInitial} />

      <div
        className="flex-1 mb-1 rounded-md border border-line bg-surface hover:border-line-strong transition-colors cursor-pointer"
        onClick={() => history.push(LIKELIHOOD_ROUTE[scan.likelihood])}
      >
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
                Run #{scan.runId} · {formatHistoryDateTime(scan.date)} · {scan.trigger}
              </span>
              {isInitial && (
                <span className="font-mono text-[10px] text-ink-4 uppercase">initial</span>
              )}
            </div>
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <Pill variant={LIKELIHOOD_VARIANT[scan.likelihood]}>
                {LIKELIHOOD_LABEL[scan.likelihood]}
              </Pill>
              <span className={`font-mono text-[11px] uppercase tracking-widest ${CONFIDENCE_TONE[band]}`}>
                {CONFIDENCE_LABEL[band]} confidence · {scan.confidence}%
              </span>
            </div>
            <div className="text-[13px] text-ink-3">
              <span className="font-mono">{scan.batchName}</span>
              {scan.platforms.length > 0 ? (
                <>
                  <span className="mx-2 text-ink-4">·</span>
                  <span>
                    {scan.listingsCount} listing{scan.listingsCount === 1 ? '' : 's'} on{' '}
                    {scan.platforms.map((p) => HISTORY_PLATFORM_LABEL[p]).join(', ')}
                  </span>
                </>
              ) : (
                <>
                  <span className="mx-2 text-ink-4">·</span>
                  <span>no public listings found</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-1">
            <CertDownloadIcon
              payload={{
                address,
                date: scan.date,
                score: scan.score,
                risk: scan.likelihood === 'likely' ? 'risk' : scan.likelihood === 'possibly' ? 'warn' : 'clean',
                context: `${scan.batchName} · Run #${scan.runId}`,
              }}
            />
            <Icon name="arrow-right" size={14} className="text-ink-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRail({
  kind,
  likelihood,
  hideTail = false,
}: {
  kind: 'dot' | 'tail';
  likelihood?: ScanLikelihood;
  hideTail?: boolean;
}) {
  if (kind === 'tail') {
    return (
      <div className="flex flex-col items-center shrink-0 w-3">
        <div className="flex-1 w-px bg-line" />
      </div>
    );
  }
  const dotCls = likelihood ? LIKELIHOOD_DOT[likelihood] : 'bg-ink-4';
  return (
    <div className="flex flex-col items-center shrink-0 w-3">
      <div className={`w-3 h-3 rounded-full ${dotCls} ring-4 ring-surface mt-2`} />
      {!hideTail && <div className="flex-1 w-px bg-line my-1" />}
    </div>
  );
}

function DiffStrip({ diff }: { diff: ScanDiff }) {
  return (
    <div className="flex items-stretch gap-4 -mt-1 mb-1">
      <TimelineRail kind="tail" />
      <div className="flex-1 py-2 flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-4 mr-0.5">
          Changed:
        </span>
        {diff.resultFlip && (
          <ResultFlipBadge from={diff.resultFlip.from} to={diff.resultFlip.to} />
        )}
        {diff.confidenceDelta !== undefined && (
          <ConfidenceDeltaBadge delta={diff.confidenceDelta} />
        )}
        {diff.platformsAdded && (
          <PlatformsBadge ids={diff.platformsAdded} kind="added" />
        )}
        {diff.platformsRemoved && (
          <PlatformsBadge ids={diff.platformsRemoved} kind="removed" />
        )}
      </div>
    </div>
  );
}

function DiffStripUnchanged() {
  return (
    <div className="flex items-stretch gap-4 -mt-1 mb-1">
      <TimelineRail kind="tail" />
      <div className="flex-1 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-4">
          No change since previous scan
        </span>
      </div>
    </div>
  );
}

const DIFF_BADGE_BASE =
  'px-2 py-1 rounded-sm text-[11.5px] font-medium inline-flex items-center gap-1';

function ResultFlipBadge({ from, to }: { from: ScanLikelihood; to: ScanLikelihood }) {
  // Color by destination — the salient outcome.
  return (
    <span className={`${DIFF_BADGE_BASE} ${LIKELIHOOD_TONE[to]}`}>
      <Icon name="flag" size={11} />
      result: {LIKELIHOOD_LABEL[from].toLowerCase()} → {LIKELIHOOD_LABEL[to].toLowerCase()}
    </span>
  );
}

function ConfidenceDeltaBadge({ delta }: { delta: number }) {
  const positive = delta > 0;
  const tone = positive ? 'bg-clean-soft text-clean-ink' : 'bg-warn-soft text-warn-ink';
  const sign = positive ? '+' : '';
  return (
    <span className={`${DIFF_BADGE_BASE} ${tone}`}>
      <Icon name={positive ? 'trend-up' : 'trend-down'} size={11} />
      {sign}{delta} confidence
    </span>
  );
}

function PlatformsBadge({
  ids,
  kind,
}: {
  ids: HistoryPlatformId[];
  kind: 'added' | 'removed';
}) {
  const tone = kind === 'added' ? 'bg-brand-soft text-brand' : 'bg-surface-2 text-ink-3';
  const label = ids.map((p) => HISTORY_PLATFORM_LABEL[p]).join(', ');
  return (
    <span className={`${DIFF_BADGE_BASE} ${tone}`}>
      <Icon name={kind === 'added' ? 'check' : 'x'} size={11} />
      {kind === 'added' ? 'new on' : 'gone from'} {label}
    </span>
  );
}
