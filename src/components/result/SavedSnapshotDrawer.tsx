/* global React, Drawer, Button, Icon */
// SavedSnapshotDrawer — focused single-pane viewer for the archived
// listing snapshot. Opened from the folder icon next to each listing's
// "Open" action in ListingsPanel.
//
// Design locked in archive-mock.html:
//   - One snapshot at a time (the user explicitly chose a listing).
//   - No left rail, no date picker, no scan ID — the drawer is contextual
//     to whatever was clicked from the table.
//   - Download icon at the top-right of the metadata strip so it pairs with
//     the snapshot it would export. Click is a no-op for now — the PDF
//     artifact extends CertificateSheet per docs/pdf-certificate-spec.md
//     and that variant lands in a follow-up.

type PlatformId = 'airbnb' | 'vrbo' | 'fb';

interface SnapshotListing {
  platformId: PlatformId;
  title: string;
  /** Original platform URL — the live link that may have expired. */
  url: string;
  /** Pre-formatted capture date label (e.g. "Jun 3, 2026"). */
  capturedAt: string;
}

interface SavedSnapshotDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Subject property's address; shown in the drawer header so the snapshot
   *  is self-contextual when the drawer is opened from a deep state. */
  address: string;
  /** The listing whose snapshot is being viewed. Null when nothing is
   *  selected (drawer is closed). */
  listing: SnapshotListing | null;
}

const PLATFORM_LABEL: Record<PlatformId, string> = {
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
  fb: 'Facebook',
};

// Brand colors live in tokens.css (--airbnb / --vrbo / --fb).
const PLATFORM_COLOR: Record<PlatformId, string> = {
  airbnb: 'var(--airbnb)',
  vrbo: 'var(--vrbo)',
  fb: 'var(--fb)',
};

function SavedSnapshotDrawer({ open, onClose, address, listing }: SavedSnapshotDrawerProps) {
  // Defensive: even though Drawer returns null on !open, callers may keep
  // listing=null while open is briefly true during a transition.
  if (!listing) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={600}
      title={address}
      footer={
        <>
          {/* Spacer keeps the Close button right-aligned in the
              justify-between footer (matches the Filters drawer pattern). */}
          <span />
          <Button variant="primary" onClick={onClose}>Close</Button>
        </>
      }
    >
      {/* Metadata strip — platform pill + listing title on the left;
          download (icon-only) on the right pairs with the snapshot below. */}
      <div className="mb-stack-md">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-flex items-center h-5 px-1.5 rounded-sm font-sans text-caption font-semibold text-white shrink-0"
              style={{ background: PLATFORM_COLOR[listing.platformId] }}
            >
              {PLATFORM_LABEL[listing.platformId]}
            </span>
            <span
              className="font-sans text-body-sm font-semibold truncate"
              style={{ color: 'var(--navy)' }}
            >
              {listing.title}
            </span>
          </div>
          <button
            type="button"
            aria-label="Download PDF"
            title="Download PDF"
            // No-op until the CertificateSheet "snapshot" variant ships
            // (docs/pdf-certificate-spec.md — "Don't fork the template").
            onClick={() => {}}
            className="shrink-0 w-8 h-8 grid place-items-center rounded-md border border-line bg-surface text-ink-2 hover:bg-hover-bg hover:border-line-strong transition-colors"
          >
            <Icon name="download" size={14} />
          </button>
        </div>
        <div className="font-mono text-caption text-ink-3 truncate" title={listing.url}>
          {listing.url}
        </div>
        <div className="text-caption text-ink-3 mt-0.5">
          Captured by TrueOccupancy on {listing.capturedAt}.
        </div>
      </div>

      {/* Screenshot pane — placeholder pattern until the backend's stored
          screenshot URL is wired through the listing record. */}
      <div
        role="img"
        aria-label={`Listing screenshot — captured ${listing.capturedAt}`}
        className="rounded-md border border-line grid place-items-center text-center"
        style={{
          minHeight: 360,
          background:
            'repeating-linear-gradient(135deg, var(--surface-2), var(--surface-2) 8px, var(--surface) 8px, var(--surface) 16px)',
        }}
      >
        <div>
          <span className="inline-block text-ink-3 [&>svg]:w-7 [&>svg]:h-7" aria-hidden>
            <Icon name="folder" size={28} />
          </span>
          <p className="m-0 mt-2 font-sans text-caption text-ink-3">
            Listing screenshot · captured {listing.capturedAt}
          </p>
        </div>
      </div>
    </Drawer>
  );
}
