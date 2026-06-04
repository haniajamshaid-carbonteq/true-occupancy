/* global React, Drawer, Button, Icon */
// SavedSnapshotDrawer — single-listing snapshot viewer.
//
// Opened from a per-row icon on the listings table (in ListingsPanel).
// Each click drives the drawer with ONE listing — the row that was
// clicked. There's no left rail, no cross-listing navigation: if the user
// wants another snapshot, they close and click another row. The drawer
// surface stays focused on one thing.
//
// Download lives inline next to the listing title (small icon button),
// not in the footer, so the action sits adjacent to the artifact it acts
// on. Hooks the existing CertificateSheet "snapshot" PDF variant as a
// stand-in in the prototype. In production it should fetch the single
// screenshot file for this listing from the backend — the drawer
// signature won't change.

type SnapshotPlatformId = 'airbnb' | 'vrbo' | 'fb';

interface SnapshotListing {
  platformId: SnapshotPlatformId;
  title: string;
  /** Original platform URL — the live link that may have expired. */
  url: string;
  /** Captured screenshot pixel dimensions; surface as "1440 × 2240" in
   *  the placeholder caption when both are present. Optional so callers
   *  without real metadata can omit and let the caption hide the line. */
  width?: number;
  height?: number;
  /** Captured screenshot file size in bytes; rendered as KB/MB in the
   *  caption. Optional for the same reason as the dimensions above. */
  fileSizeBytes?: number;
}

interface SavedSnapshotDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Subject property's address; shown in the drawer header eyebrow. */
  address: string;
  /** The listing this drawer is showing. Caller sets it to the row that
   *  was clicked; null while closed. Drawer renders nothing when null
   *  even if `open` is true (defensive — shouldn't happen). */
  listing: SnapshotListing | null;
  /** Pre-formatted capture date label (e.g. "Jun 3, 2026"). Used in the
   *  "Captured by TrueOccupancy on …" line and on the screenshot caption. */
  capturedAt: string;
}

const PLATFORM_LABEL: Record<SnapshotPlatformId, string> = {
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
  fb: 'Facebook',
};

// Brand colors live in tokens.css (--airbnb / --vrbo / --fb). Matches the
// per-row platform pill styling so the drawer reads as a continuation of
// the listings table the user just clicked from.
const PLATFORM_COLOR: Record<SnapshotPlatformId, string> = {
  airbnb: 'var(--airbnb)',
  vrbo: 'var(--vrbo)',
  fb: 'var(--fb)',
};

// "412 KB" / "1.4 MB" — keep it short because the caption line is dense
// already (dimensions sit on the same row). Anything under 1024 KB stays
// in KB; above that we step to MB with one decimal place.
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function SavedSnapshotDrawer({
  open,
  onClose,
  address,
  listing,
  capturedAt,
}: SavedSnapshotDrawerProps) {
  // Download — package this one listing into the cert "snapshot" variant
  // and trigger the browser's print/save-as-PDF dialog. Single listing
  // means a single-page PDF (the cert variant renders one page per item
  // in the payload). Matches the dance in ScanContextBar.printCertificate:
  // stash payload → dispatch variant flip event → two rAFs → window.print().
  // CertificateSheet listens for the event and swaps to the snapshot
  // body before the print snapshot is taken.
  function downloadSnapshot() {
    if (!listing) return;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('certVariant', 'snapshot');
      sessionStorage.setItem('certSnapshotAddress', address);
      sessionStorage.setItem('certSnapshotCapturedAt', capturedAt);
      sessionStorage.setItem(
        'certSnapshotListings',
        JSON.stringify([
          {
            platformId: listing.platformId,
            platform: PLATFORM_LABEL[listing.platformId],
            title: listing.title,
            url: listing.url,
          },
        ]),
      );
    }
    window.dispatchEvent(
      new CustomEvent('halcyon:certvariant', { detail: 'snapshot' }),
    );
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }

  // Defensive: `open` and `listing` track together at the call site, but
  // belt-and-suspenders here means a transient mismatch can't render a
  // broken drawer with no data.
  if (!open || !listing) return null;

  // Build the placeholder caption's meta line. Both halves are optional;
  // when neither is present the line hides entirely so the placeholder
  // doesn't read as half-filled.
  const dims =
    listing.width && listing.height
      ? `${listing.width.toLocaleString()} × ${listing.height.toLocaleString()}`
      : '';
  const size =
    typeof listing.fileSizeBytes === 'number'
      ? formatFileSize(listing.fileSizeBytes)
      : '';
  const metaLine = [dims, size].filter(Boolean).join(' · ');

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={680}
      title={
        // Eyebrow + address stacked. The Drawer wraps `title` in an h2, so
        // both spans render inside the same heading — visually two lines
        // but semantically one title for assistive tech.
        <>
          <span
            className="block font-sans uppercase tracking-[0.16em] font-semibold"
            style={{
              fontSize: 'var(--text-eyebrow)',
              color: 'var(--ink-3)',
              letterSpacing: '0.16em',
            }}
          >
            Saved snapshot
          </span>
          <span
            className="block mt-1"
            style={{ color: 'var(--navy)' }}
          >
            {address}
          </span>
        </>
      }
      footer={<Button variant="primary" onClick={onClose}>Close</Button>}
    >
      {/* Listing title row — platform pill + listing title on the left,
          single-click download icon on the right. Adjacent to the
          artifact it acts on, so the relationship is unambiguous. */}
      <div className="flex items-start justify-between gap-3 mb-stack-md">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span
            className="inline-flex items-center h-6 px-2 rounded-sm font-sans text-caption font-semibold text-white shrink-0"
            style={{ background: PLATFORM_COLOR[listing.platformId] }}
          >
            {PLATFORM_LABEL[listing.platformId]}
          </span>
          <span
            className="font-sans text-body font-semibold truncate"
            style={{ color: 'var(--navy)' }}
          >
            {listing.title}
          </span>
        </div>
        <button
          type="button"
          onClick={downloadSnapshot}
          aria-label="Download this snapshot"
          title="Download this snapshot"
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md border border-line bg-surface text-ink-2 hover:bg-hover-bg hover:text-ink transition-colors cursor-pointer"
        >
          <Icon name="download" size={16} />
        </button>
      </div>

      {/* URL + capture-source lines — quiet metadata, not competing with
          the title row above. */}
      <div className="mb-stack-md">
        <div
          className="font-mono text-caption text-ink-3 break-all"
          title={listing.url}
        >
          {listing.url}
        </div>
        <div className="text-caption text-ink-3 mt-0.5">
          Captured by TrueOccupancy on {capturedAt}.
        </div>
      </div>

      {/* Screenshot placeholder — diagonal-stripe pattern + folder icon
          stands in for the real <img> until the backend per-scan
          screenshot URL is wired through the listing record. Aspect ratio
          favors tall captures (most platform listing pages are scroll-
          length screenshots), but the box also has a generous min-height
          so short captures don't read as cramped. */}
      <div
        role="img"
        aria-label={`Listing screenshot — captured ${capturedAt}`}
        className="rounded-md border border-line grid place-items-center text-center"
        style={{
          minHeight: 420,
          background:
            'repeating-linear-gradient(135deg, var(--surface-2), var(--surface-2) 8px, var(--surface) 8px, var(--surface) 16px)',
        }}
      >
        <div className="px-4">
          <span className="inline-block text-ink-3 [&>svg]:w-8 [&>svg]:h-8" aria-hidden>
            <Icon name="folder" size={32} />
          </span>
          <p
            className="m-0 mt-3 font-sans text-caption"
            style={{ color: 'var(--ink-3)' }}
          >
            Listing screenshot · {capturedAt}
          </p>
          {metaLine && (
            <p
              className="m-0 mt-1 font-mono text-caption tabular-nums"
              style={{ color: 'var(--ink-4)' }}
            >
              {metaLine}
            </p>
          )}
        </div>
      </div>
    </Drawer>
  );
}
