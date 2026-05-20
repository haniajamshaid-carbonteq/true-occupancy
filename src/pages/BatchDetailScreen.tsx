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

  // Spread the full history entry so BatchResults' new header has access to
  // title, description, and scannedAgo for the identity strip. We force
  // status: 'complete' so the read-only view never animates "Scanning…" —
  // historical batches are always settled.
  const batch = {
    ...entry,
    status: 'complete' as const,
  };

  return (
    <AppShell>
      <BatchResults batch={batch} readOnly />
    </AppShell>
  );
}
