/* global React, Icon */
// NotificationRow — single task line inside the expanded NotificationStack.
// Pure presentation; status-driven accent. Uses the shared <Icon> set and
// Tailwind type/radius tokens so the dock stays inside the design system.

type NotifKind = 'batch' | 'ai-investigator';
type NotifStatus = 'running' | 'completed' | 'completed-errors' | 'error';

type NotifProgress =
  | { kind: 'count'; done: number; total: number }
  | { kind: 'step'; step: 1 | 2; of: 2 };

interface Notification {
  id: string;
  kind: NotifKind;
  status: NotifStatus;
  title: string;
  meta?: string;
  progress?: NotifProgress;
  failed?: number;
  href?: string;
  startedAt: number;
  finishedAt?: number;
  autoDismissAt?: number;
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
}

// ── Status visuals ─────────────────────────────────────────────────────
// Soft tints stay just inside the dock's dark surface so the status accent
// reads at a glance without re-tinting the whole pill per state.
// Soft tints reuse the existing `*-soft` tokens (see tokens.css §3) —
// designed for light surfaces.
const STATUS_THEME: Record<
  NotifStatus,
  { accent: string; soft: string }
> = {
  'running':          { accent: 'var(--brand)', soft: 'var(--brand-soft)' },
  'completed':        { accent: 'var(--clean)', soft: 'var(--clean-soft)' },
  'completed-errors': { accent: 'var(--warn)',  soft: 'var(--warn-soft)' },
  'error':            { accent: 'var(--risk)',  soft: 'var(--risk-soft)' },
};

// Spinner glyph reuses motion.css `ai-spin` so the dock and AICta share
// one motion language for "thinking".
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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

function StatusGlyph({ status }: { status: NotifStatus }) {
  if (status === 'running') return <Spinner size={14} />;
  // Error reuses the standard alert glyph from the shared icon set.
  return <Icon name={status === 'completed' ? 'check' : 'alert'} size={14} />;
}

// ── Progress affordances ───────────────────────────────────────────────
function CountProgress({
  done,
  total,
  accent,
}: { done: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div
      className="mt-1 h-[3px] w-full rounded-full overflow-hidden"
      style={{ background: 'var(--line)' }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
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

function StepProgress({
  step,
  of,
  accent,
}: { step: 1 | 2; of: 2; accent: string }) {
  return (
    <div className="mt-1 flex gap-1.5 items-center" aria-label={`Step ${step} of ${of}`}>
      {Array.from({ length: of }).map((_, i) => {
        const idx = i + 1;
        const filled = idx < step;
        const active = idx === step;
        return (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full relative overflow-hidden"
            style={{
              background: filled
                ? accent
                : active
                  ? 'var(--line-strong)'
                  : 'var(--line)',
            }}
          >
            {active && (
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${accent} 50%, transparent 100%)`,
                  animation: 'dock-shimmer 1400ms ease-in-out infinite',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Action button (mirrors <Button>'s primary / default variants for the
// white dock surface so the dock and the rest of the product chrome
// share one button language). ──
function RowAction({
  label,
  primary,
  onClick,
}: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex items-center h-8 px-3 rounded-md font-sans font-medium text-caption',
        'border transition-[background-color,border-color,color] duration-150',
        'cursor-pointer shrink-0',
        primary
          ? 'bg-brand border-brand text-white hover:bg-brand-deep hover:border-brand-deep'
          : 'bg-surface border-line-strong text-ink-2 hover:bg-hover-bg',
      ].join(' ')}
      style={{ letterSpacing: '0.01em' }}
    >
      {label}
    </button>
  );
}

// ── Row ────────────────────────────────────────────────────────────────
interface NotificationRowProps {
  notif: Notification;
  onDismiss?: (id: string) => void;
}

function NotificationRow({ notif, onDismiss }: NotificationRowProps) {
  const theme = STATUS_THEME[notif.status];
  const isRunning = notif.status === 'running';
  return (
    <div
      role="group"
      aria-label={`${notif.title}${notif.meta ? ` — ${notif.meta}` : ''}`}
      className="flex gap-3 p-3 rounded-xl border border-line transition-colors duration-150 hover:bg-hover-bg"
      style={{ background: 'var(--surface-2)' }}
    >
      {/* Status chip */}
      <div
        className="w-[26px] h-[26px] rounded-full grid place-items-center shrink-0 mt-[1px]"
        style={{ background: theme.soft, color: theme.accent }}
        aria-hidden
      >
        <StatusGlyph status={notif.status} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 justify-between">
          <div
            className="font-sans font-semibold text-label whitespace-nowrap overflow-hidden text-ellipsis min-w-0"
            style={{ color: 'var(--ink-2)', lineHeight: 1.3 }}
          >
            {notif.title}
          </div>
          {!isRunning && (
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => onDismiss?.(notif.id)}
              className="appearance-none bg-transparent border-0 cursor-pointer p-1 leading-none rounded-sm hover:bg-hover-bg"
              style={{ color: 'var(--ink-3)' }}
            >
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        {notif.meta && (
          <div
            className="font-mono text-micro mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: 'var(--ink-3)', lineHeight: 1.4 }}
          >
            {notif.meta}
          </div>
        )}

        {notif.progress?.kind === 'count' && (
          <CountProgress
            done={notif.progress.done}
            total={notif.progress.total}
            accent={theme.accent}
          />
        )}
        {notif.progress?.kind === 'step' && (
          <StepProgress
            step={notif.progress.step}
            of={notif.progress.of}
            accent={theme.accent}
          />
        )}

        {(notif.primaryAction || notif.secondaryAction) && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {notif.primaryAction && (
              <RowAction
                label={notif.primaryAction.label}
                onClick={notif.primaryAction.onClick}
                primary
              />
            )}
            {notif.secondaryAction && (
              <RowAction
                label={notif.secondaryAction.label}
                onClick={notif.secondaryAction.onClick}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
