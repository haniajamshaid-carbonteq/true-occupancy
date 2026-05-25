/* global React, AppShell, Button, Icon, Pill, DataTable, Drawer, ChipRow, ReactRouterDOM, useAppState,
   HOME_VERDICT_LABEL, VERDICT_ACCENT, splitAddress, deriveTitleFromFilename, ScreenError, ScreenEmpty,
   cadenceLabel, cadenceShort */

type Filter = 'all' | 'single' | 'batch';
// Cadence filter values match cadenceShort() output ("1wk", "3mo", …).
type CadenceFilter = 'all' | '1wk' | '1mo' | '3mo' | '6mo';

// Parse a next-run label like "Aug 13, 2026" into an epoch ms for sorting.
// Missing / unparseable labels return Infinity so they fall to the bottom
// of an ascending sort (e.g. cancelled rows that retain a `—` placeholder).
function nextRunTime(label: string | undefined | null): number {
  if (!label) return Infinity;
  const t = Date.parse(label);
  return Number.isNaN(t) ? Infinity : t;
}

function ScheduledScreen() {
  const routerHistory = ReactRouterDOM.useHistory();
  const { schedules, loading, error } = useAppState();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');
  const [cadence, setCadence] = React.useState<CadenceFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const advancedCount = (filter !== 'all' ? 1 : 0) + (cadence !== 'all' ? 1 : 0);

  const rows = schedules
    .filter((s: any) => {
      if (filter !== 'all' && s.kind !== filter) return false;
      if (cadence !== 'all' && cadenceShort(s.cadence) !== cadence) return false;
      if (query) {
        // Match against title (primary cell) + filename (caption) for batches,
        // so users can search by either since both are visible in the row.
        const haystacks: string[] =
          s.kind === 'batch'
            ? [s.title || deriveTitleFromFilename(s.filename), s.filename]
            : [s.address];
        const q = query.toLowerCase();
        if (!haystacks.some((h: string) => h.toLowerCase().includes(q))) return false;
      }
      return true;
    })
    // Default sort: next run ascending — answers the question a user is
    // actually asking when they open /scheduled ("what runs next?") and
    // matches the convention used by calendar apps and cron-job dashboards.
    // Rows with an unparseable / missing next-run label (e.g. cancelled
    // entries that retain a row but no schedule) fall to the bottom; JS's
    // stable sort preserves their relative order from the filter pass.
    .sort((a: any, b: any) => {
      const ta = nextRunTime(a.nextRunLabel);
      const tb = nextRunTime(b.nextRunLabel);
      return ta - tb;
    });

  function clearAdvanced() {
    setFilter('all');
    setCadence('all');
  }

  const COLUMNS: any[] = [
    {
      key: 'type',
      label: 'Type',
      width: '96px',
      cell: (r: any) => <Pill>{r.kind === 'batch' ? 'Batch' : 'Single'}</Pill>,
    },
    {
      key: 'target',
      label: 'Target',
      primary: true,
      cell: (r: any) => {
        if (r.kind === 'batch') {
          const title = r.title?.trim() || deriveTitleFromFilename(r.filename);
          return (
            <div className="min-w-0">
              <div
                className="font-sans font-semibold text-body-sm leading-tight truncate"
                style={{ color: 'var(--navy)' }}
              >
                {title}
              </div>
              <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
                {r.filename} · {r.total} properties
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
        <span className="font-sans text-label text-ink-2 whitespace-nowrap capitalize">
          {cadenceLabel(r.cadence)}
        </span>
      ),
    },
    {
      key: 'next',
      label: 'Next run',
      width: '120px',
      hideBelow: 'md' as const,
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {r.nextRunLabel}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      width: '100px',
      hideBelow: 'md' as const,
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {r.createdAgo}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-end justify-between gap-6 mb-section-sub">
        <div>
          <h1
            className="font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Scheduled
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2">
            Automations re-run on your chosen cadence. Click any row to view its run history.
          </p>
        </div>
      </header>

      {/* Filter + search bar — Type filter lives in the drawer to keep this row uncluttered. */}
      <section className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-[260px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
              <Icon name="search" size={14} />
            </span>
            <input
              type="search"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Filter by target"
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
            label="Type"
            value={filter}
            onChange={(v: string) => setFilter(v as Filter)}
            options={[
              { value: 'all',    label: 'All' },
              { value: 'single', label: 'Single property' },
              { value: 'batch',  label: 'Batch' },
            ]}
          />
          <ChipRow
            label="Cadence"
            value={cadence}
            onChange={(v: string) => setCadence(v as CadenceFilter)}
            options={[
              { value: 'all', label: 'Any Cadence' },
              { value: '1wk', label: 'Weekly' },
              { value: '1mo', label: 'Monthly' },
              { value: '3mo', label: 'Every 3 months' },
              { value: '6mo', label: 'Every 6 months' },
            ]}
          />
        </div>
      </Drawer>

      {error ? (
        <ScreenError
          title="Couldn't load your schedules"
          message={error}
          onRetry={() => window.location.reload()}
        />
      ) : !loading && schedules.length === 0 ? (
        <ScreenEmpty
          icon="cal"
          title="No automations yet"
          message="Schedule a recurring scan from any property or batch — they'll show up here."
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(r: any) => r.id}
          onRowClick={(r: any) => routerHistory.push(`/scheduled/${r.id}`)}
          pageSize={10}
          loading={loading}
          empty={
            <div className="px-5 py-12 text-center text-label text-ink-3">
              No schedules match your filters.
            </div>
          }
        />
      )}
    </AppShell>
  );
}
