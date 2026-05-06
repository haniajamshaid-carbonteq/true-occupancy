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
      className={`inline-flex items-center font-mono text-[10.5px] uppercase tracking-[0.04em] py-0.5 px-2 rounded-full ${m.className}`}
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

function ListingRow({ listing, platformName }: { listing: Listing; platformName: string }) {
  return (
    <div className="grid grid-cols-[56px_1fr_auto] gap-3 p-3 rounded-md bg-surface-2 border border-line text-inherit no-underline">
      <div className="w-14 h-14 rounded-md" style={{ background: listing.img }} />
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium leading-tight mb-1">{listing.title}</div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3 flex-wrap">
          {listing.beds != null && (
            <span className="inline-flex items-center gap-1">
              <Icon name="bed" size={11} /> {listing.beds} bd
            </span>
          )}
          {listing.baths != null && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="bath" size={11} /> {listing.baths} ba
              </span>
            </>
          )}
          {listing.price && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="price" size={11} /> {listing.price}
              </span>
            </>
          )}
          {listing.rating && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <Icon name="star" size={11} /> {listing.rating} ({listing.reviews})
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <MatchPill kind={listing.match} />
        <span className="text-ink-4 text-[11px] inline-flex items-center gap-1">
          View on {platformName} <Icon name="external" size={11} />
        </span>
      </div>
    </div>
  );
}

interface PlatformSectionProps {
  platform: { id: string; name: string; domain: string; mark: string; markBg: string };
  listings: Listing[];
}

function PlatformSection({ platform, listings }: PlatformSectionProps) {
  const [open, setOpen] = React.useState(true);
  const empty = listings.length === 0;

  return (
    <div className="border border-line rounded-lg bg-surface overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center gap-3.5 bg-transparent border-0 cursor-pointer text-left"
      >
        <div className={`w-8 h-8 rounded-md grid place-items-center text-white font-bold text-sm shrink-0 ${platform.markBg}`}>
          {platform.mark}
        </div>
        <div className="text-[15px] font-semibold">{platform.name}</div>
        <span className="font-mono text-xs text-ink-3">{platform.domain}</span>
        <div className="ml-auto flex items-center gap-3">
          {empty ? (
            <Pill variant="clean">
              <Icon name="check" size={11} /> No matches
            </Pill>
          ) : (
            <Pill variant="risk">
              <Icon name="alert" size={11} />
              {listings.length} listing{listings.length !== 1 ? 's' : ''}
            </Pill>
          )}
          <span className={`w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform ${open ? 'rotate-180' : ''}`}>
            <Icon name="chevron" />
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-2">
          {empty ? (
            <div className="p-4 border border-dashed border-line rounded-md bg-surface-2 text-left text-ink-3 text-[13px]">
              <strong className="text-ink-2">Nothing found on {platform.name}.</strong>{' '}
              We swept the full 1.0 mi radius — no listings matched the property's photos, geocode, or fingerprint.
            </div>
          ) : (
            listings.map((l, i) => <ListingRow key={i} listing={l} platformName={platform.name} />)
          )}
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
      <div className="flex items-baseline justify-between mt-9 mb-3.5">
        <h2 className="font-serif text-[26px] font-normal m-0">Discovered listings</h2>
        <div className="font-mono text-[11.5px] text-ink-3 uppercase tracking-wider">
          Grouped by platform · {total} total
        </div>
      </div>
      <div className="flex flex-col gap-3.5">
        {(PLATFORMS as PlatformSectionProps['platform'][]).map((p) => (
          <PlatformSection key={p.id} platform={p} listings={sc.listings[p.id] || []} />
        ))}
      </div>
    </div>
  );
}
