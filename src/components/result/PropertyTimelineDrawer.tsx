/* global React, ReactRouterDOM, Drawer, Pill, Icon, useAppState, occMatchForRisk, SCENARIOS,
   OCC_INTENT_SHORT, formatUsDate, timeAgo, openRunReport */
// PropertyTimelineDrawer — the "what has this address done over time" flyout,
// reachable from the top bar on every result page (including an older report
// opened from the corroboration links). Composes the registered Drawer with
// Pill / Icon; invents no new primitive.
//
// Three bands, top to bottom:
//   1. Present status — the reconciliation of the LATEST scan on or before
//      today, stated plainly. This is the "where does it stand now" line.
//   2. Summary — how many times scanned, and the result it reaches most often.
//   3. Timeline — every run (newest first), each row a dated link that opens
//      that exact report (and closes the drawer).
//
// "As of today" is load-bearing: a report page can be an archived snapshot, so
// the drawer always recomputes present status against `now`, never against the
// open report. Future-dated rows (none in seed, guarded anyway) are dropped —
// we never present an obsolete or not-yet-served report as current.

// The reconciliation for one history run — the same (intent × found) status
// shown everywhere else, so the drawer never disagrees with the list rows.
function timelineMatchOf(run: any) {
  return occMatchForRisk(run.intent, SCENARIOS[run.scenario as keyof typeof SCENARIOS]?.risk);
}

// Scope note under the address in BOTH drawers. A report page is frozen at
// its own date, but these drawers deliberately show the FULL record up to
// today — this line says so, so the mismatch reads as intent, not a bug.
// When the open report has newer siblings (i.e. the user is standing on an
// archived report), the note names that report's date to make it pointed.
function DrawerScopeNote({ runs }: { runs: any[] }) {
  if (!runs.length) return null;
  const servedRaw =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('resultServedAt') : null;
  const served = servedRaw ? new Date(servedRaw).getTime() : NaN;
  const currentId =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanHistoryId') : null;
  const viewingOlder =
    !Number.isNaN(served) && runs.some((r) => r.id !== currentId && (r.scannedAt || 0) > served);
  return (
    <p className="font-sans text-caption text-ink-3 leading-snug m-0 mb-4 flex items-start gap-1.5">
      <span className="shrink-0 mt-px [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
        <Icon name="info" size={14} />
      </span>
      <span>
        {viewingOlder ? (
          <>
            Showing the property&rsquo;s full history up to today — including scans newer than the{' '}
            <span className="font-semibold text-ink-2">
              {formatUsDate(new Date(served).toISOString())}
            </span>{' '}
            report you&rsquo;re viewing.
          </>
        ) : (
          <>Showing the property&rsquo;s full history up to today.</>
        )}
      </span>
    </p>
  );
}

function PropertyTimelineDrawer({
  open,
  onClose,
  address,
}: {
  open: boolean;
  onClose: () => void;
  address: string;
}) {
  const { getHistoryForAddress } = useAppState();
  const routerHistory = ReactRouterDOM.useHistory();

  // Recompute on every open so a stale snapshot is never shown. `now` is read
  // at render; the drawer only mounts its body while open, so this is cheap.
  const now = React.useMemo(() => Date.now(), [open]);

  // Runs for this address, on or before today, newest first. The on-or-before
  // filter is what "show data on the date we're in" means — nothing dated
  // ahead of now is presented as real.
  const runs: any[] = React.useMemo(() => {
    const list = getHistoryForAddress(address).filter((h: any) => (h.scannedAt || 0) <= now);
    return [...list].sort((a: any, b: any) => (b.scannedAt || 0) - (a.scannedAt || 0));
  }, [getHistoryForAddress, address, now]);

  const present = runs[0];
  const presentMatch = present ? timelineMatchOf(present) : null;

  // Most-frequent reconciliation across the timeline — "the result it usually
  // lands on". Grouped by the reconciliation label (Consistent / Inconclusive /
  // Needs review), which is the status shown everywhere, not the raw verdict.
  const modal = React.useMemo(() => {
    const counts = new Map<string, { label: string; tone: string; count: number }>();
    runs.forEach((r) => {
      const m = timelineMatchOf(r);
      if (!m) return;
      const prev = counts.get(m.label);
      if (prev) prev.count += 1;
      else counts.set(m.label, { label: m.label, tone: m.tone, count: 1 });
    });
    let best: { label: string; tone: string; count: number } | null = null;
    counts.forEach((v) => {
      if (!best || v.count > best.count) best = v;
    });
    return best;
  }, [runs]);

  function openRun(run: any) {
    // Delegate to the shared opener (defined in ConfidenceHero, co-loaded in
    // every host that loads this drawer) so the back-stack behaviour is
    // identical to the in-hero date links. Guarded for the spec hosts.
    if (typeof openRunReport === 'function') openRunReport(run, routerHistory);
    onClose();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Property timeline" width={400}>
      {/* Address — quiet context line so the drawer is legible on its own. */}
      <div className="font-sans text-caption text-ink-3 leading-snug m-0 mb-1.5">{address}</div>
      <DrawerScopeNote runs={runs} />

      {runs.length === 0 ? (
        // First-use empty — no scans on record for this property yet.
        <div className="rounded-lg border border-line bg-surface-2/40 px-4 py-6 text-center">
          <div className="mx-auto mb-2 w-8 h-8 grid place-items-center rounded-full bg-surface-2 text-ink-3 [&>svg]:w-4 [&>svg]:h-4">
            <Icon name="history" size={16} aria-hidden />
          </div>
          <p className="font-sans text-caption text-ink-2 leading-snug m-0">
            This is the first scan on record for this property. Its timeline builds as it&rsquo;s
            re-scanned.
          </p>
        </div>
      ) : (
        <>
          {/* 1 — Present status, as of today. */}
          <div className="rounded-lg border border-line p-4">
            <div
              className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
              style={{ color: 'var(--ink-3)' }}
            >
              Present status · as of {formatUsDate(new Date(now).toISOString())}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {presentMatch && <Pill variant={presentMatch.tone as any}>{presentMatch.label}</Pill>}
              <span className="font-sans text-caption text-ink-3 tabular-nums">
                {timeAgo(present.scannedAt)}
              </span>
            </div>
            {presentMatch && (
              <p className="mt-2 font-sans text-caption text-ink-2 leading-snug m-0">
                {present.intent ? (
                  <>
                    Reconciled against intended{' '}
                    <span className="font-semibold">{OCC_INTENT_SHORT[present.intent as keyof typeof OCC_INTENT_SHORT]}</span>.
                  </>
                ) : (
                  <>No occupancy was declared for this scan.</>
                )}
              </p>
            )}
          </div>

          {/* 2 — Summary: how many scans, and the result it lands on most. */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-line px-3 py-2.5">
              <div className="font-sans text-h4 font-semibold tabular-nums leading-none" style={{ color: 'var(--navy)' }}>
                {runs.length}
              </div>
              <div className="mt-1 font-sans text-caption text-ink-3 leading-snug">
                {runs.length === 1 ? 'scan on record' : 'scans on record'}
              </div>
            </div>
            <div className="rounded-lg border border-line px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                {modal ? <Pill variant={modal.tone as any}>{modal.label}</Pill> : <span className="text-ink-4">—</span>}
              </div>
              <div className="mt-1 font-sans text-caption text-ink-3 leading-snug tabular-nums">
                {modal ? `most often — ${modal.count} of ${runs.length}` : 'no reconciled runs'}
              </div>
            </div>
          </div>

          {/* 3 — Full timeline. Each date opens that run's report. */}
          <div className="mt-5">
            <div
              className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase mb-2"
              style={{ color: 'var(--ink-3)' }}
            >
              Every scan
            </div>
            <ul className="m-0 p-0 list-none flex flex-col">
              {runs.map((r, i) => {
                const m = timelineMatchOf(r);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openRun(r)}
                      className={`w-full flex items-center gap-2 py-2.5 text-left bg-transparent border-0 cursor-pointer rounded hover:bg-hover-bg transition-colors ${
                        i > 0 ? 'border-t border-line' : ''
                      }`}
                    >
                      <span className="font-sans text-caption text-ink-2 tabular-nums w-24 shrink-0">
                        {formatUsDate(new Date(r.scannedAt || 0).toISOString())}
                      </span>
                      <span className="flex-1 min-w-0">
                        {m ? <Pill variant={m.tone as any}>{m.label}</Pill> : null}
                      </span>
                      <span className="font-sans text-caption text-ink-3 shrink-0">
                        {OCC_INTENT_SHORT[(r.intent as keyof typeof OCC_INTENT_SHORT) ?? 'not-sure']}
                      </span>
                      <span className="shrink-0 text-ink-4 [&>svg]:w-3 [&>svg]:h-3" aria-hidden>
                        <Icon name="arrow-right" size={12} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </Drawer>
  );
}
