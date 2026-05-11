/* global React, AppShell, Button, Icon, Pill, DataTable, Modal, useAppState,
   HOME_VERDICT_LABEL, VERDICT_ACCENT, splitAddress */
// Scheduled — every automation the user has set up. Filter by Type
// (Single vs Batch), search by address or filename, click a row to open
// a details modal.

type Filter = 'all' | 'single' | 'batch';

function ScheduledScreen() {
  const { schedules } = useAppState();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState<any | null>(null);

  const rows = schedules.filter((s: any) => {
    if (filter !== 'all' && s.kind !== filter) return false;
    if (query) {
      const target = s.kind === 'batch' ? s.filename : s.address;
      if (!target.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const FILTER_OPTS: { id: Filter; label: string; count: number }[] = [
    { id: 'all',    label: 'All',    count: schedules.length },
    { id: 'single', label: 'Single', count: schedules.filter((s: any) => s.kind === 'single').length },
    { id: 'batch',  label: 'Batch',  count: schedules.filter((s: any) => s.kind === 'batch').length },
  ];

  const COLUMNS: any[] = [
    {
      key: 'type',
      label: 'Type',
      width: '96px',
      cell: (r: any) => <Pill>{r.kind === 'batch' ? 'Batch' : 'Single'}</Pill>,
    },
    {
      key: 'target',
      label: 'Target',
      primary: true,
      cell: (r: any) => {
        if (r.kind === 'batch') {
          return (
            <div className="min-w-0">
              <div
                className="font-sans font-semibold text-body-sm leading-tight truncate"
                style={{ color: 'var(--navy)' }}
              >
                {r.filename}
              </div>
              <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
                {r.total} properties
              </div>
            </div>
          );
        }
        const [street, locality] = splitAddress(r.address);
        return (
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {street}
            </div>
            {locality && (
              <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
                {locality}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'cadence',
      label: 'Cadence',
      width: '140px',
      hideBelow: 'sm' as const,
      cell: (r: any) => (
        <span className="font-sans text-label text-ink-2 whitespace-nowrap">
          Every {r.cadenceMonths} months
        </span>
      ),
    },
    {
      key: 'next',
      label: 'Next run',
      width: '120px',
      align: 'right' as const,
      hideBelow: 'md' as const,
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {r.nextRunLabel}
        </span>
      ),
    },
    {
      key: 'created',
      label: 'Created',
      width: '100px',
      align: 'right' as const,
      hideBelow: 'md' as const,
      cell: (r: any) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {r.createdAgo}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-end justify-between gap-6 mb-8 pb-5 border-b border-line">
        <div>
          <div
            className="font-sans text-micro font-semibold tracking-[0.14em] uppercase mb-1.5"
            style={{ color: 'var(--brand-deep)' }}
          >
            Halcyon · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
          </div>
          <h1
            className="font-sans font-semibold leading-[1.1] tracking-[-0.012em] m-0"
            style={{ fontSize: 'clamp(28px, 4.4vw, 40px)', color: 'var(--navy)' }}
          >
            Scheduled Scans.
          </h1>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2">
            Automations re-run on your chosen cadence. Click any row to view details or cancel.
          </p>
        </div>
      </header>

      {/* Filter + search bar */}
      <section className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTS.map((opt) => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-caption font-medium transition-colors ${
                  active
                    ? '!bg-brand-tint !border-brand/40'
                    : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
                }`}
                style={{ color: active ? 'var(--brand-deep)' : 'var(--ink-2)' }}
              >
                {opt.label}
                <span
                  className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? 'rgba(2,146,190,0.12)' : 'var(--surface-2)',
                    color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                  }}
                >
                  {opt.count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-[280px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
            <Icon name="search" size={14} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Filter by target"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-line text-label outline-none focus:border-brand placeholder:text-ink-4"
          />
        </div>
      </section>

      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r: any) => r.id}
        onRowClick={(r: any) => setOpen(r)}
        pageSize={10}
        empty={
          <div className="px-5 py-12 text-center text-label text-ink-3">
            No schedules yet — click <span className="font-medium text-ink-2">Automate</span> on a scan or batch to set one up.
          </div>
        }
      />

      <ScheduleDetailsModal entry={open} onClose={() => setOpen(null)} />
    </AppShell>
  );
}

function ScheduleDetailsModal({ entry, onClose }: { entry: any | null; onClose: () => void }) {
  if (!entry) {
    return <Modal open={false} onClose={onClose} />;
  }
  const isBatch = entry.kind === 'batch';
  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={isBatch ? 'Batch automation' : 'Single-property automation'}
      width={520}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="default" onClick={onClose}>Cancel automation</Button>
        </>
      }
    >
      <dl className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-body-sm">
        <dt className="text-ink-3 font-medium">Target</dt>
        <dd className="text-ink-2">{isBatch ? entry.filename : entry.address}</dd>

        {isBatch && (
          <>
            <dt className="text-ink-3 font-medium">Properties</dt>
            <dd className="text-ink-2 tabular-nums">{entry.total}</dd>
          </>
        )}

        <dt className="text-ink-3 font-medium">Cadence</dt>
        <dd className="text-ink-2">Every {entry.cadenceMonths} months</dd>

        <dt className="text-ink-3 font-medium">Next run</dt>
        <dd className="text-ink-2">{entry.nextRunLabel}</dd>

        <dt className="text-ink-3 font-medium">Created</dt>
        <dd className="text-ink-2">{entry.createdAgo}</dd>
      </dl>
    </Modal>
  );
}
