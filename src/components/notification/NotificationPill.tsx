/* global React, Icon */
// NotificationPill — collapsed Dynamic-Island-style view. Single task
// summary OR aggregated "N tasks running" chip when more than one job is
// active. Pure presentation; expansion is owned by NotificationDock.

// Soft tints reuse the existing `*-soft` tokens (see tokens.css §3) —
// designed for light surfaces so the chip reads as a calm status cue
// rather than a saturated dot.
const PILL_STATUS_THEME = {
  'running':           { accent: 'var(--brand)', soft: 'var(--brand-soft)' },
  'completed':         { accent: 'var(--clean)', soft: 'var(--clean-soft)' },
  'completed-errors':  { accent: 'var(--warn)',  soft: 'var(--warn-soft)' },
  'error':             { accent: 'var(--risk)',  soft: 'var(--risk-soft)' },
} as const;

function PillSpinner() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: 'ai-spin 900ms linear infinite' }}
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-6.2-8.55" />
    </svg>
  );
}

function PillGlyph({ status }: { status: keyof typeof PILL_STATUS_THEME }) {
  if (status === 'running') return <PillSpinner />;
  return <Icon name={status === 'completed' ? 'check' : 'alert'} size={13} />;
}

// Stacked-dots glyph for the multi-task aggregate.
function StackedDotsGlyph() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="6" cy="8" r="1.5" />
      <circle cx="12" cy="8" r="1.5" />
      <circle cx="18" cy="8" r="1.5" />
      <circle cx="6" cy="16" r="1.5" opacity="0.55" />
      <circle cx="12" cy="16" r="1.5" opacity="0.55" />
      <circle cx="18" cy="16" r="1.5" opacity="0.55" />
    </svg>
  );
}

function BottomRail({
  done,
  total,
  accent,
}: { done: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div
      aria-hidden
      className="absolute left-[40px] right-[14px] bottom-[5px] h-[2px] rounded-full overflow-hidden"
      style={{ background: 'var(--line)' }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent} 0%, var(--brand-2) 100%)`,
        }}
      />
    </div>
  );
}

function CountdownRing({ progress }: { progress: number }) {
  const r = 11;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, progress)));
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 26 26"
      className="absolute inset-0"
      aria-hidden
    >
      <circle cx="13" cy="13" r={r} stroke="var(--line)" strokeWidth="1.5" fill="none" />
      <circle
        cx="13"
        cy="13"
        r={r}
        stroke="var(--clean)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 13 13)"
        style={{ transition: 'stroke-dashoffset 200ms linear' }}
      />
    </svg>
  );
}

interface NotificationPillProps {
  notifications: any[];
  onExpand?: () => void;
  forceHover?: boolean;
  forceFocused?: boolean;
}

function NotificationPill({
  notifications,
  onExpand,
  forceHover,
  forceFocused,
}: NotificationPillProps) {
  const single = notifications.length === 1 ? notifications[0] : null;

  const runningCount = notifications.filter((n) => n.status === 'running').length;
  const hasError = notifications.some((n) => n.status === 'error');
  const aggregateStatus = hasError
    ? 'error'
    : runningCount > 0
      ? 'running'
      : 'completed';

  const theme = single
    ? PILL_STATUS_THEME[single.status as keyof typeof PILL_STATUS_THEME]
    : PILL_STATUS_THEME[aggregateStatus as keyof typeof PILL_STATUS_THEME];

  let countdownProgress: number | null = null;
  if (single && single.status === 'completed' && single.autoDismissAt && single.finishedAt) {
    const total = single.autoDismissAt - single.finishedAt;
    if (typeof (single as any)._countdown === 'number') {
      countdownProgress = (single as any)._countdown;
    } else {
      const now = Date.now();
      countdownProgress = Math.max(0, Math.min(1, (single.autoDismissAt - now) / total));
    }
  }

  const renderSingle = () => {
    const s = single!;
    let metaText: string | null = null;
    if (s.progress?.kind === 'count') {
      metaText = `${s.progress.done} / ${s.progress.total}`;
    } else if (s.progress?.kind === 'step') {
      metaText = `Step ${s.progress.step} of ${s.progress.of}`;
    } else if (s.meta) {
      metaText = s.meta;
    }
    return (
      <>
        <div
          className="w-[26px] h-[26px] grid place-items-center shrink-0 relative"
          style={{ color: theme.accent }}
        >
          <PillGlyph status={s.status} />
          {countdownProgress !== null && <CountdownRing progress={countdownProgress} />}
        </div>
        <div className="flex items-baseline gap-2 min-w-0 pr-1">
          <span
            className="font-sans font-medium text-label whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
            style={{ color: 'var(--ink-2)', lineHeight: 1.2 }}
          >
            {s.title}
          </span>
          {metaText && (
            <span
              className="font-mono text-micro whitespace-nowrap"
              style={{ color: 'var(--ink-3)' }}
            >
              {metaText}
            </span>
          )}
        </div>
      </>
    );
  };

  const renderMulti = () => (
    <>
      <div
        className="w-[26px] h-[26px] grid place-items-center shrink-0"
        style={{ color: theme.accent }}
      >
        <StackedDotsGlyph />
      </div>
      <div className="flex items-baseline gap-2 pr-1.5">
        <span
          className="font-sans font-medium text-label whitespace-nowrap"
          style={{ color: 'var(--ink-2)', lineHeight: 1.2 }}
        >
          {runningCount > 0
            ? `${notifications.length} tasks running`
            : `${notifications.length} tasks`}
        </span>
        <span style={{ color: 'var(--ink-3)' }} aria-hidden>
          <Icon name="chevron" size={12} />
        </span>
      </div>
    </>
  );

  const isScanningSingle =
    single && single.status === 'running' && single.progress?.kind === 'count';

  const isAnyError = notifications.some(
    (n) => n.status === 'error' || n.status === 'completed-errors',
  );

  return (
    <button
      type="button"
      onClick={onExpand}
      aria-label={
        single
          ? `${single.title}${single.meta ? ` — ${single.meta}` : ''}`
          : `${notifications.length} tasks · click to expand`
      }
      role={isAnyError ? 'alert' : 'status'}
      className={[
        'notification-dock-pill',
        'inline-flex gap-2 pr-3.5 pl-1.5 relative',
        isScanningSingle ? 'h-[44px] pt-[5px] items-start' : 'items-center py-1.5',
        'border cursor-pointer appearance-none',
        forceHover ? 'is-hover' : '',
        forceFocused ? 'is-focus' : '',
      ].filter(Boolean).join(' ')}
      style={{
        borderRadius: 22,
        background: 'var(--surface)',
        borderColor: 'var(--line-strong)',
        boxShadow:
          '0 24px 48px -16px rgba(20,45,85,.14), 0 8px 16px -8px rgba(20,45,85,.07)',
        color: 'var(--ink-2)',
        minWidth: single ? 220 : 180,
        maxWidth: 360,
        transition:
          'transform 200ms cubic-bezier(.16,1,.3,1), box-shadow 200ms cubic-bezier(.16,1,.3,1)',
      }}
    >
      {single ? renderSingle() : renderMulti()}
      {isScanningSingle && (
        <BottomRail
          done={(single!.progress as any).done}
          total={(single!.progress as any).total}
          accent={theme.accent}
        />
      )}
    </button>
  );
}
