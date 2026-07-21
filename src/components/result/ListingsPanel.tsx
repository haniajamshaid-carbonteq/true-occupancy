/* global React, SCENARIOS, PROPERTY, Tabs, Pill, DataTable, Icon, SavedSnapshotDrawer */
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

// --- snapshot payload type -----------------------------------------------
// Mirrors SnapshotListing in SavedSnapshotDrawer. Declared here so the
// drawer state can hold a single item without `typeof someLocalConst`
// gymnastics, and so the per-row callbacks can pass a fully-typed payload
// instead of just a URL string.

interface SnapshotPayloadItem {
  platformId: 'airbnb' | 'vrbo' | 'fb';
  title: string;
  url: string;
  /** Synthesized in the prototype (deterministic per URL); real values
   *  flow in from the backend once per-snapshot metadata is wired. */
  width: number;
  height: number;
  fileSizeBytes: number;
}

// djb2-style hash, kept inline. Used to derive plausible — and stable
// across renders — pixel dimensions / file sizes for the prototype's
// snapshot placeholder caption ("1440 × 2240 · 412 KB"). Same listing
// URL ⇒ same numbers every time, so the design reads consistently.
function snapshotHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return Math.abs(h);
}

function synthesizeSnapshotMeta(url: string): {
  width: number;
  height: number;
  fileSizeBytes: number;
} {
  // Width: pin to a small set of plausible viewport widths so the captions
  // read like real screenshots rather than random numbers.
  const widths = [1280, 1366, 1440, 1512];
  const h = snapshotHash(url);
  const width = widths[h % widths.length];
  // Height: scroll-length capture, 1.4–1.9× width (most listing pages).
  const heightMul = 1.4 + ((h >> 4) % 60) / 100;
  const height = Math.round((width * heightMul) / 8) * 8;
  // File size: 200 KB – 900 KB (PNG of a tall page compresses about there).
  const fileSizeBytes = (200 + ((h >> 8) % 700)) * 1024;
  return { width, height, fileSizeBytes };
}

// --- per-row snapshot affordance -----------------------------------------
// Quiet eye icon used in three places: Table view row, Desktop matrix
// action row, and Mobile accordion footer. Stays low-saturation on purpose
// so the table's primary read (match + confidence) keeps priority — the
// icon should say "evidence available, click if you want it" without
// competing with the actual finding data.

function SnapshotIconButton({
  onClick,
  label = 'View snapshot',
}: {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-3 hover:bg-hover-bg hover:text-ink-2 transition-colors bg-transparent border-0 cursor-pointer"
    >
      <Icon name="eye" size={15} />
    </button>
  );
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

  // One-shot attention pulse on mismatch cells so the eye finds the
  // deviations on the user's first paint. CSS animation runs once at
  // 900ms after mount, then never again.
  const pulseClass =
    cell.kind === 'fail'
      ? 'pulse-mismatch-fail'
      : cell.kind === 'warn'
      ? 'pulse-mismatch-warn'
      : '';

  return (
    <div className={`px-3 py-3 text-caption tabular-nums ${cls} ${pulseClass}`}>
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
    <div className="flex items-center flex-wrap gap-x-stack gap-y-stack-tight text-micro text-ink-3 mb-3">
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
  onSnapshot,
}: {
  listings: ListingFlat[];
  rows: DiffRow[];
  strongestId: string | null;
  onSnapshot: (url: string) => void;
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
          <div className="px-4 py-4 sticky left-0 z-raised bg-surface" />

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
                    className="text-center text-white text-eyebrow uppercase tracking-[0.18em] font-semibold py-1.5 leading-none ribbon-drop"
                    style={{ background: 'var(--brand)', transformOrigin: 'top center' }}
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
          <div className="px-4 py-3 border-t border-line flex flex-col justify-center sticky left-0 z-raised bg-surface">
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
              <div className="px-4 py-3 border-t border-line flex flex-col justify-center sticky left-0 z-raised bg-surface">
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

          {/* Action row — Open (external) on the right, snapshot eye icon
              tucked just to its left so the two evidence verbs ("view
              listing on platform" / "view captured snapshot") stay
              adjacent without competing for visual weight. */}
          <div className="px-4 py-3 border-t border-line sticky left-0 z-raised bg-surface" />
          {listings.map((l, i) => (
            <div
              key={`a-${i}`}
              className="border-t border-l border-line px-3 py-3 flex items-center gap-1"
              style={{
                background: isStrong(i) ? 'var(--brand-tint)' : undefined,
              }}
            >
              <SnapshotIconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onSnapshot(l.url);
                }}
                label={`View snapshot — ${l.title}`}
              />
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 h-7 px-2 rounded-md text-caption font-semibold no-underline transition-colors hover:bg-hover-bg"
                style={{ color: 'var(--brand-deep)' }}
              >
                Open
                <svg
                  viewBox="0 0 16 16"
                  className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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

// Smooth open/close for mobile listing accordions. Measures the child's
// scrollHeight and tweens max-height + opacity. Children stay mounted so
// the next open animates from a known geometry.
function MobileAccordionBody({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      const raf = requestAnimationFrame(() => {
        setMaxHeight(el.scrollHeight);
      });
      return () => cancelAnimationFrame(raf);
    }
    setMaxHeight(0);
  }, [open, children]);

  return (
    <div
      ref={ref}
      className="accordion-content"
      style={{ maxHeight, opacity: open ? 1 : 0 }}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}

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
  onSnapshot,
}: {
  listings: ListingFlat[];
  rows: DiffRow[];
  strongestId: string | null;
  onSnapshot: (url: string) => void;
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
            <MobileAccordionBody open={isOpen}>
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
                <div className="pt-3 mt-3 border-t border-line flex items-center justify-between gap-2">
                  <SnapshotIconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onSnapshot(l.url);
                    }}
                    label={`View snapshot — ${l.title}`}
                  />
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1 h-8 px-2 rounded-md text-caption font-semibold no-underline transition-colors hover:bg-hover-bg"
                    style={{ color: 'var(--brand-deep)' }}
                  >
                    Open on {PLATFORM_NAME[l.platformId]}
                    <span className="transition-transform group-hover:translate-x-0.5">↗</span>
                  </a>
                </div>
              </div>
            </MobileAccordionBody>
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
  const [view, setView] = React.useState<'comparison' | 'table'>('comparison');

  // Capture date stub. The real backend stores a per-snapshot timestamp;
  // until that's wired through the listing record we display today's date
  // so the metadata strip reads correctly. Memoized so it doesn't shift
  // mid-session if the user opens the drawer twice.
  const capturedAt = React.useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    []
  );

  // Subject address — prefer the per-scan address stashed in sessionStorage
  // by the scan-start flow, fall back to the static seed property.
  const address = React.useMemo<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.sessionStorage?.getItem('scanAddress');
      if (stored) return stored;
    }
    return PROPERTY.address;
  }, []);

  // Snapshot payload — one entry per captured listing, carrying the
  // synthesized image metadata the drawer caption needs ("1440 × 2240 ·
  // 412 KB"). Memoized so the snapshotHash-derived numbers don't shift on
  // every render and so the drawer's `listing` prop has a stable identity
  // while the drawer is open.
  const snapshotPayload = React.useMemo<SnapshotPayloadItem[]>(
    () =>
      listings.map((l) => ({
        platformId: l.platformId,
        title: l.title,
        url: l.url,
        ...synthesizeSnapshotMeta(l.url),
      })),
    [listings],
  );

  // Saved-snapshot drawer state. Entry points are per-listing — every
  // row / matrix column / mobile accordion carries an eye icon. Clicking
  // it sets `activeSnapshot` to that listing's snapshot payload; the
  // drawer renders it standalone (no rail, no cross-navigation). null
  // doubles as the closed state.
  const [activeSnapshot, setActiveSnapshot] = React.useState<SnapshotPayloadItem | null>(null);
  const openSnapshotFor = React.useCallback(
    (url: string) => {
      const found = snapshotPayload.find((l) => l.url === url) || null;
      setActiveSnapshot(found);
    },
    [snapshotPayload],
  );
  const closeSnapshot = React.useCallback(() => setActiveSnapshot(null), []);

  return (
    <div>
      {/* Section heading + view tabs. Snapshot entry is per-row, on each
          listing row / matrix column / mobile card — not a section-level
          affordance — so the heading stays clean. */}
      <div className="mt-7 sm:mt-9 mb-4">
        <h2
          className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0"
          style={{ color: 'var(--navy)' }}
        >
          Property Listings
        </h2>
        {listings.length > 0 && (
          <div className="mt-3">
            <Tabs
              value={view}
              onChange={(v: any) => setView(v)}
              items={[
                { value: 'comparison', label: 'Comparison', count: listings.length },
                { value: 'table',      label: 'Table',      count: listings.length },
              ]}
            />
          </div>
        )}
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
      ) : view === 'comparison' ? (
        <>
          <DiffLegend />
          {/* Desktop: full diff matrix */}
          <div className="hidden lg:block">
            <DesktopMatrix
              listings={listings}
              rows={rows}
              strongestId={strongestId}
              onSnapshot={openSnapshotFor}
            />
          </div>
          {/* Mobile: accordion stack */}
          <div className="lg:hidden">
            <MobileStack
              listings={listings}
              rows={rows}
              strongestId={strongestId}
              onSnapshot={openSnapshotFor}
            />
          </div>
        </>
      ) : (
        <TableView
          listings={listings}
          strongestId={strongestId}
          onSnapshot={openSnapshotFor}
        />
      )}

      {/* Saved-snapshot viewer — one instance per result page. Per-row eye
          icons in the three views call `openSnapshotFor(url)`, which
          finds the matching payload entry and stashes it as
          `activeSnapshot`. The drawer shows that one listing standalone;
          closing it resets back to null. */}
      <SavedSnapshotDrawer
        open={activeSnapshot !== null}
        onClose={closeSnapshot}
        address={address}
        listing={activeSnapshot}
        capturedAt={capturedAt}
      />
    </div>
  );
}

// --- truncation-aware tooltip --------------------------------------------
// Wraps text with `truncate` and only shows a tooltip when the text is
// actually clipped. Tooltip is positioned with a fixed-positioned bubble
// anchored to the trigger so it escapes table overflow clipping.

function TruncatedText({
  children,
  className,
  style,
  tooltip,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tooltip?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  const tip = tooltip ?? (typeof children === 'string' ? children : '');

  const check = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollWidth > el.clientWidth + 1);
  }, []);

  React.useEffect(() => {
    check();
    const ro = new ResizeObserver(check);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [check, children]);

  function onEnter(e: React.MouseEvent<HTMLSpanElement>) {
    if (!overflowing) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left, y: r.top });
    setHover(true);
  }
  function onLeave() {
    setHover(false);
  }

  return (
    <>
      <span
        ref={ref}
        className={`truncate block min-w-0 ${className ?? ''}`}
        style={style}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {children}
      </span>
      {hover && overflowing && pos && (
        <div
          role="tooltip"
          className="fixed z-popover pointer-events-none px-2 py-1 rounded-md text-caption font-sans shadow-md max-w-sm break-words"
          style={{
            left: pos.x,
            top: pos.y - 8,
            transform: 'translateY(-100%)',
            background: 'var(--navy)',
            color: 'white',
            whiteSpace: 'normal',
          }}
        >
          {tip}
        </div>
      )}
    </>
  );
}

// --- Table view ----------------------------------------------------------
// Lighter-weight alternative to the diff matrix. Renders each listing as a
// row in the shared DataTable primitive so the spacing and hover rhythm
// match the History / Batch / Schedule tables across the rest of the
// product. The strongest match wears a brand-tint "Strongest" chip so it
// still pops without dominating the table.

const PLATFORM_PILL_LABEL: Record<'airbnb' | 'vrbo' | 'fb', string> = {
  airbnb: 'Airbnb',
  vrbo:   'Vrbo',
  fb:     'Facebook',
};

const MATCH_TIER_VARIANT: Record<'high' | 'med' | 'low', any> = {
  high: 'verdict-high',
  med:  'verdict-med',
  low:  'verdict-low',
};

function TableView({
  listings,
  strongestId,
  onSnapshot,
}: {
  listings: ListingFlat[];
  strongestId: string | null;
  onSnapshot: (url: string) => void;
}) {
  const COLUMNS: any[] = [
    {
      key: 'platform',
      label: 'Platform',
      width: '108px',
      cell: (r: ListingFlat) => <Pill>{PLATFORM_PILL_LABEL[r.platformId]}</Pill>,
    },
    {
      key: 'title',
      label: 'Listing',
      primary: true,
      cell: (r: ListingFlat) => {
        const isStrongest = r.url === strongestId;
        return (
          <div className="min-w-0">
            <div
              className="font-sans font-semibold text-body-sm leading-tight flex items-center gap-1.5 min-w-0"
              style={{ color: 'var(--navy)' }}
            >
              {isStrongest && (
                <span
                  className="shrink-0 text-brand [&>svg]:w-3.5 [&>svg]:h-3.5"
                  aria-label="Strongest match"
                >
                  <Icon name="star" size={14} />
                </span>
              )}
              <TruncatedText>{r.title}</TruncatedText>
            </div>
            <TruncatedText className="block font-sans text-caption text-ink-3 mt-0.5 leading-tight">
              @{r.host.handle}
            </TruncatedText>
          </div>
        );
      },
    },
    {
      key: 'match',
      label: 'Match',
      width: '152px',
      hideBelow: 'sm' as const,
      cell: (r: ListingFlat) => (
        <Pill variant={MATCH_TIER_VARIANT[r.match]}>{MATCH_LABEL[r.match]}</Pill>
      ),
    },
    {
      key: 'confidence',
      label: 'Confidence',
      width: '92px',
      align: 'center' as const,
      hideBelow: 'sm' as const,
      cell: (r: ListingFlat) => (
        <span
          className="font-mono tabular-nums font-semibold text-label leading-none"
          style={{ color: 'var(--navy)' }}
        >
          {r.confidencePct}%
        </span>
      ),
    },
    {
      key: 'layout',
      label: 'Layout',
      width: '180px',
      hideBelow: 'md' as const,
      cell: (r: ListingFlat) => (
        <span className="font-mono tabular-nums text-caption text-ink-3 whitespace-nowrap">
          {r.beds ?? '—'} bd · {r.baths ?? '—'} ba{r.sqft ? ` · ${r.sqft.toLocaleString()} sf` : ''}
        </span>
      ),
    },
    {
      key: 'firstSeen',
      label: 'First seen',
      width: '116px',
      align: 'center' as const,
      hideBelow: 'lg' as const,
      cell: (r: ListingFlat) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">{r.firstSeen}</span>
      ),
    },
    {
      key: 'snapshot',
      label: '',
      width: '44px',
      align: 'center' as const,
      hideBelow: 'sm' as const,
      cell: (r: ListingFlat) => (
        <SnapshotIconButton
          onClick={(e) => {
            e.stopPropagation();
            onSnapshot(r.url);
          }}
          label={`View snapshot — ${r.title}`}
        />
      ),
    },
    {
      key: 'open',
      label: '',
      width: '72px',
      align: 'right' as const,
      hideBelow: 'sm' as const,
      cell: (r: ListingFlat) => (
        <a
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e: any) => e.stopPropagation()}
          className="group inline-flex items-center gap-1 h-7 px-2 -mr-2 rounded-md text-caption font-semibold no-underline transition-colors hover:bg-hover-bg"
          style={{ color: 'var(--brand-deep)' }}
          aria-label={`Open ${r.title} on ${PLATFORM_PILL_LABEL[r.platformId]}`}
        >
          Open
          <svg
            viewBox="0 0 16 16"
            className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
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
      ),
    },
  ];

  return (
    <div className="mt-4">
      <DataTable
        columns={COLUMNS}
        rows={listings}
        rowKey={(r: ListingFlat) => r.url}
      />
    </div>
  );
}
