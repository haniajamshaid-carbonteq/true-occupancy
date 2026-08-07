/* global React, Pill, DataTable, ReactRouterDOM, useAppState, timeAgo, occMatchForRisk,
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

function normalizeAddress(a: string): string {
  return (a || '').toLowerCase().replace(/\s+/g, ' ').trim();
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
              <span className="font-mono tabular-nums text-caption text-ink-3">{timeAgo(r.scannedAt)}</span>
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
      <p className="font-sans text-caption text-ink-3 m-0 mb-stack-md">
        Every time this {props.kind === 'single' ? 'property' : 'batch'} was scanned. Open any run to view or
        download that date&rsquo;s report.
      </p>
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
