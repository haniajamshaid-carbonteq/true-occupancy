/* global React, AppShell, BatchResults, ReactRouterDOM, useAppState */
// BatchDetailScreen — read-only view of a completed batch from history.
// Reuses BatchResults so the page reads exactly like the live-completed
// state, just sourced from the snapshot stored in AppState.history.

function BatchDetailScreen() {
  const { id } = ReactRouterDOM.useParams<{ id: string }>();
  const { history } = useAppState();
  const entry = history.find((h: any) => h.kind === 'batch' && h.id === id) as any;

  if (!entry) {
    return <ReactRouterDOM.Redirect to="/history" />;
  }

  const batch = {
    id: entry.id,
    filename: entry.filename,
    rows: entry.rows,
    status: 'complete' as const,
  };

  return (
    <AppShell>
      <BatchResults batch={batch} readOnly />
    </AppShell>
  );
}
