/* global React, ReactDOM, SCENARIOS, PROPERTY, PLATFORMS, useAppState */
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

/** Cert can render either as the single-scan certificate (default) or as a
 *  multi-row "Scan history report" that lists every prior single-property
 *  scan for the same address. The variant is picked by the caller right
 *  before triggering window.print() (sessionStorage.certVariant), so the
 *  two share one cert chrome and one print path. */
type CertVariant = 'single' | 'history';

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

// Convert the human-relative `scannedAgo` strings the seed data uses
// ('8 min ago', '6 mo ago', 'Yesterday', …) into an approximate absolute
// Date. Used only by the history report so each prior run shows a concrete
// calendar date instead of "8 min ago" — lenders archive these PDFs years
// later, when "8 min ago" loses meaning.
const CERT_HISTORY_UNIT_MS: Record<string, number> = {
  min: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 7 * 86_400_000,
  mo: 30 * 86_400_000,
  y: 365 * 86_400_000,
};
function certParseScannedAgo(scannedAgo: string, now: Date = new Date()): Date {
  const s = scannedAgo.trim().toLowerCase();
  if (s === 'just now') return now;
  if (s === 'yesterday') return new Date(now.getTime() - CERT_HISTORY_UNIT_MS.d);
  const m = s.match(/^(\d+)\s*(min|h|d|w|mo|y)\s*ago$/);
  if (!m) return now;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  return new Date(now.getTime() - n * (CERT_HISTORY_UNIT_MS[unit] ?? 0));
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
            <span className="cert-verdict-pct">{s.score}%</span> confidence
          </div>
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
                  <td className="col-conf tabular">{l.confidencePct}%</td>
                  <td className="col-seen tabular">{l.firstSeen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {remaining > 0 && (
          <div className="cert-remaining">
            + {remaining} additional listing{remaining === 1 ? '' : 's'} — see live report at
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
      const v = e?.detail === 'history' ? 'history' : 'single';
      setVariant(v);
    };
    const onBeforePrint = () => {
      setTimestamp(certTimestamp(new Date()));
    };
    const onAfterPrint = () => {
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('certVariant');
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
      return {
        date: certFormatHistoryDate(certParseScannedAgo(h.scannedAgo)),
        verdict: certScenarioVerdict(sc),
        scorePct: SCENARIOS[sc].score,
        listingCount: listings.length,
        platformCount: h.platforms,
        listings,
      };
    });
  }, [variant, resolvedAddress, getHistoryForAddress]);

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
