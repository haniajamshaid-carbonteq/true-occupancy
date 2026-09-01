/* global React, ReactRouterDOM, AppShell, AppStateContext, Card, ChipRow, Input, Toggle, Button, Pill, Modal,
   DropdownMenu, Icon, ScreenEmpty, OCC_INTENTS, OCC_VERDICTS, OCC_STATUSES, OCC_INTENT_LABEL,
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

// ---- Confidence-threshold bands (client direction, 2026-08/09) ----------
// The thresholds section is a 0–100 bar whose coloured segments ARE the
// ranges. Two draggable boundaries split it into three (so the ranges tile
// 0–100 BY CONSTRUCTION — gaps/overlaps are inexpressible and there is no
// validation), and each segment can be reassigned to a different result.
// Default mode shows one shared set of bands read-only; Custom mode gives
// each declared type its own editable bar.
//
// Screen-local design prototype: `bandRows` are not yet part of OccConfig.
// Recorded-not-resolved owner questions live on the Trello cards: how this
// maps onto thresholds + outcomeMatrix (#76), and wiring it to the verdict
// (#75). hi/lo stay dormant on state so the saved shape is unchanged.
//
// Tones are the SAME status tokens the Outcome-matrix pills use, so the two
// sections stay colour-consistent by construction: Consistent=green→clean,
// Needs review=red→risk, Inconclusive=yellow→warn. Status words on status
// tones — this strip describes outcomes, not raw verdicts.
const OUTCOME_META: Record<string, { label: string; tone: string }> = {
  consistent: { label: 'Consistent', tone: 'clean' },
  needsReview: { label: 'Needs review', tone: 'risk' },
  inconclusive: { label: 'Inconclusive', tone: 'warn' },
};
const OUTCOME_KEYS = ['consistent', 'needsReview', 'inconclusive'];

/** One row = which outcome sits in each of the three score positions, plus
 *  the two boundaries. b1 ends the first range; b2 starts the last — so the
 *  ranges are 0–b1, (b1+1)–(b2−1), b2–100. */
type BandRow = { order: [string, string, string]; b1: number; b2: number };

// Recommended default band, applied to every declared type to start: a
// contradiction reads low (Needs review 0–30), the ambiguous middle is
// Inconclusive (31–69), a match reads high (Consistent 70–100). The score is
// "confidence the finding matches the declaration"; the flip lives in what a
// match MEANS (rented for a rental, not rented for owner-occupied), not in
// the layout. Default (off) mode shows this one shared set; Custom (on) mode
// lets each type diverge from it. See intentMatchIsRented / matchMeaningLine.
const DEFAULT_BAND_ROW: BandRow = { order: ['needsReview', 'inconclusive', 'consistent'], b1: 30, b2: 70 };

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

/** The three ranges a row resolves to, in score order. */
function bandRowRanges(row: BandRow): { key: string; from: number; to: number }[] {
  return [
    { key: row.order[0], from: 0, to: row.b1 },
    { key: row.order[1], from: row.b1 + 1, to: row.b2 - 1 },
    { key: row.order[2], from: row.b2, to: 100 },
  ];
}

/** One declared type's control. The design is built around the point the
 *  client raised (2026-08-31): the SCORE AXIS 0→100 is the only fixed thing;
 *  which outcome occupies which part of it is the editable decision and has
 *  NO canonical order — Owner-occupied puts Consistent low, a rental puts it
 *  high. So each of the three segments carries its outcome as an in-place
 *  DropdownMenu (a real registered primitive), never a fixed label, and the
 *  bar is the score axis itself.
 *
 *  Two draggable, keyboard-operable boundaries (role=slider, arrows ±1) split
 *  the axis. Clamps keep 0 ≤ b1 ≤ b2−2 ≤ 98 so the middle range always
 *  exists — invalid tiling is not expressible, so nothing here validates or
 *  gates Save. Reassigning an outcome swaps it with wherever it currently
 *  sits, so all three stay present and contiguous. */
function OutcomeBandStrip({
  row,
  onReassign,
  onChangeB1,
  onChangeB2,
}: {
  row: BandRow;
  onReassign: (idx: number, outcome: string) => void;
  onChangeB1: (n: number) => void;
  onChangeB2: (n: number) => void;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const segs = bandRowRanges(row);
  const widths = [row.b1, row.b2 - row.b1, 100 - row.b2];

  const clampB1 = (n: number) => Math.max(0, Math.min(row.b2 - 2, n));
  const clampB2 = (n: number) => Math.max(row.b1 + 2, Math.min(100, n));

  function beginDrag(which: 'b1' | 'b2') {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const move = (ev: PointerEvent) => {
        const pct = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
        if (which === 'b1') onChangeB1(clampB1(pct));
        else onChangeB2(clampB2(pct));
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  }

  function keyAdjust(which: 'b1' | 'b2') {
    return (e: React.KeyboardEvent) => {
      const delta =
        e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : 0;
      if (!delta) return;
      e.preventDefault();
      if (which === 'b1') onChangeB1(clampB1(row.b1 + delta));
      else onChangeB2(clampB2(row.b2 + delta));
    };
  }

  const handles: { which: 'b1' | 'b2'; value: number; clamp: (n: number) => number; onChange: (n: number) => void }[] = [
    { which: 'b1', value: row.b1, clamp: clampB1, onChange: onChangeB1 },
    { which: 'b2', value: row.b2, clamp: clampB2, onChange: onChangeB2 },
  ];

  return (
    <div>
      {/* The bar IS the 0–100 score axis. overflow-visible so a segment's
          outcome menu can escape the track; corners are rounded per-segment
          and the outline is a ring (no clip). */}
      <div ref={trackRef} className="relative flex h-14 rounded-xl ring-1 ring-inset ring-line">
        {segs.map((s, i) => {
          const meta = OUTCOME_META[s.key];
          const round = i === 0 ? 'rounded-l-xl' : i === segs.length - 1 ? 'rounded-r-xl' : '';
          const narrow = widths[i] < 22;
          return (
            <div
              key={i}
              className={`relative grid place-items-center bg-${meta.tone}-soft ${round}`}
              style={{ width: `${widths[i]}%` }}
            >
              <DropdownMenu
                align="start"
                menuWidth="w-44"
                title="This range counts as"
                trigger={(open: boolean) => (
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-sans text-caption font-semibold cursor-pointer transition-colors hover:bg-white/40 ${
                      open ? 'bg-white/50' : ''
                    }`}
                    style={{ color: `var(--${meta.tone}-ink)` }}
                    title={`${meta.label} · scores ${s.from}–${s.to}`}
                  >
                    {!narrow && <span className="truncate">{meta.label}</span>}
                    <span
                      className={`inline-flex shrink-0 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
                      aria-hidden
                    >
                      <Icon name="chevron" size={12} />
                    </span>
                  </span>
                )}
                items={OUTCOME_KEYS.map((k: string) => ({
                  label: OUTCOME_META[k].label,
                  icon:
                    k === s.key ? (
                      <span className="[&>svg]:w-4 [&>svg]:h-4" style={{ color: 'var(--brand)' }}>
                        <Icon name="check" size={16} />
                      </span>
                    ) : (
                      <span className={`inline-block w-2.5 h-2.5 rounded-full bg-${OUTCOME_META[k].tone}`} />
                    ),
                  onClick: () => onReassign(i, k),
                }))}
              />
              {/* Score span, small, under the label — reads which part of the
                  axis this outcome owns. */}
              {!narrow && (
                <span
                  className="absolute bottom-1.5 font-sans text-micro tabular-nums pointer-events-none"
                  style={{ color: `var(--${meta.tone}-ink)`, opacity: 0.7 }}
                >
                  {s.from}–{s.to}
                </span>
              )}
            </div>
          );
        })}

        {handles.map((h) => (
          <div
            key={h.which}
            role="slider"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={h.value}
            aria-label={
              h.which === 'b1'
                ? `Boundary between ${OUTCOME_META[row.order[0]].label} and ${OUTCOME_META[row.order[1]].label}`
                : `Boundary between ${OUTCOME_META[row.order[1]].label} and ${OUTCOME_META[row.order[2]].label}`
            }
            onPointerDown={beginDrag(h.which)}
            onKeyDown={keyAdjust(h.which)}
            className="absolute top-0 h-full w-5 -translate-x-1/2 flex items-center justify-center cursor-col-resize group focus:outline-none"
            style={{ left: `${h.value}%` }}
          >
            {/* A real slider grip: a rounded pill riding the boundary, with a
                subtle grabber, lifting to brand on hover/focus. */}
            <div
              className="h-9 w-1.5 rounded-full bg-white shadow-md ring-1 ring-line-strong group-hover:ring-brand group-focus-visible:ring-2 group-focus-visible:ring-brand transition-shadow"
              style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.18)' }}
            />
          </div>
        ))}
      </div>

      {/* The axis scale: fixed 0 and 100 ends, and the two live boundary
          values as compact inputs under their handles — the precise,
          accessible edit path that mirrors the drag. */}
      <div className="relative h-9 mt-2">
        <span className="absolute left-0 top-1 font-sans text-micro" style={{ color: 'var(--ink-4)' }}>
          0 · contradicts declaration
        </span>
        <span className="absolute right-0 top-1 font-sans text-micro" style={{ color: 'var(--ink-4)' }}>
          matches declaration · 100
        </span>
        {handles.map((h) => (
          <span
            key={h.which}
            className="absolute top-0 w-[64px] -translate-x-1/2"
            style={{ left: `${Math.max(7, Math.min(93, h.value))}%` }}
          >
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={String(h.value)}
              aria-label={h.which === 'b1' ? 'First boundary' : 'Second boundary'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => h.onChange(h.clamp(clamp0to100(e.target.value)))}
            />
          </span>
        ))}
      </div>
    </div>
  );
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
  const ranges = bandRowRanges(DEFAULT_BAND_ROW);
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
          {/* The universal bands, stated once. */}
          <p className="font-sans text-micro m-0 mb-1" style={{ color: 'var(--ink-3)' }}>
            One set of bands applies to every declared type:
          </p>
          <div className="flex flex-wrap gap-x-stack gap-y-stack-tight">
            {ranges.map((s, i) => {
              const meta = OUTCOME_META[s.key];
              return (
                <span key={i} className="inline-flex items-center gap-inline">
                  <span className={`inline-block w-2 h-2 rounded-full bg-${meta.tone}`} aria-hidden />
                  <span className="font-sans text-caption font-medium" style={{ color: 'var(--ink)' }}>
                    {meta.label}
                  </span>
                  <span className="font-sans text-caption tabular-nums" style={{ color: 'var(--ink-3)' }}>
                    {s.from}–{s.to}
                  </span>
                </span>
              );
            })}
          </div>
          {/* Only the meaning differs per type. */}
          <p className="font-sans text-micro m-0 mt-stack mb-1" style={{ color: 'var(--ink-3)' }}>
            Only the score is flipped per type, so a match always reads high. What a match means:
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
  const [bandRows, setBandRows] = React.useState<Record<string, BandRow>>(() =>
    Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_ROW }]))
  );
  // Which type's bar is on screen in Custom mode.
  const [editIntent, setEditIntent] = React.useState('owner-occupied');
  // One section-level switch (client call): off = every type uses the
  // recommended defaults, shown read-only; on = the tabs + editable bars.
  const [bandsCustom, setBandsCustom] = React.useState<boolean>(
    !!(seed.categoryThresholds && Object.keys(seed.categoryThresholds).length)
  );
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
      bandRows: Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_ROW }])),
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

  // Universal-band edits. Boundaries clamp inside the strip; reassigning a
  // segment SWAPS outcomes so each of the three is always used exactly once —
  // validity is structural, nothing gates Save. (occThresholdError still
  // guards the dormant hi/lo pair at the state level but no longer gates this
  // screen.)
  const setRowBoundary = (intent: string, which: 'b1' | 'b2', n: number) =>
    setBandRows((rows) => ({ ...rows, [intent]: { ...rows[intent], [which]: n } }));
  const reassignSegment = (intent: string, idx: number, outcome: string) =>
    setBandRows((rows) => {
      const r = rows[intent];
      const from = r.order.indexOf(outcome as any);
      if (from === idx || from < 0) return rows;
      const order = [...r.order] as BandRow['order'];
      order[from] = order[idx];
      order[idx] = outcome;
      return { ...rows, [intent]: { ...r, order } };
    });
  const dirty = forceDirty || snapshot() !== baseline;

  const Prompt = ReactRouterDOM?.Prompt;

  function discard() {
    const b = JSON.parse(baseline);
    setDefaultIntent(b.defaultIntent);
    setNotSureResolve(b.notSureResolve);
    setNotSureResolveAs(b.notSureResolveAs);
    setHi(b.hi);
    setLo(b.lo);
    setBandRows(b.bandRows ?? Object.fromEntries(OCC_INTENTS.map((i: string) => [i, { ...DEFAULT_BAND_ROW }])));
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

           Redesigned again on the client's direction of 2026-08-31: one
           infographic strip per declared type — see the OUTCOME_META /
           OutcomeBandStrip block above for the full design record,
           including the two recorded-not-resolved owner questions (mapping
           onto the saved config; Not sure vs the resolve-as toggle).
           ThresholdBandPreview stays dormant below. */}
      <ConfigSection
        title="Confidence thresholds"
        desc="How a confidence score becomes a result. Off applies the recommended defaults; on lets you tune the bands for each declared type."
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
              // Custom mode: each declared type has its own editable bar, so a
              // type can diverge from the shared default (e.g. a rental that
              // needs a higher score to read Consistent). The scale is neutral
              // (contradicts ↔ matches); the meaning line says what a match is.
              const matchRented = intentMatchIsRented(editIntent, notSureResolve ? notSureResolveAs : 'owner-occupied');
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
                  <div className="mt-stack">
                    <OutcomeBandStrip
                      row={bandRows[editIntent]}
                      onReassign={(i: number, k: string) => reassignSegment(editIntent, i, k)}
                      onChangeB1={(n: number) => setRowBoundary(editIntent, 'b1', n)}
                      onChangeB2={(n: number) => setRowBoundary(editIntent, 'b2', n)}
                    />
                  </div>
                  <p className="font-sans text-micro text-ink-3 leading-relaxed m-0 mt-stack">
                    These ranges apply to {OCC_INTENT_LABEL[editIntent]} only. The three bands always
                    cover 0 to 100. Changes apply to future scans only: completed scans keep the ranges
                    they ran under.
                  </p>
                </>
              );
            })()
          ) : (
            <DefaultsInfo notSureResolveAs={notSureResolve ? notSureResolveAs : 'owner-occupied'} />
          )}
        </div>
      </ConfigSection>

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
