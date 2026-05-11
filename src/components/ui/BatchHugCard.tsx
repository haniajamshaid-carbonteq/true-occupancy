/* global React */
// BatchHugCard — compact horizontal status surface for the Batch flow.
// Four states: scanning · completed · completed-with-errors · error.
// Hug-width (display: inline-flex), not full-bleed.

type BatchHugState = 'scanning' | 'completed' | 'completed-errors' | 'error';

interface BatchHugCardProps {
  state: BatchHugState;
  filename: string;
  scanned: number;        // rows scanned successfully
  total: number;          // total rows in batch
  failed?: number;        // rows that errored (completed-errors)
  stoppedAt?: number;     // row index of fatal failure (error)
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

const ThumbIcon = {
  spinner: (
    <span
      className="block w-7 h-7 rounded-full animate-spin"
      style={{
        border: '2.5px solid rgba(10,183,163,.22)',
        borderTopColor: 'var(--brand)',
        borderRightColor: 'var(--brand-2)',
      }}
      aria-hidden
    />
  ),
  check: (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4l10 17H2L12 4z" />
      <path d="M12 10v5" />
      <path d="M12 18h.01" strokeWidth={2.5} />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  retry: (
    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor"
         strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <path d="M3 20v-5h5" />
    </svg>
  ),
};

function BatchHugCard({
  state,
  filename,
  scanned,
  total,
  failed = 0,
  stoppedAt,
  onPrimary,
  onSecondary,
  onDismiss,
}: BatchHugCardProps) {
  const thumbClass =
    state === 'scanning'         ? 'bg-brand-soft text-brand' :
    state === 'completed'        ? 'bg-clean-soft text-clean-ink' :
    state === 'completed-errors' ? 'bg-warn-soft  text-warn-ink' :
                                   'bg-risk-soft  text-risk-ink';

  const title =
    state === 'scanning'         ? 'Batch Is Being Scanned' :
    state === 'completed'        ? 'Batch Completed' :
    state === 'completed-errors' ? 'Batch Completed With Errors' :
                                   'Network Failure';

  const meta =
    state === 'scanning'         ? `${filename}  ·  ${scanned} / ${total} scanned` :
    state === 'completed'        ? `${filename}  ·  ${scanned} / ${total} scanned` :
    state === 'completed-errors' ? `${filename}  ·  ${scanned} / ${total} scanned  ·  ${failed} failed` :
                                   `${filename}  ·  stopped at row ${stoppedAt ?? '?'} of ${total}`;

  const progressPct = total > 0 ? Math.round((scanned / total) * 100) : 0;

  return (
    <div
      className="relative inline-flex items-start gap-[18px] bg-surface border border-line rounded-[14px] shadow-sm"
      style={{ padding: '18px 44px 18px 18px', minWidth: 460, maxWidth: 720 }}
    >
      <div
        className={`w-14 h-14 shrink-0 rounded-[10px] grid place-items-center ${thumbClass}`}
      >
        {state === 'scanning' ? ThumbIcon.spinner :
         state === 'completed' ? ThumbIcon.check : ThumbIcon.alert}
      </div>

      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <h3
          className="font-sans font-semibold leading-[1.25] m-0"
          style={{ color: 'var(--navy)', fontSize: 19, letterSpacing: '-.005em' }}
        >
          {title}
        </h3>
        <p className="font-sans m-0 text-ink-3" style={{ fontSize: 13, lineHeight: 1.5 }}>
          {meta}
        </p>

        {state === 'scanning' && (
          <div
            className="mt-2 h-1 w-full bg-line rounded-full overflow-hidden"
            aria-label={`${progressPct} percent`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-2) 100%)',
              }}
            />
          </div>
        )}

        {state === 'completed' && (
          <div className="mt-2.5 flex gap-2.5">
            <Button variant="primary" iconRight={ThumbIcon.arrowRight} onClick={onPrimary}>
              View results
            </Button>
          </div>
        )}

        {state === 'completed-errors' && (
          <div className="mt-2.5 flex gap-2.5">
            <Button variant="primary" iconRight={ThumbIcon.arrowRight} onClick={onPrimary}>
              View results
            </Button>
            <Button variant="default" onClick={onSecondary}>
              Retry failed
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-2.5 flex gap-2.5">
            <Button variant="primary" icon={ThumbIcon.retry} onClick={onPrimary}>
              Retry batch
            </Button>
            <Button variant="default" onClick={onSecondary}>
              View partial results
            </Button>
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="absolute top-2.5 right-3 w-6 h-6 grid place-items-center rounded-md text-ink-4 hover:text-ink-2 hover:bg-hover-bg transition-colors"
      >
        {ThumbIcon.x}
      </button>
    </div>
  );
}
