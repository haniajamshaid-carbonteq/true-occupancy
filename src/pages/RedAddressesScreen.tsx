/* global React, AppShell, DataTable, Pill, Button, Icon, ScreenEmpty, ScreenError,
   useAppState, RedPropertyDrawer, OCC_INTENT_SHORT, OCC_VERDICT_LABEL, OCC_STATUS_TONE,
   formatUsDate, occDaysSince */

// Red addresses — every property whose scan contradicts what was declared
// for it. Deliberately NOT a fourth column of colour: every row here is red
// by definition, so the table spends its width on declared-vs-found, which
// is the reason the row exists at all.

interface RedRow {
  id: string;
  address: string;
  intent: string;
  verdict: string;
  confidence: number;
  servedAt: string;
  source: string;
  recurring?: string;
  /** Set once an operator has stopped recurring scans for this property. */
  scansStopped?: boolean;
  /** Recurring red-flag scans that have run, newest first. */
  scanHistory?: { at: string; verdict: string }[];
}

interface RedAddressesScreenProps {
  rows?: RedRow[];
  loading?: boolean;
  error?: boolean;
  /** true = the empty result is a filtered miss, not a first-use empty. */
  filtered?: boolean;
  onOpen?: (row: RedRow) => void;
  onRetry?: () => void;
}

function RedAddressesScreen({
  rows = [],
  loading = false,
  error = false,
  filtered = false,
  onOpen,
  onRetry,
}: RedAddressesScreenProps) {
  const columns = React.useMemo(
    () => [
      {
        key: 'address',
        label: 'Address',
        primary: true,
        cell: (r: RedRow) => (
          <span className="inline-flex items-center gap-inline">
            <span
              className="shrink-0 w-2 h-2 rounded-pill"
              style={{ background: 'var(--risk)' }}
              aria-hidden
            />
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              {r.address}
            </span>
            {r.scansStopped && (
              <Pill variant="default" size="sm" subtle>
                Scans stopped
              </Pill>
            )}
          </span>
        ),
      },
      {
        key: 'intent',
        label: 'Declared',
        width: '150px',
        hideBelow: 'md',
        cell: (r: RedRow) => (
          <span style={{ color: 'var(--ink-2)' }}>{OCC_INTENT_SHORT[r.intent]}</span>
        ),
      },
      {
        key: 'verdict',
        label: 'Found',
        width: '140px',
        cell: (r: RedRow) => (
          <span style={{ color: 'var(--ink-2)' }}>{OCC_VERDICT_LABEL[r.verdict]}</span>
        ),
      },
      {
        key: 'served',
        label: 'Served',
        width: '150px',
        hideBelow: 'lg',
        cell: (r: RedRow) => (
          <span className="tabular-nums" style={{ color: 'var(--ink-3)' }}>
            {formatUsDate(r.servedAt)}
          </span>
        ),
      },
      {
        key: 'age',
        label: 'Age',
        width: '90px',
        align: 'right',
        hideBelow: 'lg',
        cell: (r: RedRow) => (
          <span className="tabular-nums" style={{ color: 'var(--ink-3)' }}>
            {occDaysSince(r.servedAt)} d
          </span>
        ),
      },
    ],
    []
  );

  if (error) {
    return (
      <AppShell>
        <div className="mt-section">
          <ScreenError
            title="Couldn't load red addresses"
            message="The exception list didn't respond. Nothing has changed on your properties."
            onRetry={onRetry}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
    <div className="pb-section">
      <div className="mt-section flex flex-wrap items-end justify-between gap-stack">
        <div>
          <div
            className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase"
            style={{ color: 'var(--brand)' }}
          >
            Exceptions
          </div>
          <h1 className="font-sans text-h2 font-semibold mt-1" style={{ color: 'var(--navy)' }}>
            Red addresses
          </h1>
          <p className="font-sans text-body-sm mt-2 max-w-[68ch]" style={{ color: 'var(--ink-2)' }}>
            {loading
              ? 'Loading properties that contradict their declared occupancy.'
              : rows.length > 0
              ? `${rows.length} ${
                  rows.length === 1 ? 'property contradicts' : 'properties contradict'
                } their declared occupancy.`
              : 'Properties whose scan contradicts what was declared for them.'}
          </p>
        </div>
      </div>

      <div className="mt-section-sub">
        <DataTable
          columns={columns as any}
          rows={rows}
          rowKey={(r: RedRow) => r.id}
          loading={loading}
          onRowClick={onOpen}
          pageSize={12}
          empty={
            filtered ? (
              <div className="py-stack-md text-center">
                <p className="font-sans text-body-sm" style={{ color: 'var(--ink-2)' }}>
                  No red addresses match these filters.
                </p>
                <p className="font-sans text-caption mt-1" style={{ color: 'var(--ink-3)' }}>
                  Clear the filters to see every exception.
                </p>
              </div>
            ) : (
              <ScreenEmpty
                icon="shield"
                title="No addresses contradict their declaration"
                message="Every scanned property matches what was declared for it. New exceptions appear here as soon as a scan finds one."
              />
            )
          }
        />
      </div>
    </div>
    </AppShell>
  );
}

// Seed data for the prototype. The live app will read these from the scan
// store, filtered to rows whose resolved status is 'red'.
const RED_ADDRESS_SEED: RedRow[] = [
  {
    id: 'r1',
    address: '412 Cumberland Ave, Asheville, NC 28801',
    intent: 'owner-occupied',
    verdict: 'rented',
    confidence: 81,
    servedAt: '2026-07-29T16:02:00',
    source: 'Automation · Asheville Q2',
    recurring: 'monthly',
    // Recurring red-flag scans that have run for this property, newest first.
    scanHistory: [
      { at: '2026-07-29T16:02:00', verdict: 'rented' },
      { at: '2026-06-29T15:40:00', verdict: 'rented' },
      { at: '2026-05-29T14:10:00', verdict: 'possibly-rented' },
      { at: '2026-04-29T11:05:00', verdict: 'rented' },
    ],
  },
  {
    id: 'r2',
    address: '7 Beaucatcher Rd, Asheville, NC 28805',
    intent: 'second-home',
    verdict: 'rented',
    confidence: 88,
    servedAt: '2026-07-25T09:40:00',
    source: 'Batch · asheville-q2-2026.csv',
    recurring: 'monthly',
    scanHistory: [
      { at: '2026-07-25T09:40:00', verdict: 'rented' },
      { at: '2026-06-25T09:10:00', verdict: 'rented' },
      { at: '2026-05-25T08:55:00', verdict: 'rented' },
    ],
  },
  {
    id: 'r3',
    address: '153 Merrimon Ave, Asheville, NC 28804',
    intent: 'owner-occupied',
    verdict: 'rented',
    confidence: 74,
    // Deliberately old — its report demonstrates the stale-freshness flow.
    servedAt: '2026-06-14T11:15:00',
    source: 'Single scan',
    recurring: 'monthly',
    scansStopped: true,
    scanHistory: [
      { at: '2026-06-14T11:15:00', verdict: 'rented' },
      { at: '2026-05-14T10:30:00', verdict: 'rented' },
    ],
  },
];

// A property that has been flagged red (its scan contradicts what was declared
// for it) should be recognisable everywhere it appears — not only inside the
// Red-addresses tab. These helpers are the shared source of truth for "is this
// address red?" and the small danger marker that rides next to it.
//
// Live app: this set would come from the scan store. In the prototype it is
// derived from the same seed the red tabs render.
function normalizeAddress(a: string): string {
  return (a || '').toLowerCase().replace(/\s+/g, ' ').trim();
}
const RED_ADDRESS_SET: Set<string> = new Set(
  RED_ADDRESS_SEED.map((r) => normalizeAddress(r.address))
);
function isRedAddress(address: string): boolean {
  return RED_ADDRESS_SET.has(normalizeAddress(address));
}
// The full red record for an address (declared/found/served/recurring), so a
// batch row can open the same red drawer a single property does.
function redRecordFor(address: string): RedRow | undefined {
  return RED_ADDRESS_SEED.find((r) => normalizeAddress(r.address) === normalizeAddress(address));
}

// The danger marker. Native title tooltip keeps it dependency-free so it can
// drop into any address cell. `risk` tone, never the verdict palette.
function RedFlag({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5 ${className}`}
      style={{ color: 'var(--risk)' }}
      title="Flagged red — contradicts declared occupancy"
      aria-label="Flagged red"
    >
      <Icon name="warning" size={14} />
    </span>
  );
}

// The "N red" pill shown on a BATCH row (in Scheduled + History) when the
// batch contains red-flagged properties. One shared component so the two
// screens can never drift. Renders nothing when count is 0.
function BatchRedBadge({ count, onClick }: { count: number; onClick?: (e: any) => void }) {
  if (!count) return null;
  const inner = (
    <>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--risk)' }} aria-hidden />
      {count} red
    </>
  );
  const cls =
    'shrink-0 inline-flex items-center gap-1 h-[18px] pl-1.5 pr-1.5 rounded-full text-micro font-semibold tabular-nums';
  const style = { background: 'var(--risk-soft)', color: 'var(--risk-ink)' } as React.CSSProperties;
  const title = `${count} red ${count === 1 ? 'flag' : 'flags'} in this batch`;
  // Clickable variant: jumps to the batch's red-filtered properties. A span
  // with role=button (not a <button>) because the table row is itself a
  // <button> and nesting is invalid. stopPropagation keeps the row click from
  // also firing.
  if (onClick) {
    const fire = (e: any) => {
      e.stopPropagation();
      onClick(e);
    };
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={fire}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fire(e);
          }
        }}
        className={`${cls} cursor-pointer transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-risk focus-visible:ring-offset-1`}
        style={style}
        title={`${title} — view them`}
      >
        {inner}
      </span>
    );
  }
  return (
    <span className={cls} style={style} title={title}>
      {inner}
    </span>
  );
}

// The "Red only" filter toggle. Red is a status, not a place — so instead of a
// separate tab, this isolates the red subset of whatever list it sits on
// (History, a batch, Scheduled). A calm filter chip, not an alarm: a small
// solid dot carries the only colour when idle; the whole chip warms to
// risk-soft when active. The count only renders when there are red rows to
// find, and a hover tooltip explains what it does.
function RedFilterToggle({
  active,
  count,
  onToggle,
}: {
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <div className="relative group inline-flex">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={active ? 'Showing red flags only — click to show all' : `Show only the ${count} red flags`}
        className={`inline-flex items-center gap-inline h-8 pl-2.5 pr-2 rounded-full border text-caption font-medium transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
          active
            ? 'bg-risk-soft border-transparent'
            : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
        }`}
        style={{ color: active ? 'var(--risk-ink)' : 'var(--ink-2)' }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: 'var(--risk)' }}
          aria-hidden
        />
        Red flags
        <span
          className="tabular-nums text-micro font-semibold min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full"
          style={{
            background: active ? 'var(--risk)' : 'var(--surface-2)',
            color: active ? 'var(--on-brand)' : 'var(--ink-3)',
            border: active ? 'none' : '1px solid var(--line)',
          }}
        >
          {count}
        </span>
      </button>
      {/* Tooltip — shows on hover AND keyboard focus. Top-placed, clip-safe. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 bottom-full mb-2 hidden group-hover:block group-focus-within:block whitespace-nowrap rounded-md px-2.5 py-1.5 text-micro font-medium shadow-md z-popover"
        style={{ background: 'var(--navy)', color: 'var(--on-brand)' }}
      >
        Show only red flags — properties whose scan contradicts the declared occupancy.
      </span>
    </div>
  );
}

// NOTE: the standalone /red-addresses route was retired — "red" is a filter
// (the Red flags toggle on History / Scheduled / batch), not a destination.
// `RedAddressesScreen` above is kept only as the design-spec reference for the
// red list's states; all the shared helpers in this file (isRedAddress,
// RedFlag, RedFilterToggle, BatchRedBadge, RedPropertyDrawer wiring, seed) are
// still used across the live app.
