/* global React, Icon, Button */
// ScreenError — full-screen failure block. Used when a page's primary
// data fetch fails. Anatomy mirrors ScreenEmpty so the two read as
// siblings; the only visual differences are the badge palette
// (--error-soft vs --brand-soft) and a primary Retry button.

interface ScreenErrorProps {
  title?: string;
  /** Short reason line under the title. */
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  /** Optional secondary label for the back button. Defaults to 'Go back'. */
  backLabel?: string;
}

function ScreenError({
  title = "Couldn't load this page",
  message = 'Something went wrong on our end. Try again in a moment.',
  onRetry,
  onBack,
  backLabel = 'Go back',
}: ScreenErrorProps) {
  return (
    <div className="bg-surface border border-line rounded-lg" role="alert">
      <div className="flex flex-col items-center text-center gap-stack max-w-[420px] mx-auto py-section-sub px-card">
        <span
          className="shrink-0 w-12 h-12 rounded-full grid place-items-center bg-error-soft text-error-ink [&>svg]:w-6 [&>svg]:h-6"
          aria-hidden
        >
          <Icon name="alert" size={24} />
        </span>
        <div className="flex flex-col gap-stack-tight">
          <h2
            className="font-sans font-semibold text-h4 tracking-[-0.005em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            {title}
          </h2>
          <p className="font-sans text-body-sm text-ink-3 leading-relaxed m-0">
            {message}
          </p>
        </div>
        {(onRetry || onBack) && (
          <div className="flex items-center gap-stack-tight mt-stack-tight">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                {backLabel}
              </Button>
            )}
            {onRetry && (
              <Button variant="primary" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
