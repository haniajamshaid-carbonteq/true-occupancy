/* global React, AppShell, BatchResults, BatchRerunBanner, ReactRouterDOM, useAppState */
// BatchDetailScreen — read-only view of a completed batch from history.
// Reuses BatchResults so the page reads exactly like the live-completed
// state, just sourced from the snapshot stored in AppState.history.
//
// When this batch is part of an automation chain, we prepend a context
// banner so the user can see where this run sits in the sequence and jump
// to siblings / the parent schedule without backtracking through History.

function BatchDetailScreen() {
  const { id } = ReactRouterDOM.useParams<{ id: string }>();
  const { history, findScheduleByRunId } = useAppState();
  const entry = history.find((h: any) => h.kind === 'batch' && h.id === id) as any;

  if (!entry) {
    return <ReactRouterDOM.Redirect to="/history" />;
  }

  const schedule = findScheduleByRunId(entry.id);
  const linkedRuns: any[] = schedule
    ? schedule.runHistoryIds
        .map((rid: string) => history.find((h: any) => h.id === rid))
        .filter(Boolean)
    : [];

  const batch = {
    id: entry.id,
    filename: entry.filename,
    rows: entry.rows,
    status: 'complete' as const,
  };

  return (
    <AppShell>
      {schedule && schedule.kind === 'batch' && (
        <div className="mb-section-sub">
          <BatchRerunBanner
            schedule={schedule}
            currentRunId={entry.id}
            runs={linkedRuns.map((r: any) => ({
              id: r.id,
              scannedAgo: r.scannedAgo,
              total: r.total ?? 0,
            }))}
          />
        </div>
      )}
      <BatchResults batch={batch} readOnly />
    </AppShell>
  );
}
