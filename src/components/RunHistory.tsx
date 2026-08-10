/* global React, Pill, DataTable, Icon, ReactRouterDOM, useAppState, timeAgo, occMatchForRisk,
   SCENARIOS, HOME_VERDICT_LABEL, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT */
// RunHistory — the "same target, scanned again" log. Instead of History growing
// a new row every re-scan, History shows ONE row per property/batch (the latest)
// and the prior runs live here, at the bottom of the detail view. Each row is
// clickable and opens that specific run's report (of that date), where it can be
// downloaded — so the whole timeline is reachable without cluttering the list.
//
// Two modes:
//   - kind="single" → runs for one address (defaults to the scan in session).
//     Row → that scan's result page.
//   - kind="batch"  → runs of one CSV (by filename). Row → that batch's detail.
// Renders nothing when there's only a single run (no "history" to show yet).
//
// Manual vs automated (owner call, Aug-2026). A property's timeline mixes
// both — an officer scans an address, an automation keeps re-scanning it on a
// cadence — and reading a run wrong changes what it means. The two modes
// disambiguate differently, on purpose:
//   - single → per-row zap marker on automated runs, nothing on manual ones.
//     Marking only one side keeps the column quiet; a person-run scan is the
//     unmarked baseline.
//   - batch  → one line of copy, no per-row markers. Only the first upload of
//     a CSV is manual; every later run of it comes from the automation, so
//     saying it once beats repeating a marker down the column.

function normalizeAddress(a: string): string {
  return (a || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// The automated-run marker. Sits in a fixed-width slot so the timestamps stay
// on one baseline whether or not a row is marked — an icon that shifts the
// column is worse than no icon. `title` carries the hover explanation and the
// visually-hidden span carries it to screen readers (Tooltip is truncation-
// gated and can't be used on a bare icon).
function TriggerMark({ trigger }: { trigger?: 'manual' | 'automation' }) {
  const auto = trigger === 'automation';
  return (
    <span
      className="inline-flex shrink-0 w-4 justify-center text-brand [&>svg]:w-3.5 [&>svg]:h-3.5"
      title={auto ? 'Automated run — triggered by the schedule on this property' : undefined}
    >
      {auto ? (
        <>
          <Icon name="zap" size={14} aria-hidden />
          <span className="sr-only">Automated run</span>
        </>
      ) : null}
    </span>
  );
}

function RunHistory(props: { kind: 'single'; address?: string } | { kind: 'batch'; filename: string }) {
  const { history } = useAppState();
  const routerHistory = ReactRouterDOM.useHistory();

  const address =
    props.kind === 'single'
      ? props.address ??
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanAddress') ?? '' : '')
      : '';

  const runs: any[] = React.useMemo(() => {
    const list =
      props.kind === 'single'
        ? history.filter(
            (h: any) => h.kind === 'single' && normalizeAddress(h.address) === normalizeAddress(address)
          )
        : history.filter((h: any) => h.kind === 'batch' && h.filename === props.filename);
    return [...list].sort((a: any, b: any) => (b.scannedAt || 0) - (a.scannedAt || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, props.kind, address, (props as any).filename]);

  // Nothing to show as "history" until the same target has been scanned twice.
  if (runs.length < 2) return null;

  // Only explain the trigger when an automation has actually run against this
  // target. On an all-manual timeline the note would describe a marker that
  // appears nowhere, and on a batch it would claim an automation that doesn't
  // exist. No automation, no line.
  const hasAutomatedRun = runs.some((r: any) => r.trigger === 'automation');

  function openSingle(r: any) {
    sessionStorage.setItem('scanScenario', r.scenario);
    sessionStorage.setItem('scanAddress', r.address);
    if (r.intent) sessionStorage.setItem('scanIntent', r.intent);
    else sessionStorage.removeItem('scanIntent');
    // Stamp this run's served date so the report reads as that date's snapshot.
    const d = r.scannedAt ? new Date(r.scannedAt) : null;
    const iso = d ? d.toISOString().slice(0, 10) : null;
    sessionStorage.setItem('resultServedAt', iso ? `${iso}T09:00:00` : new Date().toISOString());
    sessionStorage.removeItem('resultCached');
    sessionStorage.setItem('scanHistoryId', r.id);
    if (r.reference) sessionStorage.setItem('scanReference', r.reference);
    else sessionStorage.removeItem('scanReference');
    const path =
      r.scenario === 'low' ? '/result/clean' : r.scenario === 'medium' ? '/result/medium' : '/result/high';
    routerHistory.push(path);
  }

  const columns =
    props.kind === 'single'
      ? [
          {
            key: 'when',
            label: 'Run',
            width: '160px',
            cell: (r: any) => (
              <span className="inline-flex items-center gap-inline">
                <TriggerMark trigger={r.trigger} />
                <span className="font-mono tabular-nums text-caption text-ink-3">{timeAgo(r.scannedAt)}</span>
              </span>
            ),
          },
          {
            key: 'result',
            label: 'Result',
            primary: true,
            cell: (r: any) => {
              const m = occMatchForRisk(r.intent, SCENARIOS[r.scenario as keyof typeof SCENARIOS]?.risk);
              return m ? (
                <Pill variant={m.tone as any}>{m.label}</Pill>
              ) : (
                <Pill variant="verdict-high">{HOME_VERDICT_LABEL[r.scenario as 'low' | 'medium' | 'high']}</Pill>
              );
            },
          },
          {
            key: 'platforms',
            label: 'Platforms',
            width: '100px',
            align: 'right' as const,
            hideBelow: 'md' as const,
            cell: (r: any) => (
              <span className="font-mono tabular-nums text-caption text-ink-3">{r.platforms} / 3</span>
            ),
          },
        ]
      : [
          {
            key: 'when',
            label: 'Run',
            width: '160px',
            cell: (r: any) => (
              <span className="font-mono tabular-nums text-caption text-ink-3">{timeAgo(r.scannedAt)}</span>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            primary: true,
            cell: (r: any) => {
              const status: 'complete' | 'partial' | 'failed' = r.status ?? 'complete';
              return <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}</Pill>;
            },
          },
          {
            key: 'flagged',
            label: 'Flagged',
            width: '100px',
            align: 'right' as const,
            hideBelow: 'md' as const,
            cell: (r: any) => (
              <span className="font-mono tabular-nums text-caption text-ink-3">
                {r.flagged} / {r.total}
              </span>
            ),
          },
        ];

  return (
    <section className="mt-8 sm:mt-12">
      <h3
        className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0 mb-3"
        style={{ color: 'var(--navy)' }}
      >
        Run history
      </h3>
      <p className={`font-sans text-caption text-ink-3 m-0 ${hasAutomatedRun ? 'mb-stack-tight' : 'mb-stack-md'}`}>
        Every time this {props.kind === 'single' ? 'property' : 'batch'} was scanned. Open any run to view or
        download that date&rsquo;s report.
      </p>
      {/* Trigger provenance. Single mode marks rows and needs a legend for the
          marker; batch mode states it once because every re-run is automated.
          items-start + a flexible text span, NOT flex-wrap: at mobile width the
          sentence is wider than the row, and wrapping it as a whole flex item
          drops the glyph onto its own line above the copy. */}
      {hasAutomatedRun && (
        <p className="font-sans text-caption text-ink-3 m-0 mb-stack-md flex items-start gap-inline">
          <span className="inline-flex shrink-0 mt-0.5 text-brand [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="zap" size={14} />
          </span>
          <span className="min-w-0 flex-1">
            {props.kind === 'single'
              ? 'Marks a run started by an automation. Unmarked runs were started by a person.'
              : 'Re-runs of this batch are started by its automation, not by a person.'}
          </span>
        </p>
      )}
      <DataTable
        columns={columns}
        rows={runs}
        rowKey={(r: any) => r.id}
        onRowClick={props.kind === 'single' ? openSingle : (r: any) => routerHistory.push(`/batch/${r.id}`)}
        pageSize={5}
      />
    </section>
  );
}
