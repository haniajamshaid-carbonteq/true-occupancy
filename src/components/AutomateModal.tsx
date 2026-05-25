/* global React, Modal, Button, Icon, StatusPillSelector, AutomationScopeCard,
   Cadence, ScopeRetention, sameCadence, cadenceLabel, formatNextRun */
// AutomateModal — shared dialog for creating OR editing an automation.
//
// Create mode: shows the cadence radio cards (and, for batches, the new
// status-scope selector + retention cards + live scope card). Calls
// onConfirm({ cadence, statuses?, retention? }) on submit.
// Edit mode: preselects initialCadence + initialStatuses. Primary CTA is
// disabled until the user changes one OR the other. An optional
// "Cancel automation" destructive button renders on the left of the footer.
//
// Batch-only props (`scopeCounts`, `scopeTotal`, etc.) drive the new
// per-status section per the May-14 design feedback (Erin). Single-property
// automations keep the simpler one-section layout.

// Cadence + ScopeRetention come from AppState (shared global script scope).
type Risk = 'clean' | 'warn' | 'risk';

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
  onConfirm: (payload: { cadence: Cadence; statuses?: Risk[]; retention?: ScopeRetention }) => void;
  /** 'create' (default) opens with defaults. 'edit' preselects initial values
   *  and disables the primary CTA until something changes. */
  mode?: 'create' | 'edit';
  /** Used in edit mode to seed the radio selection. Create mode defaults to
   *  6 months. */
  initialCadence?: Cadence;
  /** BATCH-only. Edit mode: initial selected statuses. Create mode: ignored,
   *  defaults to ['risk','warn'] (Rented + Possibly Rented). */
  initialStatuses?: Risk[];
  /** BATCH-only. Edit mode: initial retention rule. Create mode: ignored,
   *  defaults to 'monitor' (keep re-scanning when a status stops matching). */
  initialRetention?: ScopeRetention;
  /** BATCH-only. Per-status counts from the latest scan; drives the live
   *  scope card + the "(N)" suffix on each status pill. */
  scopeCounts?: { risk: number; warn: number; clean: number };
  /** BATCH-only. Total addresses in the latest scan. */
  scopeTotal?: number;
  /** BATCH-only. First scan is still running — counts not known yet. */
  scopeCountsPending?: boolean;
  /** Edit mode only — renders a destructive "Cancel automation" button on
   *  the left of the footer when provided. */
  onCancelAutomation?: () => void;
}

const OPTIONS: { value: Cadence; label: string; hint: string }[] = [
  { value: { every: 1, unit: 'week' },  label: 'Weekly',   hint: 'Close watch on active cases' },
  { value: { every: 1, unit: 'month' }, label: 'Monthly',  hint: 'Steady month-to-month checks' },
  { value: { every: 3, unit: 'month' }, label: '3 Months', hint: 'Quarterly compliance sweeps' },
  { value: { every: 6, unit: 'month' }, label: '6 Months', hint: 'Recommended for most portfolios' },
];

const DEFAULT_CADENCE: Cadence = { every: 6, unit: 'month' };
const DEFAULT_RETENTION: ScopeRetention = 'monitor';
const DEFAULT_STATUSES: Risk[] = ['risk', 'warn'];

// Retention rule cards — what happens to a property once its status no longer
// matches the selected bands. Plain-language, consequence-first copy (locked
// with design): never "static / dynamic / scope".
const RETENTION_OPTIONS: { value: ScopeRetention; label: string; hint: string }[] = [
  {
    value: 'monitor',
    label: 'Continue monitoring it',
    hint: 'Once added, the property stays in the automation — even if its status changes later.',
  },
  {
    value: 'remove',
    label: 'Remove it from automation',
    hint: 'The property is removed once it no longer matches the selected statuses.',
  },
];

const STATUS_OPTIONS_BASE: { value: Risk; label: string }[] = [
  { value: 'risk',  label: 'Rented' },
  { value: 'warn',  label: 'Possibly Rented' },
  { value: 'clean', label: 'Not Rented' },
];

function sameSet(a: Risk[], b: Risk[]): boolean {
  if (a.length !== b.length) return false;
  for (const v of a) if (!b.includes(v)) return false;
  return true;
}

function AutomateModal({
  open,
  onClose,
  target,
  onConfirm,
  mode = 'create',
  initialCadence,
  initialStatuses,
  initialRetention,
  scopeCounts,
  scopeTotal,
  scopeCountsPending = false,
  onCancelAutomation,
}: AutomateModalProps) {
  const isEdit = mode === 'edit';
  const isBatch = target?.kind === 'batch';

  const seedCadence: Cadence = isEdit && initialCadence ? initialCadence : DEFAULT_CADENCE;
  const seedStatuses: Risk[] =
    isEdit && initialStatuses && initialStatuses.length > 0
      ? initialStatuses
      : DEFAULT_STATUSES;
  const seedRetention: ScopeRetention =
    isEdit && initialRetention ? initialRetention : DEFAULT_RETENTION;

  const [cadence, setCadence] = React.useState<Cadence>(seedCadence);
  const [statuses, setStatuses] = React.useState<Risk[]>(seedStatuses);
  const [retention, setRetention] = React.useState<ScopeRetention>(seedRetention);

  // Reset selection each time the modal reopens so it reflects fresh seeds.
  // Keyed on `open` only — the seed values are recomputed every render
  // (cadence/statuses are objects/arrays whose identity churns), so we read
  // the latest seeds inside the effect rather than tracking them as deps.
  React.useEffect(() => {
    if (open) {
      setCadence(seedCadence);
      setStatuses(seedStatuses);
      setRetention(seedRetention);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Primary CTA enablement.
  //   create (single): always enabled
  //   create (batch):  enabled only when ≥1 status selected
  //   edit   (single): enabled when cadence changed
  //   edit   (batch):  enabled when cadence OR statuses OR retention changed,
  //                    AND ≥1 status
  let primaryDisabled = false;
  if (isBatch && statuses.length === 0) {
    primaryDisabled = true;
  } else if (isEdit) {
    const cadenceUnchanged = initialCadence ? sameCadence(cadence, initialCadence) : false;
    const statusesUnchanged = isBatch
      ? sameSet(statuses, initialStatuses ?? DEFAULT_STATUSES)
      : true;
    const retentionUnchanged = isBatch
      ? retention === (initialRetention ?? DEFAULT_RETENTION)
      : true;
    primaryDisabled = cadenceUnchanged && statusesUnchanged && retentionUnchanged;
  }

  const counts = scopeCounts ?? { risk: 0, warn: 0, clean: 0 };
  const total = scopeTotal ?? 0;
  const nextRunLabel = formatNextRun(cadence);

  // Edit-mode scope diff — only meaningful for batches when the user has
  // actually changed the status selection from the initial.
  const showScopeDiff =
    isEdit &&
    isBatch &&
    !scopeCountsPending &&
    initialStatuses &&
    !sameSet(statuses, initialStatuses);
  const oldScopeCount = initialStatuses
    ? (initialStatuses.includes('risk')  ? counts.risk  : 0) +
      (initialStatuses.includes('warn')  ? counts.warn  : 0) +
      (initialStatuses.includes('clean') ? counts.clean : 0)
    : 0;
  const newScopeCount =
    (statuses.includes('risk')  ? counts.risk  : 0) +
    (statuses.includes('warn')  ? counts.warn  : 0) +
    (statuses.includes('clean') ? counts.clean : 0);

  // ---------- Render -----------------------------------------------------

  const title = isBatch
    ? (isEdit ? 'Update batch automation' : 'Automate this batch')
    : (isEdit ? 'Update Automation' : 'Automate This Scan');

  const primaryLabel = isEdit
    ? (isBatch ? 'Save changes' : 'Update Cadence')
    : (scopeCountsPending && isBatch ? 'Apply when scan completes' : 'Automate');

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={isBatch ? 600 : 520}
      title={title}
      footer={
        <>
          {isEdit && onCancelAutomation && (
            <button
              type="button"
              onClick={onCancelAutomation}
              className="mr-auto inline-flex items-center gap-inline-tight h-9 px-control-x rounded-lg bg-transparent border border-transparent font-sans text-label font-medium text-error-ink hover:bg-error-soft transition-colors cursor-pointer"
            >
              <Icon name="x" size={14} />
              Cancel Automation
            </button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button
            variant="primary"
            onClick={() =>
              onConfirm({
                cadence,
                statuses: isBatch ? statuses : undefined,
                retention: isBatch ? retention : undefined,
              })
            }
            icon={<Icon name="cal" size={14} />}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </Button>
        </>
      }
    >
      {/* Address summary block — single property only. The filename / total
          for a batch reads more naturally in the modal title + scope card,
          so we don't double up here. */}
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
          ? `We'll re-scan ${isBatch ? 'matching properties in this batch' : 'this address'} on the new cadence going forward.`
          : `We'll re-scan ${isBatch ? 'the properties you pick below' : 'this address'} on the cadence you choose and surface new matches in your queue.`}
      </p>

      {/* ---- Section: Cadence ----------------------------------------- */}
      {isBatch && (
        <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
          Cadence
        </div>
      )}
      <div role="radiogroup" aria-label="Cadence" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map((opt) => {
          const active = sameCadence(cadence, opt.value);
          return (
            <button
              key={`${opt.value.every}-${opt.value.unit}`}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setCadence(opt.value)}
              className={`text-left flex items-start gap-inline-loose px-control-x py-3 rounded-md border transition-colors ${
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
                  className="block font-sans font-semibold text-label"
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

      {/* ---- Section: Status scope (BATCH ONLY) ----------------------- */}
      {isBatch && (
        <div className="mt-5">
          {/* Step 1 — the status bands that seed the re-scan set. */}
          <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
            Which properties to re-scan?
          </div>
          <StatusPillSelector
            options={STATUS_OPTIONS_BASE.map((opt) => ({
              ...opt,
              count: scopeCountsPending ? null : counts[opt.value],
            }))}
            value={statuses}
            onChange={setStatuses}
            countsPending={scopeCountsPending}
          />

          {/* Step 2 — retention rule for a property that later stops matching. */}
          <div className="mt-5 font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
            If a property no longer matches these statuses
          </div>
          <div role="radiogroup" aria-label="When a property no longer matches" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {RETENTION_OPTIONS.map((opt) => {
              const active = retention === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRetention(opt.value)}
                  className={`text-left flex items-start gap-inline-loose px-control-x py-3 rounded-md border transition-colors ${
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
                      className="block font-sans font-semibold text-label"
                      style={{ color: active ? 'var(--brand-deep)' : 'var(--navy)' }}
                    >
                      {opt.label}
                    </span>
                    <span className="block text-caption text-ink-3 mt-0.5 leading-snug">{opt.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live scope summary */}
          <div className="mt-3">
            <AutomationScopeCard
              selected={statuses}
              counts={counts}
              total={total}
              cadence={cadence}
              retention={retention}
              nextRunLabel={nextRunLabel}
              countsPending={scopeCountsPending}
            />
          </div>

          {/* Inline diff for edit mode — only when scope actually changes. */}
          {showScopeDiff && (
            <p className="mt-2 m-0 font-mono tabular-nums text-caption text-ink-3">
              Next run scope: {oldScopeCount} → {newScopeCount} addresses.
              First run with new scope: {nextRunLabel}.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
