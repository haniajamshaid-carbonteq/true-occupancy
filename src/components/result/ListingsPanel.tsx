/* global React, Pill, Icon, PLATFORMS, SCENARIOS */

// Spec defines `.match-pill` as a separate, smaller chip (mono 10.5px,
// 2px y-padding, no fixed height) — distinct from the 24px Pill primitive.
const MATCH_PILL: Record<'high' | 'med' | 'low', { className: string; label: string }> = {
  high: { className: 'bg-risk/20 text-white border border-risk/40',          label: 'High match' },
  med:  { className: 'bg-warn/20 text-white border border-warn/40',          label: 'Med match' },
  low:  { className: 'bg-white/10 text-white/70 border border-white/15',     label: 'Low match' },
};

function MatchPill({ kind }: { kind: 'high' | 'med' | 'low' }) {
  const m = MATCH_PILL[kind];
  return (
    <span
      className={`inline-flex items-center font-sans text-[10.5px] uppercase tracking-[0.04em] py-0.5 px-2 rounded-full ${m.className}`}
    >
      {m.label}
    </span>
  );
}

interface Listing {
  title: string;
  beds?: number;
  baths?: number;
  price?: string;
  rating?: number;
  reviews?: number;
  match: 'high' | 'med' | 'low';
  img: string;
}

const LISTING_IMAGES = [
  'uploads/pexels-2159872754-37437491.jpg',
  'uploads/pexels-artbovich-8143698.jpg',
  'uploads/pexels-cmoon-12558848.jpg',
  'uploads/pexels-introspectivedsgn-9150640.jpg',
];

function ListingRow({
  listing,
  platformName,
  imageIndex,
}: {
  listing: Listing;
  platformName: string;
  imageIndex: number;
}) {
  const src = LISTING_IMAGES[imageIndex % LISTING_IMAGES.length];
  return (
    <div className="group relative rounded-2xl overflow-hidden cursor-pointer transition hover:ring-1 hover:ring-white/20 w-full">
      {/* Photo fills the whole card */}
      <img src={src} alt="" className="block w-full aspect-square object-cover" />

      {/* Progressive dim — strongest at the bottom, fades to clear at the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/0"
      />

      {/* Extra contrast wash directly behind the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-black/25"
      />

      {/* Backdrop-blur covering the whole card; mask fades gradually so the blur eases out toward the top */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 backdrop-blur-[6px]"
        style={{
          WebkitMaskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
          maskImage:
            'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 75%)',
        }}
      />

      {/* Info content — sits over the gradient + blur */}
      <div className="absolute inset-x-0 bottom-0 text-white px-3.5 pt-3 pb-3">
        {/* Top row: rating + match pill */}
        <div className="flex items-center justify-between gap-3 mb-2">
          {listing.rating ? (
            <span className="inline-flex items-center gap-1 font-sans text-[11.5px] text-white/75">
              <Icon name="star" size={11} /> {listing.rating} ({listing.reviews})
            </span>
          ) : (
            <span />
          )}
          <MatchPill kind={listing.match} />
        </div>

        {/* Price */}
        {listing.price && (
          <div className="font-sans text-[17px] font-semibold leading-none mb-2 tabular-nums">
            {listing.price}
          </div>
        )}

        {/* Title + stats */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="block font-sans text-[12px] leading-snug text-white/90 no-underline hover:underline underline-offset-2 decoration-white/40"
            >
              <span className="break-words line-clamp-2">{listing.title}</span>
            </a>
          </div>

          <div className="grid grid-cols-2 divide-x divide-white/20 text-center shrink-0">
            <div className="px-2.5">
              <div className="font-sans text-[13px] font-semibold leading-none">
                {listing.beds ?? '—'}
              </div>
              <div className="font-sans text-[9.5px] uppercase tracking-[0.14em] text-white/60 mt-1">
                Beds
              </div>
            </div>
            <div className="px-2.5">
              <div className="font-sans text-[13px] font-semibold leading-none">
                {listing.baths ?? '—'}
              </div>
              <div className="font-sans text-[9.5px] uppercase tracking-[0.14em] text-white/60 mt-1">
                Baths
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlatformSectionProps {
  platform: { id: string; name: string; domain: string; mark: string; markBg: string };
  listings: Listing[];
}

function PlatformSection({
  platform,
  listings,
  isFirst,
  startIndex,
}: PlatformSectionProps & { isFirst: boolean; startIndex: number }) {
  const [open, setOpen] = React.useState(true);
  const empty = listings.length === 0;

  return (
    <div className={isFirst ? '' : 'border-t border-line'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full py-3.5 sm:py-4 flex items-center gap-2.5 sm:gap-3.5 bg-transparent border-0 cursor-pointer text-left min-w-0"
      >
        <div
          className={`w-6 h-6 rounded-full grid place-items-center text-white font-semibold text-[11px] shrink-0 ${platform.markBg}`}
        >
          {platform.mark}
        </div>
        <div className="text-[14px] sm:text-[15px] font-semibold truncate min-w-0">{platform.name}</div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
          {empty ? (
            <span className="font-sans text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.08em] sm:tracking-[0.12em] text-ink-3 inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
              <Icon name="check" size={13} /> <span className="hidden xs:inline sm:inline">No matches</span><span className="xs:hidden sm:hidden">Clear</span>
            </span>
          ) : (
            <span className="font-sans text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.08em] sm:tracking-[0.12em] text-risk inline-flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
              <Icon name="alert" size={13} />
              {listings.length}<span className="hidden sm:inline ml-1">listing{listings.length !== 1 ? 's' : ''}</span>
            </span>
          )}
          <span
            className={`w-6 h-6 grid place-items-center text-ink-3 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          >
            <Icon name="chevron" size={14} />
          </span>
        </div>
      </button>

      {open && !empty && (
        <div className="pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((l, i) => (
            <ListingRow
              key={i}
              listing={l}
              platformName={platform.name}
              imageIndex={startIndex + i}
            />
          ))}
        </div>
      )}
      {open && empty && (
        <div className="pb-4 text-[12px] sm:text-[13px] text-ink-3 leading-snug">
          <strong className="text-ink-2 font-medium">Nothing found on {platform.name}.</strong>{' '}
          We swept the full 1.0 mi radius — no listings matched the property's
          photos, geocode, or fingerprint.
        </div>
      )}
    </div>
  );
}

interface ListingsPanelProps {
  scenario: 'low' | 'medium' | 'high';
}

function ListingsPanel({ scenario }: ListingsPanelProps) {
  const sc = SCENARIOS[scenario];
  const total = (PLATFORMS as PlatformSectionProps['platform'][]).reduce(
    (acc, p) => acc + (sc.listings[p.id]?.length || 0),
    0
  );

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mt-7 sm:mt-9 mb-3 sm:mb-3.5">
        <h2 className="font-sans font-bold text-[22px] sm:text-[28px] tracking-[-0.005em] m-0" style={{ color: 'var(--navy)' }}>Discovered listings</h2>
        <div className="hidden sm:block font-sans text-[11.5px] text-ink-3 uppercase tracking-wider">
          Grouped by platform · {total} total
        </div>
      </div>
      <div>
        {(() => {
          let running = 0;
          return (PLATFORMS as PlatformSectionProps['platform'][]).map((p, i) => {
            const listings = sc.listings[p.id] || [];
            const startIndex = running;
            running += listings.length;
            return (
              <PlatformSection
                key={p.id}
                platform={p}
                listings={listings}
                isFirst={i === 0}
                startIndex={startIndex}
              />
            );
          });
        })()}
      </div>
    </div>
  );
}
