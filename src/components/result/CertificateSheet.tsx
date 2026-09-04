/* global React, ReactDOM, SCENARIOS, PROPERTY, PLATFORMS, useAppState,
   occMatchForRisk, INTENDED_OCCUPANCY_LABEL, DEFAULT_OCC_CONFIG, displayConfidence,
   formatReportDate */
// CertificateSheet — Halcyon-branded single-page PDF report.
//
// Design spec: docs/pdf-certificate-spec.md. This component is the ONLY
// source of truth for what a downloaded Halcyon report looks like. Future
// report types (batch, scheduled-recheck, audit-trail) should be added as
// variants here rather than as standalone print templates.
//
// Mechanics: rendered via React portal as a sibling of #root, hidden on
// screen, revealed only inside @media print (see src/styles/print.css).
// Browsers preserve <a href> when printing to PDF, so listing URLs stay
// clickable in the saved file.

type CertScenarioKey = 'low' | 'medium' | 'high';

/** Cert can render as:
 *   - 'single'   — the single-scan certificate (default).
 *   - 'history'  — a multi-row "Scan history report" of every prior
 *                  single-property scan for the same address.
 *   - 'snapshot' — the saved-snapshots archive: one row per listing
 *                  captured at scan time, with the platform URL preserved
 *                  as a clickable <a href>. Triggered by the Download
 *                  button in SavedSnapshotDrawer.
 *  The variant is picked by the caller right before triggering
 *  window.print() (sessionStorage.certVariant), so all three share one
 *  cert chrome and one print path. */
type CertVariant = 'single' | 'history' | 'snapshot';

interface CertificateSheetProps {
  scenario: CertScenarioKey;
  address?: string;
  kind?: 'single' | 'batch';
  /** Optional user-supplied identifier per the May-2026 lender spec.
   *  Surfaces as a "Reference:" line at the top of the cert; omitted
   *  entirely when undefined / empty (no dashes). The internal UUID
   *  remains in the footer regardless. */
  reference?: string;
}

/** djb2 — tiny deterministic hash for a believable scan ID. Kept inline
 *  to avoid a new shared util file in a no-bundler project. */
function certShortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

// Stamp format: `2026-05-20 14:17 MDT (UTC-6)`. We drop the older "local"
// suffix because compliance PDFs outlive the session they were generated in
// — a lender opening this six months later in another timezone has no way
// to know what "local" referred to. The abbreviation + UTC offset is
// self-translating: any reader anywhere can re-derive the absolute moment.
//
// Half-hour and 45-minute offsets (Asia/Kolkata = UTC+5:30, Pacific/Chatham
// = UTC+12:45, …) are handled — `:MM` is appended only when non-zero so
// the common case stays compact.
function certTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Timezone abbreviation via formatToParts — empty string if the runtime
  // can't resolve a short name, in which case we fall back to the offset
  // alone (still unambiguous, just less friendly).
  let tzAbbrev = '';
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(d);
    tzAbbrev = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    /* runtime without full Intl — leave abbrev blank */
  }

  // getTimezoneOffset() returns minutes WEST of UTC (positive for Americas),
  // i.e. the opposite sign convention to ISO 8601. Negate it so UTC-6 reads
  // as "-6" rather than "+360".
  const offsetMin = -d.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMin);
  const hh = Math.floor(absMin / 60);
  const mm = absMin % 60;
  const offset = mm === 0 ? `UTC${sign}${hh}` : `UTC${sign}${hh}:${pad(mm)}`;

  return tzAbbrev
    ? `${date} ${time} ${tzAbbrev} (${offset})`
    : `${date} ${time} ${offset}`;
}

function certParseScannedAt(ts: number): Date {
  return new Date(ts);
}

function certFormatHistoryDate(d: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function certScenarioVerdict(scenario: CertScenarioKey): string {
  return scenario === 'high' ? 'Rented' : scenario === 'medium' ? 'Likely Rented' : 'Not Rented';
}

function certScenarioListingCount(scenario: CertScenarioKey): number {
  const s = SCENARIOS[scenario];
  let total = 0;
  PLATFORMS.forEach((p: any) => {
    total += (s.listings[p.id] || []).length;
  });
  return total;
}

// Reconciliation status → the ink colour used on the "Intended occupancy"
// sub-line. Text colour (not a soft background) so the status survives a
// print with "Background graphics" turned off. Mirrors ConfidenceHero's
// TONE_INK, and the word itself always carries the meaning — never colour
// alone.
const CERT_TONE_INK: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'var(--clean-ink)',
  warn: 'var(--warn-deep)',
  risk: 'var(--risk-ink)',
};

interface CertHistoryListing {
  platform: string;
  url: string;
}
function certScenarioListings(scenario: CertScenarioKey): CertHistoryListing[] {
  const s = SCENARIOS[scenario];
  const out: CertHistoryListing[] = [];
  PLATFORMS.forEach((p: any) => {
    (s.listings[p.id] || []).forEach((row: any) => {
      out.push({ platform: p.name, url: row.url });
    });
  });
  return out;
}

interface FlatListing {
  platform: string;
  platformId: string;
  title: string;
  confidencePct: number;
  firstSeen: string;
  url: string;
  match: 'high' | 'med' | 'low';
}

function certFlattenListings(scenario: CertScenarioKey): FlatListing[] {
  const s = SCENARIOS[scenario];
  const out: FlatListing[] = [];
  PLATFORMS.forEach((p: any) => {
    const rows = s.listings[p.id] || [];
    rows.forEach((row: any) => {
      out.push({
        platform: p.name,
        platformId: p.id,
        title: row.title,
        confidencePct: row.confidencePct,
        firstSeen: row.firstSeen,
        url: row.url,
        match: row.match,
      });
    });
  });
  // Strongest matches first so the page truncation, if any, drops the weakest.
  return out.sort((a, b) => b.confidencePct - a.confidencePct);
}

function CertificateBody({
  scenario,
  address,
  kind = 'single',
  reference,
  scanId,
  timestamp,
}: CertificateSheetProps & { scanId: string; timestamp: string }) {
  const s = SCENARIOS[scenario];
  const listings = certFlattenListings(scenario);
  const MAX_ROWS = 8;
  const shown = listings.slice(0, MAX_ROWS);
  const remaining = Math.max(0, listings.length - MAX_ROWS);

  // Mirrors the live ConfidenceHero verdict wording — verdict is the headline,
  // the score is a supporting confidence figure. Same Halcyon palette across
  // all scenarios; the verdict copy carries the differentiation.
  const verdictHeadline =
    scenario === 'high' ? 'Rented' : scenario === 'medium' ? 'Likely Rented' : 'Not Rented';

  // The intent this scan was reconciled against: whatever was declared, else
  // the org's universal default (there is always a baseline). Same derivation
  // as the Scan History Report and the on-screen result, so all three agree.
  const rawIntent =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanIntent') : null;
  const intent =
    rawIntent && (INTENDED_OCCUPANCY_LABEL as any)[rawIntent]
      ? rawIntent
      : DEFAULT_OCC_CONFIG.defaultIntent;
  const match = occMatchForRisk(intent as any, s.risk);

  // Confidence is stored as P(rented); flip to the complement when the finding
  // is "not rented" so the % agrees with the finding headline directly above
  // it. Mirrors ConfidenceHero. Possibly-rented keeps the raw score.
  // Exception — "Not sure" remains Not sure everywhere: the resolve toggle
  // only drives triage colours, never the declared intent. A Not-sure cert
  // ALWAYS shows the RAW rented-probability labelled "rental confidence".
  const rentalConfidenceMode = intent === 'not-sure';

  // Provenance: was an AI occupancy report run against this scan? The
  // certificate leaves the building on its own, so a reader holding the PDF
  // with no app around it must be able to tell. Reads the same frozen store
  // the on-screen report reads; absent = the line simply doesn't print.
  const certAIDate = (() => {
    try {
      const raw =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('occupancyReports') : null;
      const at = raw ? JSON.parse(raw)?.[scenario]?.generatedAt : null;
      return at ? formatReportDate(at) : null;
    } catch {
      return null;
    }
  })();
  // Clamped to 1-99 for display — the certificate is the artefact that leaves
  // the building, so it is the last place to print an absolute. See
  // displayConfidence.
  const certConfidence = displayConfidence(
    rentalConfidenceMode
      ? s.score
      : match && match.verdict === 'not-rented'
      ? 100 - s.score
      : s.score
  );

  return (
    <article className="certificate-sheet">
      <header className="cert-head">
        <div className="cert-head-left">
          <img src="docs/brand/halcyon-mark-v2.png" alt="" className="cert-mark" />
          <div className="cert-wordmark">
            <div className="cert-brand">Halcyon</div>
            <div className="cert-product">TrueOccupancy Certificate</div>
          </div>
        </div>
        <div className="cert-head-right">
          {/* Top-corner identifier — prefers the user-supplied reference
              when set (lenders look for their loan number first), falls
              back to the scan ID so the corner is never empty. Either way,
              the internal scan ID is still printed in the footer for audit. */}
          <div
            className="cert-id"
            aria-label={reference ? 'Reference' : 'Scan ID'}
          >
            {reference || scanId}
          </div>
          <div className="cert-stamp">{timestamp}</div>
          <div className="cert-kind">{kind === 'batch' ? 'Batch Scan' : 'Single-Property Scan'}</div>
        </div>
      </header>

      <div className="cert-rule" />

      <section className="cert-property">
        <div className="cert-eyebrow">Subject property</div>
        <div className="cert-address">{address || PROPERTY.address}</div>
        <div className="cert-meta">
          Parcel {PROPERTY.parcel} · {PROPERTY.zoning} · {PROPERTY.permitStatus}
        </div>
      </section>

      <section className="cert-verdict-band">
        <div className="cert-verdict-head">
          <div className="cert-eyebrow">Finding</div>
          <div className="cert-verdict-headline">{verdictHeadline}</div>
          <div className="cert-verdict-sub">
            <span className="cert-verdict-pct">{certConfidence}%</span> {rentalConfidenceMode ? 'rental confidence' : 'confidence'}
          </div>
          {/* Intended occupancy this finding was reconciled against, and the
              result — kept to one plain line: declared X, this is Y. */}
          {match && (
            <div className="cert-verdict-recon">
              <span className="cert-recon-label">Intended occupancy</span>
              <span className="cert-recon-value">{(INTENDED_OCCUPANCY_LABEL as any)[intent]}</span>
              <span className="cert-recon-sep">·</span>
              <span className="cert-recon-status" style={{ color: CERT_TONE_INK[match.tone] }}>
                {match.label}
              </span>
            </div>
          )}
          {/* AI provenance, ink-only: print drops background fills, so this
              is a hairline note rather than the on-screen pill. */}
          {certAIDate && (
            <div className="cert-ai-note">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5c.3 2.6 1 4.5 2 5.6 1 1 2.9 1.7 5.5 2-2.6.3-4.5 1-5.5 2-1 1.1-1.7 3-2 5.5-.3-2.6-1-4.5-2-5.5-1-1-3-1.7-5.5-2 2.6-.3 4.5-1 5.5-2 1-1.1 1.7-3 2-5.6z" />
                <path d="M19 14.5c.15 1.3.5 2.2 1 2.75.5.5 1.45.85 2.75 1-1.3.15-2.25.5-2.75 1-.5.55-.85 1.45-1 2.75-.15-1.3-.5-2.2-1-2.75-.5-.5-1.45-.85-2.75-1 1.3-.15 2.25-.5 2.75-1 .5-.55.85-1.45 1-2.75z" />
              </svg>
              <span>Occupancy report run by AI · {certAIDate}</span>
            </div>
          )}
        </div>
        <div className="cert-verdict-body">
          <div className="cert-eyebrow">Summary</div>
          <p className="cert-summary">{s.summary}</p>
        </div>
      </section>

      <section className="cert-listings">
        <div className="cert-section-title">
          Discoverable Properties
          <span className="cert-section-count">
            {listings.length === 0 ? 'None detected' : `${listings.length} listing${listings.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="cert-empty">
            No active short-term rental listings reference this property across any monitored
            platform.
          </div>
        ) : (
          <table className="cert-table">
            <thead>
              <tr>
                <th className="col-platform">Platform</th>
                <th className="col-title">Listing</th>
                <th className="col-conf">Match</th>
                <th className="col-seen">First seen</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((l, i) => (
                <tr key={i}>
                  <td className="col-platform">{l.platform}</td>
                  <td className="col-title">
                    <div className="cert-listing-title">{l.title}</div>
                    <a className="cert-listing-url" href={l.url}>{l.url}</a>
                  </td>
                  <td className="col-conf tabular">{displayConfidence(l.confidencePct)}%</td>
                  <td className="col-seen tabular">{l.firstSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {remaining > 0 && (
          <div className="cert-remaining">
            + {remaining} additional listing{remaining === 1 ? '' : 's'}. See the live report at
            {' '}halcyon.app/verify/{scanId}
          </div>
        )}
      </section>

      <footer className="cert-foot">
        <div className="cert-foot-left">
          {/* Internal UUID is always present per spec, regardless of whether
              the lender attached a user-facing Reference. Serves as audit /
              cross-reference, not primary identification. */}
          <div className="cert-foot-line">
            Scan ID: <span className="mono">{scanId}</span>
          </div>
          <div className="cert-foot-line">
            Verifiable at <span className="mono">halcyon.app/verify/{scanId}</span>
          </div>
          <div className="cert-foot-line muted">
            Generated {timestamp} · Halcyon TrueOccupancy · halcyon.app
          </div>
        </div>
        <div className="cert-foot-right">Page 1 of 1</div>
      </footer>
    </article>
  );
}

interface CertificateHistoryRow {
  date: string;
  verdict: string;
  scorePct: number;
  listingCount: number;
  platformCount: number;
  listings: CertHistoryListing[];
  /** The declared intent for this scan — the row's own if it carried one,
   *  otherwise the org's universal default (there is always a baseline to
   *  reconcile against). */
  intentLabel: string;
  /** Reconciliation of the finding against that intent: Consistent /
   *  Inconclusive / Needs review. */
  matchLabel: string;
  /** Ink colour for the status word, keyed off the reconciliation tone. */
  matchInk: string;
}

function CertificateHistoryBody({
  address,
  reference,
  scanId,
  timestamp,
  rows,
}: {
  address: string;
  reference?: string;
  scanId: string;
  timestamp: string;
  rows: CertificateHistoryRow[];
}) {
  return (
    <article className="certificate-sheet">
      <header className="cert-head">
        <div className="cert-head-left">
          <img src="docs/brand/halcyon-mark-v2.png" alt="" className="cert-mark" />
          <div className="cert-wordmark">
            <div className="cert-brand">Halcyon</div>
            <div className="cert-product">TrueOccupancy Scan History</div>
          </div>
        </div>
        <div className="cert-head-right">
          <div className="cert-id" aria-label={reference ? 'Reference' : 'Scan ID'}>
            {reference || scanId}
          </div>
          <div className="cert-stamp">{timestamp}</div>
          <div className="cert-kind">Scan History Report</div>
        </div>
      </header>

      <div className="cert-rule" />

      <section className="cert-property">
        <div className="cert-eyebrow">Subject property</div>
        <div className="cert-address">{address}</div>
        <div className="cert-meta">
          Parcel {PROPERTY.parcel} · {PROPERTY.zoning} · {PROPERTY.permitStatus}
        </div>
      </section>

      <section className="cert-listings">
        <div className="cert-section-title">
          Scan history
          <span className="cert-section-count">
            {rows.length} {rows.length === 1 ? 'scan' : 'scans'}
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="cert-empty">No prior scans recorded for this property.</div>
        ) : (
          <div className="cert-history-list">
            {rows.map((r, i) => (
              <div className="cert-history-scan" key={i}>
                <div className="cert-history-scan-head">
                  <span className="cert-history-date tabular">{r.date}</span>
                  <span className="cert-history-sep">·</span>
                  <span className="cert-history-verdict">{r.verdict}</span>
                  <span className="cert-history-sep">·</span>
                  <span className="cert-history-score tabular">{r.scorePct}%</span>
                  <span className="cert-history-meta">
                    {r.listingCount === 0
                      ? 'No listings detected'
                      : `${r.listingCount} listing${r.listingCount === 1 ? '' : 's'} on ${r.platformCount} platform${r.platformCount === 1 ? '' : 's'}`}
                  </span>
                </div>
                <div className="cert-history-occ">
                  <span className="cert-history-occ-label">Intended occupancy:</span>
                  <span className="cert-history-occ-intent">{r.intentLabel}</span>
                  {r.matchLabel && (
                    <>
                      <span className="cert-history-sep">·</span>
                      <span className="cert-history-occ-status" style={{ color: r.matchInk }}>
                        {r.matchLabel}
                      </span>
                    </>
                  )}
                </div>
                {r.listings.length > 0 && (
                  <ul className="cert-history-urls">
                    {r.listings.map((l, j) => (
                      <li key={j}>
                        <span className="cert-history-url-platform">{l.platform}</span>
                        <a className="cert-history-url-link" href={l.url}>{l.url}</a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="cert-foot">
        <div className="cert-foot-left">
          <div className="cert-foot-line">
            Report ID: <span className="mono">{scanId}</span>
          </div>
          <div className="cert-foot-line muted">
            Generated {timestamp} · Halcyon TrueOccupancy · halcyon.app
          </div>
        </div>
        <div className="cert-foot-right">Page 1 of 1</div>
      </footer>
    </article>
  );
}

type CertSnapshotPlatformId = 'airbnb' | 'vrbo' | 'fb';

interface CertSnapshotListing {
  /** Stable platform key — drives the tag color (airbnb red / vrbo blue /
   *  fb blue). Falls back to a neutral chip if missing or unknown. */
  platformId?: CertSnapshotPlatformId;
  /** Display name of the platform: "Airbnb" / "Vrbo" / "Facebook". */
  platform: string;
  /** Listing title as shown in the drawer rail. */
  title: string;
  /** Original platform URL — preserved as <a href> so it survives the
   *  browser's "Save as PDF" pipeline. */
  url: string;
}

// "https://airbnb.com/rooms/example-12848319" → "airbnb.com/rooms/example-12848319"
// Used by the per-listing strip footer where the prefix would push the URL
// off the right edge of the page.
function certSnapshotStripUrl(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

// Split a flat address on the first comma so the snapshot page can render
// the street line large and the locality below it. Falls back to the whole
// string when there's no comma so single-token addresses still print.
function certSnapshotSplitAddress(addr: string): { street: string; locality: string } {
  const idx = addr.indexOf(',');
  if (idx < 0) return { street: addr.trim(), locality: '' };
  return { street: addr.slice(0, idx).trim(), locality: addr.slice(idx + 1).trim() };
}

// "2026-05-12" — short ISO date for the per-listing strip footer. Derived
// from `capturedAt` when it parses; falls back to the raw label so the
// strip is never empty.
function certSnapshotStripDate(capturedAt: string): string {
  const d = new Date(capturedAt);
  if (isNaN(d.getTime())) return capturedAt;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Snapshot variant — one full page per captured listing. Each page
 *  carries the listing's platform tag, title, original URL (as a clickable
 *  <a href> so it survives the browser's "Save as PDF" pipeline), capture
 *  source line, the screenshot placeholder, and a per-listing footer strip.
 *  When real screenshot URLs are wired through the backend, swap the
 *  placeholder for an <img>. */
function CertificateSnapshotBody({
  address,
  reference,
  scanId,
  timestamp,
  capturedAt,
  listings,
}: {
  address: string;
  reference?: string;
  scanId: string;
  timestamp: string;
  capturedAt: string;
  listings: CertSnapshotListing[];
}) {
  const total = listings.length;
  const { street, locality } = certSnapshotSplitAddress(address);
  const stripDate = certSnapshotStripDate(capturedAt);

  // Empty-state — render a single page so the PDF isn't blank if a scan
  // happened to capture no listings. Matches the existing cert-empty copy.
  if (total === 0) {
    return (
      <CertificateSnapshotPage
        pageIndex={0}
        total={1}
        scanId={scanId}
        reference={reference}
        timestamp={timestamp}
        street={street}
        locality={locality}
      >
        <div className="cert-empty">
          No listings were archived for this scan.
        </div>
      </CertificateSnapshotPage>
    );
  }

  return (
    <>
      {listings.map((l, i) => (
        <CertificateSnapshotPage
          key={i}
          pageIndex={i}
          total={total}
          scanId={scanId}
          reference={reference}
          timestamp={timestamp}
          street={street}
          locality={locality}
        >
          <div className="cert-snapshot-listing-head">
            <span className="cert-snapshot-eyebrow">
              Listing {i + 1} of {total}
            </span>
            <span className="cert-snapshot-sep">·</span>
            <span
              className={`cert-snapshot-tag${
                l.platformId ? ` cert-snapshot-tag--${l.platformId}` : ''
              }`}
            >
              {l.platform}
            </span>
          </div>

          <dl className="cert-snapshot-fields">
            <div className="cert-snapshot-field">
              <dt>Title</dt>
              <dd className="cert-snapshot-field-strong">{l.title}</dd>
            </div>
            <div className="cert-snapshot-field">
              <dt>Original URL</dt>
              <dd>
                <a className="cert-snapshot-link" href={l.url}>{l.url}</a>
              </dd>
            </div>
            <div className="cert-snapshot-field">
              <dt>Captured by</dt>
              <dd className="cert-snapshot-field-strong">
                TrueOccupancy automated scan
              </dd>
            </div>
          </dl>

          <div className="cert-snapshot-shot-label">Snapshot</div>
          <div
            className="cert-snapshot-shot"
            role="img"
            aria-label={`Listing screenshot captured ${capturedAt}`}
          >
            <svg
              className="cert-snapshot-shot-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
            </svg>
            <div className="cert-snapshot-shot-caption">
              Listing screenshot captured {capturedAt}
            </div>
          </div>

          <div className="cert-snapshot-strip">
            <span className="cert-snapshot-strip-brand">
              Halcyon · TrueOccupancy
            </span>
            <span className="cert-snapshot-strip-meta">
              {certSnapshotStripUrl(l.url)} · {stripDate}
            </span>
          </div>
        </CertificateSnapshotPage>
      ))}
    </>
  );
}

/** Single page in the snapshot archive — chrome (head + rule + property +
 *  foot) is identical across every listing, so it lives here and the body
 *  takes the per-listing content as children. The trailing page-break
 *  class is what splits one .certificate-sheet per page when the browser
 *  prints. */
function CertificateSnapshotPage({
  pageIndex,
  total,
  scanId,
  reference,
  timestamp,
  street,
  locality,
  children,
}: {
  pageIndex: number;
  total: number;
  scanId: string;
  reference?: string;
  timestamp: string;
  street: string;
  locality: string;
  children: React.ReactNode;
}) {
  const isLast = pageIndex === total - 1;
  return (
    <article
      className={`certificate-sheet cert-snapshot-sheet${
        isLast ? '' : ' cert-snapshot-sheet--break'
      }`}
    >
      <header className="cert-head">
        <div className="cert-head-left">
          <img src="docs/brand/halcyon-mark-v2.png" alt="" className="cert-mark" />
          <div className="cert-wordmark">
            <div className="cert-brand">Halcyon</div>
            <div className="cert-product">TrueOccupancy</div>
          </div>
        </div>
        <div className="cert-head-right">
          <div className="cert-id" aria-label={reference ? 'Reference' : 'Scan ID'}>
            {reference || scanId}
          </div>
          <div className="cert-stamp">{timestamp}</div>
          <div className="cert-kind">Listings Snapshot</div>
        </div>
      </header>

      <div className="cert-rule" />

      <section className="cert-property">
        <div className="cert-eyebrow">Subject property</div>
        <div className="cert-address">{street}</div>
        {locality && <div className="cert-snapshot-locality">{locality}</div>}
      </section>

      {children}

      <footer className="cert-foot">
        <div className="cert-foot-left">
          <div className="cert-foot-line">
            Verifiable at <span className="mono">halcyon.app/verify/{scanId}</span>
          </div>
          <div className="cert-foot-line muted">
            Generated {timestamp} · Halcyon TrueOccupancy · halcyon.app
          </div>
        </div>
        <div className="cert-foot-right">
          Page {pageIndex + 1} of {total}
        </div>
      </footer>
    </article>
  );
}

function CertificateSheet({ scenario, address, kind, reference }: CertificateSheetProps) {
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  // Pull reference from sessionStorage when the caller didn't pass one.
  // HomeScreen writes `scanReference` alongside `scanAddress` on submit.
  const resolvedReference =
    reference ??
    (typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('scanReference') ?? undefined
      : undefined);

  const scanId = React.useMemo(
    () => `TO-${certShortHash(resolvedAddress + ':' + scenario)}`,
    [resolvedAddress, scenario],
  );
  // Recompute on every print so the stamp reflects "when this PDF was saved",
  // not when the page was first mounted. Variant flips at the same moment:
  // ScanContextBar writes sessionStorage.certVariant just before window.print(),
  // so the cert can swap bodies before the browser snapshots the page.
  const [timestamp, setTimestamp] = React.useState(() => certTimestamp(new Date()));
  const [variant, setVariant] = React.useState<CertVariant>('single');
  React.useEffect(() => {
    // Variant flip happens via a 'halcyon:certvariant' event dispatched by
    // ScanContextBar *before* it calls window.print(). Listening here (not
    // in beforeprint) gives React time to commit the state change and the
    // browser time to paint before the print snapshot is taken.
    const onVariant = (e: any) => {
      const d = e?.detail;
      const v: CertVariant = d === 'history' ? 'history' : d === 'snapshot' ? 'snapshot' : 'single';
      setVariant(v);
    };
    const onBeforePrint = () => {
      setTimestamp(certTimestamp(new Date()));
    };
    const onAfterPrint = () => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('certVariant');
        // Snapshot payload is single-shot — drop it after print so the next
        // download doesn't pick up a stale listing set.
        sessionStorage.removeItem('certSnapshotAddress');
        sessionStorage.removeItem('certSnapshotListings');
        sessionStorage.removeItem('certSnapshotCapturedAt');
      }
      setVariant('single');
    };
    window.addEventListener('halcyon:certvariant', onVariant as EventListener);
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      window.removeEventListener('halcyon:certvariant', onVariant as EventListener);
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
    };
  }, []);

  // History rows are derived from AppState so they reflect any scans added
  // during this session, not just the seed. The selector returns an empty
  // array for unknown addresses; the dropdown disables the menu item in
  // that case, so we just render the empty-state row server-side.
  const { getHistoryForAddress } = useAppState();
  const historyRows: CertificateHistoryRow[] = React.useMemo(() => {
    if (variant !== 'history') return [];
    return getHistoryForAddress(resolvedAddress).map((h: any) => {
      const sc = h.scenario as CertScenarioKey;
      const listings = certScenarioListings(sc);
      // Every scan reconciles against a declared intent: the row's own if it
      // carried one, otherwise the org's universal default. Derived through
      // occMatchForRisk — the same helper the on-screen Run history uses — so
      // the PDF and the app never disagree on a row's status.
      const intent = h.intent || DEFAULT_OCC_CONFIG.defaultIntent;
      const match = occMatchForRisk(intent, SCENARIOS[sc].risk);
      // "Not sure" rows keep the raw rented-probability (rental confidence)
      // regardless of the resolve toggle — Not sure remains Not sure; every
      // other row flips to read as confidence in the finding.
      const rowRentalConf = intent === 'not-sure';
      return {
        date: certFormatHistoryDate(certParseScannedAt(h.scannedAt)),
        verdict: certScenarioVerdict(sc),
        // Flip to the complement for a "not rented" run so the % agrees with
        // the verdict printed beside it (matches ConfidenceHero / the main
        // finding above). Possibly-rented keeps its raw score.
        scorePct: rowRentalConf
          ? SCENARIOS[sc].score
          : match && match.verdict === 'not-rented'
          ? 100 - SCENARIOS[sc].score
          : SCENARIOS[sc].score,
        listingCount: listings.length,
        platformCount: h.platforms,
        listings,
        intentLabel: INTENDED_OCCUPANCY_LABEL[intent],
        matchLabel: match ? match.label : '',
        matchInk: match ? CERT_TONE_INK[match.tone] : 'var(--ink-3)',
      };
    });
  }, [variant, resolvedAddress, getHistoryForAddress]);

  // Snapshot payload — listings + capture date come through sessionStorage,
  // written by SavedSnapshotDrawer immediately before the variant flip.
  // Parsed lazily so an empty/invalid payload renders an empty-state row
  // rather than throwing on print.
  const snapshotPayload = React.useMemo(() => {
    if (variant !== 'snapshot' || typeof sessionStorage === 'undefined') {
      return { address: resolvedAddress, capturedAt: '', listings: [] as CertSnapshotListing[] };
    }
    const addr = sessionStorage.getItem('certSnapshotAddress') || resolvedAddress;
    const capturedAt = sessionStorage.getItem('certSnapshotCapturedAt') || '';
    let listings: CertSnapshotListing[] = [];
    try {
      const raw = sessionStorage.getItem('certSnapshotListings');
      if (raw) listings = JSON.parse(raw) as CertSnapshotListing[];
    } catch {
      /* malformed payload — render empty-state */
    }
    return { address: addr, capturedAt, listings };
  }, [variant, resolvedAddress]);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="cert-print-root">
      {variant === 'history' ? (
        <CertificateHistoryBody
          address={resolvedAddress}
          reference={resolvedReference}
          scanId={scanId}
          timestamp={timestamp}
          rows={historyRows}
        />
      ) : variant === 'snapshot' ? (
        <CertificateSnapshotBody
          address={snapshotPayload.address}
          reference={resolvedReference}
          scanId={scanId}
          timestamp={timestamp}
          capturedAt={snapshotPayload.capturedAt}
          listings={snapshotPayload.listings}
        />
      ) : (
        <CertificateBody
          scenario={scenario}
          address={resolvedAddress}
          reference={resolvedReference}
          kind={kind}
          scanId={scanId}
          timestamp={timestamp}
        />
      )}
    </div>,
    document.body,
  );
}

/** Inline preview variant for the design-spec canvas — visible on screen,
 *  unscaled, no portal. SpecApp wraps it in the same Screen frame as the
 *  other production pages. */
function CertificatePreview({ scenario = 'high', address, kind, reference }: Partial<CertificateSheetProps>) {
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;
  // Default to a believable sample for the design-spec canvas so reviewers
  // see the populated state, not the omit-line variant.
  const resolvedReference =
    reference ??
    (typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem('scanReference') ?? 'LOAN-2026-0042'
      : 'LOAN-2026-0042');
  const scanId = `TO-${certShortHash(resolvedAddress + ':' + scenario)}`;
  const timestamp = certTimestamp(new Date());
  return (
    <div className="cert-preview-host">
      <CertificateBody
        scenario={scenario as CertScenarioKey}
        address={resolvedAddress}
        reference={resolvedReference}
        kind={kind}
        scanId={scanId}
        timestamp={timestamp}
      />
    </div>
  );
}
