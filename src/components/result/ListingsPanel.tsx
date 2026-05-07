/* global React, Pill, Icon, PLATFORMS, SCENARIOS */

// Spec defines `.match-pill` as a separate, smaller chip (mono 10.5px,
// 2px y-padding, no fixed height) — distinct from the 24px Pill primitive.
const MATCH_PILL: Record<'high' | 'med' | 'low', { className: string; label: string }> = {
  high: { className: 'bg-risk-soft text-risk-ink',                      label: 'High match' },
  med:  { className: 'bg-warn-soft text-warn-ink',                      label: 'Med match' },
  low:  { className: 'bg-surface-2 text-ink-3 border border-line',      label: 'Low match' },
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
  'uploads/property-sample.jpg',
  'uploads/step-01.jpg',
  'uploads/step-02.jpg',
  'uploads/step-03.jpg',
  'uploads/hero.jpg',
];

function ListingRow({
  listing,
  platformName,
  isFirst,
  imageIndex,
}: {
  listing: Listing;
  platformName: string;
  isFirst: boolean;
  imageIndex: number;
}) {
  const src = LISTING_IMAGES[imageIndex % LISTING_IMAGES.length];
  return (
    <div
      className={`grid grid-cols-[48px_1fr] sm:grid-cols-[64px_1fr_auto] gap-3 sm:gap-4 py-3 sm:py-4 ${
        isFirst ? '' : 'border-t border-line'
      }`}
    >
      <img
        src={src}
        alt=""
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover block bg-surface-2"
      />
      <div className="min-w-0">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-1.5 text-[13.5px] sm:text-[15px] font-medium leading-tight mb-1 sm:mb-1.5 text-ink no-underline hover:underline underline-offset-2 decoration-ink-3"
        >
          <span className="break-words">{listing.title}</span>
          <Icon name="external" size={12} className="text-ink-4 shrink-0" />
        </a>
        <div className="flex items-center gap-2.5 font-sans text-[13px] text-ink-2 flex-wrap">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1">
              <Icon name="bed" size={13} /> {listing.beds} bd
            </span>
          )}
          {listing.baths != null && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="bath" size={13} /> {listing.baths} ba
              </span>
            </>
          )}
          {listing.price && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="price" size={13} /> {listing.price}
              </span>
            </>
          )}
          {listing.rating && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="star" size={13} /> {listing.rating} ({listing.reviews})
              </span>
            </>
          )}
        </div>
      </div>
      <div className="col-span-2 sm:col-span-1 flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1 shrink-0 mt-1 sm:mt-0">
        <MatchPill kind={listing.match} />
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
}: PlatformSectionProps & { isFirst: boolean }) {
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
        <span className="hidden sm:inline font-sans text-xs text-ink-3 truncate">{platform.domain}</span>
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
        <div className="pb-3">
          {listings.map((l, i) => (
            <ListingRow
              key={i}
              listing={l}
              platformName={platform.name}
              isFirst={i === 0}
              imageIndex={i + (platform.id === 'vrbo' ? 2 : platform.id === 'fb' ? 4 : 0)}
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
        <h2 className="font-sans font-light text-[22px] sm:text-[28px] tracking-[-0.015em] m-0">Discovered listings</h2>
        <div className="hidden sm:block font-sans text-[11.5px] text-ink-3 uppercase tracking-wider">
          Grouped by platform · {total} total
        </div>
      </div>
      <div>
        {(PLATFORMS as PlatformSectionProps['platform'][]).map((p, i) => (
          <PlatformSection
            key={p.id}
            platform={p}
            listings={sc.listings[p.id] || []}
            isFirst={i === 0}
          />
        ))}
      </div>
    </div>
  );
}
