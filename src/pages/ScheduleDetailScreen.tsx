/* global React, AppShell, Card, Icon, Pill, DataTable, ReactRouterDOM, useAppState,
   HOME_VERDICT_LABEL, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT, splitAddress */
// Schedule detail — full page for a scheduled automation.
// Layout:
//   1. Header bar  — back link (left) + Cancel automation (right, destructive)
//   2. Summary Card — eyebrow strip · title · subline · hairline · 4-up meta grid
//   3. Run history — h3 + DataTable; rows drill to /batch/:id or /result/<scenario>

function ScheduleDetailScreen() {
  const routerHistory = ReactRouterDOM.useHistory();
  const { id } = ReactRouterDOM.useParams<{ id: string }>();
  const { schedules, history, cancelSchedule } = useAppState();

  const schedule: any = schedules.find((s: any) => s.id === id);
  if (!schedule) {
    return <ReactRouterDOM.Redirect to="/scheduled" />;
  }

  const isBatch = schedule.kind === 'batch';
  const runIds: string[] = schedule.runHistoryIds ?? [];
  const runs: any[] = runIds
    .map((rid) => history.find((h: any) => h.id === rid))
    .filter(Boolean);

  function openRun(run: any) {
    if (run.kind === 'batch') {
      routerHistory.push(`/batch/${run.id}`);
      return;
    }
    sessionStorage.setItem('scanScenario', run.scenario);
    sessionStorage.setItem('scanAddress', run.address);
    const path =
      run.scenario === 'low'    ? '/result/clean'
      : run.scenario === 'medium' ? '/result/medium'
      : '/result/high';
    routerHistory.push(path);
  }

  function handleCancel() {
    cancelSchedule(schedule.id);
    routerHistory.push('/scheduled');
  }

  const [street, locality] = isBatch
    ? [schedule.filename, `${schedule.total} properties`]
    : splitAddress(schedule.address);

  const RUN_COLUMNS: any[] = [
    {
      key: 'when',
      label: 'Run',
      width: '160px',
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">{r.scannedAgo}</span>
      ),
    },
    {
      key: 'verdict',
      label: isBatch ? 'Status' : 'Verdict',
      primary: true,
      cell: (r: any) => {
        if (r.kind === 'batch') {
          const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
          return <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}</Pill>;
        }
        const variant =
          r.scenario === 'high'  ? 'verdict-high'
          : r.scenario === 'medium' ? 'verdict-med'
          : 'verdict-low';
        return <Pill variant={variant as any}>{HOME_VERDICT_LABEL[r.scenario as 'low' | 'medium' | 'high']}</Pill>;
      },
    },
    {
      key: 'detail',
      label: isBatch ? 'Flagged' : 'Platforms',
      width: '100px',
      align: 'right' as const,
      hideBelow: 'md' as const,
      cell: (r: any) => {
        if (r.kind === 'batch') {
          return (
            <span className="font-mono tabular-nums text-caption text-ink-3">
              {r.flagged} / {r.total}
            </span>
          );
        }
        return (
          <span className="font-mono tabular-nums text-caption text-ink-3">
            {r.platforms} / 3
          </span>
        );
      },
    },
  ];

  return (
    <AppShell>
      {/* Header bar: back link + destructive Cancel */}
      <div className="flex items-center justify-between gap-3 mb-section-tight">
        <ReactRouterDOM.Link
          to="/scheduled"
          className="group inline-flex items-center gap-stack-tight h-9 px-control-x -ml-control-x rounded-md text-label text-ink-2 hover:bg-hover-bg transition-colors"
        >
          <span
            className="grid place-items-center w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            aria-hidden
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <path d="m10 4-4 4 4 4" />
            </svg>
          </span>
          <span>Back to Scheduled</span>
        </ReactRouterDOM.Link>

        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-stack-tight h-9 px-control-x rounded-md bg-transparent border border-transparent font-sans text-label font-medium text-error-ink hover:bg-error-soft transition-colors cursor-pointer"
        >
          <Icon name="x" size={14} />
          <span>Cancel automation</span>
        </button>
      </div>

      <div className="flex flex-col gap-section-sub">
        {/* Summary card */}
        <Card allowOverflow>
          <div className="px-card-loose py-card">
            {/* Eyebrow strip */}
            <div className="flex items-center gap-stack-tight mb-stack-tight">
              <Pill variant={isBatch ? 'brand' : 'default'}>
                {isBatch ? 'Batch automation' : 'Single property'}
              </Pill>
              <span
                className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
                style={{ color: 'var(--ink-3)' }}
              >
                Every {schedule.cadenceMonths} months
              </span>
            </div>

            {/* Title + subline */}
            <h2
              className="font-sans font-semibold text-h3 tracking-[-0.005em] m-0 leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {street}
            </h2>
            {locality && (
              <p className="font-sans text-body-sm text-ink-3 leading-relaxed m-0 mt-1 truncate">
                {locality}
              </p>
            )}

            {/* Hairline divider */}
            <div className="border-t border-line my-card" />

            {/* Meta strip — natural-width columns, left-packed with a
                consistent section gap. Avoids the disconnected look an
                equal-width 4-col grid creates when "3" sits in a column
                as wide as "Nov 12, 2026". */}
            <dl className="flex flex-wrap gap-x-section-sub gap-y-stack m-0">
              <RuleField label="Cadence" value={`Every ${schedule.cadenceMonths} months`} />
              <RuleField label="Next run" value={schedule.nextRunLabel} />
              <RuleField label="Created" value={schedule.createdAgo} />
              <RuleField label="Runs to date" value={String(runs.length)} />
            </dl>
          </div>
        </Card>

        {/* Run history */}
        <div>
          <h3
            className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0 mb-stack-md"
            style={{ color: 'var(--navy)' }}
          >
            Run history
          </h3>

          <DataTable
            columns={RUN_COLUMNS}
            rows={runs}
            rowKey={(r: any) => r.id}
            onRowClick={openRun}
            pageSize={20}
            empty={
              <div className="px-5 py-12 text-center text-label text-ink-3">
                No runs recorded yet — the next scan will appear here on{' '}
                <span className="font-medium text-ink-2">{schedule.nextRunLabel}</span>.
              </div>
            }
          />
        </div>
      </div>
    </AppShell>
  );
}

// Single field cell — eyebrow label above a navy semibold value, matched
// to the typography ramp used everywhere else (eyebrow + body-sm).
function RuleField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt
        className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase mb-stack-tight"
        style={{ color: 'var(--ink-3)' }}
      >
        {label}
      </dt>
      <dd
        className="font-sans text-body-sm font-semibold m-0 truncate"
        style={{ color: 'var(--navy)' }}
      >
        {value}
      </dd>
    </div>
  );
}
