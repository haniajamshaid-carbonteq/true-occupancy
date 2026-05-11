/* global React, Modal, Button, Icon */
// AutomateModal — shared dialog used from result-screen headers and from the
// batch view. Takes the target (single address + scenario, or batch
// filename + total), shows 3/4/6/12 month radio cards, calls
// onConfirm({ cadenceMonths }) on submit.

type Cadence = 3 | 4 | 6 | 12;

interface AutomateTarget {
  kind: 'single' | 'batch';
  // single
  address?: string;
  scenario?: 'low' | 'medium' | 'high';
  // batch
  filename?: string;
  total?: number;
}

interface AutomateModalProps {
  open: boolean;
  onClose: () => void;
  target: AutomateTarget | null;
  onConfirm: (payload: { cadenceMonths: Cadence }) => void;
}

const OPTIONS: { value: Cadence; label: string; hint: string }[] = [
  { value: 3,  label: '3 months',  hint: 'Quarterly compliance sweeps' },
  { value: 4,  label: '4 months',  hint: 'Tri-annual cadence' },
  { value: 6,  label: '6 months',  hint: 'Recommended for most portfolios' },
  { value: 12, label: '12 months', hint: 'Annual recheck' },
];

function AutomateModal({ open, onClose, target, onConfirm }: AutomateModalProps) {
  const [cadence, setCadence] = React.useState<Cadence>(6);

  // Reset selection each time the modal reopens so the default cadence
  // (6 months) is consistent.
  React.useEffect(() => {
    if (open) setCadence(6);
  }, [open]);

  const targetLabel =
    target?.kind === 'batch'
      ? `${target.filename} · ${target.total} properties`
      : target?.address ?? '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title="Automate This Scan"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => onConfirm({ cadenceMonths: cadence })}
            icon={<Icon name="cal" size={14} />}
          >
            Automate
          </Button>
        </>
      }
    >
      {target && (
        <div className="mb-5 px-4 py-3 rounded-md border border-line bg-surface-2/50">
          <div className="font-sans text-eyebrow uppercase tracking-[0.16em] font-semibold text-ink-3 mb-1">
            {target.kind === 'batch' ? 'Batch target' : 'Address'}
          </div>
          <div className="font-sans font-semibold text-body-sm" style={{ color: 'var(--navy)' }}>
            {targetLabel}
          </div>
        </div>
      )}

      <p className="text-body-sm text-ink-2 leading-relaxed m-0 mb-4">
        We'll re-scan {target?.kind === 'batch' ? 'every property in this batch' : 'this address'} on
        the cadence you choose and surface new matches in your queue.
      </p>

      <div role="radiogroup" aria-label="Cadence" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = cadence === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCadence(opt.value)}
              className={`text-left flex items-start gap-3 px-3.5 py-3 rounded-md border transition-colors ${
                active
                  ? '!bg-brand-tint !border-brand/50'
                  : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
              }`}
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 transition-colors ${
                  active ? 'border-brand' : 'border-line-strong'
                }`}
                aria-hidden
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
              </span>
              <span className="min-w-0">
                <span
                  className={`block font-sans font-semibold text-label ${active ? '' : ''}`}
                  style={{ color: active ? 'var(--brand-deep)' : 'var(--navy)' }}
                >
                  {opt.label}
                </span>
                <span className="block text-caption text-ink-3 mt-0.5">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
