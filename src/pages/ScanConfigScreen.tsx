/* global React, AppShell, AppStateContext, Card, ChipRow, Input, Button, Pill, Modal,
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
  const bands = [
    { tone: 'clean', label: OCC_VERDICT_LABEL['not-rented'], width: safeLo },
    { tone: 'warn', label: OCC_VERDICT_LABEL['possibly-rented'], width: safeHi - safeLo },
    { tone: 'risk', label: OCC_VERDICT_LABEL.rented, width: 100 - safeHi },
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
  const [openIntent, setOpenIntent] = React.useState<string | null>(defaultOpenIntent);

  // Save flow: confirm → saving → saved. `baseline` is the last-saved snapshot;
  // dirty compares the live values against it so the footer collapses on save.
  const snapshot = () => JSON.stringify({ defaultIntent, hi, lo, matrix, recurring, staleDays });
  const [baseline, setBaseline] = React.useState(() =>
    JSON.stringify({
      defaultIntent: seed.defaultIntent,
      hi: seedInvalid ? 25 : seed.thresholds.rentedAtOrAbove,
      lo: seedInvalid ? 60 : seed.thresholds.notRentedAtOrBelow,
      matrix: seed.outcomeMatrix,
      recurring: seed.recurring,
      staleDays: seed.stalenessDays,
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
      <div className="mt-section">
        <div
          className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase"
          style={{ color: 'var(--brand)' }}
        >
          Organisation settings
        </div>
        <h1 className="font-sans text-h2 font-semibold mt-1" style={{ color: 'var(--navy)' }}>
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

      {/* ---- 2. Confidence thresholds ---- */}
      <ConfigSection
        title="Confidence thresholds"
        desc="Where the score stops being one verdict and becomes the next."
      >
        <div className="flex flex-wrap gap-stack">
          <div className="flex-1 min-w-[180px]">
            <Input
              label="Rented at or above"
              type="number"
              min={0}
              max={100}
              step={1}
              value={String(hi)}
              error={!!thresholdError}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHi(clamp0to100(e.target.value))}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Input
              label="Not rented at or below"
              type="number"
              min={0}
              max={100}
              step={1}
              value={String(lo)}
              error={!!thresholdError}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLo(clamp0to100(e.target.value))}
            />
          </div>
        </div>
        {thresholdError && (
          <p className="font-sans text-caption mt-stack-tight" role="alert" style={{ color: 'var(--error-ink)' }}>
            {thresholdError}
          </p>
        )}
        <div className="mt-stack-md">
          <ThresholdBandPreview lo={lo} hi={hi} />
        </div>
      </ConfigSection>

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
            <span key={v}>{OCC_VERDICT_LABEL[v]}</span>
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

      {/* ---- 4. Recurring scans ---- */}
      <ConfigSection
        title="Recurring scans"
        desc="Which statuses keep getting re-scanned. Only red recurs by default — yellow and green are one-off unless you change it."
      >
        <div className="flex flex-col gap-stack">
          {OCC_STATUSES.slice().reverse().map((s: string) => (
            <div key={s} className="flex flex-wrap items-center gap-stack">
              <span className="w-[92px] shrink-0">
                <Pill variant={OCC_STATUS_TONE[s]} size="md">
                  {OCC_STATUS_LABEL[s]}
                </Pill>
              </span>
              <div className="flex-1 min-w-[260px]">
                <ChipRow
                  label=""
                  value={recurring[s]}
                  onChange={(next: string) => setRecurring((r: any) => ({ ...r, [s]: next }))}
                  options={(['none', 'quarterly', 'monthly', 'weekly'] as string[]).map((c) => ({
                    value: c,
                    label: OCC_CADENCE_LABEL[c],
                  }))}
                />
              </div>
            </div>
          ))}
        </div>
      </ConfigSection>

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
