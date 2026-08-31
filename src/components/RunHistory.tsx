/* global React, Pill, DataTable, Icon, ReactRouterDOM, useAppState, timeAgo, occMatchForRisk,
   SCENARIOS, HOME_VERDICT_LABEL, BATCH_STATUS_LABEL, BATCH_STATUS_VARIANT,
   OCC_INTENT_SHORT, summarizeBatchIntent, batchIntentBreakdown,
   formatUsDate, SEED_THRESHOLDS_CHANGED_AT */
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
      title={auto ? 'Automated run started by the schedule on this property' : undefined}
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

  // Threshold provenance (Trello #73). Every run is stamped with the bands it
  // was scored under; a later threshold edit never re-bands a completed run.
  // When one timeline spans a change, say so once — dated — so two eras of
  // verdicts read as a recorded policy change, not a contradiction. The date
  // comes from the seeded change marker; production reads the org's config
  // version log instead. DataTable has no divider-row API (and growing one is
  // an owner call), so the seam is a caption plus the per-run pair column.
  const pairKey = (t: any) => `${t.notRentedAtOrBelow}/${t.rentedAtOrAbove}`;
  const thresholdEras: any[] = runs.reduce((acc: any[], r: any) => {
    if (r.thresholds && !acc.some((t) => pairKey(t) === pairKey(r.thresholds))) acc.push(r.thresholds);
    return acc;
  }, []);
  // runs are sorted newest-first, so era [0] is the current pair.
  const thresholdSeam = props.kind === 'single' && thresholdEras.length >= 2;
  const eraNew = thresholdEras[0];
  const eraOld = thresholdEras[thresholdEras.length - 1];

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
    // Fresh context from the run-history table — drop any abandoned back-stack.
    sessionStorage.removeItem('resultReturnStack');
    sessionStorage.setItem('scanHistoryId', r.id);
    if (r.reference) sessionStorage.setItem('scanReference', r.reference);
    else sessionStorage.removeItem('scanReference');
    // The bands this run was scored under, for the certificate's meta line.
    if (r.thresholds) sessionStorage.setItem('scanThresholds', JSON.stringify(r.thresholds));
    else sessionStorage.removeItem('scanThresholds');
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
            // The intent this run was reconciled against (Trello #48) — it can
            // differ between runs, which is exactly when two verdicts on one
            // property stop looking contradictory.
            key: 'intended',
            label: 'Intended',
            width: '130px',
            hideBelow: 'sm' as const,
            cell: (r: any) => (
              <span className="font-sans text-caption text-ink-2">
                {OCC_INTENT_SHORT[(r.intent as any) ?? 'not-sure']}
              </span>
            ),
          },
          {
            key: 'result',
            label: 'Result',
            primary: true,
            cell: (r: any) => {
              const m = occMatchForRisk(r.intent, SCENARIOS[r.scenario as keyof typeof SCENARIOS]?.risk);
              // Same AI-validated sign as the History verdict pills (Trello #58).
              const aiMark = r.hasAIReport && (
                <span
                  role="img"
                  aria-label="AI used to validate this result"
                  title="AI used to validate this result"
                  className="inline-flex shrink-0 opacity-70"
                >
                  <Icon name="ai-star" size={12} />
                </span>
              );
              return m ? (
                <Pill variant={m.tone as any}>{m.label}{aiMark}</Pill>
              ) : (
                <Pill variant="verdict-high">{HOME_VERDICT_LABEL[r.scenario as 'low' | 'medium' | 'high']}{aiMark}</Pill>
              );
            },
          },
          {
            // The bands this run was scored under (Trello #73). Shown per row
            // so runs from different threshold eras carry their own pair.
            key: 'thresholds',
            label: 'Thresholds',
            width: '110px',
            align: 'right' as const,
            hideBelow: 'md' as const,
            cell: (r: any) =>
              r.thresholds ? (
                <span
                  className="font-mono tabular-nums text-caption text-ink-3"
                  title={`This run banded scores at: not rented ≤${r.thresholds.notRentedAtOrBelow}, rented ≥${r.thresholds.rentedAtOrAbove}`}
                >
                  ≤{r.thresholds.notRentedAtOrBelow} / ≥{r.thresholds.rentedAtOrAbove}
                </span>
              ) : (
                <span className="font-mono text-caption text-ink-4">—</span>
              ),
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
              // Same AI-validated sign as History batch rows (Trello #58).
              const aiMark = r.hasAIReport && (
                <span
                  role="img"
                  aria-label="AI used to validate these results"
                  title="AI used to validate these results"
                  className="inline-flex shrink-0 opacity-70"
                >
                  <Icon name="ai-star" size={12} />
                </span>
              );
              return <Pill variant={BATCH_STATUS_VARIANT[status]}>{BATCH_STATUS_LABEL[status]}{aiMark}</Pill>;
            },
          },
          {
            // Batch runs: the declared summary for that run (Trello #48) —
            // uniform label, or "Mixed" with the breakdown on hover.
            key: 'intended',
            label: 'Intended',
            width: '130px',
            hideBelow: 'sm' as const,
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
    // id is the scroll target for ConfidenceHero's "N more in Run history"
    // overflow link; that link only renders when this section does (≥2 runs).
    <section id="run-history" className="mt-8 sm:mt-12">
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
      {thresholdSeam && (
        <p className="font-sans text-caption text-ink-3 m-0 mb-stack-md">
          Thresholds changed {formatUsDate(new Date(SEED_THRESHOLDS_CHANGED_AT).toISOString())}: was{' '}
          <span className="font-mono tabular-nums">≤{eraOld.notRentedAtOrBelow} / ≥{eraOld.rentedAtOrAbove}</span>, now{' '}
          <span className="font-mono tabular-nums">≤{eraNew.notRentedAtOrBelow} / ≥{eraNew.rentedAtOrAbove}</span>.
          Every run keeps the thresholds it ran under.
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
