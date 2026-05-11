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
}

interface BatchHistoryEntry {
  id: string;
  kind: 'batch';
  filename: string;
  total: number;
  flagged: number;
  warn: number;
  clean: number;
  scannedAgo: string;
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
}

interface BatchScheduleEntry {
  id: string;
  kind: 'batch';
  filename: string;
  total: number;
  cadenceMonths: Cadence;
  nextRunLabel: string;
  createdAgo: string;
}

type ScheduleEntry = SingleScheduleEntry | BatchScheduleEntry;

interface LiveBatchRow {
  id: number;
  address: string;
  status: 'done' | 'running' | 'queued';
  score?: number;
  risk?: Risk;
  listings?: number;
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
}

// ---- seed data ----------------------------------------------------------
// Mirrors the previous in-page mocks. Older entries trail off so the
// dashboard "6 most recent" cap shows the freshest activity.

const SEED_HISTORY: HistoryEntry[] = [
  { id: 'h01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804',  scenario: 'high',   platforms: 3, scannedAgo: '8 min ago'  },
  { id: 'h02', kind: 'single', address: '212 Westbrook Lane, Asheville, NC 28805',    scenario: 'medium', platforms: 2, scannedAgo: '24 min ago' },
  { id: 'hb1', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24, flagged: 6, warn: 5, clean: 13, scannedAgo: '2 h ago' },
  { id: 'h03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',      scenario: 'high',   platforms: 3, scannedAgo: '3 h ago'    },
  { id: 'h04', kind: 'single', address: '502 N Liberty St, Asheville, NC 28801',      scenario: 'low',    platforms: 0, scannedAgo: '4 h ago'    },
  { id: 'h05', kind: 'single', address: '88 Cumberland Ave, Asheville, NC 28801',     scenario: 'low',    platforms: 0, scannedAgo: '5 h ago'    },
  { id: 'h06', kind: 'single', address: '301 Merrimon Ave, Asheville, NC 28804',      scenario: 'medium', platforms: 1, scannedAgo: '7 h ago'    },
  { id: 'h07', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',    scenario: 'high',   platforms: 3, scannedAgo: 'Yesterday' },
  { id: 'h08', kind: 'single', address: '23 Tunnel Rd, Asheville, NC 28805',          scenario: 'low',    platforms: 0, scannedAgo: 'Yesterday' },
  { id: 'h09', kind: 'single', address: '215 Edgewood Rd, Asheville, NC 28804',       scenario: 'medium', platforms: 1, scannedAgo: 'Yesterday' },
  { id: 'hb2', kind: 'batch',  filename: 'lender-portfolio-jan.csv', total: 42, flagged: 9, warn: 8, clean: 25, scannedAgo: '2 d ago' },
  { id: 'h10', kind: 'single', address: '450 Patton Ave, Asheville, NC 28806',        scenario: 'high',   platforms: 2, scannedAgo: '2 d ago'   },
  { id: 'h11', kind: 'single', address: '12 Hillside St, Asheville, NC 28801',        scenario: 'low',    platforms: 0, scannedAgo: '2 d ago'   },
  { id: 'h12', kind: 'single', address: '156 Sand Hill Rd, Asheville, NC 28806',      scenario: 'high',   platforms: 3, scannedAgo: '3 d ago'   },
  { id: 'h13', kind: 'single', address: '89 Beverly Rd, Asheville, NC 28805',         scenario: 'medium', platforms: 1, scannedAgo: '3 d ago'   },
  { id: 'h14', kind: 'single', address: '720 Haywood Rd, Asheville, NC 28806',        scenario: 'low',    platforms: 0, scannedAgo: '4 d ago'   },
  { id: 'h15', kind: 'single', address: '301 Lakeshore Dr, Asheville, NC 28804',      scenario: 'high',   platforms: 2, scannedAgo: '5 d ago'   },
  { id: 'h16', kind: 'single', address: '44 Pine Cone Ln, Asheville, NC 28803',       scenario: 'medium', platforms: 1, scannedAgo: '6 d ago'   },
  { id: 'h17', kind: 'single', address: '987 Sunset Pkwy, Asheville, NC 28806',       scenario: 'low',    platforms: 0, scannedAgo: '1 w ago'   },
  { id: 'h18', kind: 'single', address: '50 Ridgeview Ct, Asheville, NC 28805',       scenario: 'high',   platforms: 3, scannedAgo: '1 w ago'   },
];

const SEED_SCHEDULES: ScheduleEntry[] = [
  { id: 's01', kind: 'single', address: '1428 Maplewood Drive, Asheville, NC 28804', scenario: 'high', cadenceMonths: 6,  nextRunLabel: 'In 6 months',  createdAgo: '8 min ago' },
  { id: 's02', kind: 'batch',  filename: 'asheville-q1-2026.csv', total: 24,         cadenceMonths: 3,  nextRunLabel: 'In 3 months',  createdAgo: '2 h ago' },
  { id: 's03', kind: 'single', address: '67 Charlotte Hwy, Asheville, NC 28803',     scenario: 'high', cadenceMonths: 12, nextRunLabel: 'In 12 months', createdAgo: '3 h ago' },
  { id: 's04', kind: 'single', address: '145 Westchester Dr, Asheville, NC 28803',   scenario: 'high', cadenceMonths: 4,  nextRunLabel: 'In 4 months',  createdAgo: 'Yesterday' },
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
const SAMPLE_BATCH_OUTCOMES: Record<number, { score: number; risk: Risk; listings: number }> = {
  1:  { score: 87, risk: 'risk',  listings: 4 },
  2:  { score: 12, risk: 'clean', listings: 0 },
  3:  { score: 54, risk: 'warn',  listings: 1 },
  4:  { score: 76, risk: 'risk',  listings: 3 },
  5:  { score: 8,  risk: 'clean', listings: 0 },
  6:  { score: 91, risk: 'risk',  listings: 5 },
  7:  { score: 42, risk: 'warn',  listings: 1 },
  8:  { score: 18, risk: 'clean', listings: 0 },
  9:  { score: 64, risk: 'warn',  listings: 2 },
  10: { score: 71, risk: 'risk',  listings: 2 },
  11: { score: 9,  risk: 'clean', listings: 0 },
  12: { score: 33, risk: 'warn',  listings: 1 },
  13: { score: 22, risk: 'clean', listings: 0 },
  14: { score: 6,  risk: 'clean', listings: 0 },
};

// ---- context -----------------------------------------------------------

interface AppStateValue {
  liveBatch: LiveBatch | null;
  schedules: ScheduleEntry[];
  history: HistoryEntry[];
  startSampleBatch: () => void;
  clearBatch: () => void;
  dismissBatch: () => void;
  addSchedule: (entry: Omit<ScheduleEntry, 'id' | 'createdAgo' | 'nextRunLabel'> & { cadenceMonths: Cadence }) => void;
}

const AppStateContext = React.createContext<AppStateValue | null>(null);

function uid(prefix: string) {
  return prefix + '-' + Math.random().toString(36).slice(2, 9);
}

function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [liveBatch, setLiveBatch] = React.useState<LiveBatch | null>(null);
  const [schedules, setSchedules] = React.useState<ScheduleEntry[]>(SEED_SCHEDULES);
  const [history, setHistory] = React.useState<HistoryEntry[]>(SEED_HISTORY);

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
          const o = SAMPLE_BATCH_OUTCOMES[rows[runningIdx].id] ?? { score: 50, risk: 'warn' as Risk, listings: 1 };
          rows[runningIdx] = { ...rows[runningIdx], status: 'done', ...o };
        }
        const queuedIdx = rows.findIndex((r) => r.status === 'queued');
        if (queuedIdx >= 0) {
          rows[queuedIdx] = { ...rows[queuedIdx], status: 'running' };
        }
        const stillWorking = rows.some((r) => r.status !== 'done');
        if (!stillWorking) {
          // batch just finished — push a summary entry, mark complete
          const flagged = rows.filter((r) => r.risk === 'risk').length;
          const warn = rows.filter((r) => r.risk === 'warn').length;
          const clean = rows.filter((r) => r.risk === 'clean').length;
          setHistory((h) => [
            {
              id: uid('hb'),
              kind: 'batch',
              filename: prev.filename,
              total: rows.length,
              flagged,
              warn,
              clean,
              scannedAgo: 'Just now',
            },
            ...h,
          ]);
          return { ...prev, rows, status: 'complete' };
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

  const dismissBatch = React.useCallback(() => {
    setLiveBatch((prev) => (prev ? { ...prev, dismissed: true } : prev));
  }, []);

  const addSchedule = React.useCallback(
    (entry: any) => {
      const id = uid('s');
      const nextRunLabel = `In ${entry.cadenceMonths} months`;
      setSchedules((s) => [{ ...entry, id, nextRunLabel, createdAgo: 'Just now' }, ...s]);
    },
    []
  );

  const value: AppStateValue = {
    liveBatch,
    schedules,
    history,
    startSampleBatch,
    clearBatch,
    dismissBatch,
    addSchedule,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function useAppState(): AppStateValue {
  const ctx = React.useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside <AppStateProvider>');
  return ctx;
}
