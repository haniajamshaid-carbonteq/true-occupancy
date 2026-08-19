/* global React, AppShell, Button, Icon, Pill, DataTable, Drawer, ChipRow, ReactRouterDOM, useAppState,
   HOME_VERDICT_LABEL, VERDICT_ACCENT, splitAddress, deriveTitleFromFilename, ScreenError, ScreenEmpty,
   cadenceLabel, cadenceShort, SCENARIOS, occMatchForRisk, OCC_STATUS_LABEL,
   RedFlag, BatchRedBadge, timeAgo, OCC_INTENT_SHORT, summarizeBatchIntent, batchIntentBreakdown,
   SCHEDULE_ENDED_TAG, scheduleEndedOn, scheduleEndFact */

type Filter = 'all' | 'single' | 'batch';
type OccStatus = 'green' | 'yellow' | 'red';
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

// Lifecycle lives in the Next run column: an active schedule shows its
// date; an ended one shows "Cancelled on <date>" / "Stopped on <date>" in
// the column's own type style — no pill, just the fact. The recorded
// reason (mainly for system-stopped rows) sits on hover: native title, the
// RedFlag idiom. The line and hover copy come from the shared
// scheduleEndLine / scheduleEndFact vocabulary in AppState so the detail
// page reads identically.
function NextRunCell({ row }: { row: any }) {
  const tag = SCHEDULE_ENDED_TAG[row.status ?? ''];
  if (!tag) {
    return (
      <span className="font-mono tabular-nums text-caption text-ink-3">{row.nextRunLabel}</span>
    );
  }
  const fact = scheduleEndFact(row) ?? '';
  // Two fixed lines — "Cancelled on" / "Stopped on" above, the date below —
  // so the date always lands in the column's date position.
  return (
    <div
      className="min-w-0 font-mono tabular-nums text-caption text-ink-3 leading-snug"
      title={fact}
      aria-label={fact}
    >
      <div>{tag} on</div>
      <div>{scheduleEndedOn(row.endedAt)}</div>
    </div>
  );
}

function ScheduledScreen() {
  const routerHistory = ReactRouterDOM.useHistory();
  const { schedules, history, loading, error } = useAppState();

  // Reconciliation status of a schedule row, from the config matrix — the same
  // Green / Yellow / Red the History "Flagged" filter and the batch screen use.
  // A schedule entry doesn't store the finding itself, so we read it off the
  // originating run: for a single, its scan; for a batch, the worst status
  // across the matched run's properties.
  const batchRunFor = (s: any) =>
    history.find((h: any) => h.kind === 'batch' && h.filename === s.filename);
  const batchRedCount = (s: any): number => {
    if (s.kind !== 'batch') return 0;
    const run = batchRunFor(s);
    return (run?.rows || []).filter(
      (r: any) => occMatchForRisk(r.intent ?? run.defaultIntent, r.risk)?.status === 'red'
    ).length;
  };
  const scheduleStatus = (s: any): OccStatus | null => {
    if (s.kind === 'batch') {
      const run = batchRunFor(s);
      const subs: OccStatus[] = (run?.rows || [])
        .map((r: any) => occMatchForRisk(r.intent ?? run.defaultIntent, r.risk)?.status as OccStatus)
        .filter(Boolean);
      if (subs.includes('red')) return 'red';
      if (subs.includes('yellow')) return 'yellow';
      if (subs.includes('green')) return 'green';
      return null;
    }
    const run = history.find((h: any) => h.id === s.runHistoryIds?.[0]);
    const risk = SCENARIOS[s.scenario as keyof typeof SCENARIOS]?.risk;
    return (occMatchForRisk(run?.intent, risk)?.status as OccStatus) ?? null;
  };
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');
  const [cadence, setCadence] = React.useState<CadenceFilter>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // Reconciliation "Flagged" filter — Green / Yellow / Red, straight from the
  // config outcome matrix. Lives in the Filters drawer, not as a top-level pill.
  const [flagged, setFlagged] = React.useState<'all' | OccStatus>('all');

  const advancedCount =
    (filter !== 'all' ? 1 : 0) + (cadence !== 'all' ? 1 : 0) + (flagged !== 'all' ? 1 : 0);

  // Per-status counts across all schedules — shown beside each Flagged chip.
  const flaggedCounts: Record<OccStatus, number> = {
    green:  schedules.filter((s: any) => scheduleStatus(s) === 'green').length,
    yellow: schedules.filter((s: any) => scheduleStatus(s) === 'yellow').length,
    red:    schedules.filter((s: any) => scheduleStatus(s) === 'red').length,
  };

  const rows = [...schedules]
    .filter((s: any) => {
      if (flagged !== 'all' && scheduleStatus(s) !== flagged) return false;
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
    setFlagged('all');
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
                <BatchRedBadge
                  count={nRed}
                  onClick={() => {
                    // Jump to this batch's latest run, red filter pre-applied,
                    // so the user lands on just the red properties.
                    const runId = r.runHistoryIds?.[0];
                    if (runId) {
                      sessionStorage.setItem('batchOpenRedFilter', '1');
                      routerHistory.push(`/batch/${runId}`);
                    }
                  }}
                />
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
            <div className="flex items-center gap-inline min-w-0">
              <span
                className="font-sans font-semibold text-body-sm leading-tight truncate"
                style={{ color: 'var(--navy)' }}
              >
                {street}
              </span>
              {scheduleStatus(r) === 'red' && <RedFlag address={r.address} />}
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
      // Declared side of the schedule's target (Trello #38). A schedule entry
      // doesn't store intent itself, so — like scheduleStatus above — it reads
      // off the originating run: single → that scan's intent; batch → the
      // batch summary (uniform label, or "Mixed" with the hover breakdown).
      key: 'intended',
      label: 'Intended',
      width: '130px',
      hideBelow: 'md' as const,
      cell: (r: any) => {
        if (r.kind === 'batch') {
          const run = batchRunFor(r);
          const s = summarizeBatchIntent(run?.rows, run?.defaultIntent);
          return (
            <span className="font-sans text-caption text-ink-2" title={batchIntentBreakdown(s)}>
              {s.kind === 'mixed' ? 'Mixed' : OCC_INTENT_SHORT[s.intent]}
            </span>
          );
        }
        const run = history.find((h: any) => h.id === r.runHistoryIds?.[0]);
        return (
          <span className="font-sans text-caption text-ink-2">
            {OCC_INTENT_SHORT[(run?.intent as any) ?? 'not-sure']}
          </span>
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
      cell: (r: any) => <NextRunCell row={r} />,
    },
    {
      key: 'created',
      label: 'Created',
      width: '100px',
      hideBelow: 'md' as const,
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {timeAgo(r.createdAt)}
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

      {/* Filter + search bar — Type / Cadence / Flagged all live in the drawer
          to keep this row uncluttered; search + Filters sit on the right. */}
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
          {/* Flagged — the config outcome-matrix status (Green / Yellow / Red),
              same labels as the Config screen and the History filter. */}
          <ChipRow
            label="Flagged"
            value={flagged}
            onChange={(v: string) => setFlagged(v as 'all' | OccStatus)}
            options={[
              { value: 'all',    label: 'All' },
              { value: 'green',  label: OCC_STATUS_LABEL.green,  count: flaggedCounts.green },
              { value: 'yellow', label: OCC_STATUS_LABEL.yellow, count: flaggedCounts.yellow },
              { value: 'red',    label: OCC_STATUS_LABEL.red,    count: flaggedCounts.red },
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
          actionLabel="Scan a property"
          onAction={() => routerHistory.push('/')}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(r: any) => r.id}
          onRowClick={(r: any) => {
            routerHistory.push(`/scheduled/${r.id}`);
          }}
          pageSize={10}
          loading={loading}
          empty={
            <div className="px-5 py-12 text-center text-label text-ink-3">
              {flagged !== 'all'
                ? `No ${OCC_STATUS_LABEL[flagged].toLowerCase()} schedules.`
                : 'No schedules match your filters.'}
            </div>
          }
        />
      )}
    </AppShell>
  );
}
