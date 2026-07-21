/* global React, Icon, Button */
// ScreenEmpty — full-screen "never had any data" block. Distinct from
// DataTable.empty (which is the right answer for "filter returned zero").
// Use this when the user has literally no history / no schedules / no
// scans yet — i.e. a brand-new account or freshly-cleared state.
//
// Anatomy matches ScreenError so the two read as siblings.

interface ScreenEmptyProps {
  /** Icon name from the system icon set. Defaults to 'history'. */
  icon?: string;
  title?: string;
  message?: string;
  /** Primary CTA label. Renders only when both label + onAction set. */
  actionLabel?: string;
  onAction?: () => void;
}

function ScreenEmpty({
  icon = 'history',
  title = 'Nothing here yet',
  message,
  actionLabel,
  onAction,
}: ScreenEmptyProps) {
  return (
    <div className="bg-surface border border-line rounded-lg">
      <div className="flex flex-col items-center text-center gap-stack max-w-prose mx-auto py-section-sub px-card">
        <span
          className="shrink-0 w-12 h-12 rounded-full grid place-items-center bg-brand-soft [&>svg]:w-6 [&>svg]:h-6"
          style={{ color: 'var(--brand-deep)' }}
          aria-hidden
        >
          <Icon name={icon} size={24} />
        </span>
        <div className="flex flex-col gap-stack-tight">
          <h2
            className="font-sans font-semibold text-h4 tracking-h2 m-0"
            style={{ color: 'var(--navy)' }}
          >
            {title}
          </h2>
          {message && (
            <p className="font-sans text-body-sm text-ink-3 leading-relaxed m-0">
              {message}
            </p>
          )}
        </div>
        {actionLabel && onAction && (
          <Button variant="primary" onClick={onAction} className="mt-stack-tight">
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
