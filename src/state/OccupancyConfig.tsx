/* global */
// Occupancy configuration — the org-level rules that turn a raw confidence
// score into a verdict, and a verdict + declaration into an address status.
//
// The whole point of this file is that NOTHING here is hardcoded policy. A
// scan stores only two things: the raw `confidence` and the `configVersion`
// in effect when it ran. Verdict and status are derived at read time against
// that version — so editing a threshold today never rewrites a report a
// lender already attached to a closing file.
//
// Three layers, in the order they apply:
//   1. defaultIntent      — what we assume when nobody says otherwise
//   2. thresholds         — where confidence stops being one verdict and
//                           becomes the next (optionally per category)
//   3. outcomeMatrix      — declared x verdict -> red / yellow / green
//
// Naming note: every export here is prefixed `OCC_` / `Occ` or otherwise
// distinct from src/state/AppState.tsx. Both files share one global scope
// (no bundler), so a colliding top-level const is a hard runtime error.

// ---- Vocabulary ---------------------------------------------------------

// What the loan/policy says the property should be. Four categories, all
// configurable in the matrix — including 'not-sure', which is only inert if
// the matrix says it is.
type OccIntent = 'owner-occupied' | 'second-home' | 'rental' | 'not-sure';

// What the scan found. Categorical and non-judgemental — a verdict is a
// finding, never a pass/fail. Never colour these directly; colour the
// status they resolve to.
type OccVerdict = 'not-rented' | 'possibly-rented' | 'rented';

// Whether the finding contradicts the declaration. THIS is the actionable,
// colourable layer.
type OccStatus = 'green' | 'yellow' | 'red';

// How hard we work before returning a verdict. 'deep-ambiguous' spends the
// expensive image-match / full-web-search budget only on yellow results.
type OccDepth = 'standard' | 'deep-ambiguous' | 'deep-always';

const OCC_INTENTS: OccIntent[] = ['owner-occupied', 'second-home', 'rental', 'not-sure'];
const OCC_VERDICTS: OccVerdict[] = ['not-rented', 'possibly-rented', 'rented'];
const OCC_STATUSES: OccStatus[] = ['green', 'yellow', 'red'];

const OCC_INTENT_LABEL: Record<OccIntent, string> = {
  'owner-occupied': 'Owner-occupied',
  'second-home': 'Second home',
  rental: 'Rental / investment',
  'not-sure': 'Not sure',
};

// Short forms for table cells and chips, where the full label wraps.
const OCC_INTENT_SHORT: Record<OccIntent, string> = {
  'owner-occupied': 'Owner-occupied',
  'second-home': 'Second home',
  rental: 'Rental',
  'not-sure': 'Not sure',
};

const OCC_VERDICT_LABEL: Record<OccVerdict, string> = {
  'not-rented': 'Not rented',
  'possibly-rented': 'Possibly rented',
  rented: 'Rented',
};

const OCC_STATUS_LABEL: Record<OccStatus, string> = {
  green: 'Green',
  yellow: 'Yellow',
  red: 'Red',
};

// Status -> the existing clean/warn/risk palette. The status layer IS the
// brand's severity layer, so it reuses those tokens rather than inventing a
// fourth colour family. Verdict tones stay separate and uncoloured.
const OCC_STATUS_TONE: Record<OccStatus, 'clean' | 'warn' | 'risk'> = {
  green: 'clean',
  yellow: 'warn',
  red: 'risk',
};

// ---- Config shape -------------------------------------------------------

interface OccThresholds {
  /** Confidence at or above this = Rented. */
  rentedAtOrAbove: number;
  /** Confidence at or below this = Not rented. Everything between = Possibly. */
  notRentedAtOrBelow: number;
}

type OccCadence = 'weekly' | 'monthly' | 'quarterly' | 'none';

const OCC_CADENCE_LABEL: Record<OccCadence, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  none: 'One-off',
};

interface OccConfig {
  /** Bumped on every save. Scans resolve against the version they ran under. */
  version: number;
  /** Pre-fills every scan, batch and automation. Always overridable. */
  defaultIntent: OccIntent;
  /** How an undeclared ("Not sure") property is resolved for scoring.
   *  Off = silently assume Owner-occupied. On = treat it as `notSureResolveAs`
   *  (one of the three real occupancy types). It never scores as its own row. */
  notSureResolve: boolean;
  notSureResolveAs: OccIntent;
  /** Org-wide bands. */
  thresholds: OccThresholds;
  /** Optional per-category override. Absent = inherit `thresholds`. */
  categoryThresholds: Partial<Record<OccIntent, OccThresholds>>;
  /** declared x verdict -> status. The configurable heart of the product. */
  outcomeMatrix: Record<OccIntent, Record<OccVerdict, OccStatus>>;
  /** Which statuses re-scan, and how often. */
  recurring: Record<OccStatus, OccCadence>;
  /** Days before a served report is flagged stale. */
  stalenessDays: number;
  /** Cost/quality trade-off. */
  depth: OccDepth;
  /** Force-logout after a period of inactivity. Off by default; when on, the
   *  org picks the idle window in minutes (any positive value; 30 is the seed).
   *  Per the client (Jim McGowan): a flip on/off, and if on, "how long", since
   *  policies range from 10 minutes to an hour to never. */
  sessionTimeout: OccSessionTimeout;
}

type OccTimeoutUnit = 'minutes' | 'hours' | 'days';

interface OccSessionTimeout {
  enabled: boolean;
  /** Idle window length, in `unit`s. Any positive number. */
  value: number;
  unit: OccTimeoutUnit;
}

// Shipped defaults. Owner-occupied and second-home start identical but are
// separately editable — whether a seasonal let is legitimate on a second
// home is the lender's policy call, not ours.
//
// The matrix below is the owner's table of 2026-08-10, set so the Config
// screen is already correct for an org that never opens a row. Read the keys
// through the Config column headers: not-rented = CONSISTENT,
// possibly-rented = NEEDS REVIEW, rented = INCONCLUSIVE.
//
// ⚠ That header mapping is the collision recorded on Trello #18: the column
// called NEEDS REVIEW is keyed on `possibly-rented`, so these defaults make a
// *possibly*-rented finding red and a confirmed `rented` finding yellow.
// Deliberate per the owner's table — do not "fix" it here. If #18 ratifies a
// different header mapping, this block moves with it.
const DEFAULT_OCC_CONFIG: OccConfig = {
  // v2 = the 30/70 pair below. v1 banded at ≤20 / ≥80 and survives on seed
  // runs (AppState SEED_THRESHOLDS_V1), so Run history has a real threshold
  // change to show (Trello #73).
  version: 2,
  defaultIntent: 'owner-occupied',
  // Off by default: an undeclared property is silently treated as
  // Owner-occupied. Turn on to resolve it as a specific type instead.
  notSureResolve: false,
  notSureResolveAs: 'owner-occupied',
  thresholds: { rentedAtOrAbove: 70, notRentedAtOrBelow: 30 },
  categoryThresholds: {},
  outcomeMatrix: {
    'owner-occupied': { 'not-rented': 'green', 'possibly-rented': 'red', rented: 'yellow' },
    'second-home': { 'not-rented': 'green', 'possibly-rented': 'red', rented: 'yellow' },
    // Non-owner occupancy is expected here, so nothing this row finds clears
    // the property outright — a Not-rented finding is not fraud, it is absent
    // expected income, which is still worth a look.
    rental: { 'not-rented': 'yellow', 'possibly-rented': 'red', rented: 'yellow' },
    // 'Not sure' mirrors the default intended occupancy (see
    // effectiveOutcomeIntent), so this stored row is only a fallback for the
    // edge case where the default is itself 'not-sure'.
    'not-sure': { 'not-rented': 'yellow', 'possibly-rented': 'red', rented: 'red' },
  },
  recurring: { red: 'monthly', yellow: 'none', green: 'none' },
  stalenessDays: 30,
  depth: 'deep-ambiguous',
  // Off by default — orgs opt in. 30 minutes is the seed the client named as
  // the sensible default once it's turned on; unit is configurable.
  sessionTimeout: { enabled: false, value: 30, unit: 'minutes' },
};

// ---- Derivation (pure) --------------------------------------------------

function occThresholdsFor(config: OccConfig, intent: OccIntent): OccThresholds {
  return config.categoryThresholds[intent] ?? config.thresholds;
}

/** Raw confidence -> verdict, using the bands in force for this category. */
function deriveOccVerdict(confidence: number, config: OccConfig, intent: OccIntent): OccVerdict {
  const t = occThresholdsFor(config, intent);
  if (confidence >= t.rentedAtOrAbove) return 'rented';
  if (confidence <= t.notRentedAtOrBelow) return 'not-rented';
  return 'possibly-rented';
}

// 'Not sure' has no declared baseline of its own, so it is resolved to one of
// the three real occupancy types for scoring: the type chosen when
// `notSureResolve` is on, else Owner-occupied by default (silently). It never
// scores as its own row.
function effectiveOutcomeIntent(config: OccConfig, intent: OccIntent): OccIntent {
  if (intent !== 'not-sure') return intent;
  const as = config.notSureResolve ? config.notSureResolveAs : 'owner-occupied';
  return as === 'not-sure' ? 'owner-occupied' : as;
}

/** Declared x verdict -> status. A pure matrix lookup; 'not-sure' mirrors the default. */
function deriveOccStatus(config: OccConfig, intent: OccIntent, verdict: OccVerdict): OccStatus {
  return config.outcomeMatrix[effectiveOutcomeIntent(config, intent)][verdict];
}

/** The two together — what nearly every consumer actually wants. */
function resolveOccupancy(
  config: OccConfig,
  intent: OccIntent,
  confidence: number
): { verdict: OccVerdict; status: OccStatus } {
  const verdict = deriveOccVerdict(confidence, config, intent);
  return { verdict, status: deriveOccStatus(config, intent, verdict) };
}

// ---- Reconciliation label — the ONE display of "declared vs found" ------
// Every card, table and result page shows THIS instead of the raw verdict.
// It is the outcomeMatrix status (green/yellow/red) relabelled. Deliberately
// non-absolute wording — "Consistent" (not "Decisive": we can't guarantee
// certainty), "Inconclusive", "Needs review". Colours reuse the existing
// status tokens via OCC_STATUS_TONE (no new colour family). "Needs review"
// IS the red tier — the Red-flag flow is the same value, filtered to red.
const OCC_STATUS_MATCH_LABEL: Record<OccStatus, string> = {
  green: 'Consistent',
  yellow: 'Inconclusive',
  red: 'Needs review',
};

// Existing app rows carry `risk` (clean/warn/risk) / scenario, not OccVerdict.
// This is the 1:1 bridge to the config's verdict vocabulary.
const RISK_TO_OCC_VERDICT: Record<'clean' | 'warn' | 'risk', OccVerdict> = {
  clean: 'not-rented',
  warn: 'possibly-rented',
  risk: 'rented',
};

interface OccMatch {
  status: OccStatus;                 // green | yellow | red
  label: string;                     // Consistent | Inconclusive | Needs review
  tone: 'clean' | 'warn' | 'risk';   // Pill variant / colour
  verdict: OccVerdict;               // the raw finding, for the "why" line
}

// (declared intent, observed risk) -> the reconciliation shown everywhere.
// An absent intent falls back to 'not-sure', which mirrors the org's default
// intended occupancy — so undeclared scans reconcile exactly like the default
// type (and CAN be "Needs review"). Returns null only when the row hasn't been
// scanned yet (no risk).
function occMatchForRisk(
  intent: OccIntent | undefined,
  risk: 'clean' | 'warn' | 'risk' | undefined,
  config: OccConfig = DEFAULT_OCC_CONFIG
): OccMatch | null {
  if (!risk) return null;
  const verdict = RISK_TO_OCC_VERDICT[risk];
  const status = deriveOccStatus(config, intent || 'not-sure', verdict);
  return { status, label: OCC_STATUS_MATCH_LABEL[status], tone: OCC_STATUS_TONE[status], verdict };
}

/** Thresholds are invalid if the bands cross or leave no middle band.
 *  Messages name positions ("lower"/"upper"), not band names: they surface on
 *  the Config screen, which never shows raw verdict wording (Trello #1), and
 *  that screen's reconciliation words are scoped to it — state stays neutral. */
function occThresholdError(t: OccThresholds): string | null {
  const { rentedAtOrAbove: hi, notRentedAtOrBelow: lo } = t;
  if (!Number.isFinite(hi) || !Number.isFinite(lo)) return 'Both thresholds need a number.';
  if (lo < 0 || hi > 100) return 'Thresholds sit between 0 and 100.';
  if (lo >= hi) return 'The lower threshold has to sit below the upper one.';
  if (hi - lo < 2) return 'Leave at least 2 points between the thresholds for the middle band.';
  return null;
}

// ---- Confidence display -------------------------------------------------

// No confidence percentage ever reads 100% or 0% on any surface.
//
// Client call (Jim McGowan, weekly of 2026-08-27, ratified by Erin Walker):
// "hedge our bet on the 100 — make it 1 to 99. There's always some chance we
// miss something." A property can carry an off-platform rental arrangement
// that will not surface in any source we scrape for six months to a year, so
// a displayed 100% is a claim the product cannot stand behind. The same
// hedge binds the floor.
//
// DISPLAY ONLY. The raw score still drives deriveOccVerdict and every
// threshold comparison — clamping the stored value would move addresses
// across band boundaries and silently change what is red.
//
// ⚠ Collision with Trello #57 (History Confidence column, 0-score rows). That
// ticket asks what a confidence of 0 means before choosing its treatment; the
// floor here answers it as "1" by display convention rather than by product
// decision. If #57 rules that 0 is a real, distinct value that must render as
// zero, OCC_CONFIDENCE_FLOOR moves to 0 and #57's chosen empty-state handles
// it instead. Do not resolve that ticket by pointing at this constant.
const OCC_CONFIDENCE_FLOOR = 1;
const OCC_CONFIDENCE_CEILING = 99;

/** Clamp a 0-100 confidence to the band the product is willing to display. */
function displayConfidence(n: number): number {
  if (!Number.isFinite(n)) return OCC_CONFIDENCE_FLOOR;
  return Math.min(OCC_CONFIDENCE_CEILING, Math.max(OCC_CONFIDENCE_FLOOR, Math.round(n)));
}

// ---- Timestamps ---------------------------------------------------------

// US-style display, per the client. Every numeric display uses tabular
// figures at the call site (DESIGN.md §13.5).
const OCC_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Jul 31, 2026" */
function formatUsDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${OCC_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Jul 31, 2026 · 2:45 PM" */
function formatUsDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${formatUsDate(iso)} · ${h}:${m} ${suffix}`;
}

/** Whole days between an ISO timestamp and now. */
function occDaysSince(iso: string, now: Date = new Date()): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
}

/** Relative age, no parentheses: "just now" · "4 minutes ago" · "3 hours ago"
 *  · "4 days ago" · "2 weeks ago" · "3 months ago". Pairs with the absolute
 *  date so a report's freshness reads at a glance. */
function formatUsRelative(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const secs = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 1000));
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (secs < 45) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return plural(mins, 'minute');
  const hours = Math.round(mins / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.round(hours / 24);
  if (days < 7) return plural(days, 'day');
  const weeks = Math.round(days / 7);
  if (weeks < 5) return plural(weeks, 'week');
  const months = Math.round(days / 30);
  if (months < 12) return plural(months, 'month');
  return plural(Math.round(days / 365), 'year');
}

// The four states a served report can be in. `servedAt` is always the date
// this ORGANISATION first received the report — never when the underlying
// scan ran. Cross-org cache reuse is invisible by construction.
type OccFreshness = 'fresh' | 'cached' | 'stale' | 'rerunning';

function occFreshness(
  servedAt: string,
  config: OccConfig,
  opts: { rerunning?: boolean; cached?: boolean } = {}
): OccFreshness {
  if (opts.rerunning) return 'rerunning';
  if (occDaysSince(servedAt) > config.stalenessDays) return 'stale';
  return opts.cached ? 'cached' : 'fresh';
}
