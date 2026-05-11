/* global React, Button, Icon */
// Shared certificate-download CTAs and helpers.
//   v1 = PDF download only. Link sharing comes later (needs tokenized URLs).
//
// The prototype generates a placeholder text blob so a real download fires
// in demos — replace with a server-rendered PDF in production.

type CertStatus = 'idle' | 'generating' | 'done';

interface CertPayload {
  address: string;
  date: Date;
  score?: number;
  risk?: 'clean' | 'warn' | 'risk';
  /** Optional run/batch context line (e.g. "asheville-q2-2026 · Run #4"). */
  context?: string;
}

function triggerCertDownload(filename: string, body: string) {
  const blob = new Blob([body], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function certSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function buildCertBody(p: CertPayload): string {
  const lines = [
    'TRUE OCCUPANCY · CERTIFICATE',
    '─────────────────────────────',
    `Address:  ${p.address}`,
    `Date:     ${p.date.toLocaleDateString('en-US', { dateStyle: 'long' })}`,
  ];
  if (p.score !== undefined) lines.push(`Score:    ${p.score} / 100`);
  if (p.risk)                lines.push(`Verdict:  ${p.risk}`);
  if (p.context)             lines.push(`Source:   ${p.context}`);
  lines.push('', 'Prototype placeholder — replace with rendered PDF in production.');
  return lines.join('\n');
}

// State-machine hook shared by all certificate CTAs.
function useCertDownload() {
  const [status, setStatus] = React.useState<CertStatus>('idle');

  const download = React.useCallback(
    (p: CertPayload) => {
      if (status !== 'idle') return;
      setStatus('generating');
      // Simulate generation; in production this is the server round-trip.
      setTimeout(() => {
        const filename = `cert-${certSlug(p.address)}-${p.date.toISOString().slice(0, 10)}.txt`;
        triggerCertDownload(filename, buildCertBody(p));
        setStatus('done');
        setTimeout(() => setStatus('idle'), 1500);
      }, 600);
    },
    [status],
  );

  return { status, download };
}

// Primary CTA — full-width-feel button for result screens.
function CertDownloadButton({
  payload,
  variant = 'default',
}: {
  payload: CertPayload;
  variant?: 'primary' | 'default' | 'ghost';
}) {
  const { status, download } = useCertDownload();
  const label =
    status === 'generating' ? 'Preparing…' :
    status === 'done'       ? 'Saved'       :
                              'Save as PDF';
  const iconName =
    status === 'generating' ? 'replay' :
    status === 'done'       ? 'check'  :
                              'pdf';
  return (
    <Button
      variant={variant}
      onClick={() => download(payload)}
      icon={<Icon name={iconName} />}
      disabled={status !== 'idle'}
    >
      {label}
    </Button>
  );
}

// Compact icon button — for timeline entries and batch row hovers.
function CertDownloadIcon({
  payload,
  label = 'Save certificate',
  className = '',
}: {
  payload: CertPayload;
  label?: string;
  className?: string;
}) {
  const { status, download } = useCertDownload();
  const iconName =
    status === 'generating' ? 'replay' :
    status === 'done'       ? 'check'  :
                              'pdf';
  const stateCls = status === 'done' ? 'text-clean border-clean' : 'text-ink-3 hover:text-ink hover:border-line-strong';
  return (
    <button
      type="button"
      onClick={(e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        download(payload);
      }}
      title={label}
      aria-label={label}
      disabled={status !== 'idle'}
      className={`w-7 h-7 grid place-items-center rounded-sm border border-line bg-surface transition-colors disabled:opacity-70 ${stateCls} ${className}`.trim()}
    >
      <Icon name={iconName} size={13} />
    </button>
  );
}

// Batch export dropdown — three modes; click triggers a feedback flash on
// the trigger button itself.
type BatchExportMode = 'pdf-collective' | 'zip-individual' | 'csv';

function BatchExportMenu({
  onExport,
}: {
  onExport: (mode: BatchExportMode) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [flash, setFlash] = React.useState<'idle' | 'generating' | 'done'>('idle');

  const pick = (mode: BatchExportMode) => {
    setOpen(false);
    setFlash('generating');
    setTimeout(() => {
      onExport(mode);
      setFlash('done');
      setTimeout(() => setFlash('idle'), 1500);
    }, 600);
  };

  const label =
    flash === 'generating' ? 'Preparing…' :
    flash === 'done'       ? 'Saved'       :
                             'Download';
  const iconName =
    flash === 'generating' ? 'replay' :
    flash === 'done'       ? 'check'  :
                             'pdf';

  return (
    <div className="relative">
      <Button
        icon={<Icon name={iconName} />}
        iconRight={flash === 'idle' ? <Icon name="chevron" /> : undefined}
        onClick={() => flash === 'idle' && setOpen((v) => !v)}
        disabled={flash !== 'idle'}
      >
        {label}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-surface border border-line rounded-md shadow-md min-w-[280px] overflow-hidden">
            <BatchExportMenuItem
              icon="pdf"
              title="Combined report (PDF)"
              sub="Every property in one document — good for sharing"
              onClick={() => pick('pdf-collective')}
            />
            <BatchExportMenuItem
              icon="layers"
              title="Per-property certificates (ZIP)"
              sub="One PDF per address — good for case files"
              onClick={() => pick('zip-individual')}
            />
            <BatchExportMenuItem
              icon="external"
              title="Spreadsheet (CSV)"
              sub="Raw data for analysis or import"
              onClick={() => pick('csv')}
            />
          </div>
        </>
      )}
    </div>
  );
}

function BatchExportMenuItem({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: Parameters<typeof Icon>[0]['name'];
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-3.5 py-3 hover:bg-surface-2 border-b border-line last:border-b-0 flex items-start gap-3"
    >
      <span className="w-8 h-8 grid place-items-center rounded-sm bg-surface-2 text-ink-2 shrink-0">
        <Icon name={icon} size={14} />
      </span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-medium text-ink">{title}</span>
        <span className="block text-[12px] text-ink-3 mt-0.5">{sub}</span>
      </span>
    </button>
  );
}
