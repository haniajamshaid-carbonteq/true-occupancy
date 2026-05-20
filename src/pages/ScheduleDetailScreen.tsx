/* global React, AppShell, Card, Icon, Pill, Modal, Button, DataTable, AutomateModal, ReactRouterDOM, useAppState,
   HOME_VERDICT_LABEL, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT, splitAddress, deriveTitleFromFilename, ScreenError */
// Schedule detail — full page for a scheduled automation.
// Layout:
//   1. Header bar  — back link (left) + Cancel automation (right, destructive)
//   2. Summary Card — title row (address + type pill) · cadence chip · meta grid
//   3. Run history — h3 + DataTable; rows drill to /batch/:id or /result/<scenario>

function ScheduleDetailScreen() {
  const routerHistory = ReactRouterDOM.useHistory();
  const { id } = ReactRouterDOM.useParams<{ id: string }>();
  const {
    schedules,
    history,
    cancelSchedule,
    updateScheduleCadence,
    updateScheduleStatuses,
    pushTransient,
    loading,
    error,
  } = useAppState();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  // Surface fetch errors before the redirect-on-missing guard so the user
  // sees "Couldn't load" instead of being bounced back silently.
  if (error) {
    return (
      <AppShell>
        <ScreenError
          title="Couldn't load this automation"
          message={error}
          onRetry={() => window.location.reload()}
          onBack={() => routerHistory.push('/scheduled')}
          backLabel="Back to Scheduled"
        />
      </AppShell>
    );
  }

  const schedule: any = schedules.find((s: any) => s.id === id);
  if (!schedule && !loading) {
    return <ReactRouterDOM.Redirect to="/scheduled" />;
  }

  // Loading variant: render the page chrome but swap the detail body
  // and run-history table for skeleton placeholders.
  const isBatch = schedule?.kind === 'batch';
  const runIds: string[] = schedule?.runHistoryIds ?? [];
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

  function confirmCancel() {
    cancelSchedule(schedule.id);
    routerHistory.push('/scheduled');
  }

  // Batch scope data — most recent run in history is the source of truth for
  // per-status counts; the saved `schedule.statuses` selects the subset.
  type ScopeRisk = 'risk' | 'warn' | 'clean';
  const currentStatuses: ScopeRisk[] =
    isBatch ? (schedule?.statuses ?? ['risk', 'warn']) : [];
  const recentBatch: any = isBatch
    ? history.find((h: any) => h.kind === 'batch' && h.filename === schedule.filename)
    : null;
  const scopeCounts = recentBatch
    ? { risk: recentBatch.flagged, warn: recentBatch.warn, clean: recentBatch.clean }
    : { risk: 0, warn: 0, clean: 0 };
  const scopeTotal = recentBatch?.total ?? schedule?.total ?? 0;
  const scopeCountsPending = isBatch && !recentBatch;
  const inScope = scopeCountsPending
    ? null
    : (currentStatuses.includes('risk')  ? scopeCounts.risk  : 0) +
      (currentStatuses.includes('warn')  ? scopeCounts.warn  : 0) +
      (currentStatuses.includes('clean') ? scopeCounts.clean : 0);

  function handleUpdate({ cadenceMonths, statuses }: { cadenceMonths: 3 | 4 | 6 | 12; statuses?: ScopeRisk[] }) {
    if (!schedule) return;
    const cadenceChanged = cadenceMonths !== schedule.cadenceMonths;
    if (cadenceChanged) updateScheduleCadence(schedule.id, cadenceMonths);
    if (isBatch && statuses) {
      const prev = currentStatuses;
      const changed =
        prev.length !== statuses.length || !prev.every((s) => statuses.includes(s));
      if (changed) {
        updateScheduleStatuses(schedule.id, statuses);
        const newCount =
          (statuses.includes('risk')  ? scopeCounts.risk  : 0) +
          (statuses.includes('warn')  ? scopeCounts.warn  : 0) +
          (statuses.includes('clean') ? scopeCounts.clean : 0);
        pushTransient(`Scope updated · next run ${inScope ?? 0} → ${newCount} addresses`);
      } else if (cadenceChanged) {
        pushTransient(`Cadence updated · every ${cadenceMonths} months`);
      }
    } else if (cadenceChanged) {
      pushTransient(`Cadence updated · every ${cadenceMonths} months`);
    }
    setEditOpen(false);
  }

  // Batch schedules: title is primary, filename + count get demoted to the
  // locality slot beneath. Falls back to the derived label for legacy seeds
  // that pre-date the rename feature.
  const [street, locality] = !schedule
    ? ['', '']
    : isBatch
    ? [
        schedule.title?.trim() || deriveTitleFromFilename(schedule.filename),
        `${schedule.filename} · ${schedule.total} properties`,
      ]
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

        <div className="flex items-center gap-2">
          {schedule && (
            <Button
              variant="ghost"
              onClick={() => setEditOpen(true)}
              icon={<Icon name="cal" size={14} />}
            >
              Edit schedule
            </Button>
          )}
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-stack-tight h-9 px-control-x rounded-md bg-transparent border border-transparent font-sans text-label font-medium text-error-ink hover:bg-error-soft transition-colors cursor-pointer"
          >
            <Icon name="x" size={14} />
            <span>Cancel automation</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-section-sub">
        {/* Summary card */}
        <Card allowOverflow>
          <div className="px-card-loose py-card">
            {loading || !schedule ? (
              <>
                {/* Loading skeleton — same anatomy as the populated header so
                    layout doesn't jump when data lands. */}
                <div className="flex items-start justify-between gap-stack">
                  <div className="min-w-0 flex-1 flex flex-col gap-2">
                    <div className="h-6 w-3/4 max-w-[360px] rounded-sm bg-line skeleton-pulse" />
                    <div className="h-3 w-1/2 max-w-[200px] rounded-sm bg-line skeleton-pulse" />
                  </div>
                  <div className="h-5 w-28 rounded-full bg-line skeleton-pulse" />
                </div>
                <div className="mt-stack-tight h-3 w-40 rounded-sm bg-line skeleton-pulse" />
                <div className="border-t border-line mt-stack mb-stack" />
                <dl className="flex flex-wrap gap-x-section-sub gap-y-stack m-0">
                  {['a', 'b', 'c'].map((k) => (
                    <div key={k} className="flex flex-col gap-1.5">
                      <div className="h-2 w-16 rounded-sm bg-line skeleton-pulse" />
                      <div className="h-3 w-20 rounded-sm bg-line skeleton-pulse" />
                    </div>
                  ))}
                </dl>
              </>
            ) : (
              <>
                {/* Title row: address + type pill (right). The pill is a
                    secondary classification, so it sits in the trailing corner
                    rather than the eyebrow slot above the title. */}
                <div className="flex items-start justify-between gap-stack">
                  <div className="min-w-0 flex-1">
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
                  </div>
                  <Pill variant={isBatch ? 'brand' : 'default'} className="shrink-0">
                    {isBatch ? 'Batch automation' : 'Single property'}
                  </Pill>
                </div>

                {/* Cadence — the load-bearing fact for a *scheduled* automation.
                    Rendered as ink-2 text with a calendar icon so it reads as
                    summary copy, not a stylistic tag. */}
                <div className="mt-stack-tight inline-flex items-center gap-stack-tight text-ink-2">
                  <Icon name="cal" size={14} />
                  <span className="font-sans text-body-sm font-medium">
                    Every {schedule.cadenceMonths} months
                  </span>
                </div>

                {/* Hairline divider — tightened now that the cadence above is
                    plain text (no chip / pill height) so vertical rhythm doesn't
                    overweigh the header block. */}
                <div className="border-t border-line mt-stack mb-stack" />

                {/* Meta strip — natural-width columns, left-packed with a
                    consistent section gap. Cadence is omitted here because it's
                    already featured above. */}
                <dl className="flex flex-wrap gap-x-section-sub gap-y-stack m-0">
                  {isBatch && (
                    <ScopeRuleField
                      statuses={currentStatuses}
                      inScope={inScope}
                      total={scopeTotal}
                    />
                  )}
                  <RuleField label="Next run" value={schedule.nextRunLabel} />
                  <RuleField label="Created" value={schedule.createdAgo} />
                  <RuleField label="Runs to date" value={String(runs.length)} />
                </dl>
              </>
            )}
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
            loading={loading}
            empty={
              <div className="px-5 py-12 text-center text-label text-ink-3">
                No runs recorded yet — the next scan will appear here on{' '}
                <span className="font-medium text-ink-2">{schedule?.nextRunLabel}</span>.
              </div>
            }
          />
        </div>
      </div>

      {/* Cancel-automation confirmation. Mirrors the AutomationControl
          confirmation modal so behaviour and palette are consistent. */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        width={420}
        title="Cancel Automation?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 justify-center"
            >
              Keep Automation
            </Button>
            <button
              type="button"
              onClick={confirmCancel}
              className="flex-1 inline-flex items-center justify-center gap-inline-tight h-9 px-control-x rounded-lg border border-error-soft bg-error-soft text-error-ink hover:bg-error/10 transition-colors cursor-pointer font-sans text-label font-medium"
            >
              <Icon name="x" size={14} />
              Cancel Automation
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span
            className="shrink-0 w-9 h-9 rounded-full grid place-items-center bg-error-soft text-error-ink [&>svg]:w-[18px] [&>svg]:h-[18px]"
            aria-hidden
          >
            <Icon name="alert" size={18} />
          </span>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0">
            This automation won't run again. You can re-create it any time from
            the same{' '}
            <span className="font-medium text-ink">
              {isBatch ? 'batch' : 'scan'}
            </span>{' '}
            page.
          </p>
        </div>
      </Modal>

      {/* Edit-schedule modal. For batch schedules this carries the full
          status-scope selector + live "X of Y" card; for single schedules
          only cadence is editable (statuses prop ignored). */}
      {schedule && (
        <AutomateModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          target={
            isBatch
              ? { kind: 'batch', filename: schedule.filename, total: schedule.total }
              : { kind: 'single', address: schedule.address, scenario: schedule.scenario }
          }
          onConfirm={handleUpdate}
          mode="edit"
          initialCadence={schedule.cadenceMonths}
          initialStatuses={isBatch ? currentStatuses : undefined}
          scopeCounts={isBatch ? scopeCounts : undefined}
          scopeTotal={isBatch ? scopeTotal : undefined}
          scopeCountsPending={scopeCountsPending}
          onCancelAutomation={() => {
            setEditOpen(false);
            setConfirmOpen(true);
          }}
        />
      )}
    </AppShell>
  );
}

// Scope field for batch schedules — in-scope/total of the latest run.
// Single-property schedules don't render this (their scope is implicit).
function ScopeRuleField({
  statuses,
  inScope,
  total,
}: {
  statuses: Array<'risk' | 'warn' | 'clean'>;
  inScope: number | null;
  total: number;
}) {
  const labelByStatus: Record<'risk' | 'warn' | 'clean', string> = {
    risk: 'Rented',
    warn: 'Possibly Rented',
    clean: 'Not Rented',
  };
  const tip = statuses.map((s) => labelByStatus[s]).join(', ');

  return (
    <div className="min-w-0">
      <dt
        className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase mb-stack-tight"
        style={{ color: 'var(--ink-3)' }}
      >
        Scope
      </dt>
      <dd className="font-sans m-0" title={tip}>
        <span
          className="font-semibold text-body-sm tabular-nums"
          style={{ color: 'var(--navy)' }}
        >
          {inScope !== null ? `${inScope} / ${total}` : `— / ${total}`}
        </span>
      </dd>
    </div>
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
