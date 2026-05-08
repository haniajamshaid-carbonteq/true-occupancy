/* global React, AppShell, Button, Icon, SearchBar, Pill, ReactRouterDOM, SCENARIOS */
// Home — product-first dashboard. The user lands directly on the working
// scanner with real evidence visible (KPI strip, recent scans, flagged for
// review, methodology note). Marketing-landing surfaces (photo hero,
// "How it works" cards, mission quote, sample-result section, four-column
// gradient footer) live in the prior commit history if needed for /about.
//
// Scenario routing is keyed off the ZIP for the demo:
//   28804 -> clean      (low risk)
//   28805 -> medium     (questionable)
//   28806 -> high       (red flag)
//   anything else -> clean (safe default)

const { useHistory } = ReactRouterDOM;

const ZIP_TO_SCENARIO: Record<string, 'low' | 'medium' | 'high'> = {
  '28804': 'low',
  '28805': 'medium',
  '28806': 'high',
};

function pickScenario(input: string): 'low' | 'medium' | 'high' {
  const zip = (input.match(/\b(\d{5})(?:-\d{4})?\b/) || [])[1];
  if (zip && ZIP_TO_SCENARIO[zip]) return ZIP_TO_SCENARIO[zip];
  return 'low';
}

// --- demo data (believable, not aspirational) -----------------------------

const KPIS: { label: string; value: string; delta?: { dir: 'up' | 'down'; pct: string }; hint: string }[] = [
  { label: 'Scanned today',     value: '34',  delta: { dir: 'up',   pct: '+12%' }, hint: 'vs. yesterday' },
  { label: 'Flagged this week', value: '11',  delta: { dir: 'up',   pct: '+3' },   hint: 'vs. last week' },
  { label: 'Verified clean',    value: '187', delta: { dir: 'up',   pct: '+22' },  hint: 'past 30 days' },
  { label: 'Avg confidence',    value: '92',  delta: { dir: 'down', pct: '-1pt' }, hint: 'vs. 30 d avg' },
];

interface RecentScan {
  id: string;
  address: string;
  scenario: 'low' | 'medium' | 'high';
  platforms: number;
  scannedAgo: string;
}

const RECENT_SCANS: RecentScan[] = [
  { id: 'r1', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAgo: '8 min ago'  },
  { id: 'r2', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAgo: '24 min ago' },
  { id: 'r3', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAgo: '1 h ago'    },
  { id: 'r4', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAgo: '2 h ago'    },
  { id: 'r5', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '3 h ago'    },
  { id: 'r6', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAgo: '4 h ago'    },
];

const FLAGGED_FOR_REVIEW = RECENT_SCANS.filter((r) => r.scenario === 'high').slice(0, 3);

const VERDICT_VARIANT: Record<'low' | 'medium' | 'high', 'clean' | 'warn' | 'risk'> = {
  low: 'clean',
  medium: 'warn',
  high: 'risk',
};

const HOME_VERDICT_LABEL: Record<'low' | 'medium' | 'high', string> = {
  low: 'Clean',
  medium: 'Questionable',
  high: 'Red flag',
};

const SAMPLE_CHIPS: { zip: string; label: string }[] = [
  { zip: '28804', label: 'Clean' },
  { zip: '28805', label: 'Questionable' },
  { zip: '28806', label: 'Red flag' },
];

// --- subcomponents --------------------------------------------------------

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-sans text-[10.5px] font-semibold tracking-[0.16em] uppercase"
      style={{ color: 'var(--ink-3)' }}
    >
      {children}
    </div>
  );
}

function KpiTile({ kpi, isLast }: { kpi: typeof KPIS[number]; isLast: boolean }) {
  const up = kpi.delta?.dir === 'up';
  return (
    <div className={`px-5 py-4 sm:px-6 sm:py-5 ${isLast ? '' : 'sm:border-r sm:border-line'}`}>
      <Eyebrow>{kpi.label}</Eyebrow>
      <div
        className="font-sans font-semibold text-[34px] sm:text-[36px] leading-none tracking-[-0.012em] tabular-nums mt-2.5 mb-2"
        style={{ color: 'var(--navy)' }}
      >
        {kpi.value}
      </div>
      <div className="flex items-center gap-2 text-[12.5px]">
        {kpi.delta && (
          <span
            className="inline-flex items-center gap-1 font-semibold tabular-nums"
            style={{ color: up ? 'var(--brand-deep)' : 'var(--risk-ink)' }}
          >
            <svg
              viewBox="0 0 12 12"
              className="w-2.5 h-2.5"
              fill="currentColor"
              aria-hidden
            >
              {up ? <path d="M6 2 11 9H1z" /> : <path d="M6 10 1 3h10z" />}
            </svg>
            {kpi.delta.pct}
          </span>
        )}
        <span className="text-ink-3 truncate">{kpi.hint}</span>
      </div>
    </div>
  );
}

function ScanRow({ row, onOpen }: { row: RecentScan; onOpen: (row: RecentScan) => void }) {
  const sc = SCENARIOS[row.scenario];
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full grid grid-cols-[1fr_120px_72px_72px_92px_24px] gap-4 px-5 py-3.5 text-left border-t border-line first:border-t-0 hover:bg-brand-tint/40 transition-colors items-center"
    >
      <div className="min-w-0">
        <div
          className="text-[14px] font-semibold truncate"
          style={{ color: 'var(--navy)' }}
        >
          {row.address}
        </div>
      </div>
      <div className="hidden sm:flex">
        <Pill variant={VERDICT_VARIANT[row.scenario]} dot>
          {HOME_VERDICT_LABEL[row.scenario]}
        </Pill>
      </div>
      <div className="hidden sm:block text-right tabular-nums font-semibold text-[14px]" style={{ color: 'var(--navy)' }}>
        {sc.score}
      </div>
      <div className="hidden md:block text-right tabular-nums text-[13px] text-ink-3">
        {row.platforms} / 3
      </div>
      <div className="hidden md:block text-right text-[12.5px] text-ink-3">
        {row.scannedAgo}
      </div>
      <svg
        viewBox="0 0 16 16"
        className="w-4 h-4 text-ink-4 justify-self-end"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 4 4 4-4 4" />
      </svg>
    </button>
  );
}

function FlaggedRow({ row, onOpen }: { row: RecentScan; onOpen: (row: RecentScan) => void }) {
  const sc = SCENARIOS[row.scenario];
  return (
    <button
      type="button"
      onClick={() => onOpen(row)}
      className="w-full flex items-center gap-3 px-4 py-3 border-t border-line first:border-t-0 hover:bg-brand-tint/40 transition-colors text-left"
    >
      <span
        className="w-10 h-10 rounded-md grid place-items-center font-semibold text-[13px] tabular-nums shrink-0"
        style={{ background: 'var(--risk-soft)', color: 'var(--risk-ink)' }}
      >
        {sc.score}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[13.5px] font-semibold truncate"
          style={{ color: 'var(--navy)' }}
        >
          {row.address}
        </span>
        <span className="block text-[12px] text-ink-3 truncate">
          {row.platforms} platforms · {row.scannedAgo}
        </span>
      </span>
      <svg
        viewBox="0 0 16 16"
        className="w-4 h-4 text-ink-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 4 4 4-4 4" />
      </svg>
    </button>
  );
}

// --- the page -------------------------------------------------------------

function HomeScreen() {
  const history = useHistory();
  const [address, setAddress] = React.useState('');

  function startScan(addr?: string) {
    const value = addr ?? address;
    const scenario = pickScenario(value);
    sessionStorage.setItem('scanScenario', scenario);
    sessionStorage.setItem(
      'scanAddress',
      value || '1428 Maplewood Drive, Asheville, NC 28804'
    );
    history.push('/scan/start');
  }

  function openResult(row: RecentScan) {
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

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') startScan();
  }

  return (
    <AppShell>
      {/* Page header — eyebrow + H1 + sync status */}
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
            Verify property occupancy.
          </h1>
          <p className="text-[14.5px] text-ink-2 leading-relaxed m-0 mt-2 max-w-[58ch]">
            Scan a single address, or pull from a batch. We cross-reference Airbnb,
            Vrbo, and Facebook Marketplace within a 1-mile radius and return a
            confidence score with every contributing signal.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
          <Eyebrow>Last sync</Eyebrow>
          <span className="text-[13px] tabular-nums" style={{ color: 'var(--navy)' }}>
            2 min ago
          </span>
          <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--brand)' }}
              aria-hidden
            />
            All platforms healthy
          </span>
        </div>
      </header>

      {/* Scanner card — primary affordance */}
      <section className="mb-10 sm:mb-12">
        <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <Eyebrow>New scan</Eyebrow>
            <span className="text-[12px] text-ink-3 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-2 text-[11px] font-mono">Enter</kbd> to run
            </span>
          </div>
          <SearchBar
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Enter a U.S. street address, parcel ID, or geocoded coordinates"
            icon={<Icon name="search" />}
            containerClassName="!shadow-none !border-line-strong !rounded-lg"
            trailing={
              <Button
                variant="primary"
                onClick={() => startScan()}
                icon={<Icon name="search" size={14} />}
              >
                Run scan
              </Button>
            }
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-ink-3 uppercase tracking-[0.14em] font-semibold mr-1">
              Try
            </span>
            {SAMPLE_CHIPS.map((c) => (
              <button
                key={c.zip}
                type="button"
                onClick={() =>
                  setAddress(`1428 Maplewood Drive, Asheville, NC ${c.zip}`)
                }
                className="px-2.5 py-1 rounded-full border border-line text-[12px] text-ink-2 hover:border-brand/40 hover:text-brand-deep hover:bg-brand-tint/40 transition-colors"
              >
                {c.zip} · {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="mb-10 sm:mb-12">
        <div className="bg-surface border border-line rounded-xl grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-line">
          {KPIS.map((kpi, i) => (
            <KpiTile key={kpi.label} kpi={kpi} isLast={i === KPIS.length - 1} />
          ))}
        </div>
      </section>

      {/* Recent scans table */}
      <section className="mb-10 sm:mb-12">
        <div className="flex items-end justify-between mb-3 gap-4">
          <div>
            <Eyebrow>Activity</Eyebrow>
            <h2
              className="font-sans font-semibold text-[20px] sm:text-[22px] tracking-[-0.005em] m-0 mt-1"
              style={{ color: 'var(--navy)' }}
            >
              Recent scans
            </h2>
          </div>
          <Button
            variant="ghost"
            iconRight={
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 4 4 4-4 4" />
              </svg>
            }
          >
            View all
          </Button>
        </div>

        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_72px_72px_92px_24px] gap-4 px-5 py-2.5 bg-surface-2 border-b border-line">
            <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Address</div>
            <div className="hidden sm:block font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Verdict</div>
            <div className="hidden sm:block text-right font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Score</div>
            <div className="hidden md:block text-right font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Platforms</div>
            <div className="hidden md:block text-right font-sans text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-3">Scanned</div>
            <div />
          </div>
          {RECENT_SCANS.map((row) => (
            <ScanRow key={row.id} row={row} onOpen={openResult} />
          ))}
        </div>
      </section>

      {/* Two-card row: Flagged + Methodology */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 sm:mb-12">
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <div>
              <Eyebrow>Needs attention</Eyebrow>
              <h3
                className="font-sans font-semibold text-[16px] tracking-[-0.005em] m-0 mt-1"
                style={{ color: 'var(--navy)' }}
              >
                Flagged for review
              </h3>
            </div>
            <Pill variant="risk" dot>
              {FLAGGED_FOR_REVIEW.length} open
            </Pill>
          </div>
          {FLAGGED_FOR_REVIEW.map((row) => (
            <FlaggedRow key={row.id} row={row} onOpen={openResult} />
          ))}
        </div>

        <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 flex flex-col">
          <Eyebrow>Methodology</Eyebrow>
          <h3
            className="font-sans font-semibold text-[16px] tracking-[-0.005em] m-0 mt-1 mb-3"
            style={{ color: 'var(--navy)' }}
          >
            How we score a property.
          </h3>
          <p className="text-[14px] text-ink-2 leading-relaxed m-0">
            Each scan combines listing fingerprints (photos, room counts, host
            handles) across Airbnb, Vrbo, and Facebook Marketplace with parcel
            and occupancy records. Every result surfaces the contributing
            signals so you can verify the verdict before acting on it.
          </p>
          <div className="mt-auto pt-5">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold no-underline group"
              style={{ color: 'var(--brand-deep)' }}
            >
              Read the full methodology
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 4 4 4-4 4" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Utility footer — single hairline strip */}
      <footer className="mt-12 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 border-t border-line">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-5 text-[12.5px] text-ink-3">
          <div>
            © 2026 Halcyon Solutions · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup> · Decide with certainty.
          </div>
          <div className="flex items-center gap-5">
            <a href="#" className="no-underline hover:text-brand-deep">Privacy</a>
            <a href="#" className="no-underline hover:text-brand-deep">Terms</a>
            <a href="#" className="no-underline hover:text-brand-deep">Status</a>
          </div>
        </div>
      </footer>
    </AppShell>
  );
}
