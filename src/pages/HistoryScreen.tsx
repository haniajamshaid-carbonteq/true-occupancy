/* global React, AppShell, Button, Icon, Pill, DataTable, DropdownMenu, Drawer, Tabs, ReactRouterDOM, SCENARIOS,
   HOME_VERDICT_LABEL, VERDICT_VARIANT, VERDICT_ACCENT, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT,
   SCAN_COLUMNS, scanLeadingAccent, useAppState, splitAddress, ChipRow, DateRangePicker, parseAgoHours,
   deriveTitleFromFilename, ScreenError, ScreenEmpty,
   RedFlag, BatchRedBadge, occMatchForRisk, OCC_STATUS_LABEL, OCC_STATUS_MATCH_LABEL, OCC_STATUS_TONE,
   OCC_INTENT_SHORT, resolveIntent, summarizeBatchIntent, batchIntentBreakdown */

// Keep one row per key — the most recently scanned. Stable enough for the
// History list (re-scans collapse; the full run list lives on the detail view).
function dedupeLatest<T extends { scannedAt?: number }>(rows: T[], keyFn: (r: T) => string): T[] {
  const latest = new Map<string, T>();
  for (const r of rows) {
    const k = keyFn(r);
    const cur = latest.get(k);
    if (!cur || (r.scannedAt || 0) > (cur.scannedAt || 0)) latest.set(k, r);
  }
  return [...latest.values()];
}

function formatScannedDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
  });
}

type Kind = 'single' | 'batch';

// Reconciliation status of a history row, straight from the config matrix
// (declared intent × what the scan found → green | yellow | red). This is the
// single source of truth the "Flagged" filter, the red ⚠ marker, and the batch
// red badge all read from — so History agrees with Config and with the batch
// screen. For a single scan it's the row's own status; for a batch it's the
// worst status across its properties (any red → red, else any yellow, else
// green), matching the old "any red row makes the batch red" behaviour.
type OccStatus = 'green' | 'yellow' | 'red';

function singleStatus(r: any): OccStatus | null {
  const risk = SCENARIOS[r.scenario as keyof typeof SCENARIOS]?.risk;
  return (occMatchForRisk(r.intent, risk)?.status as OccStatus) ?? null;
}
function batchStatusAgg(r: any): OccStatus | null {
  const subs: OccStatus[] = (r.rows || [])
    .map((x: any) => occMatchForRisk(x.intent ?? r.defaultIntent, x.risk)?.status as OccStatus)
    .filter(Boolean);
  if (subs.includes('red')) return 'red';
  if (subs.includes('yellow')) return 'yellow';
  if (subs.includes('green')) return 'green';
  return null;
}
function rowStatus(r: any): OccStatus | null {
  return r.kind === 'batch' ? batchStatusAgg(r) : singleStatus(r);
}
// Count of red subrows in a batch — drives the inline red badge on batch rows.
function batchRedCount(r: any): number {
  return (r.rows || []).filter(
    (x: any) => occMatchForRisk(x.intent ?? r.defaultIntent, x.risk)?.status === 'red'
  ).length;
}
type BatchStatus = 'all' | 'complete' | 'partial' | 'failed';
type DateRange = { from?: string; to?: string };
type PlatformsBucket = 'all' | 'none' | 'any' | 'multi';
type ScoreRange = { min?: number; max?: number };

function rowScore(row: any): number | null {
  const sc = SCENARIOS[row.scenario as keyof typeof SCENARIOS];
  return sc ? sc.score : null;
}

function scannedIso(row: any): string {
  if (!row.scannedAt) return '';
  const d = new Date(row.scannedAt);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function HistoryScreen() {
  const history = ReactRouterDOM.useHistory();
  const { history: rows, loading, error } = useAppState();
  const [kind, setKind] = React.useState<Kind>('single');
  const [batchStatus, setBatchStatus] = React.useState<BatchStatus>('all');
  const [query, setQuery] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange>({});
  const [platformsBucket, setPlatformsBucket] = React.useState<PlatformsBucket>('all');
  const [scoreRange, setScoreRange] = React.useState<ScoreRange>({});
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // Reconciliation "Flagged" filter — Green / Yellow / Red, straight from the
  // config outcome matrix. Lives in the Filters drawer, not as a top-level tab.
  const [flagged, setFlagged] = React.useState<'all' | OccStatus>('all');

  // Platforms filter only makes sense on the single tab; it disappears
  // from the drawer on batch, so don't count it toward the badge there.
  // Status filtering is the reconciliation "Flagged" filter (single + batch);
  // batch also has its scan-status filter. Raw verdicts are no longer a filter.
  const dateRangeActive = Boolean(dateRange.from || dateRange.to);
  const scoreRangeActive =
    scoreRange.min !== undefined || scoreRange.max !== undefined;
  const advancedCount =
    (dateRangeActive ? 1 : 0) +
    (flagged !== 'all' ? 1 : 0) +
    (kind === 'batch'  && batchStatus !== 'all' ? 1 : 0) +
    (kind === 'single' && platformsBucket !== 'all' ? 1 : 0) +
    (kind === 'single' && scoreRangeActive ? 1 : 0);

  // Collapse repeated scans of the same target to ONE row (the latest run), so
  // re-scanning a property or re-running a batch never stacks new rows. The full
  // timeline lives in the "Run history" section on each detail view. Single =
  // by address, batch = by filename. Display-only: every run stays in `history`
  // so Run history can list them all.
  const singleRows = dedupeLatest(
    rows.filter((r: any) => r.kind !== 'batch'),
    (r: any) => (r.address || '').toLowerCase().replace(/\s+/g, ' ').trim()
  );
  const batchRows = dedupeLatest(
    rows.filter((r: any) => r.kind === 'batch'),
    (r: any) => r.filename
  );

  const baseRows = kind === 'single' ? singleRows : batchRows;
  // Per-status counts in the current tab — shown beside each Flagged chip.
  const flaggedCounts: Record<OccStatus, number> = {
    green:  baseRows.filter((r: any) => rowStatus(r) === 'green').length,
    yellow: baseRows.filter((r: any) => rowStatus(r) === 'yellow').length,
    red:    baseRows.filter((r: any) => rowStatus(r) === 'red').length,
  };

  const filtered = baseRows.filter((r: any) => {
    if (flagged !== 'all' && rowStatus(r) !== flagged) return false;
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
      // Batch rows now show title as primary — match against title OR the
      // original filename so users can search by either, since both are
      // still visible in the cell.
      const haystacks: string[] =
        r.kind === 'batch'
          ? [r.title || deriveTitleFromFilename(r.filename), r.filename]
          : [r.address];
      const q = query.toLowerCase();
      if (!haystacks.some((h: string) => h.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  function clearAdvanced() {
    setDateRange({});
    setPlatformsBucket('all');
    setBatchStatus('all');
    setScoreRange({});
    setFlagged('all');
  }

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
    // Carry the declared intent so the result page reconciles it against the
    // verdict. Cleared when absent so a prior scan's intent never leaks in.
    if (row.intent) sessionStorage.setItem('scanIntent', row.intent);
    else sessionStorage.removeItem('scanIntent');
    // Stamp when the report was served so the result's freshness banner can
    // show fresh vs stale. Derived from the row's age; old rows read stale.
    const servedIso = scannedIso(row);
    sessionStorage.setItem(
      'resultServedAt',
      servedIso ? `${servedIso}T09:00:00` : new Date().toISOString()
    );
    sessionStorage.removeItem('resultCached');
    // Thread the entry's id + reference so the result page can show the
    // saved reference (if any) and route inline edits back to this entry
    // via setSingleScanReference(historyId, ref).
    sessionStorage.setItem('scanHistoryId', row.id);
    if (row.reference) {
      sessionStorage.setItem('scanReference', row.reference);
    } else {
      sessionStorage.removeItem('scanReference');
    }
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
        <div className="flex items-center gap-3 min-w-0">
          <Tabs
            value={kind}
            onChange={(v: any) => setKind(v)}
            items={[
              { value: 'single', label: 'Single', count: singleRows.length },
              { value: 'batch',  label: 'Batch',  count: batchRows.length },
            ]}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
              <Icon name="search" size={14} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Filter by address or file"
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
          {kind === 'batch' && (
            <ChipRow
              label="Status"
              value={batchStatus}
              onChange={(v: string) => setBatchStatus(v as BatchStatus)}
              options={STATUS_FILTERS.map((f) => ({ value: f.id, label: f.label }))}
            />
          )}
          {/* Flagged — the config outcome-matrix status (Green / Yellow / Red).
              Same labels as the Config screen, so what's "red" here is exactly
              what the matrix defines. Replaces the old top-level Red-flags tab. */}
          <ChipRow
            label="Verdict"
            value={flagged}
            onChange={(v: string) => setFlagged(v as 'all' | OccStatus)}
            options={[
              { value: 'all',    label: 'All' },
              { value: 'green',  label: OCC_STATUS_MATCH_LABEL.green,  count: flaggedCounts.green },
              { value: 'yellow', label: OCC_STATUS_MATCH_LABEL.yellow, count: flaggedCounts.yellow },
              { value: 'red',    label: OCC_STATUS_MATCH_LABEL.red,    count: flaggedCounts.red },
            ]}
          />
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
      ) : !loading && baseRows.length === 0 ? (
        <ScreenEmpty
          icon="history"
          title="No scans yet"
          message="Your scans and batch runs will appear here once you've run them."
          actionLabel="Scan a property"
          onAction={() => history.push('/')}
        />
      ) : (
        <DataTable
          columns={kind === 'single' ? HISTORY_SINGLE_COLUMNS : HISTORY_BATCH_COLUMNS}
          rows={filtered}
          rowKey={(r: any) => r.id}
          onRowClick={openRow}
          pageSize={10}
          loading={loading}
          empty={
            <div className="px-5 py-12 text-center text-label text-ink-3">
              {flagged !== 'all'
                ? `No ${OCC_STATUS_LABEL[flagged].toLowerCase()} entries in this tab.`
                : 'No scans match your filters.'}
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
          {filtered.length} of {baseRows.length} {baseRows.length === 1 ? 'entry' : 'entries'}
        </span>
        <span>Older scans archived after 90 days.</span>
      </div>
    </AppShell>
  );
}

// ---- column defs --------------------------------------------------------
// Rows are split by tab, so single and batch carry their own column sets —
// no "Type" pill since the tab already conveys kind.

const HISTORY_SINGLE_COLUMNS: any[] = [
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
            {singleStatus(r) === 'red' && <RedFlag address={r.address} />}
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
    // Declared side of the reconciliation, beside the detected Verdict
    // (Trello #36) — the meeting's "compare declared vs detected" column.
    key: 'intended',
    label: 'Intended',
    width: '130px',
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-sans text-caption text-ink-2">{OCC_INTENT_SHORT[resolveIntent(r)]}</span>
    ),
  },
  {
    // Result — reconciliation of declared intent × scan verdict. The raw
    // Rented/Possibly/Not-rented finding now lives on the property page.
    key: 'result',
    label: 'Verdict',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      const risk = SCENARIOS[r.scenario].risk;
      const m = occMatchForRisk(r.intent, risk);
      return (
        <span className="inline-flex items-center gap-1.5">
          {m ? <Pill variant={m.tone as any}>{m.label}</Pill> : <span className="text-ink-4">—</span>}
          {/* Quiet "we already investigated this" marker (Trello #50) —
              informational only, never changes verdict, tone or counts. */}
          {r.hasAIReport && (
            <span title={`AI report · run ${formatScannedDate(r.scannedAt)}`}>
              <Pill size="sm">AI</Pill>
            </span>
          )}
        </span>
      );
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
        {formatScannedDate(r.scannedAt)}
      </span>
    ),
  },
];

const HISTORY_BATCH_COLUMNS: any[] = [
  {
    key: 'target',
    label: 'File',
    primary: true,
    cell: (r: any) => {
      // Title is now the primary cell; filename + counts get demoted to a
      // caption so the row reads as a named entity, not a CSV path.
      const title = r.title?.trim() || deriveTitleFromFilename(r.filename);
      const nRed = batchRedCount(r);
      return (
        <div className="min-w-0">
          <div className="flex items-center gap-inline min-w-0">
            <span
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {title}
            </span>
            <BatchRedBadge count={nRed} />
          </div>
          <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
            {r.filename} · {r.total} properties · {r.flagged} flagged
          </div>
        </div>
      );
    },
  },
  {
    // Batch summary of the declared side (Trello #36): uniform → the label,
    // differing → "Mixed" with the per-intent breakdown on hover.
    key: 'intended',
    label: 'Intended',
    width: '130px',
    hideBelow: 'md' as const,
    cell: (r: any) => {
      const s = summarizeBatchIntent(r.rows, r.defaultIntent);
      return (
        <span className="font-sans text-caption text-ink-2" title={batchIntentBreakdown(s)}>
          {s.kind === 'mixed' ? 'Mixed' : OCC_INTENT_SHORT[s.intent]}
        </span>
      );
    },
  },
  {
    key: 'status',
    label: 'Status',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (r: any) => {
      const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
      return (
        <span className="inline-flex items-center gap-1.5">
          <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}</Pill>
          {r.hasAIReport && (
            <span title={`AI reports · run ${formatScannedDate(r.scannedAt)}`}>
              <Pill size="sm">AI</Pill>
            </span>
          )}
        </span>
      );
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
        {formatScannedDate(r.scannedAt)}
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
