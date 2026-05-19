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
}

type HistoryEntry = SingleHistoryEntry | BatchHistoryEntry;

type Cadence = 3 | 4 | 6 | 12;

interface SingleScheduleEntry {
  id: string;
  kind: 'single';
  address: string;
  scenario: Scenario;
  cadenceMonths: Cadence;
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
  cadenceMonths: Cadence;
  nextRunLabel: string;
  createdAgo: string;
  /** History entry ids for all prior runs of this schedule, newest first. */
  runHistoryIds: string[];
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
  { id: 'hb1', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24, flagged: 6, warn: 6, clean: 12, failed: 0, status: 'complete', scannedAgo: '2 h ago', rows: SEED_BATCH_Q1_ROWS },
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

// Renders an absolute calendar date — readable label that doesn't decay over
// time the way "In 6 months" does once a row is a few weeks old.
function formatNextRun(cadenceMonths: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + cadenceMonths);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const SEED_SCHEDULES: ScheduleEntry[] = [
  { id: 's01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high', cadenceMonths: 6,  nextRunLabel: formatNextRun(6),  createdAgo: '8 min ago', runHistoryIds: ['h01', 'hr01a', 'hr01b'] },
  { id: 's02', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24,         cadenceMonths: 3,  nextRunLabel: formatNextRun(3),  createdAgo: '2 h ago',   runHistoryIds: ['hb1', 'hr02a'] },
  { id: 's03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high', cadenceMonths: 12, nextRunLabel: formatNextRun(12), createdAgo: '3 h ago',   runHistoryIds: ['h03', 'hr03a'] },
  { id: 's04', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'high', cadenceMonths: 4,  nextRunLabel: formatNextRun(4),  createdAgo: 'Yesterday', runHistoryIds: ['h07', 'hr04a'] },
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
  clearBatch: () => void;
  dismissBatch: () => void;
  retryBatchRow: (id: number) => void;
  /** Set or clear the reference on a single-scan history entry. References
   *  are a single-scan-only concept (decided 2026-05-19): each single scan
   *  carries one optional user-supplied identifier (loan #, client ID, case
   *  file…) that travels onto its PDF certificate. */
  setSingleScanReference: (historyId: string, reference?: string) => void;
  addSchedule: (entry: Omit<ScheduleEntry, 'id' | 'createdAgo' | 'nextRunLabel' | 'runHistoryIds'> & { cadenceMonths: Cadence; runHistoryIds?: string[] }) => void;
  updateScheduleCadence: (id: string, cadenceMonths: Cadence) => void;
  cancelSchedule: (id: string) => void;
  findScheduleByTarget: (target: ScheduleTarget) => ScheduleEntry | null;
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
    });
  }, []);

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
      const nextRunLabel = formatNextRun(entry.cadenceMonths);
      const runHistoryIds: string[] = entry.runHistoryIds ?? [];
      setSchedules((s) => [{ ...entry, id, nextRunLabel, createdAgo: 'Just now', runHistoryIds }, ...s]);
    },
    []
  );

  const updateScheduleCadence = React.useCallback((id: string, cadenceMonths: Cadence) => {
    setSchedules((s) =>
      s.map((entry) =>
        entry.id === id
          ? { ...entry, cadenceMonths, nextRunLabel: formatNextRun(cadenceMonths) }
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

  const value: AppStateValue = {
    liveBatch,
    schedules,
    history,
    transients,
    loading: false,
    error: null,
    startSampleBatch,
    clearBatch,
    dismissBatch,
    retryBatchRow,
    setSingleScanReference,
    addSchedule,
    updateScheduleCadence,
    cancelSchedule,
    findScheduleByTarget,
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
