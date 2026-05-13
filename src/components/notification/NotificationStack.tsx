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
      className="notification-dock-stack w-[420px] max-h-[360px] border border-white/[0.08] p-3 flex flex-col gap-3 overflow-hidden"
      style={{
        borderRadius: 22,
        background: 'rgba(20,45,85,0.92)',
        boxShadow:
          '0 16px 40px -10px rgba(20,45,85,0.42), 0 4px 10px rgba(20,45,85,0.22)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 pt-1 pb-0.5 px-2">
        <span
          className="font-mono text-eyebrow uppercase"
          style={{
            letterSpacing: '0.08em',
            color: 'rgba(255,255,255,0.5)',
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
          className="ml-auto appearance-none bg-transparent border-0 cursor-pointer p-1 leading-none rounded-md hover:bg-white/8"
          style={{ color: 'rgba(255,255,255,0.55)' }}
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
