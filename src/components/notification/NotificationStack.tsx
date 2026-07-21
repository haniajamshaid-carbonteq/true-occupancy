/* global React, NotificationRow, Icon */
// NotificationStack — expanded accordion shell. Header summarises the
// queue; body renders one NotificationRow per task.

interface NotificationStackProps {
  notifications: any[];
  onCollapse?: () => void;
  onDismiss?: (id: string) => void;
}

function NotificationStack({
  notifications,
  onCollapse,
  onDismiss,
}: NotificationStackProps) {
  const running = notifications.filter((n) => n.status === 'running').length;
  const done = notifications.filter(
    (n) => n.status === 'completed' || n.status === 'completed-errors',
  ).length;
  const failed = notifications.filter((n) => n.status === 'error').length;

  const headerBits: string[] = [];
  if (running > 0) headerBits.push(`${running} running`);
  if (done > 0) headerBits.push(`${done} done`);
  if (failed > 0) headerBits.push(`${failed} failed`);

  const hasAlert = failed > 0;

  return (
    <div
      role={hasAlert ? 'alert' : 'status'}
      aria-live={hasAlert ? 'assertive' : 'polite'}
      className="notification-dock-stack w-[420px] max-h-[360px] border p-3 flex flex-col gap-3 overflow-hidden"
      style={{
        borderRadius: 'var(--r-dock)',
        background: 'var(--surface)',
        borderColor: 'var(--line-strong)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 pt-1 pb-0.5 px-2">
        <span
          className="font-mono text-eyebrow uppercase"
          style={{
            letterSpacing: '0.08em',
            color: 'var(--ink-4)',
            lineHeight: 1,
          }}
        >
          {headerBits.length > 0
            ? headerBits.join(' · ')
            : `${notifications.length} tasks`}
        </span>
        <button
          type="button"
          aria-label="Collapse"
          onClick={onCollapse}
          className="ml-auto appearance-none bg-transparent border-0 cursor-pointer p-1 leading-none rounded-md hover:bg-hover-bg"
          style={{ color: 'var(--ink-3)' }}
        >
          <span className="inline-block rotate-180" aria-hidden>
            <Icon name="chevron" size={12} />
          </span>
        </button>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2 overflow-y-auto pr-0.5">
        {notifications.map((n) => (
          <NotificationRow key={n.id} notif={n} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
}
