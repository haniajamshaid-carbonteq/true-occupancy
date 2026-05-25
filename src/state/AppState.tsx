/* global React */
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

interface SingleHistoryEntry {
  id: string;
  kind: 'single';
  address: string;
  scenario: Scenario;
  platforms: number;
  scannedAgo: string;
  /** Optional user-supplied identifier (loan #, client ID, case file…)
   *  set at scan-time and editable on the history page. Surfaces on the
   *  PDF certificate header when present. Never replaces our internal UUID
   *  — see CertificateSheet footer. */
  reference?: string;
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
  scannedAgo: string;
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
  createdAgo: string;
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
  createdAgo: string;
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

interface LiveBatchRow {
  id: number;
  address: string;
  status: 'done' | 'running' | 'queued' | 'failed';
  score?: number;
  risk?: Risk;
  listings?: number;
  /** Short reason populated when status === 'failed' (e.g. "Geocoder timeout"). */
  errorReason?: string;
}

interface LiveBatch {
  id: string;
  filename: string;
  rows: LiveBatchRow[];
  status: 'running' | 'complete';
  startedAt: number;
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
}

// ---- seed data ----------------------------------------------------------
// Mirrors the previous in-page mocks. Older entries trail off so the
// dashboard "6 most recent" cap shows the freshest activity.

// Curated row snapshots for the two seeded batch entries so the batch-
// detail page has something to render before the user has run a batch.
const SEED_BATCH_Q1_ROWS: LiveBatchRow[] = [
  { id: 1,  address: '1428 Maplewood Drive, Asheville, NC 28804', status: 'done', score: 87, risk: 'risk',  listings: 4 },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'done', score: 12, risk: 'clean', listings: 0 },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'done', score: 54, risk: 'warn',  listings: 1 },
  { id: 4,  address: '145 Westchester Dr, Asheville, NC 28803',   status: 'done', score: 76, risk: 'risk',  listings: 3 },
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
  { id: 1, address: '88 Cumberland Ave, Asheville, NC 28801',   status: 'done',   score: 18, risk: 'clean', listings: 0 },
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
  { id: 'h01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAgo: '8 min ago',  reference: 'LOAN-2026-0042' },
  { id: 'h02', kind: 'single', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAgo: '24 min ago', reference: 'CASE-FILE-7714' },
  { id: 'hb0', kind: 'batch',  filename: 'asheville-q2-2026.csv', total: 6,  flagged: 0, warn: 0, clean: 0, failed: 6, status: 'failed',   scannedAgo: '52 min ago', rows: SEED_BATCH_FAILED_ROWS },
  { id: 'hb1', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24, flagged: 6, warn: 6, clean: 12, failed: 0, status: 'complete', scannedAgo: '2 h ago', rows: SEED_BATCH_Q1_ROWS, title: 'Asheville Spring Sweep', description: 'Quarterly compliance scan for the spring 2026 lender portfolio.' },
  { id: 'h03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAgo: '3 h ago'    },
  { id: 'h04', kind: 'single', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAgo: '4 h ago'    },
  { id: 'h05', kind: 'single', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '5 h ago'    },
  { id: 'h06', kind: 'single', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAgo: '7 h ago'    },
  { id: 'h07', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',    scenario: 'high',   platforms: 3, scannedAgo: 'Yesterday' },
  { id: 'h08', kind: 'single', address: '23 Tunnel Rd, Asheville, NC 28805',          scenario: 'low',    platforms: 0, scannedAgo: 'Yesterday' },
  { id: 'h09', kind: 'single', address: '215 Edgewood Rd, Asheville, NC 28804',       scenario: 'medium', platforms: 1, scannedAgo: 'Yesterday' },
  { id: 'hb2', kind: 'batch',  filename: 'lender-portfolio-jan.csv', total: 42, flagged: 9, warn: 8, clean: 25, failed: 0, status: 'complete', scannedAgo: '2 d ago', rows: SEED_BATCH_LENDER_ROWS },
  { id: 'hb3', kind: 'batch',  filename: 'permit-sweep-dec.csv',     total: 8,  flagged: 2, warn: 1, clean: 3, failed: 2, status: 'partial', scannedAgo: '3 d ago', rows: SEED_BATCH_PARTIAL_ROWS },
  { id: 'hb4', kind: 'batch',  filename: 'short-sweep-nov.csv',      total: 4,  flagged: 0, warn: 0, clean: 0, failed: 4, status: 'failed',  scannedAgo: '5 d ago', rows: SEED_BATCH_FAILED_ROWS },
  { id: 'h10', kind: 'single', address: '450 Patton Ave, Asheville, NC 28806',        scenario: 'high',   platforms: 2, scannedAgo: '2 d ago'   },
  { id: 'h11', kind: 'single', address: '12 Hillside St, Asheville, NC 28801',        scenario: 'low',    platforms: 0, scannedAgo: '2 d ago'   },
  { id: 'h12', kind: 'single', address: '156 Sand Hill Rd, Asheville, NC 28806',      scenario: 'high',   platforms: 3, scannedAgo: '3 d ago'   },
  { id: 'h13', kind: 'single', address: '89 Beverly Rd, Asheville, NC 28805',         scenario: 'medium', platforms: 1, scannedAgo: '3 d ago'   },
  { id: 'h14', kind: 'single', address: '720 Haywood Rd, Asheville, NC 28806',        scenario: 'low',    platforms: 0, scannedAgo: '4 d ago'   },
  { id: 'h15', kind: 'single', address: '301 Lakeshore Dr, Asheville, NC 28804',      scenario: 'high',   platforms: 2, scannedAgo: '5 d ago'   },
  { id: 'h16', kind: 'single', address: '44 Pine Cone Ln, Asheville, NC 28803',       scenario: 'medium', platforms: 1, scannedAgo: '6 d ago'   },
  { id: 'h17', kind: 'single', address: '987 Sunset Pkwy, Asheville, NC 28806',       scenario: 'low',    platforms: 0, scannedAgo: '1 w ago'   },
  { id: 'h18', kind: 'single', address: '50 Ridgeview Ct, Asheville, NC 28805',       scenario: 'high',   platforms: 3, scannedAgo: '1 w ago'   },
  // ---- Prior automation runs ---------------------------------------------
  // Synthetic history entries that act as previous executions of seeded
  // schedules, so the schedule-detail page shows a real run history.
  { id: 'hr01a', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high',   platforms: 3, scannedAgo: '6 mo ago' },
  { id: 'hr01b', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'medium', platforms: 2, scannedAgo: '1 y ago'  },
  { id: 'hr02a', kind: 'batch',  filename: 'asheville-q4-2025.csv', total: 22, flagged: 4, warn: 5, clean: 13, failed: 0, status: 'complete', scannedAgo: '3 mo ago', rows: SEED_BATCH_Q1_ROWS.slice(0, 22) },
  { id: 'hr03a', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high',   platforms: 2, scannedAgo: '1 y ago' },
  { id: 'hr04a', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'medium', platforms: 1, scannedAgo: '4 mo ago' },
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
  { id: 's01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high', cadence: CAD_6MO,     nextRunLabel: formatNextRun(CAD_6MO),     createdAgo: '8 min ago', runHistoryIds: ['h01', 'hr01a', 'hr01b'] },
  { id: 's02', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24,         cadence: CAD_3MO,     nextRunLabel: formatNextRun(CAD_3MO),     createdAgo: '2 h ago',   runHistoryIds: ['hb1', 'hr02a'], statuses: ['risk', 'warn'], retention: 'monitor', title: 'Asheville Spring Sweep' },
  { id: 's03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high', cadence: CAD_MONTHLY, nextRunLabel: formatNextRun(CAD_MONTHLY), createdAgo: '3 h ago',   runHistoryIds: ['h03', 'hr03a'] },
  { id: 's04', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'high', cadence: CAD_WEEKLY,  nextRunLabel: formatNextRun(CAD_WEEKLY),  createdAgo: 'Yesterday', runHistoryIds: ['h07', 'hr04a'] },
];

// Batch sample addresses — kept identical to the previous BatchScreen mock
// so the prototype reads the same.
const SAMPLE_BATCH_ROWS: LiveBatchRow[] = [
  { id: 1,  address: '1428 Maplewood Drive, Asheville, NC 28804', status: 'queued' },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'queued' },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'queued' },
  { id: 4,  address: '145 Westchester Dr, Asheville, NC 28803',   status: 'queued' },
  { id: 5,  address: '23 Tunnel Rd, Asheville, NC 28805',         status: 'queued' },
  { id: 6,  address: '67 Charlotte Hwy, Asheville, NC 28803',     status: 'queued' },
  { id: 7,  address: '215 Edgewood Rd, Asheville, NC 28804',      status: 'queued' },
  { id: 8,  address: '88 Cumberland Ave, Asheville, NC 28801',    status: 'queued' },
  { id: 9,  address: '301 Merrimon Ave, Asheville, NC 28804',     status: 'queued' },
  { id: 10, address: '450 Patton Ave, Asheville, NC 28806',       status: 'queued' },
  { id: 11, address: '12 Hillside St, Asheville, NC 28801',       status: 'queued' },
  { id: 12, address: '156 Sand Hill Rd, Asheville, NC 28806',     status: 'queued' },
  { id: 13, address: '89 Beverly Rd, Asheville, NC 28805',        status: 'queued' },
  { id: 14, address: '720 Haywood Rd, Asheville, NC 28806',       status: 'queued' },
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
  }) => void;
  clearBatch: () => void;
  dismissBatch: () => void;
  retryBatchRow: (id: number) => void;
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
  addSchedule: (entry: Omit<ScheduleEntry, 'id' | 'createdAgo' | 'nextRunLabel' | 'runHistoryIds'> & { cadence: Cadence; runHistoryIds?: string[]; statuses?: Risk[]; retention?: ScopeRetention }) => void;
  updateScheduleCadence: (id: string, cadence: Cadence) => void;
  /** Update which verdict bands a batch schedule rescans each cycle. No-op
   *  for single-property schedules (their scope is implicitly that address). */
  updateScheduleStatuses: (id: string, statuses: Risk[]) => void;
  /** Update the batch retention rule ('monitor' | 'remove'). No-op for
   *  single-property schedules. */
  updateScheduleRetention: (id: string, retention: ScopeRetention) => void;
  cancelSchedule: (id: string) => void;
  findScheduleByTarget: (target: ScheduleTarget) => ScheduleEntry | null;
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
            : { ...rows[runningIdx], status: 'done', score: o.score, risk: o.risk, listings: o.listings };
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
              scannedAgo: 'Just now',
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

  const startSampleBatch = React.useCallback(() => {
    setLiveBatch({
      id: uid('lb'),
      filename: 'asheville-q2-2026.csv',
      rows: SAMPLE_BATCH_ROWS.map((r) => ({ ...r, status: 'queued' as const })),
      status: 'running',
      startedAt: Date.now(),
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
    }) => {
      setLiveBatch({
        id: uid('lb'),
        filename: config.filename,
        rows: SAMPLE_BATCH_ROWS.map((r) => ({ ...r, status: 'queued' as const })),
        status: 'running',
        startedAt: Date.now(),
        title: config.title?.trim() || undefined,
        description: config.description?.trim() || undefined,
      });
    },
    []
  );

  const clearBatch = React.useCallback(() => setLiveBatch(null), []);

  const retryBatchRow = React.useCallback((id: number) => {
    setLiveBatch((prev) => {
      if (!prev) return prev;
      const rows = prev.rows.map((r) =>
        r.id === id
          ? { id: r.id, address: r.address, status: 'queued' as const }
          : r
      );
      return { ...prev, rows, status: 'running' };
    });
  }, []);

  const dismissBatch = React.useCallback(() => {
    setLiveBatch((prev) => (prev ? { ...prev, dismissed: true } : prev));
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
      setSchedules((s) => [{ ...entry, id, nextRunLabel, createdAgo: 'Just now', runHistoryIds, statuses, retention }, ...s]);
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
    renameBatch,
    setBatchDescription,
    setSingleScanReference,
    addSchedule,
    updateScheduleCadence,
    updateScheduleStatuses,
    updateScheduleRetention,
    cancelSchedule,
    findScheduleByTarget,
    getHistoryForAddress,
    pushTransient,
    dismissTransient,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function useAppState(): AppStateValue {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
