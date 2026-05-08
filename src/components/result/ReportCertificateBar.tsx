/* global React, Button, Icon */
// ReportCertificateBar — the lender-compliance affordance.
//
// Anchors a result or batch screen with a verifiable "certificate" framing:
// timestamp + a deterministic-looking scan ID, plus a "Download PDF report"
// CTA. The PDF generator is not wired yet — the button calls window.print(),
// which produces a saveable PDF with the current page styling (good enough
// as a CTA-level placeholder until the real generator lands).

interface ReportCertificateBarProps {
  /** Optional explicit scan ID. Falls back to a stable hash of the address + scenario. */
  scanId?: string;
  /** "Single scan" or "Batch scan" — shown next to the badge. */
  kind?: 'single' | 'batch';
}

function shortHash(input: string): string {
  // tiny, deterministic, non-cryptographic hash for a believable scan ID.
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h) ^ input.charCodeAt(i);
  }
  return Math.abs(h).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
}

function formatTimestamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())} local`;
}

function ReportCertificateBar({ scanId, kind = 'single' }: ReportCertificateBarProps) {
  const address =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) || '';
  const scenario =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanScenario')) || 'low';

  const id = scanId || `TO-${shortHash(address + ':' + scenario)}`;
  const timestamp = React.useMemo(() => formatTimestamp(new Date()), []);

  return (
    <div
      className="flex items-center gap-4 bg-surface border border-line rounded-[14px] px-5 py-3.5 shadow-sm"
      role="region"
      aria-label="Verifiable report"
    >
      <span
        className="grid place-items-center w-9 h-9 rounded-full shrink-0"
        style={{
          background: 'var(--brand-tint)',
          color: 'var(--brand-deep)',
        }}
        aria-hidden
      >
        <Icon name="shield" size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-sans text-[10.5px] font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--brand-deep)' }}
          >
            Verifiable report
          </span>
          <span className="text-[11px] text-ink-4">·</span>
          <span className="text-[11px] text-ink-3 uppercase tracking-[0.12em]">
            {kind === 'batch' ? 'Batch scan' : 'Single scan'}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <span className="font-mono text-[12.5px] tabular-nums" style={{ color: 'var(--navy)' }}>
            {id}
          </span>
          <span className="text-[12.5px] text-ink-3 tabular-nums">{timestamp}</span>
          <span className="text-[12px] text-ink-3 hidden sm:inline">
            Live evidence links · Lender-ready
          </span>
        </div>
      </div>
      <Button
        variant="primary"
        onClick={() => {
          if (typeof window !== 'undefined' && typeof window.print === 'function') {
            window.print();
          }
        }}
        icon={<Icon name="pdf" size={14} />}
      >
        Download PDF
      </Button>
    </div>
  );
}
