/* global React, ReactDOM, SCENARIOS, PROPERTY, PLATFORMS */
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

interface CertificateSheetProps {
  scenario: CertScenarioKey;
  address?: string;
  kind?: 'single' | 'batch';
}

/** djb2 — tiny deterministic hash for a believable scan ID. Kept inline
 *  to avoid a new shared util file in a no-bundler project. */
function certShortHash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

function certTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} local`;
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
          <div className="cert-id" aria-label="Scan ID">{scanId}</div>
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

function CertificateSheet({ scenario, address, kind }: CertificateSheetProps) {
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  const scanId = React.useMemo(
    () => `TO-${certShortHash(resolvedAddress + ':' + scenario)}`,
    [resolvedAddress, scenario],
  );
  // Recompute on every print so the stamp reflects "when this PDF was saved",
  // not when the page was first mounted.
  const [timestamp, setTimestamp] = React.useState(() => certTimestamp(new Date()));
  React.useEffect(() => {
    const onBeforePrint = () => setTimestamp(certTimestamp(new Date()));
    window.addEventListener('beforeprint', onBeforePrint);
    return () => window.removeEventListener('beforeprint', onBeforePrint);
  }, []);

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="cert-print-root">
      <CertificateBody
        scenario={scenario}
        address={resolvedAddress}
        kind={kind}
        scanId={scanId}
        timestamp={timestamp}
      />
    </div>,
    document.body,
  );
}

/** Inline preview variant for the design-spec canvas — visible on screen,
 *  unscaled, no portal. SpecApp wraps it in the same Screen frame as the
 *  other production pages. */
function CertificatePreview({ scenario = 'high', address, kind }: Partial<CertificateSheetProps>) {
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;
  const scanId = `TO-${certShortHash(resolvedAddress + ':' + scenario)}`;
  const timestamp = certTimestamp(new Date());
  return (
    <div className="cert-preview-host">
      <CertificateBody
        scenario={scenario as CertScenarioKey}
        address={resolvedAddress}
        kind={kind}
        scanId={scanId}
        timestamp={timestamp}
      />
    </div>
  );
}
