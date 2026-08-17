/* global React, DEFAULT_OCC_CONFIG, OCC_INTENT_SHORT */
// AppState — a single source of truth for the three cross-cutting datasets
// the prototype now spans:
//   * live batch (one at a time; running or complete)
//   * history (every completed scan — single or batch summary)
//   * schedules (automations created via the Automate CTA)
//
// Shape rationale:
//   - History is a discriminated union (kind: 'single' | 'batch'). A
//     completed batch lands as ONE summary row (per design call); per-
//     address detail is reachable through the batch view.
//   - Live batch sim: when status === 'running', a 800 ms interval walks
//     the next queued row forward (queued → running → done). On the final
//     transition we emit a history entry and flip status to 'complete'.
//     The /batch route keeps showing it; the home strip hides.
//   - Seed data mirrors the previous hardcoded arrays so the dashboard
//     looks populated on first load.

type Scenario = 'low' | 'medium' | 'high';
type Risk = 'clean' | 'warn' | 'risk';

// Converts an epoch timestamp to a human-relative label ("Just now", "8 min ago", "Yesterday", …).
function timeAgo(ts: number): string {
  const elapsed = Date.now() - ts;
  if (elapsed < 60_000) return 'Just now';
  const min = Math.floor(elapsed / 60_000);
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} h ago`;
  if (hrs < 48) return 'Yesterday';
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 4) return `${weeks} w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(days / 365);
  return `${years} y ago`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
function seedTime(offset: string): number {
  const m = offset.match(/^(\d+)\s*(min|h|d|w|mo|y)$/);
  if (!m) return Date.now();
  const n = parseInt(m[1], 10);
  const units: Record<string, number> = { min: MINUTE, h: HOUR, d: DAY, w: WEEK, mo: MONTH, y: YEAR };
  return Date.now() - n * (units[m[2]] ?? 0);
}

// What fired a scan. A property's timeline mixes both: a person scans an
// address, then an automation keeps re-scanning it on a cadence (or the
// reverse — an officer re-checks a property the schedule already covers).
// Without this the two are indistinguishable in Run history.
type ScanTrigger = 'manual' | 'automation';

interface SingleHistoryEntry {
  id: string;
  kind: 'single';
  address: string;
  scenario: Scenario;
  platforms: number;
  scannedAt: number;
  /** OccConfig.version in effect when this scan ran. Lets verdicts be
   *  re-derived against historical thresholds, not whatever's current. */
  configVersion?: number;
  /** Optional user-supplied identifier (loan #, client ID, case file…)
   *  set at scan-time and editable on the history page. Surfaces on the
   *  PDF certificate header when present. Never replaces our internal UUID
   *  — see CertificateSheet footer. */
  reference?: string;
  /** Declared "as per loan" occupancy captured at scan time, reconciled
   *  against the observed verdict. Absent on scans that predate intake. */
  intent?: IntendedOccupancy;
  /** Who fired this run. 'automation' = a schedule ran it unattended;
   *  absent or 'manual' = a person hit Scan. Surfaces as the zap marker in
   *  RunHistory so a property's timeline reads unambiguously — the same
   *  address can be scanned both ways. Absent is the safe default: every
   *  in-session scan is user-triggered, so only seeded/scheduled runs set it. */
  trigger?: ScanTrigger;
}

interface BatchHistoryEntry {
  id: string;
  kind: 'batch';
  filename: string;
  total: number;
  flagged: number;
  warn: number;
  clean: number;
  /** Number of rows that errored during the scan. */
  failed: number;
  /** Aggregate outcome: complete = no failures, partial = some failures,
   *  failed = every row errored. Drives the History status pill and the
   *  banner CTA copy. */
  status: 'complete' | 'partial' | 'failed';
  scannedAt: number;
  /** Snapshot of the per-address scan rows so the batch-detail page can
   *  render the full table without keeping the LiveBatch around in state. */
  rows: LiveBatchRow[];
  /** User-chosen display name. Defaults to deriveTitleFromFilename(filename)
   *  in the UI when omitted, so older seed entries render naturally without
   *  a migration. Editable inline from the batch results header. */
  title?: string;
  /** Optional free-text description, surfaced on the batch detail page only
   *  (not in list rows). Up to 280 chars; editable inline. */
  description?: string;
  /** Batch-level declared occupancy — applied to any row without its own
   *  intent when reconciling the batch. */
  defaultIntent?: IntendedOccupancy;
  /** Same as SingleHistoryEntry.trigger. Batch re-runs are automation-driven
   *  by definition (only the first upload is manual), so RunHistory states
   *  that once in copy rather than marking every row — see that file. */
  trigger?: ScanTrigger;
}

type HistoryEntry = SingleHistoryEntry | BatchHistoryEntry;

// Cadence is structured (count + unit) so the modal can offer weekly and
// monthly alongside the original 3/4/6/12-month options. Helpers below
// (formatNextRun / cadenceLabel / cadenceShort / sameCadence) are the only
// places that interpret the shape, so display sites stay unit-agnostic.
type CadenceUnit = 'week' | 'month';
interface Cadence {
  every: number;
  unit: CadenceUnit;
}

// Batch retention rule — what happens to a property on a later run once its
// status no longer matches the selected scope.
//   'monitor' — keep re-scanning it anyway (the property stays in the
//               automation; catches cases that go quiet then come back).
//   'remove'  — drop it from future runs once it no longer matches.
// Default is 'monitor'. Single-property schedules don't carry this (their
// scope is implicitly that one address).
type ScopeRetention = 'monitor' | 'remove';

interface SingleScheduleEntry {
  id: string;
  kind: 'single';
  address: string;
  scenario: Scenario;
  cadence: Cadence;
  nextRunLabel: string;
  createdAt: number;
  /** History entry ids for all prior runs of this schedule, newest first.
   *  At minimum holds the originating scan that allowed the user to
   *  automate this address. Empty arrays only occur for legacy seeds. */
  runHistoryIds: string[];
}

interface BatchScheduleEntry {
  id: string;
  kind: 'batch';
  filename: string;
  total: number;
  cadence: Cadence;
  nextRunLabel: string;
  createdAt: number;
  /** History entry ids for all prior runs of this schedule, newest first. */
  runHistoryIds: string[];
  /** Which verdict bands seed the re-scan set. Defaults to ['risk','warn']
   *  ("Rented" + "Possibly Rented"); see DESIGN feedback (Erin, 2026-05-14). */
  statuses: Risk[];
  /** What happens to a property when its status later stops matching the
   *  selected bands. 'monitor' keeps it in the automation; 'remove' drops
   *  it from future runs. Defaults to 'monitor'. */
  retention: ScopeRetention;
  /** Mirrored from the parent batch so list rows and the schedule-detail
   *  header read the user-chosen name instead of the raw filename. The
   *  description does NOT mirror here — it only surfaces on the batch
   *  detail page per the locked design. */
  title?: string;
}

type ScheduleEntry = SingleScheduleEntry | BatchScheduleEntry;

// ---- Intended (declared) occupancy — "as per loan" -----------------------
// The occupancy the loan/policy says a property should be. Captured per
// property (a CSV column on batch upload, or the single-scan intake) and
// reconciled against the OBSERVED verdict so a finding can be judged: does
// what we found contradict what was declared?
type IntendedOccupancy = 'owner-occupied' | 'rental' | 'second-home' | 'not-sure';

// Human labels — shared by the batch "Declared" column and the intake chips.
const INTENDED_OCCUPANCY_LABEL: Record<IntendedOccupancy, string> = {
  'owner-occupied': 'Owner-occupied',
  rental: 'Rental / investment',
  'second-home': 'Second home',
  'not-sure': 'Not sure',
};

// Normalise a raw CSV cell to a canonical value. null = unrecognised (surfaced
// at upload, then falls back to the batch default). Lenient + case/space-
// insensitive; covers free text, single letters, and agency codes (P/S/I,
// Fannie 1/2/3) as they appear in real LOS exports. This is the seam a live
// CSV parser plugs into; the prototype seeds already-canonical values.
function normalizeIntent(raw: string): IntendedOccupancy | null {
  const s = (raw || '').trim().toLowerCase();
  if (!s) return 'not-sure';
  if (['owner-occupied', 'owner occupied', 'owner', 'primary', 'primary residence', 'oo', 'o', 'p', '1'].includes(s)) return 'owner-occupied';
  if (['rental', 'investment', 'investment property', 'investor', 'non-owner', 'nonowner', 'noo', 'i', '3'].includes(s)) return 'rental';
  if (['second-home', 'second home', '2nd home', 'secondary', 'vacation', 'seasonal', 's', '2'].includes(s)) return 'second-home';
  if (['not-sure', 'unknown', 'n/a', 'na', 'tbd', '?'].includes(s)) return 'not-sure';
  return null;
}

// ---- Declared-occupancy resolver (Trello #34) ---------------------------
// The declared twin of occMatchForRisk: one source of truth for "what was
// this address intended as", consumed by every list column and run row.
// Never returns blank — an undeclared address resolves to 'not-sure'.
function resolveIntent(row: { intent?: IntendedOccupancy } | undefined, defaultIntent?: IntendedOccupancy): IntendedOccupancy {
  return row?.intent ?? defaultIntent ?? 'not-sure';
}

// Summarise a batch's declared side for a one-row list cell: every address
// shares one resolved intent → that intent; they differ → 'mixed' with
// per-intent counts (surfaced on hover). Empty rows fall back to the default.
function summarizeBatchIntent(
  rows: Array<{ intent?: IntendedOccupancy }> | undefined,
  defaultIntent?: IntendedOccupancy
): { kind: 'uniform'; intent: IntendedOccupancy; counts: Record<string, number> } | { kind: 'mixed'; counts: Record<string, number> } {
  const counts: Record<string, number> = {};
  (rows || []).forEach((r) => {
    const i = resolveIntent(r, defaultIntent);
    counts[i] = (counts[i] || 0) + 1;
  });
  const keys = Object.keys(counts);
  if (keys.length <= 1) {
    return { kind: 'uniform', intent: (keys[0] as IntendedOccupancy) ?? defaultIntent ?? 'not-sure', counts };
  }
  return { kind: 'mixed', counts };
}

// "8 Owner-occupied · 4 Rental · 2 Not sure" — the hover breakdown for a
// Mixed cell. Sorted by count so the dominant intent leads.
function batchIntentBreakdown(summary: { counts: Record<string, number> }): string {
  return Object.entries(summary.counts)
    .sort((a, b) => b[1] - a[1])
    .map(([i, n]) => `${n} ${OCC_INTENT_SHORT[i as IntendedOccupancy] ?? i}`)
    .join(' · ');
}

// Declared × observed → reconciliation. null when the row isn't scanned yet.
// 'not-sure' has no baseline of its own, so it mirrors the org's default
// intended occupancy (same as the config matrix does). risk:
// 'risk' = Rented (tenants), 'warn' = Possibly rented, 'clean' = Not rented.
type Reconciliation = 'exception' | 'consistent' | 'inconclusive';
function reconcileOccupancy(intent: IntendedOccupancy, risk?: Risk): Reconciliation | null {
  if (!risk) return null;
  // 'Not sure' resolves to a real type (chosen type when notSureResolve is on,
  // else Owner-occupied) — same rule as the config matrix.
  const resolved = DEFAULT_OCC_CONFIG.notSureResolve
    ? DEFAULT_OCC_CONFIG.notSureResolveAs
    : 'owner-occupied';
  const eff: IntendedOccupancy =
    intent === 'not-sure' && resolved !== 'not-sure'
      ? (resolved as IntendedOccupancy)
      : intent;
  if (eff === 'not-sure') return 'inconclusive';
  if (eff === 'rental') {
    // Non-owner occupancy is expected; only a "not rented" reading is unclear.
    return risk === 'clean' ? 'inconclusive' : 'consistent';
  }
  // owner-occupied or second-home: tenants are NOT expected.
  if (risk === 'risk') return 'exception';
  if (risk === 'warn') return 'inconclusive';
  return 'consistent';
}

interface LiveBatchRow {
  id: number;
  address: string;
  status: 'done' | 'running' | 'queued' | 'failed';
  /** Declared "as per loan" occupancy for this property (CSV column on upload
   *  or a per-row edit). Undefined = not declared → the batch default applies
   *  at read time. Reconciled against `risk` once the row is scanned. */
  intent?: IntendedOccupancy;
  score?: number;
  risk?: Risk;
  listings?: number;
  /** Short reason populated when status === 'failed' (e.g. "Geocoder timeout"). */
  errorReason?: string;
  /** Epoch ms when the listing scan last completed (status → done). */
  lastScanAt?: number;
  /** OccConfig.version in effect when this row's scan completed. */
  configVersion?: number;
  /** The agentic AI report for this row — a SECOND, independent lifecycle
   *  layered on top of the occupancy scan. Absent until the user runs AI on
   *  this row (via the batch AI phase or a per-row "run now"). The occupancy
   *  scan verdict (score/risk/listings) and the AI verdict (verdictBand) are
   *  deliberately separate reads — a matched listing can be treated as a
   *  smoking gun OR as a trigger to dig deeper, which is the AI's job. */
  aiReport?: {
    status: 'queued' | 'running' | 'done' | 'failed';
    /** Set when status === 'done'. Reuses the five-band AI vocabulary from
     *  aiInvestigation.tsx (AIVerdictBand). */
    verdictBand?: AIVerdictBand;
    /** Populated when status === 'failed'. */
    errorReason?: string;
    /** Epoch ms when the AI report last completed (status → done). */
    lastAIReportAt?: number;
  };
}

interface LiveBatch {
  id: string;
  filename: string;
  rows: LiveBatchRow[];
  status: 'running' | 'complete';
  startedAt: number;
  /** Declared-occupancy config captured at upload. `defaultIntent` applies to
   *  any row whose `intent` is undefined (blank cell / no column). `intentColumn`
   *  records which CSV column was mapped, for audit. */
  defaultIntent?: IntendedOccupancy;
  intentColumn?: string;
  /** Set true once the user acknowledges the completed-batch notice on
   *  the dashboard. The strip hides; /batch still shows the results. */
  dismissed?: boolean;
  /** ID of the history entry emitted on completion. Lets the banner CTA
   *  deep-link straight to /batch/{id}. */
  historyId?: string;
  /** User-chosen display name, captured at upload time (and editable from
   *  the results header). Falls back to deriveTitleFromFilename(filename)
   *  in the UI when omitted. */
  title?: string;
  /** Optional free-text description captured at upload (and editable from
   *  the results header). Shown only on the batch detail page. */
  description?: string;
  /** The AI-report batch mode. Absent until the user kicks off AI reports on
   *  this batch. Once present, a second worker (mirroring the occupancy sim)
   *  walks the in-scope rows' `aiReport` sub-state queued → running → done.
   *  `scope` records which verdict bands were selected to run — defaults to
   *  ['risk'] (the red-threshold flow), but the trigger offers wider scopes.
   *  AI scheduling / automation is deliberately NOT modelled here — it was
   *  deferred (client call, 2026-07-23); the AI phase is human-triggered. */
  aiPhase?: {
    status: 'running' | 'complete';
    scope: Risk[];
  };
}

// ---- seed data ----------------------------------------------------------
// Mirrors the previous in-page mocks. Older entries trail off so the
// dashboard "6 most recent" cap shows the freshest activity.

// Curated row snapshots for the two seeded batch entries so the batch-
// detail page has something to render before the user has run a batch.
const SEED_BATCH_Q1_ROWS: LiveBatchRow[] = [
  { id: 1,  address: '412 Cumberland Ave, Asheville, NC 28801',   status: 'done', score: 87, risk: 'risk',  listings: 4 },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'done', score: 12, risk: 'clean', listings: 0 },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'done', score: 54, risk: 'warn',  listings: 1 },
  { id: 4,  address: '7 Beaucatcher Rd, Asheville, NC 28805',     status: 'done', score: 76, risk: 'risk',  listings: 3 },
  { id: 5,  address: '23 Tunnel Rd, Asheville, NC 28805',         status: 'done', score: 8,  risk: 'clean', listings: 0 },
  { id: 6,  address: '67 Charlotte Hwy, Asheville, NC 28803',     status: 'done', score: 91, risk: 'risk',  listings: 5 },
  { id: 7,  address: '215 Edgewood Rd, Asheville, NC 28804',      status: 'done', score: 42, risk: 'warn',  listings: 1 },
  { id: 8,  address: '88 Cumberland Ave, Asheville, NC 28801',    status: 'done', score: 18, risk: 'clean', listings: 0 },
  { id: 9,  address: '301 Merrimon Ave, Asheville, NC 28804',     status: 'done', score: 64, risk: 'warn',  listings: 2 },
  { id: 10, address: '450 Patton Ave, Asheville, NC 28806',       status: 'done', score: 71, risk: 'risk',  listings: 2 },
  { id: 11, address: '12 Hillside St, Asheville, NC 28801',       status: 'done', score: 9,  risk: 'clean', listings: 0 },
  { id: 12, address: '156 Sand Hill Rd, Asheville, NC 28806',     status: 'done', score: 33, risk: 'warn',  listings: 1 },
  { id: 13, address: '89 Beverly Rd, Asheville, NC 28805',        status: 'done', score: 22, risk: 'clean', listings: 0 },
  { id: 14, address: '720 Haywood Rd, Asheville, NC 28806',       status: 'done', score: 6,  risk: 'clean', listings: 0 },
  { id: 15, address: '301 Lakeshore Dr, Asheville, NC 28804',     status: 'done', score: 82, risk: 'risk',  listings: 3 },
  { id: 16, address: '44 Pine Cone Ln, Asheville, NC 28803',      status: 'done', score: 51, risk: 'warn',  listings: 1 },
  { id: 17, address: '987 Sunset Pkwy, Asheville, NC 28806',      status: 'done', score: 11, risk: 'clean', listings: 0 },
  { id: 18, address: '50 Ridgeview Ct, Asheville, NC 28805',      status: 'done', score: 88, risk: 'risk',  listings: 4 },
  { id: 19, address: '912 College St, Asheville, NC 28801',       status: 'done', score: 47, risk: 'warn',  listings: 1 },
  { id: 20, address: '24 Beaver Lake Rd, Asheville, NC 28804',    status: 'done', score: 14, risk: 'clean', listings: 0 },
  { id: 21, address: '671 Brevard Rd, Asheville, NC 28806',       status: 'done', score: 19, risk: 'clean', listings: 0 },
  { id: 22, address: '108 Furman Ave, Asheville, NC 28801',       status: 'done', score: 7,  risk: 'clean', listings: 0 },
  { id: 23, address: '215 Reed St, Asheville, NC 28803',          status: 'done', score: 27, risk: 'clean', listings: 0 },
  { id: 24, address: '88 Westwood Pl, Asheville, NC 28806',       status: 'done', score: 16, risk: 'clean', listings: 0 },
];

// Smaller batch with a handful of failed rows — demonstrates the "partial"
// completion state in History.
const SEED_BATCH_PARTIAL_ROWS: LiveBatchRow[] = [
  // Row 1 overrides the batch default (rental) — keeps this seed batch
  // "Mixed" so the declared-summary cell is demonstrable without running one.
  { id: 1, address: '88 Cumberland Ave, Asheville, NC 28801',   status: 'done',   score: 18, risk: 'clean', listings: 0, intent: 'owner-occupied' },
  { id: 2, address: '301 Merrimon Ave, Asheville, NC 28804',    status: 'failed', errorReason: 'Geocoder timeout — retry later' },
  { id: 3, address: '145 Westchester Dr, Asheville, NC 28803',  status: 'done',   score: 76, risk: 'risk',  listings: 3 },
  { id: 4, address: '23 Tunnel Rd, Asheville, NC 28805',        status: 'done',   score: 8,  risk: 'clean', listings: 0 },
  { id: 5, address: '67 Charlotte Hwy, Asheville, NC 28803',    status: 'failed', errorReason: 'Address not found in county records' },
  { id: 6, address: '215 Edgewood Rd, Asheville, NC 28804',     status: 'done',   score: 42, risk: 'warn',  listings: 1 },
  { id: 7, address: '12 Hillside St, Asheville, NC 28801',      status: 'done',   score: 9,  risk: 'clean', listings: 0 },
  { id: 8, address: '450 Patton Ave, Asheville, NC 28806',      status: 'done',   score: 71, risk: 'risk',  listings: 2 },
];

// Every row errored — demonstrates the "failed" completion state in History.
const SEED_BATCH_FAILED_ROWS: LiveBatchRow[] = [
  { id: 1, address: '988 Riverside Dr, Asheville, NC 28801', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
  { id: 2, address: '12 Birch Hollow Ln, Asheville, NC 28804', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
  { id: 3, address: '77 Aston Park Ct, Asheville, NC 28805',  status: 'failed', errorReason: 'Geocoder timeout — retry later' },
  { id: 4, address: '301 Sweeten Creek Rd, Asheville, NC 28803', status: 'failed', errorReason: 'Geocoder timeout — retry later' },
];

const SEED_BATCH_LENDER_ROWS: LiveBatchRow[] = Array.from({ length: 42 }, (_, i) => {
  // Spread to match flagged 9 / warn 8 / clean 25.
  const risk: Risk = i < 9 ? 'risk' : i < 17 ? 'warn' : 'clean';
  const score = risk === 'risk' ? 70 + (i % 25) : risk === 'warn' ? 40 + (i % 20) : 5 + (i % 25);
  return {
    id: i + 1,
    address: `${100 + i * 7} Lender Way, Asheville, NC ${28800 + (i % 7)}`,
    status: 'done' as const,
    score,
    risk,
    listings: risk === 'risk' ? 2 + (i % 4) : risk === 'warn' ? 1 : 0,
  };
});

const SEED_HISTORY: HistoryEntry[] = [
  { id: 'h01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAt: seedTime('8min'),  reference: 'LOAN-2026-0042', intent: 'owner-occupied', hasAIReport: true },
  // Prior re-scans of the SAME two addresses. These do NOT show as extra rows in
  // History (it dedups to the latest); they populate the "Run history" section
  // on the property's detail view — demonstrating the collapse. Mixed triggers
  // on purpose: this address is on a 6-month automation AND gets manually
  // re-checked, which is the case the zap marker exists to disambiguate.
  { id: 'h01b', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high',   platforms: 3, scannedAt: seedTime('40d'),  reference: 'LOAN-2026-0042', intent: 'owner-occupied', trigger: 'automation' },
  { id: 'h01c', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'medium', platforms: 2, scannedAt: seedTime('120d'), reference: 'LOAN-2026-0042', intent: 'owner-occupied' },
  { id: 'h02', kind: 'single', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAt: seedTime('24min'), reference: 'CASE-FILE-7714', intent: 'owner-occupied' },
  // Deliberately old, so its report demonstrates the stale-freshness flow.
  { id: 'h00', kind: 'single', address: '19 Rankin Ave, Asheville, NC 28801',         scenario: 'high',   platforms: 3, scannedAt: seedTime('46d'),   reference: 'LOAN-2026-0099' },
  // These three are also red addresses (see RED_ADDRESS_SEED), so they carry
  // the danger flag wherever they appear outside the Red-addresses tab.
  { id: 'hr1', kind: 'single', address: '412 Cumberland Ave, Asheville, NC 28801',    scenario: 'high',   platforms: 4, scannedAt: seedTime('1h'),    reference: 'LOAN-2026-0071', intent: 'owner-occupied' },
  { id: 'hr1b', kind: 'single', address: '412 Cumberland Ave, Asheville, NC 28801',   scenario: 'medium', platforms: 3, scannedAt: seedTime('60d'),   reference: 'LOAN-2026-0071', intent: 'owner-occupied' },
  { id: 'hr2', kind: 'single', address: '7 Beaucatcher Rd, Asheville, NC 28805',      scenario: 'high',   platforms: 3, scannedAt: seedTime('6h'),    reference: 'LOAN-2026-0058', intent: 'rental', hasAIReport: true },
  { id: 'hr3', kind: 'single', address: '153 Merrimon Ave, Asheville, NC 28804',      scenario: 'high',   platforms: 2, scannedAt: seedTime('2d'), intent: 'owner-occupied' },
  { id: 'hb0', kind: 'batch',  filename: 'asheville-q2-2026.csv', total: 6,  flagged: 0, warn: 0, clean: 0, failed: 6, status: 'failed',   scannedAt: seedTime('47d'), rows: SEED_BATCH_FAILED_ROWS },
  { id: 'hb1', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24, flagged: 6, warn: 6, clean: 12, failed: 0, status: 'complete', scannedAt: seedTime('2h'), rows: SEED_BATCH_Q1_ROWS, title: 'Asheville Spring Sweep', description: 'Quarterly compliance scan for the spring 2026 lender portfolio.', defaultIntent: 'owner-occupied', trigger: 'automation', aiStatus: 'done', hasAIReport: true },
  // A prior run of the SAME CSV — collapses in the History tab (one row), and
  // surfaces in the batch's "Run history" section on its detail view. This is
  // the original upload (manual); everything after it is the automation.
  { id: 'hb1b', kind: 'batch', filename: 'asheville-q1-2026.csv', total: 24, flagged: 4, warn: 7, clean: 13, failed: 0, status: 'complete', scannedAt: seedTime('3mo'), rows: SEED_BATCH_Q1_ROWS, title: 'Asheville Spring Sweep', defaultIntent: 'owner-occupied' },
  { id: 'h03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAt: seedTime('3h'), intent: 'rental'    },
  { id: 'h04', kind: 'single', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAt: seedTime('4h'), intent: 'owner-occupied'    },
  { id: 'h05', kind: 'single', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAt: seedTime('5h'), intent: 'owner-occupied'    },
  { id: 'h06', kind: 'single', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAt: seedTime('7h'), intent: 'owner-occupied'    },
  { id: 'h07', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',    scenario: 'high',   platforms: 3, scannedAt: seedTime('1d'), intent: 'owner-occupied' },
  { id: 'h08', kind: 'single', address: '23 Tunnel Rd, Asheville, NC 28805',          scenario: 'low',    platforms: 0, scannedAt: seedTime('1d') },
  { id: 'h09', kind: 'single', address: '215 Edgewood Rd, Asheville, NC 28804',       scenario: 'medium', platforms: 1, scannedAt: seedTime('1d') },
  { id: 'hb2', kind: 'batch',  filename: 'lender-portfolio-jan.csv', total: 42, flagged: 9, warn: 8, clean: 25, failed: 0, status: 'complete', scannedAt: seedTime('2d'), rows: SEED_BATCH_LENDER_ROWS, defaultIntent: 'owner-occupied' },
  { id: 'hb3', kind: 'batch',  filename: 'permit-sweep-dec.csv',     total: 8,  flagged: 2, warn: 1, clean: 3, failed: 2, status: 'partial', scannedAt: seedTime('3d'), rows: SEED_BATCH_PARTIAL_ROWS, defaultIntent: 'rental' },
  { id: 'hb4', kind: 'batch',  filename: 'short-sweep-nov.csv',      total: 4,  flagged: 0, warn: 0, clean: 0, failed: 4, status: 'failed',  scannedAt: seedTime('5d'), rows: SEED_BATCH_FAILED_ROWS },
  { id: 'h10', kind: 'single', address: '450 Patton Ave, Asheville, NC 28806',        scenario: 'high',   platforms: 2, scannedAt: seedTime('2d')   },
  { id: 'h11', kind: 'single', address: '12 Hillside St, Asheville, NC 28801',        scenario: 'low',    platforms: 0, scannedAt: seedTime('2d')   },
  { id: 'h12', kind: 'single', address: '156 Sand Hill Rd, Asheville, NC 28806',      scenario: 'high',   platforms: 3, scannedAt: seedTime('3d')   },
  { id: 'h13', kind: 'single', address: '89 Beverly Rd, Asheville, NC 28805',         scenario: 'medium', platforms: 1, scannedAt: seedTime('3d')   },
  { id: 'h14', kind: 'single', address: '720 Haywood Rd, Asheville, NC 28806',        scenario: 'low',    platforms: 0, scannedAt: seedTime('4d')   },
  { id: 'h15', kind: 'single', address: '301 Lakeshore Dr, Asheville, NC 28804',      scenario: 'high',   platforms: 2, scannedAt: seedTime('5d')   },
  { id: 'h16', kind: 'single', address: '44 Pine Cone Ln, Asheville, NC 28803',       scenario: 'medium', platforms: 1, scannedAt: seedTime('6d')   },
  { id: 'h17', kind: 'single', address: '987 Sunset Pkwy, Asheville, NC 28806',       scenario: 'low',    platforms: 0, scannedAt: seedTime('1w')   },
  { id: 'h18', kind: 'single', address: '50 Ridgeview Ct, Asheville, NC 28805',       scenario: 'high',   platforms: 3, scannedAt: seedTime('1w')   },
  // ---- Prior automation runs ---------------------------------------------
  // Synthetic history entries that act as previous executions of seeded
  // schedules, so the schedule-detail page shows a real run history. All of
  // these ran unattended, so they carry trigger: 'automation'.
  { id: 'hr01a', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high',   platforms: 3, scannedAt: seedTime('6mo'), trigger: 'automation' },
  { id: 'hr01b', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'medium', platforms: 2, scannedAt: seedTime('1y'),  trigger: 'automation' },
  { id: 'hr02a', kind: 'batch',  filename: 'asheville-q4-2025.csv', total: 22, flagged: 4, warn: 5, clean: 13, failed: 0, status: 'complete', scannedAt: seedTime('3mo'), rows: SEED_BATCH_Q1_ROWS.slice(0, 22), defaultIntent: 'owner-occupied', trigger: 'automation', aiStatus: 'failed' },
  { id: 'hr03a', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high',   platforms: 2, scannedAt: seedTime('1y'),  trigger: 'automation' },
  { id: 'hr04a', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'medium', platforms: 1, scannedAt: seedTime('4mo'), trigger: 'automation' },
];

// ---- cadence helpers ----------------------------------------------------
// The only code that interprets the Cadence shape. Top-level (global script
// scope) so every host file can format a cadence the same way; consumers
// list these in their /* global */ header.

// Advance a date by a cadence (weeks add days, months add months).
function addCadence(base: Date, c: Cadence): Date {
  const d = new Date(base);
  if (c.unit === 'week') d.setDate(d.getDate() + c.every * 7);
  else d.setMonth(d.getMonth() + c.every);
  return d;
}

// Renders an absolute calendar date — readable label that doesn't decay over
// time the way "In 6 months" does once a row is a few weeks old.
function formatNextRun(cadence: Cadence): string {
  return addCadence(new Date(), cadence).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Long human label: "weekly", "monthly", "every 3 months", "every 2 weeks".
function cadenceLabel(c: Cadence): string {
  if (c.unit === 'week') return c.every === 1 ? 'weekly' : `every ${c.every} weeks`;
  return c.every === 1 ? 'monthly' : `every ${c.every} months`;
}

// Compact chip label: "1wk", "3mo", "12mo".
function cadenceShort(c: Cadence): string {
  return `${c.every}${c.unit === 'week' ? 'wk' : 'mo'}`;
}

// Structural equality — cadences are plain objects, so `===` won't do.
function sameCadence(a: Cadence, b: Cadence): boolean {
  return a.every === b.every && a.unit === b.unit;
}

// "asheville-q2-2026.csv" → "Asheville Q2 2026". Used everywhere a batch
// renders without a user-chosen title, so legacy seeds and not-yet-named
// batches still read as a human name instead of a raw filename.
//   - Strip the trailing extension (handles .csv / .CSV / .tsv).
//   - Replace separators (- _ .) with spaces.
//   - Title-case each word, but preserve all-uppercase chunks (Q2, NC).
function deriveTitleFromFilename(filename: string): string {
  if (!filename) return 'Untitled batch';
  const stem = filename.replace(/\.[a-z0-9]+$/i, '');
  const words = stem.split(/[\s._-]+/).filter(Boolean);
  return words
    .map((w) => {
      if (/^[A-Z0-9]{2,}$/.test(w)) return w; // already an acronym
      const upper = w.toUpperCase();
      // Treat short letter+digit tokens as labels (q2, q4, h1) and uppercase.
      if (/^[a-z]\d+$/i.test(w)) return upper;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

const CAD_WEEKLY: Cadence = { every: 1, unit: 'week' };
const CAD_MONTHLY: Cadence = { every: 1, unit: 'month' };
const CAD_3MO: Cadence = { every: 3, unit: 'month' };
const CAD_6MO: Cadence = { every: 6, unit: 'month' };

const SEED_SCHEDULES: ScheduleEntry[] = [
  { id: 's01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high', cadence: CAD_6MO,     nextRunLabel: formatNextRun(CAD_6MO),     createdAt: seedTime('8min'), runHistoryIds: ['h01', 'hr01a', 'hr01b'] },
  { id: 's02', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24,         cadence: CAD_3MO,     nextRunLabel: formatNextRun(CAD_3MO),     createdAt: seedTime('2h'),   runHistoryIds: ['hb1', 'hr02a'], statuses: ['risk', 'warn'], retention: 'monitor', title: 'Asheville Spring Sweep' },
  { id: 's03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high', cadence: CAD_MONTHLY, nextRunLabel: formatNextRun(CAD_MONTHLY), createdAt: seedTime('3h'),   runHistoryIds: ['h03', 'hr03a'] },
  { id: 's04', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'high', cadence: CAD_WEEKLY,  nextRunLabel: formatNextRun(CAD_WEEKLY),  createdAt: seedTime('1d'), runHistoryIds: ['h07', 'hr04a'] },
];

// Batch sample addresses — kept identical to the previous BatchScreen mock
// so the prototype reads the same.
// `intent` stands in for a mapped CSV occupancy column. Rows 11 & 12 are left
// undefined on purpose, to exercise the batch-default fallback at read time.
const SAMPLE_BATCH_ROWS: LiveBatchRow[] = [
  { id: 1,  address: '1428 Maplewood Drive, Asheville, NC 28804', status: 'queued', intent: 'owner-occupied' },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'queued', intent: 'owner-occupied' },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'queued', intent: 'rental' },
  { id: 4,  address: '145 Westchester Dr, Asheville, NC 28803',   status: 'queued', intent: 'second-home' },
  { id: 5,  address: '23 Tunnel Rd, Asheville, NC 28805',         status: 'queued', intent: 'owner-occupied' },
  { id: 6,  address: '67 Charlotte Hwy, Asheville, NC 28803',     status: 'queued', intent: 'rental' },
  { id: 7,  address: '215 Edgewood Rd, Asheville, NC 28804',      status: 'queued', intent: 'second-home' },
  { id: 8,  address: '88 Cumberland Ave, Asheville, NC 28801',    status: 'queued', intent: 'owner-occupied' },
  { id: 9,  address: '301 Merrimon Ave, Asheville, NC 28804',     status: 'queued', intent: 'owner-occupied' },
  { id: 10, address: '450 Patton Ave, Asheville, NC 28806',       status: 'queued', intent: 'rental' },
  { id: 11, address: '12 Hillside St, Asheville, NC 28801',       status: 'queued' },
  { id: 12, address: '156 Sand Hill Rd, Asheville, NC 28806',     status: 'queued' },
  { id: 13, address: '89 Beverly Rd, Asheville, NC 28805',        status: 'queued', intent: 'owner-occupied' },
  { id: 14, address: '720 Haywood Rd, Asheville, NC 28806',       status: 'queued', intent: 'owner-occupied' },
];

// Resolution table for the sim — when a row finishes we assign a score and
// risk band. Mirrors the prior hardcoded SAMPLE_BATCH per-row outcomes so
// the demo end-state stays the same.
type SampleOutcome =
  | { kind: 'done'; score: number; risk: Risk; listings: number }
  | { kind: 'failed'; reason: string };

const SAMPLE_BATCH_OUTCOMES: Record<number, SampleOutcome> = {
  1:  { kind: 'done', score: 87, risk: 'risk',  listings: 4 },
  2:  { kind: 'done', score: 12, risk: 'clean', listings: 0 },
  3:  { kind: 'done', score: 54, risk: 'warn',  listings: 1 },
  4:  { kind: 'done', score: 76, risk: 'risk',  listings: 3 },
  5:  { kind: 'failed', reason: 'Address not found in county records' },
  6:  { kind: 'done', score: 91, risk: 'risk',  listings: 5 },
  7:  { kind: 'done', score: 42, risk: 'warn',  listings: 1 },
  8:  { kind: 'done', score: 18, risk: 'clean', listings: 0 },
  9:  { kind: 'done', score: 64, risk: 'warn',  listings: 2 },
  10: { kind: 'done', score: 71, risk: 'risk',  listings: 2 },
  11: { kind: 'failed', reason: 'Geocoder timeout — retry later' },
  12: { kind: 'done', score: 33, risk: 'warn',  listings: 1 },
  13: { kind: 'done', score: 22, risk: 'clean', listings: 0 },
  14: { kind: 'done', score: 6,  risk: 'clean', listings: 0 },
};

// ---- AI batch resolution ------------------------------------------------
// Deterministic AI verdict from the occupancy row's risk band, so the AI
// batch phase reads believably in the prototype without a backend. Real
// wiring resolves each row through runAIInvestigation() (see
// aiInvestigation.tsx — already isolated as the backend swap seam) and maps
// its verdictBand onto the row. The `id % 7` failure keeps the AI "failed"
// pill reachable by clicking, mirroring the occupancy sim's seeded failures.
type AIBatchOutcome =
  | { kind: 'done'; verdictBand: AIVerdictBand }
  | { kind: 'failed'; reason: string };

function resolveAIOutcome(row: LiveBatchRow): AIBatchOutcome {
  if (row.id % 7 === 0) return { kind: 'failed', reason: 'AI provider timeout — retry' };
  if (row.risk === 'risk')
    return { kind: 'done', verdictBand: row.id % 2 ? 'high_priority_review' : 'review' };
  if (row.risk === 'warn') return { kind: 'done', verdictBand: 'monitor' };
  return { kind: 'done', verdictBand: 'low_evidence' };
}

// ---- context -----------------------------------------------------------

interface ScheduleTarget {
  kind: 'single' | 'batch';
  address?: string;
  filename?: string;
}

interface TransientNotification {
  id: string;
  message: string;
  createdAt: number;
  durationMs: number;
}

interface AppStateValue {
  liveBatch: LiveBatch | null;
  schedules: ScheduleEntry[];
  history: HistoryEntry[];
  transients: TransientNotification[];
  /** True when a screen's primary data is being fetched. Real app sets
   *  this during async loads; live prototype always leaves it false. Used
   *  by states-spec.html to mount skeleton variants. */
  loading?: boolean;
  /** Non-null when a fetch failed. Pages render <ScreenError/> in place
   *  of their normal body. Same purpose as `loading` — exposed for
   *  states-spec injection and ready for a backend later. */
  error?: string | null;
  startSampleBatch: () => void;
  /** Real-flow upload — takes the form values captured on the upload page.
   *  Automation lives on the results page (post-scan, where counts exist),
   *  so this signature carries naming + parser hints only. */
  startBatch: (config: {
    filename: string;
    title?: string;
    description?: string;
    addressColumn?: string;
    intentColumn?: string;
    defaultIntent?: IntendedOccupancy;
  }) => void;
  clearBatch: () => void;
  dismissBatch: () => void;
  retryBatchRow: (id: number) => void;
  rescanBatchRow: (id: number) => void;
  rerunRowAIReport: (rowId: number) => void;
  /** Kick off the AI-report batch phase over the live batch: queues an AI
   *  report on every completed row whose occupancy verdict falls in `scope`
   *  (rows already carrying a done AI report are left alone; failed ones
   *  re-queue). Sets liveBatch.aiPhase so the AI worker starts ticking. */
  startBatchAIReports: (scope: Risk[]) => void;
  /** On-demand single AI report — the "run now" path. Flips one row's AI
   *  report straight to running (bypassing the queue) and ensures the AI
   *  worker is active so it resolves. Used both for a row with no AI report
   *  yet and to retry a failed one. */
  runRowAIReport: (rowId: number) => void;
  /** Rename a batch by id. Propagates to the live batch (if matching),
   *  every history entry sharing the same filename, and any schedule that
   *  targets it, so list rows stay in sync with the detail page. */
  renameBatch: (batchId: string, title: string) => void;
  /** Description is detail-page-only, so this only touches the live batch
   *  + matching history entries (no schedule mirror). */
  setBatchDescription: (batchId: string, description: string) => void;
  /** Set or clear the reference on a single-scan history entry. References
   *  are a single-scan-only concept (decided 2026-05-19): each single scan
   *  carries one optional user-supplied identifier (loan #, client ID, case
   *  file…) that travels onto its PDF certificate. */
  setSingleScanReference: (historyId: string, reference?: string) => void;
  addSingleScanToHistory: (address: string, scenario: Scenario, platforms: number, reference?: string) => string;
  addSchedule: (entry: Omit<ScheduleEntry, 'id' | 'createdAt' | 'nextRunLabel' | 'runHistoryIds'> & { cadence: Cadence; runHistoryIds?: string[]; statuses?: Risk[]; retention?: ScopeRetention }) => void;
  updateScheduleCadence: (id: string, cadence: Cadence) => void;
  /** Update which verdict bands a batch schedule rescans each cycle. No-op
   *  for single-property schedules (their scope is implicitly that address). */
  updateScheduleStatuses: (id: string, statuses: Risk[]) => void;
  /** Update the batch retention rule ('monitor' | 'remove'). No-op for
   *  single-property schedules. */
  updateScheduleRetention: (id: string, retention: ScopeRetention) => void;
  cancelSchedule: (id: string) => void;
  findScheduleByTarget: (target: ScheduleTarget) => ScheduleEntry | null;
  /** True when `title` (case-insensitive, trimmed) already names a batch —
   *  compared against every batch's resolved display title (user title, else
   *  the derived-from-filename fallback). Pass `excludeFilename` to ignore the
   *  batch being renamed so it can keep its own title. Enforces the "batch
   *  titles are unique" rule at both upload and inline-edit. */
  isBatchTitleTaken: (title: string, excludeFilename?: string) => boolean;
  /** Return every prior single-scan history entry for the given address,
   *  sorted newest-first. Drives the Scan History Report (PDF download)
   *  reached from the result-page download dropdown. */
  getHistoryForAddress: (address: string) => SingleHistoryEntry[];
  pushTransient: (message: string, durationMs?: number) => void;
  dismissTransient: (id: string) => void;
}

const AppStateContext = React.createContext<AppStateValue | null>(null);

function uid(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [liveBatch, setLiveBatch] = React.useState<LiveBatch | null>(null);
  const [schedules, setSchedules] = React.useState<ScheduleEntry[]>(SEED_SCHEDULES);
  const [history, setHistory] = React.useState<HistoryEntry[]>(SEED_HISTORY);
  const [transients, setTransients] = React.useState<TransientNotification[]>([]);

  // Demo role (no real auth). Staff Admin is the only role that can view the
  // Configuration page; Admin and User cannot. Switched from the Profile page.
  const [role, setRole] = React.useState<'staff' | 'admin' | 'user'>('staff');

  // Sim: tick the live batch forward one row at a time. Each tick moves
  // the first 'queued' row to 'running' and the first 'running' row to
  // 'done' (so we briefly see ~2 in-flight scans at a time, which reads
  // more like a real worker pool than a single-file conveyor).
  React.useEffect(() => {
    if (!liveBatch || liveBatch.status !== 'running') return;
    const interval = window.setInterval(() => {
      setLiveBatch((prev) => {
        if (!prev || prev.status !== 'running') return prev;
        const rows = prev.rows.slice();
        const runningIdx = rows.findIndex((r) => r.status === 'running');
        if (runningIdx >= 0) {
          const o: SampleOutcome =
            SAMPLE_BATCH_OUTCOMES[rows[runningIdx].id] ??
            { kind: 'done', score: 50, risk: 'warn', listings: 1 };
          rows[runningIdx] = o.kind === 'failed'
            ? { ...rows[runningIdx], status: 'failed', errorReason: o.reason }
            : { ...rows[runningIdx], status: 'done', score: o.score, risk: o.risk, listings: o.listings, lastScanAt: Date.now(), configVersion: DEFAULT_OCC_CONFIG.version };
        }
        const queuedIdx = rows.findIndex((r) => r.status === 'queued');
        if (queuedIdx >= 0) {
          rows[queuedIdx] = { ...rows[queuedIdx], status: 'running' };
        }
        const stillWorking = rows.some((r) => r.status === 'running' || r.status === 'queued');
        if (!stillWorking) {
          // batch just finished — push a summary entry, mark complete
          const flagged = rows.filter((r) => r.risk === 'risk').length;
          const warn = rows.filter((r) => r.risk === 'warn').length;
          const clean = rows.filter((r) => r.risk === 'clean').length;
          const failedCount = rows.filter((r) => r.status === 'failed').length;
          const batchStatus: 'complete' | 'partial' | 'failed' =
            failedCount === 0 ? 'complete'
            : failedCount === rows.length ? 'failed'
            : 'partial';
          const historyId = uid('hb');
          setHistory((h) => [
            {
              id: historyId,
              kind: 'batch',
              filename: prev.filename,
              total: rows.length,
              flagged,
              warn,
              clean,
              failed: failedCount,
              status: batchStatus,
              scannedAt: Date.now(),
              rows: rows.slice(),
              title: prev.title,
              description: prev.description,
            },
            ...h,
          ]);
          return { ...prev, rows, status: 'complete', historyId };
        }
        return { ...prev, rows };
      });
    }, 900);
    return () => window.clearInterval(interval);
  }, [liveBatch?.id, liveBatch?.status]);

  // AI batch worker — a second conveyor that runs ONLY while
  // liveBatch.aiPhase.status === 'running'. Mirrors the occupancy sim above:
  // each 900 ms tick resolves the first AI report in 'running' and promotes
  // the first 'queued' one, so ~2 reports read as in-flight at a time. Rows
  // without an `aiReport` are untouched — the phase only spans the in-scope
  // subset the trigger queued. When none remain, aiPhase flips to 'complete'.
  React.useEffect(() => {
    if (!liveBatch || liveBatch.aiPhase?.status !== 'running') return;
    const interval = window.setInterval(() => {
      setLiveBatch((prev) => {
        if (!prev || prev.aiPhase?.status !== 'running') return prev;
        const rows = prev.rows.slice();
        const runningIdx = rows.findIndex((r) => r.aiReport?.status === 'running');
        if (runningIdx >= 0) {
          const o = resolveAIOutcome(rows[runningIdx]);
          rows[runningIdx] = {
            ...rows[runningIdx],
            aiReport:
              o.kind === 'failed'
                ? { status: 'failed', errorReason: o.reason }
                : { status: 'done', verdictBand: o.verdictBand, lastAIReportAt: Date.now() },
          };
        }
        const queuedIdx = rows.findIndex((r) => r.aiReport?.status === 'queued');
        if (queuedIdx >= 0) {
          rows[queuedIdx] = { ...rows[queuedIdx], aiReport: { status: 'running' } };
        }
        const stillWorking = rows.some(
          (r) => r.aiReport?.status === 'running' || r.aiReport?.status === 'queued'
        );
        return {
          ...prev,
          rows,
          aiPhase: { ...prev.aiPhase, status: stillWorking ? 'running' : 'complete' },
        };
      });
    }, 900);
    return () => window.clearInterval(interval);
  }, [liveBatch?.id, liveBatch?.aiPhase?.status]);

  const startSampleBatch = React.useCallback(() => {
    setLiveBatch({
      id: uid('lb'),
      filename: 'asheville-q2-2026.csv',
      rows: SAMPLE_BATCH_ROWS.map((r) => ({ ...r, status: 'queued' as const })),
      status: 'running',
      startedAt: Date.now(),
      // Stands in for a detected occupancy column; unset rows fall to the default.
      intentColumn: 'occupancy_type',
      // Owner-occupied (matching the seeded history batches) so the reconciliation
      // matrix actually produces red "Needs review" rows for the sample — with
      // 'not-sure' the matrix never yields red and the demo would show none.
      defaultIntent: 'owner-occupied',
      // Sample flow bypasses the form, so the title is derived (not user-set)
      // and there's no description or cadence. The header still reads cleanly
      // because BatchResults falls back to deriveTitleFromFilename().
    });
  }, []);

  // Real upload — accepts the upload-form payload, drops the address-column
  // override (parser concern, not state's), and stashes the cadence so a
  // schedule can materialize on completion. Sample-batch rows are still
  // used as the row scaffold while we don't yet parse the user's CSV; the
  // shape mirrors `startSampleBatch` so the tick-forward sim works unchanged.
  // Automation (cadence + verdict-band scope) is created post-results via
  // AutomationControl / AutomationBanner — NOT collected here, because the
  // scope decision needs counts that only exist once the scan completes.
  const startBatch = React.useCallback(
    (config: {
      filename: string;
      title?: string;
      description?: string;
      addressColumn?: string;
      intentColumn?: string;
      defaultIntent?: IntendedOccupancy;
    }) => {
      setLiveBatch({
        id: uid('lb'),
        filename: config.filename,
        rows: SAMPLE_BATCH_ROWS.map((r) => ({ ...r, status: 'queued' as const })),
        status: 'running',
        startedAt: Date.now(),
        title: config.title?.trim() || undefined,
        description: config.description?.trim() || undefined,
        intentColumn: config.intentColumn?.trim() || undefined,
        defaultIntent: config.defaultIntent ?? 'not-sure',
      });
    },
    []
  );

  const clearBatch = React.useCallback(() => setLiveBatch(null), []);

  const rescanBatchRow = React.useCallback((id: number) => {
    setLiveBatch((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r.id === id
          ? { id: r.id, address: r.address, status: 'queued' as const, intent: r.intent, aiReport: undefined }
          : r
      );
      return { ...prev, rows, status: 'running' };
    });
  }, []);
  const retryBatchRow = rescanBatchRow;

  const rerunRowAIReport = React.useCallback((rowId: number) => {
    setLiveBatch((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r.id === rowId && r.status === 'done'
          ? { ...r, aiReport: { status: 'running' as const } }
          : r
      );
      const aiPhase =
        prev.aiPhase && prev.aiPhase.status === 'running'
          ? prev.aiPhase
          : { status: 'running' as const, scope: prev.aiPhase?.scope ?? [] };
      return { ...prev, rows, aiPhase };
    });
  }, []);

  const dismissBatch = React.useCallback(() => {
    setLiveBatch((prev) => (prev ? { ...prev, dismissed: true } : prev));
  }, []);

  // Queue AI reports across the in-scope subset and start the AI phase. Only
  // completed occupancy rows are eligible (you can't reason over a scan that
  // hasn't landed). Rows already holding a done AI report are preserved so a
  // re-run only fills the gaps + retries failures.
  const startBatchAIReports = React.useCallback((scope: Risk[]) => {
    setLiveBatch((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r.status === 'done' &&
        r.risk &&
        scope.includes(r.risk) &&
        (!r.aiReport || r.aiReport.status === 'failed')
          ? { ...r, aiReport: { status: 'queued' as const } }
          : r
      );
      const anyQueued = rows.some((r) => r.aiReport?.status === 'queued');
      // Nothing to do (e.g. scope matched zero eligible rows) — leave state be.
      if (!anyQueued && !prev.aiPhase) return prev;
      return { ...prev, rows, aiPhase: { status: 'running' as const, scope } };
    });
  }, []);

  const runRowAIReport = React.useCallback((rowId: number) => {
    setLiveBatch((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r.id === rowId && r.status === 'done'
          ? { ...r, aiReport: { status: 'running' as const } }
          : r
      );
      // Ensure the worker is live so the on-demand run resolves. Preserve any
      // existing scope; a bare run-now carries none of its own.
      const aiPhase =
        prev.aiPhase && prev.aiPhase.status === 'running'
          ? prev.aiPhase
          : { status: 'running' as const, scope: prev.aiPhase?.scope ?? [] };
      return { ...prev, rows, aiPhase };
    });
  }, []);

  // Title is the join key across surfaces — a batch is identified by its
  // filename (immutable), so a rename updates every entry that references
  // that filename: the live batch, every history snapshot of past runs,
  // and any schedule targeting it. Description is detail-only and never
  // mirrors onto the schedule (see `BatchScheduleEntry.title` JSDoc).
  const renameBatch = React.useCallback((batchId: string, title: string) => {
    const cleaned = title.trim();
    if (!cleaned) return;
    let filenameHit: string | null = null;
    setLiveBatch((prev) => {
      if (!prev || prev.id !== batchId) return prev;
      filenameHit = prev.filename;
      return { ...prev, title: cleaned };
    });
    setHistory((prev) =>
      prev.map((h) => {
        if (h.kind !== 'batch') return h;
        if (h.id === batchId || (filenameHit && h.filename === filenameHit)) {
          if (!filenameHit) filenameHit = h.filename;
          return { ...h, title: cleaned };
        }
        return h;
      })
    );
    if (filenameHit) {
      const fname = filenameHit;
      setSchedules((prev) =>
        prev.map((s) =>
          s.kind === 'batch' && s.filename === fname ? { ...s, title: cleaned } : s
        )
      );
    }
  }, []);

  const setBatchDescription = React.useCallback((batchId: string, description: string) => {
    const cleaned = description.trim() || undefined;
    let filenameHit: string | null = null;
    setLiveBatch((prev) => {
      if (!prev || prev.id !== batchId) return prev;
      filenameHit = prev.filename;
      return { ...prev, description: cleaned };
    });
    setHistory((prev) =>
      prev.map((h) => {
        if (h.kind !== 'batch') return h;
        if (h.id === batchId || (filenameHit && h.filename === filenameHit)) {
          if (!filenameHit) filenameHit = h.filename;
          return { ...h, description: cleaned };
        }
        return h;
      })
    );
  }, []);

  // Reference editing — single-scan only. Whitespace-only / empty saves are
  // treated as a clear, matching the inline-edit semantics elsewhere.
  const setSingleScanReference = React.useCallback(
    (historyId: string, reference?: string) => {
      const cleaned = reference?.trim() || undefined;
      setHistory((prev) =>
        prev.map((h: any) =>
          h.id === historyId && h.kind === 'single' ? { ...h, reference: cleaned } : h
        )
      );
    },
    []
  );

  const addSingleScanToHistory = React.useCallback(
    (address: string, scenario: Scenario, platforms: number, reference?: string): string => {
      const id = uid('h');
      const entry: SingleHistoryEntry = {
        id, kind: 'single', address, scenario, platforms,
        scannedAt: Date.now(),
        configVersion: DEFAULT_OCC_CONFIG.version,
        ...(reference ? { reference } : {}),
      };
      setHistory((h) => [entry, ...h]);
      return id;
    },
    []
  );

  const addSchedule = React.useCallback(
    (entry: any) => {
      const id = uid('s');
      const nextRunLabel = formatNextRun(entry.cadence);
      const runHistoryIds: string[] = entry.runHistoryIds ?? [];
      // Default scope per design feedback (Erin 2026-05-14): Rented + Possibly
      // Rented. Only meaningful on batch schedules; harmless on single.
      const statuses: Risk[] =
        entry.kind === 'batch'
          ? (entry.statuses && entry.statuses.length > 0 ? entry.statuses : ['risk', 'warn'])
          : entry.statuses ?? undefined;
      // Retention defaults to 'monitor' (keep re-scanning) for batches.
      const retention: ScopeRetention | undefined =
        entry.kind === 'batch' ? (entry.retention ?? 'monitor') : undefined;
      setSchedules((s) => [{ ...entry, id, nextRunLabel, createdAt: Date.now(), runHistoryIds, statuses, retention }, ...s]);
    },
    []
  );

  const updateScheduleCadence = React.useCallback((id: string, cadence: Cadence) => {
    setSchedules((s) =>
      s.map((entry) =>
        entry.id === id
          ? { ...entry, cadence, nextRunLabel: formatNextRun(cadence) }
          : entry
      )
    );
  }, []);

  const updateScheduleStatuses = React.useCallback((id: string, statuses: Risk[]) => {
    setSchedules((s) =>
      s.map((entry) =>
        entry.id === id && entry.kind === 'batch'
          ? { ...entry, statuses }
          : entry
      )
    );
  }, []);

  const updateScheduleRetention = React.useCallback((id: string, retention: ScopeRetention) => {
    setSchedules((s) =>
      s.map((entry) =>
        entry.id === id && entry.kind === 'batch'
          ? { ...entry, retention }
          : entry
      )
    );
  }, []);

  const cancelSchedule = React.useCallback((id: string) => {
    setSchedules((s) => s.filter((entry) => entry.id !== id));
  }, []);

  const dismissTransient = React.useCallback((id: string) => {
    setTransients((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushTransient = React.useCallback(
    (message: string, durationMs: number = 3000) => {
      const id = uid('tn');
      setTransients((prev) => [
        ...prev,
        { id, message, createdAt: Date.now(), durationMs },
      ]);
      window.setTimeout(() => {
        setTransients((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    []
  );

  const findScheduleByTarget = React.useCallback(
    (target: ScheduleTarget): ScheduleEntry | null => {
      const match = schedules.find((entry) => {
        if (entry.kind !== target.kind) return false;
        if (entry.kind === 'single' && target.kind === 'single') {
          return entry.address === target.address;
        }
        if (entry.kind === 'batch' && target.kind === 'batch') {
          return entry.filename === target.filename;
        }
        return false;
      });
      return match ?? null;
    },
    [schedules]
  );

  // Seed history is authored newest-first and we prepend on every new scan,
  // so the filtered slice is already in the right order — no further sort.
  const getHistoryForAddress = React.useCallback(
    (address: string): SingleHistoryEntry[] =>
      history.filter(
        (h): h is SingleHistoryEntry => h.kind === 'single' && h.address === address
      ),
    [history]
  );

  // A batch is identified TO THE USER by its title — two batches must never
  // share one (Trello #12). The uploaded filename is irrelevant to this rule.
  // Uniqueness is checked against the RESOLVED display title (user-set title,
  // else the derived-from-filename fallback), so an untitled batch still can't
  // collide with another batch that happens to derive the same name.
  //
  // `excludeFilename` drops the batch being edited from the comparison: a
  // batch's runs all share its filename, so excluding by filename removes every
  // "self" row (live + history snapshots + schedule) in one pass — letting a
  // rename keep (or case-adjust) its own title without a false collision.
  const isBatchTitleTaken = React.useCallback(
    (title: string, excludeFilename?: string): boolean => {
      const needle = title.trim().toLowerCase();
      if (!needle) return false;
      const norm = (t?: string, filename?: string) =>
        (t?.trim() || deriveTitleFromFilename(filename ?? '')).trim().toLowerCase();
      const skip = excludeFilename?.trim().toLowerCase();
      const sameBatch = (filename?: string) =>
        skip !== undefined && (filename ?? '').trim().toLowerCase() === skip;

      if (liveBatch && !sameBatch(liveBatch.filename)) {
        if (norm(liveBatch.title, liveBatch.filename) === needle) return true;
      }
      for (const h of history) {
        if (h.kind !== 'batch' || sameBatch(h.filename)) continue;
        if (norm(h.title, h.filename) === needle) return true;
      }
      for (const s of schedules) {
        if (s.kind !== 'batch' || sameBatch(s.filename)) continue;
        if (norm(s.title, s.filename) === needle) return true;
      }
      return false;
    },
    [history, liveBatch, schedules]
  );

  const value: AppStateValue = {
    liveBatch,
    schedules,
    history,
    transients,
    loading: false,
    error: null,
    startSampleBatch,
    startBatch,
    clearBatch,
    dismissBatch,
    retryBatchRow,
    rescanBatchRow,
    rerunRowAIReport,
    startBatchAIReports,
    runRowAIReport,
    renameBatch,
    setBatchDescription,
    setSingleScanReference,
    addSingleScanToHistory,
    addSchedule,
    updateScheduleCadence,
    updateScheduleStatuses,
    updateScheduleRetention,
    cancelSchedule,
    findScheduleByTarget,
    isBatchTitleTaken,
    getHistoryForAddress,
    pushTransient,
    dismissTransient,
    role,
    setRole,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function useAppState(): AppStateValue {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
