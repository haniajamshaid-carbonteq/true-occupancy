/* global React, AppShell, Button, Icon, Pill, ReactRouterDOM, SCENARIOS,
   SCAN_TABLE_COLS, HOME_VERDICT_LABEL, VERDICT_VARIANT, ScanRow */
// History — full table of past scans the investigator can search, filter,
// and drill into. Reuses ScanRow + table tokens from HomeScreen.tsx so the
// two surfaces feel identical.

interface HistoryRow {
  id: string;
  address: string;
  scenario: 'low' | 'medium' | 'high';
  platforms: number;
  scannedAgo: string;
}

const HISTORY: HistoryRow[] = [
  { id: 'h01', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAgo: '8 min ago'  },
  { id: 'h02', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAgo: '24 min ago' },
  { id: 'h03', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAgo: '1 h ago'    },
  { id: 'h04', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAgo: '2 h ago'    },
  { id: 'h05', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '3 h ago'    },
  { id: 'h06', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAgo: '4 h ago'    },
  { id: 'h07', address: '145 Westchester Dr, Asheville, NC 28803',    scenario: 'high',   platforms: 3, scannedAgo: 'Yesterday' },
  { id: 'h08', address: '23 Tunnel Rd, Asheville, NC 28805',          scenario: 'low',    platforms: 0, scannedAgo: 'Yesterday' },
  { id: 'h09', address: '215 Edgewood Rd, Asheville, NC 28804',       scenario: 'medium', platforms: 1, scannedAgo: 'Yesterday' },
  { id: 'h10', address: '450 Patton Ave, Asheville, NC 28806',        scenario: 'high',   platforms: 2, scannedAgo: '2 d ago'   },
  { id: 'h11', address: '12 Hillside St, Asheville, NC 28801',        scenario: 'low',    platforms: 0, scannedAgo: '2 d ago'   },
  { id: 'h12', address: '156 Sand Hill Rd, Asheville, NC 28806',      scenario: 'high',   platforms: 3, scannedAgo: '3 d ago'   },
  { id: 'h13', address: '89 Beverly Rd, Asheville, NC 28805',         scenario: 'medium', platforms: 1, scannedAgo: '3 d ago'   },
  { id: 'h14', address: '720 Haywood Rd, Asheville, NC 28806',        scenario: 'low',    platforms: 0, scannedAgo: '4 d ago'   },
  { id: 'h15', address: '301 Lakeshore Dr, Asheville, NC 28804',      scenario: 'high',   platforms: 2, scannedAgo: '5 d ago'   },
  { id: 'h16', address: '44 Pine Cone Ln, Asheville, NC 28803',       scenario: 'medium', platforms: 1, scannedAgo: '6 d ago'   },
  { id: 'h17', address: '987 Sunset Pkwy, Asheville, NC 28806',       scenario: 'low',    platforms: 0, scannedAgo: '1 w ago'   },
  { id: 'h18', address: '50 Ridgeview Ct, Asheville, NC 28805',       scenario: 'high',   platforms: 3, scannedAgo: '1 w ago'   },
];

type Filter = 'all' | 'high' | 'medium' | 'low';

const FILTER_OPTIONS: { id: Filter; label: string; count: (rows: HistoryRow[]) => number }[] = [
  { id: 'all',    label: 'All',           count: (r) => r.length },
  { id: 'high',   label: 'Rented',           count: (r) => r.filter((x) => x.scenario === 'high').length },
  { id: 'medium', label: 'Possibly rented',  count: (r) => r.filter((x) => x.scenario === 'medium').length },
  { id: 'low',    label: 'Not rented',       count: (r) => r.filter((x) => x.scenario === 'low').length },
];

function HistoryEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-sans text-[10.5px] font-semibold tracking-[0.16em] uppercase"
      style={{ color: 'var(--ink-3)' }}
    >
      {children}
    </div>
  );
}

function HistoryScreen() {
  const history = ReactRouterDOM.useHistory();
  const [filter, setFilter] = React.useState<Filter>('all');
  const [query, setQuery] = React.useState('');

  const rows = HISTORY.filter((r) => {
    if (filter !== 'all' && r.scenario !== filter) return false;
    if (query && !r.address.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function openResult(row: HistoryRow) {
    sessionStorage.setItem('scanScenario', row.scenario);
    sessionStorage.setItem('scanAddress', row.address);
    const path =
      row.scenario === 'low'
        ? '/result/clean'
        : row.scenario === 'medium'
        ? '/result/medium'
        : '/result/high';
    history.push(path);
  }

  return (
    <AppShell>
      {/* Header */}
      <header className="flex items-end justify-between gap-6 mb-8 pb-5 border-b border-line">
        <div>
          <div
            className="font-sans text-[11px] font-semibold tracking-[0.14em] uppercase mb-1.5"
            style={{ color: 'var(--brand-deep)' }}
          >
            Halcyon · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
          </div>
          <h1
            className="font-sans font-semibold leading-[1.1] tracking-[-0.012em] m-0"
            style={{ fontSize: 'clamp(28px, 4.4vw, 40px)', color: 'var(--navy)' }}
          >
            Scan history.
          </h1>
          <p className="text-[14.5px] text-ink-2 leading-relaxed m-0 mt-2 whitespace-nowrap">
            Every scan you've run — searchable, filterable, click any row to reopen the case.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Button variant="default" icon={<Icon name="pdf" size={14} />}>
            Export CSV
          </Button>
        </div>
      </header>

      {/* Filter + search bar */}
      <section className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => {
            const active = filter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`inline-flex items-center gap-2 h-8 px-3 rounded-md border text-[12.5px] font-medium transition-colors ${
                  active
                    ? '!bg-brand-tint !border-brand/40'
                    : 'bg-surface border-line hover:border-line-strong'
                }`}
                style={{ color: active ? 'var(--brand-deep)' : 'var(--ink-2)' }}
              >
                {opt.label}
                <span
                  className="tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded"
                  style={{
                    background: active ? 'rgba(2,146,190,0.12)' : 'var(--surface-2)',
                    color: active ? 'var(--brand-deep)' : 'var(--ink-3)',
                  }}
                >
                  {opt.count(HISTORY)}
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
            placeholder="Filter by address"
            className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-line text-[13px] outline-none focus:border-brand placeholder:text-ink-4"
          />
        </div>
      </section>

      {/* Table */}
      <div className="bg-surface border border-line rounded-lg overflow-hidden">
        <div className={`grid ${SCAN_TABLE_COLS} gap-4 px-5 py-2.5 bg-surface-2 border-b border-line`}>
          <div />
          <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Address</div>
          <div className="hidden sm:block font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Verdict</div>
          <div className="hidden sm:block font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Score</div>
          <div className="hidden md:block text-right font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Platforms</div>
          <div className="hidden md:block text-right font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Scanned</div>
          <div />
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-[13.5px] text-ink-3">
            No scans match your filters.
          </div>
        ) : (
          rows.map((row) => <ScanRow key={row.id} row={row} onOpen={openResult} />)
        )}
      </div>

      {/* Footer caption */}
      <div className="mt-4 flex items-center justify-between text-[12.5px] text-ink-3">
        <HistoryEyebrow>
          Showing {rows.length} of {HISTORY.length} scans
        </HistoryEyebrow>
        <span>Older scans archived after 90 days.</span>
      </div>
    </AppShell>
  );
}
