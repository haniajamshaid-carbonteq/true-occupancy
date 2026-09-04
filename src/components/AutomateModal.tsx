/* global React, Modal, Button, Icon, Radio, RadioGroup, StatusPillSelector,
   AutomationScopeCard, Cadence, ScopeRetention, sameCadence, cadenceLabel,
   formatNextRun, ChipRow, OCC_INTENTS, OCC_INTENT_LABEL, DEFAULT_OCC_CONFIG,
   occMatchForRisk */
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
  onConfirm: (payload: { cadence: Cadence; statuses?: Risk[]; retention?: ScopeRetention; intent?: string }) => void;
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
  /** Initial intended occupancy, honoured in BOTH modes. Create mode falls
   *  back to the org's universal default when omitted — but a batch passes its
   *  own declared intent, so the pre-selected re-scan bands are the ones that
   *  actually reconcile to Needs review for THAT batch. Always overridable. */
  initialIntent?: string;
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

// The re-scan set defaults to the raw bands that reconcile to "Needs review"
// (red) against the declared intent — the properties an officer most needs to
// keep watching. Which raw bands are red depends on the intent (per the config
// outcome matrix), so it's derived, not fixed: e.g. owner-occupied → just
// Possibly-rented; not-sure → Rented + Possibly-rented. Falls back to the
// non-consistent bands if the matrix marks nothing red for this intent. The
// user can freely change the selection afterwards.
const ALL_BANDS: Risk[] = ['risk', 'warn', 'clean'];
function redBandsFor(intent: string): Risk[] {
  const red = ALL_BANDS.filter((b) => occMatchForRisk(intent, b)?.status === 'red');
  return red.length > 0 ? red : DEFAULT_STATUSES;
}

// Retention rule cards — what happens to a property once its status no longer
// matches the selected bands. Plain-language, consequence-first copy (locked
// with design): never "static / dynamic / scope".
const RETENTION_OPTIONS: { value: ScopeRetention; label: string; hint: string }[] = [
  {
    value: 'monitor',
    label: 'Continue monitoring it',
    hint: 'Once added, the property stays in the automation even if its status changes later.',
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
  initialIntent,
  scopeCounts,
  scopeTotal,
  scopeCountsPending = false,
  onCancelAutomation,
}: AutomateModalProps) {
  const isEdit = mode === 'edit';
  const isBatch = target?.kind === 'batch';

  const seedCadence: Cadence = isEdit && initialCadence ? initialCadence : DEFAULT_CADENCE;
  // Intended occupancy — the caller's declared intent (a batch passes its own
  // batch-level one) falling back to the org's universal default, so the common
  // case is zero clicks and the user overrides it only when this automation
  // targets a different kind of property. Declared before seedStatuses because
  // the default re-scan set is derived from it.
  const seedIntent: string = initialIntent || DEFAULT_OCC_CONFIG.defaultIntent;
  const seedStatuses: Risk[] =
    isEdit && initialStatuses && initialStatuses.length > 0
      ? initialStatuses
      : redBandsFor(seedIntent);
  const seedRetention: ScopeRetention =
    isEdit && initialRetention ? initialRetention : DEFAULT_RETENTION;

  const [cadence, setCadence] = React.useState<Cadence>(seedCadence);
  const [statuses, setStatuses] = React.useState<Risk[]>(seedStatuses);
  const [retention, setRetention] = React.useState<ScopeRetention>(seedRetention);
  const [intent, setIntent] = React.useState<string>(seedIntent);

  // The re-scan default tracks the declared intent (Needs-review bands) only
  // until the user touches the pills. Once they've made a manual choice we
  // stop auto-deriving, so changing intent afterwards never wipes their pick.
  const statusesDirty = React.useRef(false);
  const handleStatusesChange = (next: Risk[]) => {
    statusesDirty.current = true;
    setStatuses(next);
  };

  // Reset selection each time the modal reopens so it reflects fresh seeds.
  // Keyed on `open` only — the seed values are recomputed every render
  // (cadence/statuses are objects/arrays whose identity churns), so we read
  // the latest seeds inside the effect rather than tracking them as deps.
  React.useEffect(() => {
    if (open) {
      setCadence(seedCadence);
      setStatuses(seedStatuses);
      setRetention(seedRetention);
      setIntent(seedIntent);
      statusesDirty.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Changing the declared intent re-derives the Needs-review default so the
  // pre-selection stays meaningful against the new intent — unless the user
  // has already hand-picked the pills. Create + batch only (single scans and
  // edit mode carry their own scope).
  React.useEffect(() => {
    if (!open || isEdit || !isBatch) return;
    if (statusesDirty.current) return;
    setStatuses(redBandsFor(intent));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent]);

  // When every status is selected, a property can never STOP matching — so the
  // retention choice is moot (the whole batch is always re-scanned). We hide
  // the section and treat retention as 'monitor', while leaving the user's
  // underlying `retention` pick intact so it returns if they deselect a status.
  const allStatusesSelected = isBatch && statuses.length === STATUS_OPTIONS_BASE.length;
  const effectiveRetention: ScopeRetention = allStatusesSelected ? 'monitor' : retention;

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
      ? effectiveRetention === (initialRetention ?? DEFAULT_RETENTION)
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
                retention: isBatch ? effectiveRetention : undefined,
                intent,
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
          <div className="font-sans text-eyebrow uppercase tracking-[0.14em] font-semibold text-ink-3 mb-1">
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

      {/* ---- Section: Intended occupancy ------------------------------ */}
      <div className="mb-section-sub">
        <ChipRow
          label="Intended occupancy"
          value={intent}
          onChange={setIntent}
          options={OCC_INTENTS.map((i: string) => ({ value: i, label: OCC_INTENT_LABEL[i] }))}
        />
        <p className="font-sans text-caption mt-2" style={{ color: 'var(--ink-3)' }}>
          Applied to every scan this automation runs. Defaults to your
          organisation&rsquo;s setting. Change it only if these properties are a
          different kind.
        </p>
      </div>

      {/* ---- Section: Cadence ----------------------------------------- */}
      {isBatch && (
        <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
          Cadence
        </div>
      )}
      <RadioGroup label="Cadence">
        {OPTIONS.map((opt) => (
          <Radio
            key={`${opt.value.every}-${opt.value.unit}`}
            label={opt.label}
            hint={opt.hint}
            checked={sameCadence(cadence, opt.value)}
            onSelect={() => setCadence(opt.value)}
          />
        ))}
      </RadioGroup>

      {/* ---- Section: Status scope (BATCH ONLY) ----------------------- */}
      {isBatch && (
        <div className="mt-section-sub">
          {/* Step 1 — the status bands that seed the re-scan set. */}
          <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
            Which properties to re-scan?
          </div>
          <StatusPillSelector
            options={STATUS_OPTIONS_BASE.map((opt) => {
              // Label each band by how it reconciles against the declared
              // intent (Consistent / Inconclusive / Needs review), and flag the
              // red one — same language + red marker as the tiles and rows.
              const m = occMatchForRisk(intent, opt.value);
              return {
                value: opt.value,
                label: m ? m.label : opt.label,
                red: m?.status === 'red',
                count: scopeCountsPending ? null : counts[opt.value],
              };
            })}
            value={statuses}
            onChange={handleStatusesChange}
            countsPending={scopeCountsPending}
          />

          {/* Step 2 — retention rule for a property that later stops matching.
              Hidden when ALL statuses are selected: a property can never stop
              matching, so the whole batch is always re-scanned and the choice
              is moot. */}
          {!allStatusesSelected && (
          <>
          <div className="mt-section-sub font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase text-ink-3 mb-2">
            If a property no longer matches these statuses
          </div>
          <RadioGroup label="When a property no longer matches">
            {RETENTION_OPTIONS.map((opt) => (
              <Radio
                key={opt.value}
                label={opt.label}
                hint={opt.hint}
                hintClassName="leading-snug"
                checked={retention === opt.value}
                onSelect={() => setRetention(opt.value)}
              />
            ))}
          </RadioGroup>
          </>
          )}

          {/* Live scope summary */}
          <div className="mt-3">
            <AutomationScopeCard
              selected={statuses}
              counts={counts}
              total={total}
              cadence={cadence}
              retention={effectiveRetention}
              hideRetentionNote={allStatusesSelected}
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
