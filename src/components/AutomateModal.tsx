/* global React, Modal, Button, Icon */
// AutomateModal — shared dialog for creating OR editing an automation.
// Create mode: shows the cadence radio cards, calls onConfirm({ cadenceMonths }).
// Edit mode: preselects initialCadence, primary CTA is disabled until the user
// picks a different cadence; an optional "Cancel automation" destructive button
// renders on the left of the footer.

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
  /** 'create' (default) opens with cadence=6. 'edit' preselects initialCadence
   *  and disables the primary CTA until cadence changes. */
  mode?: 'create' | 'edit';
  /** Used in edit mode to seed the radio selection. */
  initialCadence?: Cadence;
  /** Edit mode only — renders a destructive "Cancel automation" button on the
   *  left of the footer when provided. */
  onCancelAutomation?: () => void;
}

const OPTIONS: { value: Cadence; label: string; hint: string }[] = [
  { value: 3,  label: '3 Months',  hint: 'Quarterly compliance sweeps' },
  { value: 4,  label: '4 Months',  hint: 'Tri-annual cadence' },
  { value: 6,  label: '6 Months',  hint: 'Recommended for most portfolios' },
  { value: 12, label: '12 Months', hint: 'Annual recheck' },
];

function AutomateModal({
  open,
  onClose,
  target,
  onConfirm,
  mode = 'create',
  initialCadence,
  onCancelAutomation,
}: AutomateModalProps) {
  const seedCadence: Cadence = mode === 'edit' && initialCadence ? initialCadence : 6;
  const [cadence, setCadence] = React.useState<Cadence>(seedCadence);

  // Reset selection each time the modal reopens so it reflects the latest
  // initialCadence (edit) or the default of 6 (create).
  React.useEffect(() => {
    if (open) setCadence(seedCadence);
  }, [open, seedCadence]);

  const isEdit = mode === 'edit';
  const primaryDisabled = isEdit && cadence === initialCadence;

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={520}
      title={isEdit ? 'Update Automation' : 'Automate This Scan'}
      footer={
        <>
          {isEdit && onCancelAutomation && (
            <button
              type="button"
              onClick={onCancelAutomation}
              className="mr-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-transparent border border-transparent font-sans text-label font-medium text-error-ink hover:bg-error-soft transition-colors cursor-pointer"
            >
              <Icon name="x" size={14} />
              Cancel Automation
            </button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            onClick={() => onConfirm({ cadenceMonths: cadence })}
            icon={<Icon name="cal" size={14} />}
            disabled={primaryDisabled}
          >
            {isEdit ? 'Update Cadence' : 'Automate'}
          </Button>
        </>
      }
    >
      {target?.kind === 'single' && target.address && (
        <div className="mb-5 px-4 py-3 rounded-md border border-line bg-surface-2/50">
          <div className="font-sans text-eyebrow uppercase tracking-[0.16em] font-semibold text-ink-3 mb-1">
            Address
          </div>
          <div className="font-sans font-semibold text-body-sm" style={{ color: 'var(--navy)' }}>
            {target.address}
          </div>
        </div>
      )}

      <p className="text-body-sm text-ink-2 leading-relaxed m-0 mb-4">
        {isEdit
          ? `We'll re-scan ${target?.kind === 'batch' ? 'every property in this batch' : 'this address'} on the new cadence going forward.`
          : `We'll re-scan ${target?.kind === 'batch' ? 'every property in this batch' : 'this address'} on the cadence you choose and surface new matches in your queue.`}
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
