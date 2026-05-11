/* global React, SCENARIOS, PROPERTY */
// ListingsPanel — diff-matrix evidence view.
//
// Reframes the matched listings as a comparison table: the property's
// county record sits as the leftmost ground-truth column and each listing
// becomes its own column to the right. Rows are the dimensions a fraudster
// would have to fake convincingly (beds, baths, sq ft, host name, dates).
// Cells use a quiet glyph + tinted text (✓ ⚠ ✕) — no heat-map fills.
// The strongest-confidence listing wears a brand-teal "Strongest match"
// banner across the top with a brand-tint column wash.
//
// Mobile collapses the matrix to one accordion-card per listing. Each card
// shows the same attribute rows in a vertical stack; only one card is open
// at a time to keep scroll depth contained.

interface ListingHost {
  handle: string;
  displayName?: string;
  fuzzyMatchPct?: number;
}

type SignalKind = 'pass' | 'warn' | 'fail';

interface ListingSignal {
  kind: SignalKind;
  label: string;
}

interface Listing {
  title: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  match: 'high' | 'med' | 'low';
  confidencePct: number;
  host: ListingHost;
  firstSeen: string;
  daysPostClose?: number;
  lastVerified: string;
  signals: ListingSignal[];
  url: string;
}

interface ListingsPanelProps {
  scenario: 'low' | 'medium' | 'high';
}

// --- match-tier label ----------------------------------------------------

const MATCH_LABEL: Record<'high' | 'med' | 'low', string> = {
  high: 'Strong match',
  med:  'Partial match',
  low:  'Weak match',
};

// Platform display name keyed off the listing's outer key in scenarios.tsx.
const PLATFORM_NAME: Record<'airbnb' | 'vrbo' | 'fb', string> = {
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
  fb: 'Facebook',
};

type Kind = 'pass' | 'warn' | 'fail' | '';

interface DiffCell {
  value: React.ReactNode;
  kind: Kind;
  sub?: string;
}

interface DiffRow {
  label: string;
  record: string;
  cells: DiffCell[];
}

// Borrower-of-record name. In a real flow this comes from the loan
// application; for the prototype we fall back to the strongest fuzzy-match
// host's display name (or a constant).
function borrowerName(listings: ListingFlat[]): string {
  return 'Margaret Harlow';
}

interface ListingFlat extends Listing {
  platformId: 'airbnb' | 'vrbo' | 'fb';
}

// Flatten scenario.listings (keyed by platform) into a single list, sorted
// by confidence descending so the strongest match is always the first
// column / first card.
function flattenListings(
  byPlatform: Record<'airbnb' | 'vrbo' | 'fb', Listing[]>
): ListingFlat[] {
  const out: ListingFlat[] = [];
  (Object.entries(byPlatform) as [
    'airbnb' | 'vrbo' | 'fb',
    Listing[]
  ][]).forEach(([platformId, items]) => {
    (items || []).forEach((l) => out.push({ ...l, platformId }));
  });
  return out.sort((a, b) => (b.confidencePct || 0) - (a.confidencePct || 0));
}

// Parse PROPERTY.area ("1,924 sq ft") → 1924
function parseSqft(area: string): number {
  const m = area.replace(/,/g, '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

// --- diff-cell renderer --------------------------------------------------

function DiffCellInline({ cell }: { cell: DiffCell }) {
  const cls =
    cell.kind === 'pass'
      ? 'text-ink-2'
      : cell.kind === 'warn'
      ? 'text-warn-ink'
      : cell.kind === 'fail'
      ? 'text-risk-ink'
      : 'text-ink-2';
  const glyphColor =
    cell.kind === 'pass'
      ? 'var(--clean)'
      : cell.kind === 'warn'
      ? 'var(--warn)'
      : cell.kind === 'fail'
      ? 'var(--risk)'
      : 'transparent';
  const glyph =
    cell.kind === 'pass'
      ? '✓'
      : cell.kind === 'warn'
      ? '⚠'
      : cell.kind === 'fail'
      ? '✕'
      : '';
  const subColor =
    cell.kind === 'warn'
      ? 'var(--warn-ink)'
      : cell.kind === 'fail'
      ? 'var(--risk-ink)'
      : 'var(--ink-3)';

  return (
    <div className={`px-3 py-3 text-caption tabular-nums ${cls}`}>
      <div className="font-medium leading-tight flex items-baseline gap-1.5">
        <span
          className="font-bold w-3.5 text-center shrink-0"
          style={{ color: glyphColor }}
          aria-hidden
        >
          {glyph}
        </span>
        <span>{cell.value}</span>
      </div>
      {cell.sub && (
        <div
          className="text-micro mt-0.5 ml-[18px]"
          style={{ color: subColor, opacity: cell.kind === 'pass' || cell.kind === '' ? 1 : 0.85 }}
        >
          {cell.sub}
        </div>
      )}
    </div>
  );
}

// --- shared legend --------------------------------------------------------

function DiffLegend() {
  return (
    <div className="flex items-center flex-wrap gap-x-5 gap-y-2 text-micro text-ink-3 mb-3">
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold" style={{ color: 'var(--clean)' }} aria-hidden>✓</span> Match
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold" style={{ color: 'var(--warn)' }} aria-hidden>⚠</span> Soft mismatch
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="font-bold" style={{ color: 'var(--risk)' }} aria-hidden>✕</span> Hard mismatch
      </span>
    </div>
  );
}

// --- row builders --------------------------------------------------------

// Derive a one-cell summary of address geocode evidence from the signals
// list (no dedicated field on Listing).
function geocodeCell(l: Listing): DiffCell {
  const geocodeSignal = l.signals.find((s) =>
    /geocode/i.test(s.label)
  );
  if (!geocodeSignal) {
    return { value: 'masked', kind: 'warn', sub: 'platform-blocked' };
  }
  if (geocodeSignal.kind === 'pass') {
    return { value: 'within 25 ft', kind: 'pass', sub: 'parcel centroid' };
  }
  if (geocodeSignal.kind === 'warn') {
    return { value: 'masked', kind: 'warn', sub: 'platform-blocked' };
  }
  return { value: 'mismatch', kind: 'fail', sub: 'outside parcel' };
}

function buildRows(listings: ListingFlat[]): DiffRow[] {
  const recordSqft = parseSqft(PROPERTY.area);
  const borrower = borrowerName(listings);

  return [
    {
      label: 'Bedrooms',
      record: String(PROPERTY.bedrooms),
      cells: listings.map((l) => ({
        value: l.beds ?? '— n/a',
        kind:
          l.beds === undefined
            ? 'warn'
            : l.beds === PROPERTY.bedrooms
            ? 'pass'
            : Math.abs(l.beds - PROPERTY.bedrooms) === 1
            ? 'warn'
            : 'fail',
      })),
    },
    {
      label: 'Bathrooms',
      record: String(PROPERTY.bathrooms),
      cells: listings.map((l) => ({
        value: l.baths ?? '— n/a',
        kind:
          l.baths === undefined
            ? 'warn'
            : l.baths === PROPERTY.bathrooms
            ? 'pass'
            : Math.abs(l.baths - PROPERTY.bathrooms) <= 0.5
            ? 'warn'
            : 'fail',
      })),
    },
    {
      label: 'Square feet',
      record: PROPERTY.area.replace(' sq ft', '').replace('sqft', ''),
      cells: listings.map((l) => {
        if (!l.sqft) return { value: '— n/a', kind: 'warn', sub: 'not disclosed' };
        const diff = ((l.sqft - recordSqft) / recordSqft) * 100;
        const adiff = Math.abs(diff);
        const kind: Kind = adiff < 2 ? 'pass' : adiff < 8 ? 'warn' : 'fail';
        const sign = diff >= 0 ? '+' : '−';
        const sub = adiff < 2 ? '' : `${sign}${adiff.toFixed(0)}% vs record`;
        return { value: l.sqft.toLocaleString(), kind, sub };
      }),
    },
    {
      label: 'Geocode',
      record: 'parcel centroid',
      cells: listings.map(geocodeCell),
    },
    {
      label: 'Borrower-name match',
      record: borrower,
      cells: listings.map((l) => ({
        value: typeof l.host.fuzzyMatchPct === 'number' ? `${l.host.fuzzyMatchPct}%` : '— n/a',
        kind:
          typeof l.host.fuzzyMatchPct !== 'number'
            ? 'warn'
            : l.host.fuzzyMatchPct >= 80
            ? 'pass'
            : l.host.fuzzyMatchPct >= 70
            ? 'warn'
            : 'fail',
        sub: `@${l.host.handle}`,
      })),
    },
    {
      label: 'First seen',
      record: 'Close: Mar 12, 2025',
      cells: listings.map((l) => ({
        value:
          typeof l.daysPostClose === 'number'
            ? l.daysPostClose < 0
              ? `−${Math.abs(l.daysPostClose)}d`
              : `+${l.daysPostClose}d`
            : '— n/a',
        kind:
          typeof l.daysPostClose === 'number' && l.daysPostClose >= 0 && l.daysPostClose <= 365
            ? 'fail'
            : '',
        sub: l.firstSeen,
      })),
    },
    {
      label: 'Last verified',
      record: '—',
      cells: listings.map((l) => ({ value: l.lastVerified, kind: '' })),
    },
  ];
}

// --- desktop matrix ------------------------------------------------------

function DesktopMatrix({
  listings,
  rows,
  strongestId,
}: {
  listings: ListingFlat[];
  rows: DiffRow[];
  strongestId: string | null;
}) {
  const cols = `200px repeat(${listings.length}, minmax(180px, 1fr))`;

  function isStrong(idx: number) {
    return listings[idx].url === strongestId;
  }

  return (
    <div className="bg-surface border border-line rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: cols,
            minWidth: 200 + listings.length * 180,
          }}
        >
          {/* Top-left empty corner */}
          <div className="px-4 py-4 sticky left-0 z-10 bg-surface" />

          {/* Column headers — verdict + optional Strongest banner */}
          {listings.map((l, i) => {
            const strong = isStrong(i);
            return (
              <div
                key={`h-${i}`}
                className="border-l border-line flex flex-col"
                style={{ background: strong ? 'var(--brand-tint)' : undefined }}
              >
                {strong ? (
                  <div
                    className="text-center text-white text-eyebrow uppercase tracking-[0.18em] font-semibold py-1.5 leading-none"
                    style={{ background: 'var(--brand)' }}
                  >
                    ★ Strongest match
                  </div>
                ) : (
                  <div
                    className="py-1.5 leading-none"
                    aria-hidden
                    style={{ visibility: 'hidden', fontSize: "var(--text-eyebrow)" }}
                  >
                    ·
                  </div>
                )}
                <div className="px-3 py-3 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <div
                      className="font-sans font-semibold tabular-nums leading-none"
                      style={{
                        fontSize: "var(--text-h2)",
                        color: 'var(--navy)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {l.confidencePct}
                    </div>
                    <div className="text-micro text-ink-4">/ 100</div>
                  </div>
                  <div
                    className="text-eyebrow mt-1.5 uppercase tracking-[0.14em] font-semibold"
                    style={{
                      color:
                        l.match === 'high'
                          ? 'var(--clean-ink)'
                          : 'var(--warn-ink)',
                    }}
                  >
                    {MATCH_LABEL[l.match]}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Source row — handle + platform name */}
          <div className="px-4 py-3 border-t border-line flex flex-col justify-center sticky left-0 z-10 bg-surface">
            <div
              className="font-sans text-label font-semibold"
              style={{ color: 'var(--ink-2)' }}
            >
              Source
            </div>
            <div className="font-mono text-micro mt-0.5 text-ink-3">
              listing host
            </div>
          </div>
          {listings.map((l, i) => (
            <div
              key={`s-${i}`}
              className="border-t border-l border-line px-3 py-3"
              style={{
                background: isStrong(i) ? 'var(--brand-tint)' : undefined,
              }}
            >
              <div
                className="font-mono text-caption font-semibold truncate"
                style={{ color: 'var(--navy)' }}
              >
                @{l.host.handle}
              </div>
              <div className="text-micro mt-1 text-ink-3">
                {PLATFORM_NAME[l.platformId]}
              </div>
            </div>
          ))}

          {/* Data rows */}
          {rows.map((row, ri) => (
            <React.Fragment key={`r-${ri}`}>
              <div className="px-4 py-3 border-t border-line flex flex-col justify-center sticky left-0 z-10 bg-surface">
                <div
                  className="font-sans text-label font-semibold"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {row.label}
                </div>
                <div className="font-mono text-micro mt-0.5 text-ink-3">
                  {row.record}
                </div>
              </div>
              {row.cells.map((c, ci) => (
                <div
                  key={`c-${ri}-${ci}`}
                  className="border-t border-l border-line"
                  style={{
                    background: isStrong(ci) ? 'var(--brand-tint)' : undefined,
                  }}
                >
                  <DiffCellInline cell={c} />
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Action row */}
          <div className="px-4 py-3 border-t border-line sticky left-0 z-10 bg-surface" />
          {listings.map((l, i) => (
            <div
              key={`a-${i}`}
              className="border-t border-l border-line px-3 py-3"
              style={{
                background: isStrong(i) ? 'var(--brand-tint)' : undefined,
              }}
            >
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-caption font-semibold no-underline"
                style={{ color: 'var(--brand-deep)' }}
              >
                Open
                <svg
                  viewBox="0 0 16 16"
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 11 11 5" />
                  <path d="M6 5h5v5" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- mobile accordion stack ----------------------------------------------

function MobileAttrRow({
  label,
  recordValue,
  cell,
}: {
  label: string;
  recordValue: string;
  cell: DiffCell;
}) {
  const valueColor =
    cell.kind === 'warn'
      ? 'var(--warn-ink)'
      : cell.kind === 'fail'
      ? 'var(--risk-ink)'
      : 'var(--ink-2)';
  const glyphColor =
    cell.kind === 'pass'
      ? 'var(--clean)'
      : cell.kind === 'warn'
      ? 'var(--warn)'
      : cell.kind === 'fail'
      ? 'var(--risk)'
      : 'transparent';
  const glyph =
    cell.kind === 'pass'
      ? '✓'
      : cell.kind === 'warn'
      ? '⚠'
      : cell.kind === 'fail'
      ? '✕'
      : '';

  return (
    <div
      className="grid items-baseline gap-2 py-2 border-t border-line text-caption"
      style={{ gridTemplateColumns: '1fr auto' }}
    >
      <div>
        <div
          className="font-sans font-semibold"
          style={{ color: 'var(--ink-2)' }}
        >
          {label}
        </div>
        <div className="font-mono text-eyebrow mt-0.5 text-ink-4">
          {recordValue}
        </div>
      </div>
      <div
        className="font-mono text-micro tabular-nums whitespace-nowrap text-right flex items-baseline gap-1.5 justify-end"
        style={{ color: valueColor }}
      >
        {glyph && (
          <span className="font-bold" style={{ color: glyphColor }} aria-hidden>
            {glyph}
          </span>
        )}
        <span>{cell.value}</span>
      </div>
    </div>
  );
}

function MobileStack({
  listings,
  rows,
  strongestId,
}: {
  listings: ListingFlat[];
  rows: DiffRow[];
  strongestId: string | null;
}) {
  const [openId, setOpenId] = React.useState<string | null>(
    listings[0]?.url || null
  );

  return (
    <div className="space-y-2.5">
      {listings.map((l) => {
        const isStrong = l.url === strongestId;
        const isOpen = l.url === openId;
        return (
          <div
            key={l.url}
            className="bg-surface border border-line rounded-lg overflow-hidden shadow-sm"
            style={
              isStrong
                ? { borderColor: 'var(--brand)', borderWidth: 1.5 }
                : undefined
            }
          >
            {isStrong && (
              <div
                className="text-center text-white text-eyebrow uppercase tracking-[0.18em] font-semibold py-1.5"
                style={{ background: 'var(--brand)' }}
              >
                ★ Strongest match
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                setOpenId((cur) => (cur === l.url ? null : l.url))
              }
              className="w-full text-left px-3 py-3 flex items-center gap-2.5 bg-transparent border-0 cursor-pointer hover:bg-brand-tint/30 transition-colors"
              style={isStrong ? { background: 'var(--brand-tint)' } : undefined}
            >
              <div className="min-w-0 flex-1">
                <div
                  className="font-mono text-caption font-semibold truncate"
                  style={{ color: 'var(--navy)' }}
                >
                  @{l.host.handle}
                </div>
                <div
                  className="text-eyebrow uppercase tracking-[0.14em] font-semibold mt-0.5"
                  style={{
                    color:
                      l.match === 'high'
                        ? 'var(--clean-ink)'
                        : 'var(--warn-ink)',
                  }}
                >
                  {MATCH_LABEL[l.match]} · {PLATFORM_NAME[l.platformId]}
                </div>
              </div>
              <div
                className="font-sans font-semibold text-h3 tabular-nums leading-none shrink-0"
                style={{ color: 'var(--navy)' }}
              >
                {l.confidencePct}
                <span className="text-eyebrow font-medium text-ink-4">%</span>
              </div>
              <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5 shrink-0 text-ink-4 transition-transform"
                style={{ transform: isOpen ? 'rotate(180deg)' : undefined }}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-3 pb-3 border-t border-line">
                {rows.map((row, ri) => {
                  const cellIdx = listings.findIndex((x) => x.url === l.url);
                  return (
                    <MobileAttrRow
                      key={ri}
                      label={row.label}
                      recordValue={row.record}
                      cell={row.cells[cellIdx]}
                    />
                  );
                })}
                <div className="pt-3 mt-3 border-t border-line text-right">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-caption font-semibold no-underline"
                    style={{ color: 'var(--brand-deep)' }}
                  >
                    Open on {PLATFORM_NAME[l.platformId]} ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- panel ---------------------------------------------------------------

function ListingsPanel({ scenario }: ListingsPanelProps) {
  const sc = SCENARIOS[scenario];
  const listings = flattenListings(
    sc.listings as Record<'airbnb' | 'vrbo' | 'fb', Listing[]>
  );
  const strongestId =
    listings.length > 0 ? listings[0].url : null;
  const rows = buildRows(listings);

  return (
    <div>
      {/* Section heading */}
      <div className="flex items-baseline justify-between gap-3 mt-7 sm:mt-9 mb-4">
        <h2
          className="font-sans font-semibold text-h3 sm:text-h2 tracking-[-0.005em] m-0"
          style={{ color: 'var(--navy)' }}
        >
          Property listings
        </h2>
      </div>

      {/* Empty state — low scenario, zero matches */}
      {listings.length === 0 ? (
        <div className="bg-surface border border-line rounded-lg shadow-sm px-6 py-7">
          <div
            className="font-sans font-semibold text-body-sm"
            style={{ color: 'var(--ink-2)' }}
          >
            No active listings detected.
          </div>
          <div className="text-caption mt-1 leading-relaxed text-ink-3">
            Full sweep across Airbnb, Vrbo, and Facebook Marketplace within a
            1.0&nbsp;mi radius — nothing matched the property's address
            fingerprint, host signals, or layout.
          </div>
        </div>
      ) : (
        <>
          <DiffLegend />
          {/* Desktop: full diff matrix */}
          <div className="hidden lg:block">
            <DesktopMatrix
              listings={listings}
              rows={rows}
              strongestId={strongestId}
            />
          </div>
          {/* Mobile: accordion stack */}
          <div className="lg:hidden">
            <MobileStack
              listings={listings}
              rows={rows}
              strongestId={strongestId}
            />
          </div>
        </>
      )}
    </div>
  );
}
