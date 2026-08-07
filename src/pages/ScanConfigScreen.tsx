/* global React, AppShell, AppStateContext, Card, ChipRow, Input, Toggle, Button, Pill, Modal,
   Icon, ScreenEmpty, OCC_INTENTS, OCC_VERDICTS, OCC_STATUSES, OCC_INTENT_LABEL,
   OCC_VERDICT_LABEL, OCC_STATUS_LABEL, OCC_STATUS_TONE, OCC_CADENCE_LABEL,
   DEFAULT_OCC_CONFIG, occThresholdError, occThresholdsFor */

// Scan configuration — the org-level admin surface. Everything the product
// used to hardcode lives here: what counts as rented, what a finding means
// given what was declared, which statuses re-scan, and how much we spend
// investigating.
//
// Composition note: every control is a registered primitive. The outcome
// matrix reads as a grid but edits as ChipRows, because a grid of value
// pickers would need a `select`, which this design system does not have
// (design-harness/components/core/select.md is a logged gap).

interface ScanConfigScreenProps {
  initialConfig?: any;
  /** false renders the no-access state — the page-class floor requires it. */
  canEdit?: boolean;
  /** Rows that would change status if the pending edits were saved. */
  impactCount?: number;
  /** Force the dirty/unsaved footer without interacting (spec frames). */
  forceDirty?: boolean;
  /** Seed an invalid threshold pair to show the error state. */
  seedInvalid?: boolean;
  /** Open one matrix category on mount (spec frames). */
  defaultOpenIntent?: string;
}

// Clamp typed input so a confidence threshold can never leave 0–100, and the
// freshness window stays a sensible positive number of days. Empty/NaN falls
// back to 0 (thresholds) or 1 (days) rather than becoming NaN.
function clamp0to100(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
function clampDays(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(365, n));
}
// Session-timeout minutes. The client asked to "let them put whatever they
// want", so there's no upper cap — only a floor of 1 so the window is real.
function clampMinutes(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, n);
}

// Outcome-matrix column headers. Per the owner, the three columns read as the
// reconciliation labels (Consistent / Needs review / Inconclusive) rather than
// the raw scan-finding verdicts. Scoped to this screen so OCC_VERDICT_LABEL —
// used across the result page and lists — is untouched.
const MATRIX_HEADER_LABEL: Record<string, string> = {
  'not-rented': 'Consistent',
  'possibly-rented': 'Needs review',
  rented: 'Inconclusive',
};

function ConfigSection({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card padded className="mt-section-sub">
      <h2 className="font-sans text-h4 font-semibold" style={{ color: 'var(--navy)' }}>
        {title}
      </h2>
      {desc && (
        <p className="font-sans text-caption mt-1" style={{ color: 'var(--ink-3)' }}>
          {desc}
        </p>
      )}
      <div className="mt-stack-md">{children}</div>
    </Card>
  );
}

/** The 0-100 band preview. Widths are computed layout, not design values. */
function ThresholdBandPreview({ lo, hi }: { lo: number; hi: number }) {
  const safeLo = Math.max(0, Math.min(100, lo));
  const safeHi = Math.max(safeLo, Math.min(100, hi));
  // Verdicts are a categorical finding, not a severity — so the band uses the
  // verdict palette (blue / yellow / purple), matching the canonical verdict
  // Pill everywhere else, not the clean/warn/risk status palette.
  const bands = [
    { tone: 'verdict-low', label: OCC_VERDICT_LABEL['not-rented'], width: safeLo },
    { tone: 'verdict-med', label: OCC_VERDICT_LABEL['possibly-rented'], width: safeHi - safeLo },
    { tone: 'verdict-high', label: OCC_VERDICT_LABEL.rented, width: 100 - safeHi },
  ];
  return (
    <div>
      <div className="flex h-8 rounded-md overflow-hidden border border-line">
        {bands.map((b) => (
          <div
            key={b.tone}
            className={`grid place-items-center font-sans text-micro font-medium bg-${b.tone}-soft text-${b.tone}-ink overflow-hidden whitespace-nowrap px-1`}
            style={{ width: `${b.width}%` }}
          >
            {b.width >= 18 ? b.label : ''}
          </div>
        ))}
      </div>
      <div className="flex justify-between font-sans text-micro tabular-nums mt-1" style={{ color: 'var(--ink-3)' }}>
        <span>0</span>
        <span>{safeLo}</span>
        <span>{safeHi}</span>
        <span>100</span>
      </div>
    </div>
  );
}

function ScanConfigScreen({
  initialConfig,
  canEdit,
  impactCount,
  forceDirty = false,
  seedInvalid = false,
  defaultOpenIntent = null,
}: ScanConfigScreenProps) {
  const seed = initialConfig ?? DEFAULT_OCC_CONFIG;
  // Staff-Admin-only. If a `canEdit` prop is passed (spec frames), it wins;
  // otherwise access is role-based. Context read directly so provider-less
  // hosts default to staff.
  const roleCtx: any = React.useContext(AppStateContext);
  const role = roleCtx?.role ?? 'staff';
  const hasAccess = canEdit !== undefined ? canEdit : role === 'staff';

  const [defaultIntent, setDefaultIntent] = React.useState(seed.defaultIntent);
  const [hi, setHi] = React.useState(seedInvalid ? 25 : seed.thresholds.rentedAtOrAbove);
  const [lo, setLo] = React.useState(seedInvalid ? 60 : seed.thresholds.notRentedAtOrBelow);
  const [matrix, setMatrix] = React.useState(seed.outcomeMatrix);
  const [recurring, setRecurring] = React.useState(seed.recurring);
  const [staleDays, setStaleDays] = React.useState(seed.stalenessDays);
  // Session timeout — a toggle plus, when on, the idle window as a number + unit.
  const [timeoutOn, setTimeoutOn] = React.useState(seed.sessionTimeout?.enabled ?? false);
  const [timeoutValue, setTimeoutValue] = React.useState(seed.sessionTimeout?.value ?? 30);
  const [timeoutUnit, setTimeoutUnit] = React.useState<string>(seed.sessionTimeout?.unit ?? 'minutes');
  const [openIntent, setOpenIntent] = React.useState<string | null>(defaultOpenIntent);

  // Save flow: confirm → saving → saved. `baseline` is the last-saved snapshot;
  // dirty compares the live values against it so the footer collapses on save.
  const snapshot = () =>
    JSON.stringify({ defaultIntent, hi, lo, matrix, recurring, staleDays, timeoutOn, timeoutValue, timeoutUnit });
  const [baseline, setBaseline] = React.useState(() =>
    JSON.stringify({
      defaultIntent: seed.defaultIntent,
      hi: seedInvalid ? 25 : seed.thresholds.rentedAtOrAbove,
      lo: seedInvalid ? 60 : seed.thresholds.notRentedAtOrBelow,
      matrix: seed.outcomeMatrix,
      recurring: seed.recurring,
      staleDays: seed.stalenessDays,
      timeoutOn: seed.sessionTimeout?.enabled ?? false,
      timeoutValue: seed.sessionTimeout?.value ?? 30,
      timeoutUnit: seed.sessionTimeout?.unit ?? 'minutes',
    })
  );
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);

  const thresholdError = occThresholdError({ rentedAtOrAbove: hi, notRentedAtOrBelow: lo });
  const dirty = forceDirty || snapshot() !== baseline;

  function discard() {
    const b = JSON.parse(baseline);
    setDefaultIntent(b.defaultIntent);
    setHi(b.hi);
    setLo(b.lo);
    setMatrix(b.matrix);
    setRecurring(b.recurring);
    setStaleDays(b.staleDays);
    setTimeoutOn(b.timeoutOn);
    setTimeoutValue(b.timeoutValue);
    setTimeoutUnit(b.timeoutUnit);
  }
  function doSave() {
    setSaving(true);
    window.setTimeout(() => {
      setBaseline(snapshot());
      setSaving(false);
      setConfirmOpen(false);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 3000);
    }, 800);
  }

  if (!hasAccess) {
    return (
      <AppShell>
        <div className="mt-section">
          <ScreenEmpty
            icon="lock"
            title="You don't have access to scan configuration"
            message="These settings change how every scan in your organisation is scored. Only a Staff Admin can view and change them."
          />
        </div>
      </AppShell>
    );
  }

  const setCell = (intent: string, verdict: string, status: string) =>
    setMatrix((m: any) => ({ ...m, [intent]: { ...m[intent], [verdict]: status } }));

  return (
    <AppShell>
    <div className="pb-section">
      <div>
        <h1 className="font-sans text-h2 font-semibold" style={{ color: 'var(--navy)' }}>
          Scan configuration
        </h1>
        <p className="font-sans text-body-sm mt-2 max-w-[68ch]" style={{ color: 'var(--ink-2)' }}>
          These rules apply to every scan your organisation runs. Reports already issued keep the
          settings they were scored under.
        </p>
      </div>

      {/* ---- 1. Universal intended behaviour ---- */}
      <ConfigSection
        title="Universal intended behaviour"
        desc="Pre-fills every single scan, batch and automation. Anyone can override it per scan."
      >
        <ChipRow
          label="Unless stated otherwise, assume properties should be"
          value={defaultIntent}
          onChange={setDefaultIntent}
          options={OCC_INTENTS.map((i: string) => ({ value: i, label: OCC_INTENT_LABEL[i] }))}
        />
      </ConfigSection>

      {/* ---- 2. Confidence thresholds — REMOVED ----
           The threshold editor card was pulled from the UI at the owner's
           request. The `thresholds` (hi/lo) stay on OccConfig and in this
           screen's state so the saved config shape and dirty-tracking are
           unchanged — only the control is gone (same pattern as the retired
           Recurring-scans and Investigation-depth sections). The band preview
           (ThresholdBandPreview) is likewise dormant, not deleted. */}

      {/* ---- 3. Outcome matrix ---- */}
      <ConfigSection
        title="Outcome matrix"
        desc="What each verdict means, given what was declared. This is what makes an address red."
      >
        <div
          className="grid gap-2 font-sans text-micro uppercase tracking-[0.14em] font-semibold pb-2"
          style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1fr', color: 'var(--ink-3)' }}
        >
          <span>Declared</span>
          {OCC_VERDICTS.map((v: string) => (
            <span key={v}>{MATRIX_HEADER_LABEL[v] ?? OCC_VERDICT_LABEL[v]}</span>
          ))}
        </div>

        {OCC_INTENTS.map((intent: string) => {
          const expanded = openIntent === intent;
          return (
            <div key={intent} className="border-t border-line">
              <button
                type="button"
                onClick={() => setOpenIntent(expanded ? null : intent)}
                aria-expanded={expanded}
                className="w-full grid gap-2 items-center py-2.5 text-left rounded-md transition-colors hover:bg-hover-bg"
                style={{ gridTemplateColumns: '1.3fr 1fr 1fr 1fr' }}
              >
                <span className="font-sans text-caption font-medium inline-flex items-center gap-inline" style={{ color: 'var(--ink)' }}>
                  <span
                    className={`inline-flex shrink-0 transition-transform ${expanded ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
                    aria-hidden
                  >
                    <Icon name="chevron" size={12} />
                  </span>
                  {OCC_INTENT_LABEL[intent]}
                </span>
                {OCC_VERDICTS.map((v: string) => {
                  const status = matrix[intent][v];
                  return (
                    <span key={v}>
                      <Pill variant={OCC_STATUS_TONE[status]} size="md">
                        {OCC_STATUS_LABEL[status]}
                      </Pill>
                    </span>
                  );
                })}
              </button>

              {expanded && (
                <div className="pb-stack-md pl-5 flex flex-col gap-stack">
                  {OCC_VERDICTS.map((v: string) => (
                    <ChipRow
                      key={v}
                      label={`Found ${OCC_VERDICT_LABEL[v].toLowerCase()} — treat as`}
                      value={matrix[intent][v]}
                      onChange={(next: string) => setCell(intent, v, next)}
                      options={OCC_STATUSES.map((s: string) => ({
                        value: s,
                        label: OCC_STATUS_LABEL[s],
                      }))}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </ConfigSection>

      {/* ---- 4. Recurring scans — REMOVED ----
           Per-status recurring cadence was retired: it duplicated the
           Automation feature (scheduled scans), where recurrence now lives
           exclusively. Red properties are still detected and flagged in
           single and batch scans; re-checking them happens through a normal
           automation (batch) or an individual re-scan, each of which logs its
           own History entry. The `recurring` field stays on OccConfig so the
           saved config shape is unchanged — only the control is gone. */}

      {/* ---- 5. Investigation depth (cost / quality) — DEFERRED ----
           Pulled from the UI for this week's review, not cancelled. The
           `depth` field stays on OccConfig and DEFAULT_OCC_CONFIG still
           ships 'deep-ambiguous', so scans keep the intended behaviour;
           only the control is absent. Restoring it means re-adding one
           ConfigSection with a RadioGroup of the three OccDepth values.  */}

      {/* ---- 6. Report freshness ---- */}
      <ConfigSection
        title="Report freshness"
        desc="How long a served report stays current before we flag it and offer a re-run."
      >
        <div className="max-w-[240px]">
          <Input
            label="Flag reports older than"
            type="number"
            min={1}
            max={365}
            step={1}
            value={String(staleDays)}
            trailing={<span className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>days</span>}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStaleDays(clampDays(e.target.value))}
          />
        </div>
      </ConfigSection>

      {/* ---- 7. Session timeout ----
           Client ask (Jim McGowan): a flip on/off, and when on, "how long",
           because org policies range from 10 minutes to an hour to never.
           Composed from registered primitives — ChipRow for the on/off flip
           (the design system has no `toggle` yet — logged gap) and Input for
           the minutes, mirroring the Report-freshness pattern above. */}
      <ConfigSection
        title="Session timeout"
        desc="Automatically sign users out after a period of inactivity."
      >
        <Toggle
          checked={timeoutOn}
          onChange={setTimeoutOn}
          label="Force sign-out after inactivity"
          description="Ties into single sign-on forced-logout. Off = users stay signed in until they sign out."
        />
        {timeoutOn && (
          <div className="mt-stack-md">
            {/* Number + unit — "sign out after N minutes / hours / days". */}
            <div className="flex flex-wrap items-start gap-stack">
              <div className="w-[120px]">
                <Input
                  label="Sign out after"
                  type="number"
                  min={1}
                  step={1}
                  value={String(timeoutValue)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTimeoutValue(clampMinutes(e.target.value))}
                />
              </div>
              <ChipRow
                label="Unit"
                value={timeoutUnit}
                onChange={setTimeoutUnit}
                options={[
                  { value: 'minutes', label: 'Minutes' },
                  { value: 'hours', label: 'Hours' },
                  { value: 'days', label: 'Days' },
                ]}
              />
            </div>
            <p className="font-sans text-caption mt-stack-tight" style={{ color: 'var(--ink-3)' }}>
              Applies org-wide. 30 minutes is typical — set whatever your policy requires.
            </p>
          </div>
        )}
      </ConfigSection>

      {/* ---- Footer: impact preview + save ---- */}
      {dirty && (
        <Card padded className="mt-section-sub">
          <div className="flex flex-wrap items-center justify-between gap-stack">
            <div className="flex items-start gap-inline">
              <span className="shrink-0 mt-0.5 [&>svg]:w-4 [&>svg]:h-4" style={{ color: 'var(--warn-ink)' }} aria-hidden>
                <Icon name="info" size={16} />
              </span>
              <div>
                <p className="font-sans text-label font-medium" style={{ color: 'var(--ink)' }}>
                  Unsaved changes
                </p>
                <p className="font-sans text-caption mt-0.5" style={{ color: 'var(--ink-3)' }}>
                  {typeof impactCount === 'number' ? (
                    <>
                      Saving would reclassify{' '}
                      <span className="tabular-nums font-medium">{impactCount}</span> properties.
                      Reports already issued keep their original scoring.
                    </>
                  ) : (
                    <>Reports already issued keep their original scoring.</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-inline">
              <Button variant="default" onClick={discard}>Discard</Button>
              <Button
                variant="primary"
                disabled={!!thresholdError}
                onClick={() => setConfirmOpen(true)}
              >
                Save configuration
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Saved confirmation — brief, after a successful save. */}
      {justSaved && !dirty && (
        <Card padded className="mt-section-sub">
          <div className="flex items-center gap-inline" role="status" aria-live="polite">
            <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4" style={{ color: 'var(--clean-ink)' }} aria-hidden>
              <Icon name="check" size={16} />
            </span>
            <p className="font-sans text-label font-medium" style={{ color: 'var(--ink)' }}>
              Configuration saved. New scans use these rules; issued reports keep their original scoring.
            </p>
          </div>
        </Card>
      )}

      {/* Confirm-before-save — names the reclassification impact. */}
      <Modal
        open={confirmOpen}
        onClose={() => (saving ? null : setConfirmOpen(false))}
        title="Save configuration?"
        width={440}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={doSave} disabled={saving} icon={saving ? undefined : <Icon name="check" size={14} />}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      >
        <p className="font-sans text-body-sm" style={{ color: 'var(--ink-2)' }}>
          {typeof impactCount === 'number' ? (
            <>
              This will reclassify{' '}
              <span className="tabular-nums font-medium" style={{ color: 'var(--ink)' }}>
                {impactCount}
              </span>{' '}
              properties under the new rules. Reports already issued keep their original scoring.
            </>
          ) : (
            <>These rules apply to every new scan. Reports already issued keep their original scoring.</>
          )}
        </p>
      </Modal>
    </div>
    </AppShell>
  );
}
