/* global React, AppShell, BatchResults, ReactRouterDOM, useAppState */
// BatchDetailScreen — historical view of a completed batch from history.
// Reuses BatchResults so the page reads exactly like the live-completed
// state, just sourced from the snapshot stored in AppState.history. Passes
// `readOnly` to freeze re-execution (retry / automation) — the run is a
// settled record — but the title/description remain editable so the user
// can name or annotate a past batch later (BatchResults handles that split).
//
// No served-timestamp here: the "first served to your organization" line is
// a per-report signal (single scan + AI report), not a batch-level one.

function BatchDetailScreen() {
  const { id } = ReactRouterDOM.useParams<{ id: string }>();
  const routerHistory = ReactRouterDOM.useHistory();
  const { history } = useAppState();
  const entry = history.find((h: any) => h.kind === 'batch' && h.id === id) as any;

  if (!entry) {
    return <ReactRouterDOM.Redirect to="/history" />;
  }

  // Spread the full history entry so BatchResults' new header has access to
  // title, description, and scannedAt for the identity strip. We force
  // status: 'complete' so the read-only view never animates "Scanning…" —
  // historical batches are always settled.
  const batch = {
    ...entry,
    status: 'complete' as const,
  };

  return (
    <AppShell>
      {/* Back — batches are reached from History (or Scheduled); goBack keeps
          the origin, falling back to History on a cold/deep link. */}
      <button
        type="button"
        onClick={() => {
          if (routerHistory.length > 1) routerHistory.goBack();
          else routerHistory.push('/history');
        }}
        className="group inline-flex items-center gap-1 h-9 px-2.5 -ml-2.5 mb-stack rounded-md bg-transparent border-0 text-label text-ink-2 hover:bg-hover-bg transition-colors cursor-pointer"
        aria-label="Back"
      >
        <span
          className="grid place-items-center w-4 h-4 transition-transform group-hover:-translate-x-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"
          aria-hidden
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="m10 4-4 4 4 4" />
          </svg>
        </span>
        <span>Back</span>
      </button>

      <BatchResults batch={batch} readOnly />
    </AppShell>
  );
}
