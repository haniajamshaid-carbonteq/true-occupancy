/* global React, AppShell, Button, Icon, Pill, DataTable, DropdownMenu, Drawer, ReactRouterDOM, SCENARIOS,
   HOME_VERDICT_LABEL, VERDICT_VARIANT, VERDICT_ACCENT, SCAN_COLUMNS, scanLeadingAccent, useAppState,
   splitAddress, ChipRow, parseAgoHours */

type Verdict = 'all' | 'high' | 'medium' | 'low';
type Type = 'all' | 'single' | 'batch';
type Recency = 'all' | 'today' | 'week' | 'older';
type PlatformsBucket = 'all' | 'none' | 'any' | 'multi';

function HistoryScreen() {
  const history = ReactRouterDOM.useHistory();
  const { history: rows } = useAppState();
  const [verdict, setVerdict] = React.useState<Verdict>('all');
  const [type, setType] = React.useState<Type>('all');
  const [query, setQuery] = React.useState('');
  const [recency, setRecency] = React.useState<Recency>('all');
  const [platformsBucket, setPlatformsBucket] = React.useState<PlatformsBucket>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const advancedCount =
    (type !== 'all' ? 1 : 0) +
    (recency !== 'all' ? 1 : 0) +
    (platformsBucket !== 'all' ? 1 : 0);

  const filtered = rows.filter((r: any) => {
    if (type !== 'all' && r.kind !== type) return false;
    if (verdict !== 'all') {
      // Batch entries don't have a verdict — exclude them from any verdict-
      // specific filter to keep the meaning sharp.
      if (r.kind !== 'single') return false;
      if (r.scenario !== verdict) return false;
    }
    if (recency !== 'all') {
      const hrs = parseAgoHours(r.scannedAgo);
      if (recency === 'today' && hrs > 24) return false;
      if (recency === 'week'  && (hrs <= 24 || hrs > 24 * 7)) return false;
      if (recency === 'older' && hrs <= 24 * 7) return false;
    }
    if (platformsBucket !== 'all') {
      // Platform count is a single-scan concept; batches don't carry it.
      if (r.kind !== 'single') return false;
      const p: number = r.platforms ?? 0;
      if (platformsBucket === 'none'  && p !== 0) return false;
      if (platformsBucket === 'any'   && p < 1)  return false;
      if (platformsBucket === 'multi' && p < 2)  return false;
    }
    if (query) {
      const target = r.kind === 'batch' ? r.filename : r.address;
      if (!target.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  function clearAdvanced() {
    setType('all');
    setRecency('all');
    setPlatformsBucket('all');
  }

  const VERDICT_FILTERS: { id: Verdict; label: string; count: number }[] = [
    { id: 'all',    label: 'All',              count: rows.length },
    { id: 'high',   label: 'Rented',           count: rows.filter((r: any) => r.kind === 'single' && r.scenario === 'high').length },
    { id: 'medium', label: 'Possibly Rented',  count: rows.filter((r: any) => r.kind === 'single' && r.scenario === 'medium').length },
    { id: 'low',    label: 'Not Rented',       count: rows.filter((r: any) => r.kind === 'single' && r.scenario === 'low').length },
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
      <header className="flex items-end justify-between gap-6 mb-8 pb-5 border-b border-line">
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

      {/* Filter row — verdict chips on the left, search + Filters drawer on the right. Type filter lives in the drawer. */}
      <section className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {VERDICT_FILTERS.map((opt) => {
              const active = verdict === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setVerdict(opt.id)}
                  className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-caption font-medium transition-colors ${
                    active
                      ? '!bg-brand-tint !border-brand/40'
                      : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
                  }`}
                  style={{ color: active ? 'var(--brand-deep)' : 'var(--ink-2)' }}
                >
                  {opt.label}
                  <span
                    className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded border border-line"
                    style={{
                      background: active ? 'rgba(2,146,190,0.12)' : 'var(--surface-2)',
                      color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                    }}
                  >
                    {opt.count}
                  </span>
                </button>
              );
            })}
          </div>
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
              Done
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <ChipRow
            label="Scan type"
            value={type}
            onChange={(v: string) => setType(v as Type)}
            options={[
              { value: 'all',    label: 'All Scans' },
              { value: 'single', label: 'Single property' },
              { value: 'batch',  label: 'Batch' },
            ]}
          />
          <ChipRow
            label="When scanned"
            value={recency}
            onChange={(v: string) => setRecency(v as Recency)}
            options={[
              { value: 'all',   label: 'Any time' },
              { value: 'today', label: 'Today' },
              { value: 'week',  label: 'This week' },
              { value: 'older', label: 'Older' },
            ]}
          />
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
        </div>
      </Drawer>

      {/* Table */}
      <DataTable
        columns={HISTORY_COLUMNS}
        rows={filtered}
        rowKey={(r: any) => r.id}
        onRowClick={openRow}
        pageSize={10}
        empty={
          <div className="px-5 py-12 text-center text-label text-ink-3">
            No scans match your filters.
          </div>
        }
      />

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
// Branches on row.kind so a Batch summary renders filename + N properties
// in the address slot and skips the score/listings columns.

const HISTORY_COLUMNS: any[] = [
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
      if (r.kind === 'batch') {
        // Older seed entries pre-date the status field; treat them as clean
        // completions so the column never reads "—" once a batch is known to
        // be fine.
        const batchStatus: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
        if (batchStatus === 'failed') return <Pill variant="risk">Failed</Pill>;
        if (batchStatus === 'partial') return <Pill variant="warn">Partial Failed</Pill>;
        return <Pill variant="clean">Completed</Pill>;
      }
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
      if (r.kind === 'batch') {
        return <span className="font-mono text-caption text-ink-4">—</span>;
      }
      const sc = SCENARIOS[r.scenario];
      return (
        <div className="flex items-center gap-2.5">
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
    cell: (r: any) =>
      r.kind === 'batch' ? (
        <span className="font-mono text-caption text-ink-4">—</span>
      ) : (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {r.platforms} / 3
        </span>
      ),
  },
  {
    key: 'scanned',
    label: 'Scanned',
    width: '100px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (r: any) => (
      <span className="font-mono tabular-nums text-caption text-ink-3">
        {r.scannedAgo}
      </span>
    ),
  },
];
