/* global React, Drawer, Button, Icon */
// SavedSnapshotDrawer — rail-style viewer for the archived snapshot file
// captured at scan time.
//
// Backend reality (locked Jun 3, 2026): one screenshot file per scan,
// containing every listing. The drawer is opened from a single global
// "Saved snapshots" entry above the Discovered listings — there is no
// per-listing affordance. The left rail lets the user navigate within
// the file by listing; the right pane previews whichever one is selected.
//
// Download is global (exports the whole file) and lives in the footer's
// left slot, paired with Close on the right. Click is a no-op for now —
// the PDF artifact extends CertificateSheet per
// docs/pdf-certificate-spec.md and that variant lands in a follow-up.

type SnapshotPlatformId = 'airbnb' | 'vrbo' | 'fb';

interface SnapshotListing {
  platformId: SnapshotPlatformId;
  title: string;
  /** Original platform URL — the live link that may have expired. */
  url: string;
}

interface SavedSnapshotDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Subject property's address; shown in the drawer header. */
  address: string;
  /** All listings captured in this scan. The first is selected on open. */
  listings: SnapshotListing[];
  /** Pre-formatted capture date label (e.g. "Jun 3, 2026"). */
  capturedAt: string;
}

const PLATFORM_LABEL: Record<SnapshotPlatformId, string> = {
  airbnb: 'Airbnb',
  vrbo: 'Vrbo',
  fb: 'Facebook',
};

// Brand colors live in tokens.css (--airbnb / --vrbo / --fb).
const PLATFORM_COLOR: Record<SnapshotPlatformId, string> = {
  airbnb: 'var(--airbnb)',
  vrbo: 'var(--vrbo)',
  fb: 'var(--fb)',
};

// Strip protocol + host so the rail's secondary line stays compact.
function urlPath(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, '');
  } catch {
    return url;
  }
}

function SavedSnapshotDrawer({
  open,
  onClose,
  address,
  listings,
  capturedAt,
}: SavedSnapshotDrawerProps) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  // Reset selection each time the drawer reopens so it starts at the top
  // of the rail, matching the "fresh open" mental model.
  React.useEffect(() => {
    if (open) setSelectedIdx(0);
  }, [open]);

  if (!open || listings.length === 0) return null;
  const selected = listings[Math.min(selectedIdx, listings.length - 1)];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={760}
      title={address}
      footer={
        <>
          <Button
            variant="ghost"
            icon={<Icon name="download" size={14} />}
            aria-label="Download all snapshots"
            title="Download all snapshots"
            // No-op until the CertificateSheet "snapshot" variant ships
            // (docs/pdf-certificate-spec.md — "Don't fork the template").
            onClick={() => {}}
          >
            Download
          </Button>
          <Button variant="primary" onClick={onClose}>Close</Button>
        </>
      }
    >
      {/* Two-pane body — negative-margin out of the Drawer's body padding so
          the rail can run edge-to-edge with a clean dividing line. */}
      <div
        className="grid -mx-surface-x -my-surface-y-b"
        style={{ gridTemplateColumns: '220px 1fr', minHeight: 380 }}
      >
        {/* Left rail — listings */}
        <nav
          className="border-r border-line bg-surface-2/30 py-2 px-1.5"
          aria-label="Choose a listing"
        >
          <div className="px-2.5 py-1.5 text-eyebrow uppercase tracking-[0.16em] text-ink-3 font-semibold">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} captured
          </div>
          {listings.map((l, i) => {
            const active = i === selectedIdx;
            return (
              <button
                key={l.url}
                type="button"
                onClick={() => setSelectedIdx(i)}
                className="w-full flex items-start gap-2 px-2.5 py-2 rounded-md text-left mt-0.5 transition-colors hover:bg-hover-bg"
                style={
                  active
                    ? {
                        background: 'var(--brand-tint)',
                        borderLeft: '2px solid var(--brand)',
                      }
                    : undefined
                }
              >
                <span
                  className="mt-1 w-2 h-2 rounded-full shrink-0"
                  style={{ background: PLATFORM_COLOR[l.platformId] }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block font-sans text-label font-medium truncate"
                    style={{ color: active ? 'var(--brand-deep)' : 'var(--ink)' }}
                  >
                    {PLATFORM_LABEL[l.platformId]} · {l.title}
                  </span>
                  <span className="block text-caption text-ink-3 truncate font-mono">
                    {urlPath(l.url)}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right pane — selected listing's metadata + screenshot */}
        <div className="px-6 py-5 flex flex-col min-w-0">
          {/* Metadata strip — no download here anymore; it's global in the
              footer. */}
          <div className="mb-stack-md">
            <div className="flex items-center gap-2 min-w-0 mb-1">
              <span
                className="inline-flex items-center h-5 px-1.5 rounded-sm font-sans text-caption font-semibold text-white shrink-0"
                style={{ background: PLATFORM_COLOR[selected.platformId] }}
              >
                {PLATFORM_LABEL[selected.platformId]}
              </span>
              <span
                className="font-sans text-body-sm font-semibold truncate"
                style={{ color: 'var(--navy)' }}
              >
                {selected.title}
              </span>
            </div>
            <div className="font-mono text-caption text-ink-3 truncate" title={selected.url}>
              {selected.url}
            </div>
            <div className="text-caption text-ink-3 mt-0.5">
              Captured by TrueOccupancy on {capturedAt}.
            </div>
          </div>

          {/* Screenshot placeholder — the real backend file lands here once
              the per-scan screenshot URL is wired through. */}
          <div
            role="img"
            aria-label={`Listing screenshot — captured ${capturedAt}`}
            className="rounded-md border border-line grid place-items-center text-center flex-1"
            style={{
              minHeight: 280,
              background:
                'repeating-linear-gradient(135deg, var(--surface-2), var(--surface-2) 8px, var(--surface) 8px, var(--surface) 16px)',
            }}
          >
            <div>
              <span className="inline-block text-ink-3 [&>svg]:w-7 [&>svg]:h-7" aria-hidden>
                <Icon name="folder" size={28} />
              </span>
              <p className="m-0 mt-2 font-sans text-caption text-ink-3">
                Listing screenshot · captured {capturedAt}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
