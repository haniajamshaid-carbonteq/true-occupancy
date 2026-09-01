/* global React, ReactRouterDOM, AppShell, AppStateContext, Card, ChipRow, Input, Toggle, Button, Pill, Modal,
   DropdownMenu, Drawer, ScreenEmpty, Icon, OCC_INTENTS, OCC_VERDICTS, OCC_STATUSES, OCC_INTENT_LABEL,
   OCC_VERDICT_LABEL, OCC_STATUS_LABEL, OCC_STATUS_TONE, OCC_CADENCE_LABEL,
   DEFAULT_OCC_CONFIG, occThresholdError, occThresholdsFor, formatUsDate */

// Threshold change audit log (prototype seed). Every save appends a dated
// entry of what changed; the Audit-log drawer lets an admin pick a date and
// read that day's changes time-wise. In prod this comes from the versioned
// config history (Trello #78 / #76); here it is a static seed so the drawer
// is reviewable. `at` is a local wall-clock stamp 'YYYY-MM-DDTHH:MM'.
interface AuditChange { label: string; from: string; to: string }
interface AuditEvent { at: string; actor: string; changes: AuditChange[] }
const THRESHOLD_AUDIT: AuditEvent[] = [
  { at: '2026-09-01T14:32', actor: 'J. Marlow', changes: [
    { label: 'Owner-occupied · flag Needs review at', from: '70%', to: '80%' },
    { label: 'Owner-occupied · declare Consistent at', from: '70%', to: '76%' },
  ] },
  { at: '2026-09-01T09:12', actor: 'J. Marlow', changes: [
    { label: 'Rental / investment · declare Consistent at', from: '70%', to: '80%' },
  ] },
  { at: '2026-08-27T11:05', actor: 'A. Chen', changes: [
    { label: 'All types · declare Consistent at', from: '80%', to: '70%' },
    { label: 'Custom ranges', from: 'off', to: 'off' },
  ] },
  { at: '2026-08-10T16:40', actor: 'A. Chen', changes: [
    { label: 'Confidence thresholds', from: 'not set', to: 'flag / declare both 80% (initial)' },
  ] },
];

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

// Outcome-matrix labels. Per the owner, the matrix reads as the reconciliation
// labels (Consistent / Needs review / Inconclusive) rather than the raw
// scan-finding verdicts — in the column headers *and* in the expanded per-row
// editor ("If consistent — treat as"), which used to restate the raw verdict
// and so read as a second, contradicting vocabulary. Scoped to this screen so
// OCC_VERDICT_LABEL — used across the result page and lists — is untouched.
const MATRIX_HEADER_LABEL: Record<string, string> = {
  'not-rented': 'Consistent',
  'possibly-rented': 'Needs review',
  rented: 'Inconclusive',
};

// ---- Confidence thresholds: two declare-confidence questions -------------
// Owner decision 2026-09-01: the editor asks exactly TWO questions per
// declared type, each phrased as "how confident must the scan be to DECLARE
// this outcome":
//   1. needsReviewMin — confidence in the CONTRADICTING finding required to
//      flag Needs review (owner-occupied: finding = rented; rental: finding
//      = not rented, since the score is flipped per type).
//   2. consistentMin  — confidence in the MATCHING finding required to
//      declare Consistent.
// Inconclusive is NEVER asked: everything that clears neither bar is
// Inconclusive, handled by the original backend logic. The user is told so
// in text next to the inputs, but there is nothing to set.
//
// Mapping to the 0–100 match axis (0 contradicts, 100 matches): flag at 80%
// means the first 20 points (0–20) read Needs review; declare at 75% means
// 75–100 reads Consistent; 21–74 is the computed Inconclusive middle.
//
// Screen-local design prototype: `bandRows` are not yet part of OccConfig.
// Persistence is #76, wiring to the verdict is #75; hi/lo stay dormant on
// state so the saved shape is unchanged. Colours for the states come from the
// SAME status tokens the Outcome-matrix pills use (Consistent=green→clean,
// Needs review=red→risk, Inconclusive=yellow→warn), so the two sections stay
// colour-consistent by construction.

/** One declared type's rule: the two declare-confidence minimums. */
type BandRule = { needsReviewMin: number; consistentMin: number };

// Ratified defaults (#74), restated in declare terms: the old bands NR 0–30 /
// Consistent 70–100 are exactly "flag Needs review at 70% confidence" and
// "declare Consistent at 70% confidence". Same numbers, new question.
const DEFAULT_BAND_RULE: BandRule = { needsReviewMin: 70, consistentMin: 70 };

// The declare-confidence floor. You cannot declare an outcome on less than
// majority confidence, and 51 + 51 > 100 means the Needs-review and
// Consistent bands can never overlap — so there is no invalid state, no
// validation error and no Save gate.
function clamp51to100(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return 51;
  return Math.max(51, Math.min(100, n));
}

/** Whether a MATCH for this declared type means the property is rented. True
 *  for a rental (rented is expected, so the score is flipped to confidence-
 *  rented); false for owner-occupied / second home. Not sure follows the
 *  org's default type. */
function intentMatchIsRented(intent: string, notSureResolveAs?: string): boolean {
  if (intent === 'rental') return true;
  if (intent === 'not-sure') return (notSureResolveAs ?? 'owner-occupied') === 'rental';
  return false;
}

/** What a match means, in words, for the per-type list. */
function matchMeaningLine(intent: string, matchIsRented: boolean): string {
  if (intent === 'not-sure') return 'Scored as your default declared type.';
  return matchIsRented
    ? 'A match means the property is rented, so the score is flipped to confidence it is rented.'
    : 'A match means the property is not rented.';
}

/** The two declare-confidence questions for a type, with helper copy that
 *  names the contradicting / matching finding (flips for a rental). */
function declareCopy(intent: string, matchIsRented: boolean) {
  const contradicting = matchIsRented ? 'not rented' : 'rented';
  const matching = matchIsRented ? 'rented' : 'not rented';
  const typeLabel = OCC_INTENT_LABEL[intent];
  return {
    nrHelper: `If the scan finds the property is ${contradicting}, that contradicts ${typeLabel}. This is how confident the scan must be before we flag it Needs review.`,
    consHelper: `If the scan finds the property is ${matching}, that matches ${typeLabel}. This is how confident the scan must be before we call it Consistent.`,
  };
}

/** The per-type list: each declared type and what a MATCH means for it. The
 *  bands are universal, so this is the only thing that differs per type. Used
 *  in both the read-only defaults panel and the custom editor. */
function TypeMeaningList({ notSureResolveAs }: { notSureResolveAs: string }) {
  return (
    <div className="flex flex-col">
      {OCC_INTENTS.map((intent: string) => {
        const matchRented = intentMatchIsRented(intent, notSureResolveAs);
        return (
          <div
            key={intent}
            className="grid gap-3 items-start border-t border-line py-2"
            style={{ gridTemplateColumns: '1.3fr 3fr' }}
          >
            <span className="font-sans text-caption font-medium" style={{ color: 'var(--ink)' }}>
              {OCC_INTENT_LABEL[intent]}
            </span>
            <span className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>
              {matchMeaningLine(intent, matchRented)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Collapsible summary of the recommended defaults, mirroring the outcome
 *  matrix legend (§ MatrixLegend): a one-line summary that is itself the
 *  toggle, expanding to the universal bands + the per-type meaning list. */
function DefaultsInfo({ notSureResolveAs }: { notSureResolveAs: string }) {
  const [open, setOpen] = React.useState(false);
  const bodyId = React.useId ? React.useId() : 'defaults-info';
  return (
    <div className="rounded-lg px-card-tight py-card-tight" style={{ background: 'var(--surface-2)' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center gap-inline text-left rounded-md transition-colors hover:bg-hover-bg"
      >
        <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4" style={{ color: 'var(--ink-3)' }} aria-hidden>
          <Icon name="info" size={16} />
        </span>
        <span className="min-w-0 flex-1 font-sans text-caption" style={{ color: 'var(--ink-2)' }}>
          Default and recommended settings are applied. Turn on the Custom switch to change them.
        </span>
        <span
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
          style={{ color: 'var(--ink-3)' }}
          aria-hidden
        >
          <Icon name="chevron" size={12} />
        </span>
      </button>
      {open && (
        <div id={bodyId} className="mt-stack pl-6">
          {/* The recommended defaults, stated as the two questions. */}
          <p className="font-sans text-micro m-0 mb-1" style={{ color: 'var(--ink-3)' }}>
            The same two settings apply to every declared type:
          </p>
          <div className="flex flex-wrap gap-x-stack gap-y-stack-tight">
            <span className="inline-flex items-center gap-inline">
              <span className="inline-block w-2 h-2 rounded-full bg-risk" aria-hidden />
              <span className="font-sans text-caption font-medium" style={{ color: 'var(--ink)' }}>
                Flag Needs review at
              </span>
              <span className="font-sans text-caption tabular-nums" style={{ color: 'var(--ink-3)' }}>
                {DEFAULT_BAND_RULE.needsReviewMin}% confident
              </span>
            </span>
            <span className="inline-flex items-center gap-inline">
              <span className="inline-block w-2 h-2 rounded-full bg-clean" aria-hidden />
              <span className="font-sans text-caption font-medium" style={{ color: 'var(--ink)' }}>
                Declare Consistent at
              </span>
              <span className="font-sans text-caption tabular-nums" style={{ color: 'var(--ink-3)' }}>
                {DEFAULT_BAND_RULE.consistentMin}% confident
              </span>
            </span>
          </div>
          {/* Only what a match means differs per type. */}
          <p className="font-sans text-micro m-0 mt-stack mb-1" style={{ color: 'var(--ink-3)' }}>
            Anything that clears neither bar is Inconclusive. What a match means, per type:
          </p>
          <TypeMeaningList notSureResolveAs={notSureResolveAs} />
        </div>
      )}
    </div>
  );
}

function ConfigSection({
  title,
  desc,
  headerRight,
  children,
}: {
  title: string;
  desc?: string;
  /** Optional control on the title's baseline (e.g. a section-level switch). */
  headerRight?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card padded className="mt-section-sub">
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-sans text-h4 font-semibold" style={{ color: 'var(--navy)' }}>
          {title}
        </h2>
        {headerRight && <div className="shrink-0">{headerRight}</div>}
      </div>
      {desc && (
        <p className="font-sans text-caption mt-1" style={{ color: 'var(--ink-3)' }}>
          {desc}
        </p>
      )}
      <div className="mt-stack-md">{children}</div>
    </Card>
  );
}

// Key to the outcome matrix, rendered as the last block inside its card.
//
// Every cell above is the org's to set, so this explains the two axes and the
// three statuses — never the shipped values, which would read as rules the
// moment someone edited them. Each status carries one worked example, naming
// the cell it comes from ("declared Owner-occupied × returned Needs review")
// and picked out of live state, so an example can never describe a setting
// that has changed. A status no cell currently uses shows no example.
//
// Deliberately does NOT gloss the statuses with their downstream labels
// (green = "Consistent", red = "Needs review"). Those words are already the
// column headers here, keyed to a different axis — see the collision noted on
// MATRIX_HEADER_LABEL — so restating them would make one screen use the same
// three words two ways. Described by consequence instead.
//
// A disclosure: the one-line summary is always visible and is itself the
// toggle; the colour key expands below on demand. The ⓘ glyph marks it as
// explanatory, the trailing chevron marks it as openable — the same
// leading-glyph + rotating-chevron button idiom the matrix rows above use, so
// the card reads as one interaction grammar. `open` is local view state, never
// config, so it sits outside dirty-tracking and Save entirely. Defaults open
// (`defaultOpen`) because this block exists for the first-time admin, who is
// exactly the person who would never think to expand it.
function MatrixLegend({
  matrix,
  defaultOpen = true,
}: {
  matrix: Record<string, Record<string, string>>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const bodyId = React.useId();

  const MEANING: Record<string, string> = {
    green: 'Agrees with the file. No action.',
    yellow: 'Neither confirmed nor contradicted. An analyst decides.',
    red: 'Contradicts the file. Flagged and tracked until worked.',
  };

  // First cell using each status, in reading order — so every example names a
  // pairing that is on screen directly above it.
  const EXAMPLE: Record<string, string> = {};
  OCC_INTENTS.forEach((intent: string) => {
    OCC_VERDICTS.forEach((v: string) => {
      const s = matrix[intent]?.[v];
      if (s && !EXAMPLE[s]) {
        const col = MATRIX_HEADER_LABEL[v] ?? OCC_VERDICT_LABEL[v];
        EXAMPLE[s] = `declared ${OCC_INTENT_LABEL[intent]}, returned ${col}`;
      }
    });
  });

  return (
    <div
      className="mt-stack-md rounded-lg px-card-tight py-card-tight"
      style={{ background: 'var(--surface-2)' }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="w-full flex items-center gap-inline text-left rounded-md transition-colors hover:bg-hover-bg"
      >
        <span
          className="shrink-0 [&>svg]:w-4 [&>svg]:h-4"
          style={{ color: 'var(--ink-3)' }}
          aria-hidden
        >
          <Icon name="info" size={16} />
        </span>
        <span className="min-w-0 flex-1 font-sans text-caption" style={{ color: 'var(--ink-2)' }}>
          Rows: what was declared. Columns: what came back. The cell is your call.
        </span>
        <span
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
          style={{ color: 'var(--ink-3)' }}
          aria-hidden
        >
          <Icon name="chevron" size={12} />
        </span>
      </button>

      {open && (
        // Indented under the summary text (icon width + gap) so the key lines
        // up with the sentence it explains, mirroring the matrix rows' pl-5.
        <div id={bodyId} className="mt-stack pl-6 flex flex-col gap-stack">
          {/* auto/1fr so every description starts at the same x whatever the
              widest status label happens to be — computed layout, not a value. */}
          <dl
            className="grid items-baseline gap-x-inline gap-y-stack-tight"
            style={{ gridTemplateColumns: 'auto 1fr' }}
          >
            {OCC_STATUSES.map((s: string) => (
              <React.Fragment key={s}>
                <dt>
                  <Pill variant={OCC_STATUS_TONE[s]} size="sm">
                    {OCC_STATUS_LABEL[s]}
                  </Pill>
                </dt>
                {/* Example recedes one ink step, not two: --ink-4 on --surface-2
                    is ~2.4:1 and fails AA, so --ink-3 is the floor here. */}
                <dd className="font-sans text-caption" style={{ color: 'var(--ink-2)' }}>
                  {MEANING[s]}
                  {EXAMPLE[s] && (
                    <span className="block" style={{ color: 'var(--ink-3)' }}>
                      e.g. {EXAMPLE[s]}
                    </span>
                  )}
                </dd>
              </React.Fragment>
            ))}
          </dl>

          <p className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>
            Every cell is yours to set. These are starting points.
          </p>
        </div>
      )}
    </div>
  );
}

/** The 0-100 band preview. Widths are computed layout, not design values.
 *  Dormant again since the 2026-08-31 grid redesign — kept, not deleted,
 *  per the same pattern as its first retirement (Trello #3 → #67). */
function ThresholdBandPreview({ lo, hi }: { lo: number; hi: number }) {
  const safeLo = Math.max(0, Math.min(100, lo));
  const safeHi = Math.max(safeLo, Math.min(100, hi));
  // Verdicts are a categorical finding, not a severity — so the band uses the
  // verdict palette (blue / yellow / purple), matching the canonical verdict
  // Pill everywhere else, not the clean/warn/risk status palette. The words,
  // though, are this screen's: Config never shows raw verdict wording
  // (Trello #1, reconfirmed by the owner 2026-08-31), so the bands are named
  // through MATRIX_HEADER_LABEL — the same source as the matrix column
  // headers these bands feed.
  const bands = [
    { tone: 'verdict-low', label: MATRIX_HEADER_LABEL['not-rented'], width: safeLo },
    { tone: 'verdict-med', label: MATRIX_HEADER_LABEL['possibly-rented'], width: safeHi - safeLo },
    { tone: 'verdict-high', label: MATRIX_HEADER_LABEL.rented, width: 100 - safeHi },
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
  // "Not sure" resolution: off = silently Owner-occupied; on = the chosen type.
  const [notSureResolve, setNotSureResolve] = React.useState(seed.notSureResolve ?? false);
  const [notSureResolveAs, setNotSureResolveAs] = React.useState<string>(seed.notSureResolveAs ?? 'owner-occupied');
  const [hi, setHi] = React.useState(seedInvalid ? 25 : seed.thresholds.rentedAtOrAbove);
  const [lo, setLo] = React.useState(seedInvalid ? 60 : seed.thresholds.notRentedAtOrBelow);
  // Per-type editable bands. Default mode shows them as one universal set
  // (they start identical); Custom mode lets each declared type diverge, so
  // the state is keyed per type. hi/lo above stay dormant so the saved config
  // shape is unchanged while the mapping onto it is an open owner question.
  // No seedInvalid variant: two boundaries make invalid tiling inexpressible.
  const [bandRows, setBandRows] = React.useState<Record<string, BandRule>>(() =>
    Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_RULE }]))
  );
  // Which type's bar is on screen in Custom mode.
  const [editIntent, setEditIntent] = React.useState('owner-occupied');
  // One section-level switch (client call): off = every type uses the
  // recommended defaults, shown read-only; on = the tabs + editable bars.
  const [bandsCustom, setBandsCustom] = React.useState<boolean>(
    !!(seed.categoryThresholds && Object.keys(seed.categoryThresholds).length)
  );
  // Threshold audit-log drawer. `auditDate` is what the date picker holds;
  // `appliedDate` is what the list actually filters on (updated on Apply), so
  // changing the picker doesn't refilter until the user commits. Default: today.
  const AUDIT_TODAY = '2026-09-01';
  const [auditOpen, setAuditOpen] = React.useState(false);
  const [auditDate, setAuditDate] = React.useState(AUDIT_TODAY);
  const [appliedDate, setAppliedDate] = React.useState(AUDIT_TODAY);
  const auditForDate = THRESHOLD_AUDIT
    .filter((e) => e.at.slice(0, 10) === appliedDate)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  const [matrix, setMatrix] = React.useState(seed.outcomeMatrix);
  const [recurring, setRecurring] = React.useState(seed.recurring);
  const [staleDays, setStaleDays] = React.useState(seed.stalenessDays);
  // AI report — auto-run on red-flagged addresses. Opt-in (off by default)
  // because the deeper report costs more per property, so it's reserved for red.
  const [aiOnRed, setAiOnRed] = React.useState(false);
  // Session timeout — a toggle plus, when on, the idle window as a number + unit.
  const [timeoutOn, setTimeoutOn] = React.useState(seed.sessionTimeout?.enabled ?? false);
  const [timeoutValue, setTimeoutValue] = React.useState(seed.sessionTimeout?.value ?? 30);
  const [timeoutUnit, setTimeoutUnit] = React.useState<string>(seed.sessionTimeout?.unit ?? 'minutes');
  const [openIntent, setOpenIntent] = React.useState<string | null>(defaultOpenIntent);

  // Save flow: confirm → saving → saved. `baseline` is the last-saved snapshot;
  // dirty compares the live values against it so the footer collapses on save.
  const snapshot = () =>
    JSON.stringify({ defaultIntent, notSureResolve, notSureResolveAs, hi, lo, bandRows, bandsCustom, matrix, recurring, staleDays, timeoutOn, timeoutValue, timeoutUnit });
  const [baseline, setBaseline] = React.useState(() =>
    JSON.stringify({
      defaultIntent: seed.defaultIntent,
      notSureResolve: seed.notSureResolve ?? false,
      notSureResolveAs: seed.notSureResolveAs ?? 'owner-occupied',
      hi: seedInvalid ? 25 : seed.thresholds.rentedAtOrAbove,
      lo: seedInvalid ? 60 : seed.thresholds.notRentedAtOrBelow,
      bandRows: Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_RULE }])),
      bandsCustom: !!(seed.categoryThresholds && Object.keys(seed.categoryThresholds).length),
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

  // One edit path: set a declare-confidence minimum for a type. The 51–100
  // clamp makes overlap impossible, so nothing validates or gates Save.
  const setRule = (intent: string, field: 'needsReviewMin' | 'consistentMin', n: number) =>
    setBandRows((rows) => ({ ...rows, [intent]: { ...rows[intent], [field]: n } }));
  const dirty = forceDirty || snapshot() !== baseline;

  const Prompt = ReactRouterDOM?.Prompt;

  function discard() {
    const b = JSON.parse(baseline);
    setDefaultIntent(b.defaultIntent);
    setNotSureResolve(b.notSureResolve);
    setNotSureResolveAs(b.notSureResolveAs);
    setHi(b.hi);
    setLo(b.lo);
    setBandRows(b.bandRows ?? Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_RULE }])));
    setBandsCustom(!!b.bandsCustom);
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
      try {
        localStorage.setItem('to-sessionTimeout', JSON.stringify({
          enabled: timeoutOn, value: timeoutValue, unit: timeoutUnit,
        }));
        window.dispatchEvent(new Event('to-timeout-changed'));
      } catch (_) {}
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
    {Prompt && <Prompt when={dirty} message="You have unsaved configuration changes. Leave this page?" />}
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
          // "Not sure" has no declared baseline: it is resolved to a real type
          // for scoring — the chosen type when the toggle is on, else
          // Owner-occupied (silently). Its pills reflect that resolved type; it
          // has no editable outcomes of its own.
          const isNotSure = intent === 'not-sure';
          const sourceIntent = isNotSure
            ? (notSureResolve ? notSureResolveAs : 'owner-occupied')
            : intent;
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
                  // "Not sure" with the toggle OFF is neutral — we don't surface
                  // the silent Owner-occupied fallback as coloured outcomes.
                  if (isNotSure && !notSureResolve) {
                    return (
                      <span key={v} className="font-sans text-caption text-ink-3" aria-hidden>
                        —
                      </span>
                    );
                  }
                  const status = matrix[sourceIntent][v];
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
                  {isNotSure ? (
                    <>
                      <Toggle
                        checked={notSureResolve}
                        onChange={setNotSureResolve}
                        label="Resolve “Not sure” as a specific occupancy type"
                      />
                      {notSureResolve && (
                        <ChipRow
                          label="Treat “Not sure” as"
                          value={notSureResolveAs}
                          onChange={setNotSureResolveAs}
                          options={OCC_INTENTS.filter((i: string) => i !== 'not-sure').map((i: string) => ({
                            value: i,
                            label: OCC_INTENT_LABEL[i],
                          }))}
                        />
                      )}
                    </>
                  ) : (
                    OCC_VERDICTS.map((v: string) => (
                      <ChipRow
                        key={v}
                        label={`If ${(MATRIX_HEADER_LABEL[v] ?? OCC_VERDICT_LABEL[v]).toLowerCase()}, treat as`}
                        value={matrix[intent][v]}
                        onChange={(next: string) => setCell(intent, v, next)}
                        options={OCC_STATUSES.map((s: string) => ({
                          value: s,
                          label: OCC_STATUS_LABEL[s],
                        }))}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        <MatrixLegend matrix={matrix} />
      </ConfigSection>

      {/* ---- 2. Confidence thresholds — RE-INSTATED ----
           ⚠ REVERSAL, recorded not hidden. This card was previously pulled
           from the UI at the owner's request; the `thresholds` (hi/lo), the
           validation and ThresholdBandPreview were all left dormant rather
           than deleted, which is why bringing it back is a re-wire and not a
           rebuild.

           Brought back on the client's own ask in the weekly of 2026-08-27.
           Jim McGowan: "would that be just putting bounds around like from 0
           to 10%, ignore it — somebody might say anything from 20 to 80% is
           up in the air, and somebody else might say 60 to 40". Erin Walker:
           "they want to set a confidence score to get to that … I think we
           could look at that too." Every example they gave is a different
           hi/lo pair on the existing two-threshold model, so the model is
           unchanged — only the control returns.

           Redesigned Aug–Sep 2026 (see the BandRule block above): each type is
           set by two declare-confidence questions (flag
           Needs review at X%, declare Consistent at Y%); Inconclusive is the
           computed remainder and never asked. Default mode restates the shared
           defaults read-only; Custom mode gives each type its own two numbers.
           An Audit-log CTA (headerRight) opens a dated drawer of past changes.
           ThresholdBandPreview stays dormant below. */}
      <ConfigSection
        title="Confidence thresholds"
        desc="How a confidence score becomes a result. Off applies the recommended defaults; on lets you tune the bands for each declared type."
        headerRight={
          <Button
            variant="default"
            size="sm"
            icon={<Icon name="history" />}
            onClick={() => setAuditOpen(true)}
          >
            Audit log
          </Button>
        }
      >
        {/* Same toggle pattern as every other switch on this screen (AI report,
            Session timeout): bold label + muted description, switch on the
            left. Off = recommended defaults; on = custom per-type ranges. */}
        <Toggle
          checked={bandsCustom}
          onChange={(v: boolean) => setBandsCustom(v)}
          label="Custom ranges"
          description="If this is off, the recommended default ranges apply. Turn it on to set your own ranges for each declared type."
        />

        <div className="mt-stack-md">
          {bandsCustom ? (
            (() => {
              // Custom mode: two declare-confidence questions per type, plus a
              // read-only preview of the bands they produce. Inconclusive is
              // never asked — the info line says so.
              const rule = bandRows[editIntent];
              const matchRented = intentMatchIsRented(editIntent, notSureResolve ? notSureResolveAs : 'owner-occupied');
              const copy = declareCopy(editIntent, matchRented);
              return (
                <>
                  {/* Four declared types as real tabs. */}
                  <Tabs
                    value={editIntent}
                    onChange={(v: string) => setEditIntent(v)}
                    items={OCC_INTENTS.map((i: string) => ({ value: i, label: OCC_INTENT_LABEL[i] }))}
                  />
                  <p className="font-sans text-caption m-0 mt-stack" style={{ color: 'var(--ink-2)' }}>
                    {matchMeaningLine(editIntent, matchRented)}
                  </p>

                  {/* Two questions, side by side, narrow fields. */}
                  <div className="flex flex-wrap gap-x-section-sub gap-y-stack-md mt-stack-md">
                    <div className="w-[240px]">
                      <Input
                        label="Flag Needs review at"
                        type="number"
                        min={51}
                        max={100}
                        step={1}
                        value={String(rule.needsReviewMin)}
                        hint={copy.nrHelper}
                        trailing={<span className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>%</span>}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRule(editIntent, 'needsReviewMin', clamp51to100(e.target.value))}
                      />
                    </div>
                    <div className="w-[240px]">
                      <Input
                        label="Declare Consistent at"
                        type="number"
                        min={51}
                        max={100}
                        step={1}
                        value={String(rule.consistentMin)}
                        hint={copy.consHelper}
                        trailing={<span className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>%</span>}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRule(editIntent, 'consistentMin', clamp51to100(e.target.value))}
                      />
                    </div>
                  </div>

                  <p className="font-sans text-micro text-ink-3 leading-relaxed m-0 mt-stack-md">
                    Anything that clears neither bar is Inconclusive. TrueOccupancy decides that on its
                    own, so there is nothing to set. These apply to {OCC_INTENT_LABEL[editIntent]} only, on
                    future scans; completed scans keep the settings they ran under.
                  </p>
                </>
              );
            })()
          ) : (
            <DefaultsInfo notSureResolveAs={notSureResolve ? notSureResolveAs : 'owner-occupied'} />
          )}
        </div>
      </ConfigSection>

      {/* ---- Threshold change audit log (side drawer) ---- */}
      <Drawer
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        title="Threshold change log"
        width={440}
      >
        <div className="flex flex-col gap-stack-md">
          <p className="font-sans text-caption m-0" style={{ color: 'var(--ink-3)' }}>
            Thresholds change over time, so the same score can read differently by date. Pick a date
            to see the changes made that day.
          </p>

          {/* Date picker (single date, defaults to today) + Apply. */}
          <div className="flex items-end gap-stack">
            <div className="w-[180px]">
              <Input
                label="Date"
                type="date"
                max={AUDIT_TODAY}
                value={auditDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAuditDate(e.target.value)}
              />
            </div>
            <Button variant="default" size="md" onClick={() => setAppliedDate(auditDate)}>
              Apply
            </Button>
          </div>

          <div className="border-t border-line pt-stack-md">
            <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-stack" style={{ color: 'var(--ink-3)' }}>
              {formatUsDate(`${appliedDate}T00:00:00`)}
            </div>

            {auditForDate.length === 0 ? (
              <p className="font-sans text-caption m-0" style={{ color: 'var(--ink-3)' }}>
                No changes on this date. The settings in effect were unchanged since the previous edit.
              </p>
            ) : (
              <ol className="list-none m-0 p-0 flex flex-col gap-stack-md">
                {auditForDate.map((ev, i) => (
                  <li key={i} className="relative pl-4 border-l-2 border-line">
                    <div className="flex items-baseline gap-inline">
                      <span className="font-mono tabular-nums text-caption font-semibold" style={{ color: 'var(--navy)' }}>
                        {ev.at.slice(11)}
                      </span>
                      <span className="font-sans text-micro" style={{ color: 'var(--ink-3)' }}>
                        {ev.actor}
                      </span>
                    </div>
                    <ul className="list-none m-0 mt-1 p-0 flex flex-col gap-stack-tight">
                      {ev.changes.map((c, j) => (
                        <li key={j} className="font-sans text-caption" style={{ color: 'var(--ink-2)' }}>
                          <span style={{ color: 'var(--ink)' }}>{c.label}</span>
                          <span className="mx-1 tabular-nums" style={{ color: 'var(--ink-3)' }}>
                            {c.from}
                          </span>
                          <span aria-hidden style={{ color: 'var(--ink-4)' }}>→</span>
                          <span className="ml-1 tabular-nums font-medium" style={{ color: 'var(--navy)' }}>
                            {c.to}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Drawer>

      {/* ---- AI report — auto-run on red ---- */}
      <ConfigSection
        title="AI report"
        desc="The deeper occupancy report that settles who actually lives at a property."
      >
        <Toggle
          checked={aiOnRed}
          onChange={setAiOnRed}
          label="Auto-run the AI report on red-flagged addresses"
          description="Any address that comes back red, whether from a single scan or inside a batch, automatically gets the deeper AI report. Everything else stays on demand. Off by default: the report costs more per property, so it's reserved for red."
        />
        <p className="font-sans text-micro text-ink-3 leading-relaxed m-0">
          Applies to single scans and batch runs. Any property can still be run immediately with “Run now”.
        </p>
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
              Applies org-wide. 30 minutes is typical, but set whatever your policy requires.
            </p>
          </div>
        )}
      </ConfigSection>

      {/* ---- Footer: impact preview + save ---- */}
      {dirty && (
        <Card padded className="mt-section-sub sticky bottom-0 z-sticky">
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
                  Do you want to keep the changes?
                </p>
              </div>
            </div>
            <div className="flex gap-inline">
              <Button variant="default" onClick={discard}>Discard</Button>
              <Button
                variant="primary"
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
              Configuration saved.
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
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <p className="font-sans text-body-sm" style={{ color: 'var(--ink-2)' }}>
          Save the current configuration?
        </p>
      </Modal>
    </div>
    </AppShell>
  );
}
