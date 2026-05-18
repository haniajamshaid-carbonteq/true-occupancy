/* global React, AppShell, Button, Icon, Pill, DataTable, DropdownMenu, Drawer, Tabs, ReactRouterDOM, SCENARIOS,
   HOME_VERDICT_LABEL, VERDICT_VARIANT, VERDICT_ACCENT, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT,
   SCAN_COLUMNS, scanLeadingAccent, useAppState, splitAddress, ChipRow, DateRangePicker, parseAgoHours,
   ReferenceCell, ScreenError, ScreenEmpty */

function scannedAgoToHours(label: string): number {
  if (!label) return NaN;
  const s = label.toLowerCase().trim();
  if (s === 'just now') return 0;
  if (s === 'yesterday') return 24;
  const m = s.match(/^(\d+)\s*(min|h|d|w|mo|y)\b/);
  if (!m) return NaN;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 'min': return n / 60;
    case 'h':   return n;
    case 'd':   return n * 24;
    case 'w':   return n * 24 * 7;
    case 'mo':  return n * 24 * 30;
    case 'y':   return n * 24 * 365;
    default:    return NaN;
  }
}

function formatScannedDate(scannedAgo: string): string {
  const hrs = scannedAgoToHours(scannedAgo);
  if (!Number.isFinite(hrs)) return scannedAgo;
  const d = new Date(Date.now() - hrs * 60 * 60 * 1000);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

type Verdict = 'all' | 'high' | 'medium' | 'low';
type Kind = 'single' | 'batch';
type BatchStatus = 'all' | 'complete' | 'partial' | 'failed';
type DateRange = { from?: string; to?: string };
type PlatformsBucket = 'all' | 'none' | 'any' | 'multi';
type ScoreRange = { min?: number; max?: number };

function rowScore(row: any): number | null {
  const sc = SCENARIOS[row.scenario as keyof typeof SCENARIOS];
  return sc ? sc.score : null;
}

// Derive a scanned-date ISO string from a row's relative-time seed value.
// Uses the same hour conversion as formatScannedDate so display + filter
// stay in lockstep.
function scannedIso(row: any): string {
  const hrs = scannedAgoToHours(row.scannedAgo);
  if (!Number.isFinite(hrs)) return '';
  const d = new Date(Date.now() - hrs * 60 * 60 * 1000);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function HistoryScreen() {
  const history = ReactRouterDOM.useHistory();
  const { history: rows, setSingleScanReference, pushTransient, loading, error } = useAppState();
  const [kind, setKind] = React.useState<Kind>('single');
  const [verdict, setVerdict] = React.useState<Verdict>('all');
  const [batchStatus, setBatchStatus] = React.useState<BatchStatus>('all');
  const [query, setQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange>({});
  const [platformsBucket, setPlatformsBucket] = React.useState<PlatformsBucket>('all');
  const [scoreRange, setScoreRange] = React.useState<ScoreRange>({});
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Platforms filter only makes sense on the single tab; it disappears
  // from the drawer on batch, so don't count it toward the badge there.
  // Verdict (single) / batch status (batch) also live in the drawer now.
  const dateRangeActive = Boolean(dateRange.from || dateRange.to);
  const scoreRangeActive =
    scoreRange.min !== undefined || scoreRange.max !== undefined;
  const advancedCount =
    (dateRangeActive ? 1 : 0) +
    (kind === 'single' && verdict !== 'all' ? 1 : 0) +
    (kind === 'batch'  && batchStatus !== 'all' ? 1 : 0) +
    (kind === 'single' && platformsBucket !== 'all' ? 1 : 0) +
    (kind === 'single' && scoreRangeActive ? 1 : 0);

  const singleRows = rows.filter((r: any) => r.kind !== 'batch');
  const batchRows  = rows.filter((r: any) => r.kind === 'batch');

  const filtered = (kind === 'single' ? singleRows : batchRows).filter((r: any) => {
    if (kind === 'single' && verdict !== 'all' && r.scenario !== verdict) return false;
    if (kind === 'batch' && batchStatus !== 'all') {
      const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
      if (status !== batchStatus) return false;
    }
    if (dateRangeActive) {
      const iso = scannedIso(r);
      if (!iso) return false;
      if (dateRange.from && iso < dateRange.from) return false;
      if (dateRange.to   && iso > dateRange.to)   return false;
    }
    if (kind === 'single' && platformsBucket !== 'all') {
      const p: number = r.platforms ?? 0;
      if (platformsBucket === 'none'  && p !== 0) return false;
      if (platformsBucket === 'any'   && p < 1)  return false;
      if (platformsBucket === 'multi' && p < 2)  return false;
    }
    if (kind === 'single' && scoreRangeActive) {
      const s = rowScore(r);
      if (s === null) return false;
      if (scoreRange.min !== undefined && s < scoreRange.min) return false;
      if (scoreRange.max !== undefined && s > scoreRange.max) return false;
    }
    if (query) {
      // Spec: unified search matches against address (or batch file),
      // batch name, AND the user-supplied reference. For a batch row, also
      // peek at the per-address references in the snapshot — that lets a
      // lender find the batch containing loan #ABC-123 by typing it.
      const q = query.toLowerCase();
      const primary = r.kind === 'batch' ? r.filename : r.address;
      const refHit = (r.reference ?? '').toLowerCase().includes(q);
      let primaryHit = primary.toLowerCase().includes(q);
      if (!primaryHit && !refHit && r.kind === 'batch') {
        primaryHit = (r.rows ?? []).some((bRow: any) =>
          (bRow.reference ?? '').toLowerCase().includes(q)
        );
      }
      if (!primaryHit && !refHit) return false;
    }
    return true;
  });

  function clearAdvanced() {
    setDateRange({});
    setPlatformsBucket('all');
    setVerdict('all');
    setBatchStatus('all');
    setScoreRange({});
  }

  const VERDICT_FILTERS: { id: Verdict; label: string; count: number }[] = [
    { id: 'all',    label: 'All',              count: singleRows.length },
    { id: 'high',   label: 'Rented',           count: singleRows.filter((r: any) => r.scenario === 'high').length },
    { id: 'medium', label: 'Possibly Rented',  count: singleRows.filter((r: any) => r.scenario === 'medium').length },
    { id: 'low',    label: 'Not Rented',       count: singleRows.filter((r: any) => r.scenario === 'low').length },
  ];

  const STATUS_FILTERS: { id: BatchStatus; label: string; count: number }[] = [
    { id: 'all',      label: 'All',             count: batchRows.length },
    { id: 'complete', label: 'Successful',      count: batchRows.filter((r: any) => (r.status ?? 'complete') === 'complete').length },
    { id: 'partial',  label: 'Partial Failed',  count: batchRows.filter((r: any) => r.status === 'partial').length },
    { id: 'failed',   label: 'Failed',          count: batchRows.filter((r: any) => r.status === 'failed').length },
  ];

  function openRow(row: any) {
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

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-end justify-between gap-6 mb-section-sub">
        <div>
          <h1
            className="font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            History
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2 whitespace-nowrap">
            Every scan you've run — searchable, filterable, click any row to reopen the case.
          </p>
        </div>
      </header>

      {/* Filter row — Single/Batch tabs on the left, search + Filters
          drawer on the right. All status filtering lives inside the drawer
          to keep the table breathing room. */}
      <section className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs
          value={kind}
          onChange={(v: any) => setKind(v)}
          items={[
            { value: 'single', label: 'Single', count: singleRows.length },
            { value: 'batch',  label: 'Batch',  count: batchRows.length },
          ]}
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
              <Icon name="search" size={14} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search by address, reference, or batch name"
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
      </section>

      {/* Advanced filter drawer */}
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
              Apply
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          {kind === 'single' ? (
            <ChipRow
              label="Verdict"
              value={verdict}
              onChange={(v: string) => setVerdict(v as Verdict)}
              options={VERDICT_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
            />
          ) : (
            <ChipRow
              label="Status"
              value={batchStatus}
              onChange={(v: string) => setBatchStatus(v as BatchStatus)}
              options={STATUS_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
            />
          )}
          <DateRangePicker
            label="When scanned"
            value={dateRange}
            onChange={setDateRange}
          />
          {kind === 'single' && (
            <ChipRow
              label="Listings found"
              value={platformsBucket}
              onChange={(v: string) => setPlatformsBucket(v as PlatformsBucket)}
              options={[
                { value: 'all',   label: 'Any' },
                { value: 'none',  label: 'No listings' },
                { value: 'any',   label: '1+ platform' },
                { value: 'multi', label: '2+ platforms' },
              ]}
            />
          )}
          {kind === 'single' && (
            <ScoreRangeField value={scoreRange} onChange={setScoreRange} />
          )}
        </div>
      </Drawer>

      {/* Table — falls back to ScreenError on fetch failure. Loading
          delegates to DataTable's skeleton. True-empty (no scans yet,
          unfiltered) shows a ScreenEmpty block instead of the table's
          filter-zero message. */}
      {error ? (
        <ScreenError
          title="Couldn't load your scans"
          message={error}
          onRetry={() => window.location.reload()}
        />
      ) : !loading && rows.length === 0 ? (
        <ScreenEmpty
          icon="history"
          title="No scans yet"
          message="Your scans and batch runs will appear here once you've run them."
          actionLabel="Scan a property"
          onAction={() => history.push('/')}
        />
      ) : (
        <DataTable
          columns={
            kind === 'single'
              ? buildHistorySingleColumns({
                  onSaveReference: (id: string, next?: string) => {
                    setSingleScanReference(id, next);
                    pushTransient(next ? 'Reference saved' : 'Reference cleared');
                  },
                })
              : HISTORY_BATCH_COLUMNS
          }
          rows={filtered}
          rowKey={(r: any) => r.id}
          onRowClick={openRow}
          pageSize={10}
          loading={loading}
          empty={
            <div className="px-5 py-12 text-center text-label text-ink-3">
              No scans match your filters.
            </div>
          }
        />
      )}

      {/* Footer caption */}
      <div className="mt-4 flex items-center justify-between text-caption text-ink-3">
        <span
          className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
          style={{ color: 'var(--ink-3)' }}
        >
          {filtered.length} of {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
        </span>
        <span>Older scans archived after 90 days.</span>
      </div>
    </AppShell>
  );
}

// ---- column defs --------------------------------------------------------
// Rows are split by tab, so single and batch carry their own column sets —
// no "Type" pill since the tab already conveys kind.

// Built inside the component because the Reference column needs access to
// the save handler + transient pusher. Keeping the other columns inline
// here so the entire single-tab column set is co-located.
function buildHistorySingleColumns(opts: { onSaveReference: (id: string, next?: string) => void }): any[] {
  return [
  // Reference — placed first per spec; lenders use it as the primary
  // identifier when scanning the table to find a loan.
  {
    key: 'reference',
    label: 'Reference',
    width: '200px',
    hideBelow: 'sm' as const,
    cell: (r: any) => (
      <ReferenceCell
        value={r.reference}
        onSave={(next?: string) => opts.onSaveReference(r.id, next)}
        maxWidth={180}
      />
    ),
  },
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
    key: 'score',
    label: 'Score',
    width: '128px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      const sc = SCENARIOS[r.scenario];
      return (
        <div className="flex items-center gap-inline">
          <span
            className="font-mono tabular-nums font-semibold text-label w-[24px] text-right leading-none"
            style={{ color: 'var(--navy)' }}
          >
            {sc.score}
          </span>
          <div className="flex-1 min-w-0">
            <div className="relative h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-2"
                style={{ width: `${Math.min(100, Math.max(0, sc.score))}%` }}
              />
            </div>
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
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">
        {r.platforms} / 3
      </span>
    ),
  },
  {
    key: 'scanned',
    label: 'Scanned',
    width: '120px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">
        {formatScannedDate(r.scannedAgo)}
      </span>
    ),
  },
  ];
}

const HISTORY_BATCH_COLUMNS: any[] = [
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
      const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
      return <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}</Pill>;
    },
  },
  {
    key: 'scanned',
    label: 'Scanned',
    width: '120px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">
        {formatScannedDate(r.scannedAgo)}
      </span>
    ),
  },
];

function ScoreRangeField({
  value,
  onChange,
}: {
  value: ScoreRange;
  onChange: (next: ScoreRange) => void;
}) {
  const active = value.min !== undefined || value.max !== undefined;
  const parse = (raw: string): number | undefined => {
    if (raw === '') return undefined;
    const n = Math.max(0, Math.min(100, parseInt(raw, 10)));
    return Number.isFinite(n) ? n : undefined;
  };
  const setMin = (raw: string) => {
    const next = parse(raw);
    if (next !== undefined && value.max !== undefined && next > value.max) {
      onChange({ min: next, max: next });
    } else {
      onChange({ ...value, min: next });
    }
  };
  const setMax = (raw: string) => {
    const next = parse(raw);
    if (next !== undefined && value.min !== undefined && next < value.min) {
      onChange({ min: next, max: next });
    } else {
      onChange({ ...value, max: next });
    }
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div
          className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--ink-3)' }}
        >
          Score range
        </div>
        {active && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="font-sans text-micro font-semibold hover:underline"
            style={{ color: 'var(--brand-deep)' }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ScoreField
          ariaLabel="Minimum score"
          placeholder="Min"
          value={value.min}
          onChange={setMin}
        />
        <span
          aria-hidden
          className="font-sans text-caption shrink-0"
          style={{ color: 'var(--ink-4)' }}
        >
          —
        </span>
        <ScoreField
          ariaLabel="Maximum score"
          placeholder="Max"
          value={value.max}
          onChange={setMax}
        />
      </div>
    </div>
  );
}

function ScoreField({
  ariaLabel,
  placeholder,
  value,
  onChange,
}: {
  ariaLabel: string;
  placeholder: string;
  value: number | undefined;
  onChange: (next: string) => void;
}) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      className="flex-1 min-w-0 flex items-center rounded-lg transition-shadow"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${focused ? 'var(--brand)' : 'var(--line)'}`,
        boxShadow: focused
          ? '0 0 0 3px var(--brand-soft), var(--shadow-sm)'
          : 'var(--shadow-sm)',
      }}
    >
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={100}
        step={1}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none h-9 px-3 text-caption font-sans tabular-nums"
        style={{ color: value !== undefined ? 'var(--ink)' : 'var(--ink-4)' }}
      />
    </div>
  );
}
