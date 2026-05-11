/* global React, AppShell, Sidebar, PageHeader, Card, Button, Pill, Icon, ReactRouterDOM, BatchExportMenu, CertDownloadIcon */
// Batch processing — upload a CSV (or click "Try sample data") to scan
// dozens of properties in one queue. Shows a partially-complete batch:
// some scanned, some scanning, some queued.
//
// NB: do NOT destructure `useHistory` at module top level — HomeScreen.tsx
// already does that, and a second top-level `const { useHistory }` in shared
// script scope throws "Identifier 'useHistory' has already been declared",
// killing the bootstrap. Call `ReactRouterDOM.useHistory()` inline instead.

type Risk = 'clean' | 'warn' | 'risk';
type RowStatus = 'done' | 'running' | 'queued';
type Cadence = 3 | 4 | 6 | 12;

interface BatchRow {
  id: number;
  address: string;
  status: RowStatus;
  score?: number;
  risk?: Risk;
  listings?: number;
}

interface ScheduleState {
  enabled: boolean;
  cadence: Cadence;
}

interface RunRecord {
  id: number;
  date: Date;
  status: 'completed' | 'in-progress' | 'partial';
  duration?: string;
  errors?: number;
  isInitial?: boolean;
}

const CADENCES: Cadence[] = [3, 4, 6, 12];

const SAMPLE_BATCH: BatchRow[] = [
  { id: 1,  address: '1428 Maplewood Drive, Asheville, NC 28804', status: 'done', score: 87, risk: 'risk',  listings: 4 },
  { id: 2,  address: '502 N Liberty St, Asheville, NC 28801',     status: 'done', score: 12, risk: 'clean', listings: 0 },
  { id: 3,  address: '800 Hilliard Ave, Asheville, NC 28801',     status: 'done', score: 54, risk: 'warn',  listings: 1 },
  { id: 4,  address: '145 Westchester Dr, Asheville, NC 28803',   status: 'done', score: 76, risk: 'risk',  listings: 3 },
  { id: 5,  address: '23 Tunnel Rd, Asheville, NC 28805',         status: 'done', score: 8,  risk: 'clean', listings: 0 },
  { id: 6,  address: '67 Charlotte Hwy, Asheville, NC 28803',     status: 'done', score: 91, risk: 'risk',  listings: 5 },
  { id: 7,  address: '215 Edgewood Rd, Asheville, NC 28804',      status: 'done', score: 42, risk: 'warn',  listings: 1 },
  { id: 8,  address: '88 Cumberland Ave, Asheville, NC 28801',    status: 'done', score: 18, risk: 'clean', listings: 0 },
  { id: 9,  address: '301 Merrimon Ave, Asheville, NC 28804',     status: 'running' },
  { id: 10, address: '450 Patton Ave, Asheville, NC 28806',       status: 'running' },
  { id: 11, address: '12 Hillside St, Asheville, NC 28801',       status: 'queued' },
  { id: 12, address: '156 Sand Hill Rd, Asheville, NC 28806',     status: 'queued' },
  { id: 13, address: '89 Beverly Rd, Asheville, NC 28805',        status: 'queued' },
  { id: 14, address: '720 Haywood Rd, Asheville, NC 28806',       status: 'queued' },
];

// Demo: this is run #4 of a quarterly-scheduled batch, mid-flight today.
const SAMPLE_RUN_HISTORY: RunRecord[] = [
  { id: 4, date: new Date('2026-05-11'), status: 'in-progress' },
  { id: 3, date: new Date('2026-01-11'), status: 'completed', duration: '3h 58m' },
  { id: 2, date: new Date('2025-09-11'), status: 'partial',   duration: '4h 22m', errors: 12 },
  { id: 1, date: new Date('2025-05-11'), status: 'completed', duration: '4h 05m', isInitial: true },
];

// Calendar-month addition (March 15 + 3mo = June 15, not + 90 days).
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function cadenceLabel(c: Cadence): string {
  return c === 12 ? 'every 12 months' : `every ${c} months`;
}

type Phase = 'empty' | 'ready' | 'loaded';

interface PickedSource {
  label: string;
  addressCount: number;
}

function BatchScreen() {
  const [phase, setPhase] = React.useState<Phase>('empty');
  const [picked, setPicked] = React.useState<PickedSource | null>(null);

  // Upload form's draft schedule (off by default — Flow A).
  const [draftSchedule, setDraftSchedule] = React.useState<ScheduleState>({
    enabled: false,
    cadence: 4,
  });

  // Loaded view's persisted schedule. For the demo it starts active so the
  // banner + run history show up immediately.
  const [activeSchedule, setActiveSchedule] = React.useState<ScheduleState>({
    enabled: true,
    cadence: 4,
  });

  const onPickFile = (filename: string) => {
    setPicked({ label: filename, addressCount: SAMPLE_BATCH.length });
    setPhase('ready');
  };
  const onPickSample = () => {
    setPicked({ label: 'Sample batch · Asheville', addressCount: SAMPLE_BATCH.length });
    setPhase('ready');
  };
  const onStartScan = () => {
    setActiveSchedule(draftSchedule.enabled
      ? draftSchedule
      : { enabled: false, cadence: draftSchedule.cadence });
    setPhase('loaded');
  };
  const onResetUpload = () => {
    setPicked(null);
    setDraftSchedule({ enabled: false, cadence: 4 });
    setPhase('empty');
  };

  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader showSearch={false} />
      <div className="mt-5">
        {phase === 'empty' && (
          <BatchUpload onPickFile={onPickFile} onSample={onPickSample} />
        )}
        {phase === 'ready' && picked && (
          <BatchReady
            source={picked}
            schedule={draftSchedule}
            onScheduleChange={setDraftSchedule}
            onStartScan={onStartScan}
            onChangeSource={onResetUpload}
          />
        )}
        {phase === 'loaded' && (
          <BatchResults
            rows={SAMPLE_BATCH}
            schedule={activeSchedule}
            onScheduleChange={setActiveSchedule}
            onNewBatch={onResetUpload}
          />
        )}
      </div>
    </AppShell>
  );
}

// ---------- Phase 1: empty upload zone ----------

function BatchUpload({
  onPickFile,
  onSample,
}: {
  onPickFile: (filename: string) => void;
  onSample: () => void;
}) {
  return (
    <Card>
      <div className="px-6 pt-16 pb-16 flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-brand-soft text-brand grid place-items-center mb-5">
          <Icon name="upload" size={24} />
        </div>
        <h2 className="font-serif text-[26px] font-normal m-0 mb-2">
          Scan many properties at once
        </h2>
        <p className="text-ink-3 text-[14.5px] leading-relaxed max-w-[48ch] m-0 mb-7">
          Drop a CSV with one address per row. We'll cross-check every entry against
          Airbnb, Vrbo, and Facebook Marketplace, then surface the matches in one
          reviewable queue.
        </p>

        <label
          htmlFor="batch-csv"
          className="w-full max-w-[520px] cursor-pointer block rounded-lg border-2 border-dashed border-line-strong bg-surface-2 hover:bg-brand-soft hover:border-brand transition-colors px-6 py-8 mb-4"
        >
          <div className="font-medium text-ink-2 mb-1">
            Drop a CSV here, or <span className="text-brand">browse</span>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-ink-4">
            Required column: address · Up to 500 rows
          </div>
          <input
            id="batch-csv"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e: { target: HTMLInputElement }) => {
              const f = e.target.files?.[0];
              if (f) onPickFile(f.name);
            }}
          />
        </label>

        <Button variant="ghost" onClick={onSample} icon={<Icon name="layers" />}>
          Or try a sample batch
        </Button>
      </div>
    </Card>
  );
}

// ---------- Phase 2: ready-to-scan (CSV/sample chosen, schedule TBD) ----------

function BatchReady({
  source,
  schedule,
  onScheduleChange,
  onStartScan,
  onChangeSource,
}: {
  source: PickedSource;
  schedule: ScheduleState;
  onScheduleChange: (s: ScheduleState) => void;
  onStartScan: () => void;
  onChangeSource: () => void;
}) {
  return (
    <Card>
      {/* Source confirmation strip */}
      <div className="px-7 py-5 border-b border-line flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-clean-soft text-clean-ink grid place-items-center shrink-0">
            <Icon name="check" size={18} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-1">
              Ready to scan
            </div>
            <div className="text-ink text-[15px]">
              <span className="font-medium">{source.addressCount} addresses</span>
              <span className="text-ink-3"> · {source.label}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onChangeSource}>
          Choose different file
        </Button>
      </div>

      {/* Schedule control — Flow A steps 3–4 */}
      <div className="px-7 py-7 border-b border-line">
        <ScheduleControl schedule={schedule} onChange={onScheduleChange} />
      </div>

      {/* Start scan — Flow A step 5 */}
      <div className="px-7 py-5 bg-surface-2 flex items-center justify-between gap-4">
        <div className="text-[13px] text-ink-3">
          {schedule.enabled
            ? `This scan starts now. Reruns will follow ${cadenceLabel(schedule.cadence)}.`
            : "This is a one-time scan. You can turn on auto-rerun anytime from the batch's detail page."}
        </div>
        <Button variant="primary" onClick={onStartScan} icon={<Icon name="spark" />}>
          Start scan
        </Button>
      </div>
    </Card>
  );
}

// Reusable schedule picker. Used on upload (`mode="setup"`) and inline on
// the batch detail banner when the user clicks "Change cadence".
function ScheduleControl({
  schedule,
  onChange,
  mode = 'setup',
}: {
  schedule: ScheduleState;
  onChange: (s: ScheduleState) => void;
  mode?: 'setup' | 'edit';
}) {
  const nextRunPreview = formatDate(addMonths(new Date(), schedule.cadence));

  return (
    <div>
      {/* Header row: label + toggle (toggle hidden in edit mode — there it's
          always-on by definition). */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-2.5">
          <Icon name="replay" size={18} />
          <h3 className="font-serif text-[18px] font-normal m-0">
            Auto-rerun this batch
          </h3>
        </div>
        {mode === 'setup' && (
          <Toggle
            on={schedule.enabled}
            onChange={(on) => onChange({ ...schedule, enabled: on })}
            label="Enable auto-rerun"
          />
        )}
      </div>

      <p className="text-ink-3 text-[13.5px] leading-relaxed m-0 mb-5 max-w-[52ch]">
        {mode === 'setup'
          ? "We'll re-scan every address in this batch automatically, starting after this first run completes. You can change or cancel anytime."
          : 'Choose how often this batch re-runs. The next run is recomputed from when the most recent run completed.'}
      </p>

      {(schedule.enabled || mode === 'edit') && (
        <>
          <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-2">
            Cadence
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {CADENCES.map((c) => (
              <CadenceOption
                key={c}
                cadence={c}
                selected={schedule.cadence === c}
                onClick={() => onChange({ ...schedule, cadence: c })}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 text-[13px] text-ink-2 bg-surface-2 rounded-md px-3.5 py-2.5 border border-line">
            <Icon name="cal" size={15} />
            <span>
              Next run:{' '}
              <span className="font-medium text-ink">~{nextRunPreview}</span>
              <span className="text-ink-3">
                {mode === 'setup'
                  ? ' (after the first scan completes)'
                  : ' (' + cadenceLabel(schedule.cadence) + ' from last run)'}
              </span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function CadenceOption({
  cadence,
  selected,
  onClick,
}: {
  cadence: Cadence;
  selected: boolean;
  onClick: () => void;
}) {
  const base =
    'px-4 py-2 rounded-md text-[13px] font-medium border transition-colors';
  const cls = selected
    ? `${base} bg-brand text-white border-brand`
    : `${base} bg-surface text-ink-2 border-line hover:border-brand hover:text-brand`;
  return (
    <button type="button" onClick={onClick} className={cls}>
      Every {cadence} months
    </button>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${
        on ? 'bg-brand border-brand' : 'bg-surface-2 border-line-strong'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-px ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ---------- Loaded state: banner + summary + table + history ----------

function BatchResults({
  rows,
  schedule,
  onScheduleChange,
  onNewBatch,
}: {
  rows: BatchRow[];
  schedule: ScheduleState;
  onScheduleChange: (s: ScheduleState) => void;
  onNewBatch: () => void;
}) {
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  const progress = Math.round((done / total) * 100);

  return (
    <div className="flex flex-col gap-5">
      <AutoRerunBanner schedule={schedule} onChange={onScheduleChange} />

      {/* Summary card */}
      <Card>
        <div className="px-7 py-6">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-1.5">
                Batch · asheville-q2-2026.csv · Run #4 in progress
              </div>
              <h2 className="font-serif text-[28px] font-normal m-0 leading-tight">
                {total} properties
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <BatchExportMenu
                onExport={(mode) => {
                  // The dropdown handles its own download-in-progress state;
                  // here we'd kick off the real export by mode. Stub for the
                  // prototype — the trigger button shows feedback either way.
                  void mode;
                }}
              />
              <Button variant="primary" icon={<Icon name="upload" />} onClick={onNewBatch}>
                New batch
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-mono text-xs text-ink-3 shrink-0">
              {done}/{total} scanned · {running > 0 ? `${running} in progress` : 'queued'}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SummaryStat tone="risk"  count={flagged} label="Likely Rented" />
            <SummaryStat tone="warn"  count={warn}    label="Possibly Rented" />
            <SummaryStat tone="clean" count={clean}   label="No Public Evidence Found" />
          </div>
        </div>
      </Card>

      {/* Properties table */}
      <Card>
        <div className="px-7 py-5 border-b border-line flex items-center justify-between">
          <h3 className="font-serif text-[20px] font-normal m-0">Properties</h3>
          <span className="font-mono text-[11.5px] text-ink-3">click any row to view detail</span>
        </div>

        <div className="grid grid-cols-[40px_1fr_70px_220px_72px_72px] gap-4 px-7 py-3 bg-surface-2 border-b border-line font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
          <div>#</div>
          <div>Address</div>
          <div className="text-right">Score</div>
          <div>Verdict</div>
          <div className="text-right">Listings</div>
          <div />
        </div>

        {rows.map((row, i) => (
          <BatchRowItem key={row.id} index={i + 1} row={row} />
        ))}
      </Card>

      {/* Run history */}
      <RunHistory runs={SAMPLE_RUN_HISTORY} />
    </div>
  );
}

// ---------- Auto-rerun banner ----------

type BannerView = 'collapsed' | 'editing' | 'confirming-cancel';

function AutoRerunBanner({
  schedule,
  onChange,
}: {
  schedule: ScheduleState;
  onChange: (s: ScheduleState) => void;
}) {
  const [view, setView] = React.useState<BannerView>('collapsed');
  const [draft, setDraft] = React.useState<ScheduleState>(schedule);

  // Keep local edit-buffer in sync if external state changes.
  React.useEffect(() => setDraft(schedule), [schedule.enabled, schedule.cadence]);

  // Schedule disabled — minimal "set up" CTA.
  if (!schedule.enabled) {
    if (view === 'editing') {
      return (
        <div className="rounded-md border border-line bg-surface px-5 py-5">
          <ScheduleControl
            schedule={draft}
            onChange={(s) => setDraft({ ...s, enabled: true })}
            mode="edit"
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setView('collapsed')}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                onChange({ ...draft, enabled: true });
                setView('collapsed');
              }}
            >
              Turn on auto-rerun
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-md border border-dashed border-line-strong bg-surface-2 px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-ink-3 text-[13.5px]">
          <Icon name="replay" size={16} />
          <span>Auto-rerun is off for this batch.</span>
        </div>
        <Button variant="ghost" onClick={() => setView('editing')}>
          Set up auto-rerun
        </Button>
      </div>
    );
  }

  // Schedule active. Pick the right anchor for "next run":
  //   - If a run is in-flight, next is ~today + cadence (after this completes).
  //   - Otherwise it's the last completed run + cadence.
  const inProgressRun = SAMPLE_RUN_HISTORY.find((r) => r.status === 'in-progress');
  const lastCompletedRun = SAMPLE_RUN_HISTORY.find((r) => r.status !== 'in-progress');
  const nextRunAnchor = inProgressRun ? new Date() : (lastCompletedRun?.date ?? new Date());
  const nextRun = formatDate(addMonths(nextRunAnchor, schedule.cadence));

  if (view === 'editing') {
    const newNextRun = formatDate(addMonths(nextRunAnchor, draft.cadence));
    const cadenceChanged = draft.cadence !== schedule.cadence;
    return (
      <div className="rounded-md border border-brand-soft bg-brand-tint px-5 py-5">
        <ScheduleControl schedule={draft} onChange={setDraft} mode="edit" />
        {cadenceChanged && (
          <div className="mt-4 flex items-start gap-2 text-[13px] text-ink-2 bg-surface rounded-md px-3.5 py-2.5 border border-line">
            <Icon name="info" size={15} />
            <span>
              Next run will move from <strong>{nextRun}</strong> →{' '}
              <strong>{newNextRun}</strong>.
            </span>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setDraft(schedule);
              setView('collapsed');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onChange(draft);
              setView('collapsed');
            }}
          >
            Save cadence
          </Button>
        </div>
      </div>
    );
  }

  if (view === 'confirming-cancel') {
    return (
      <div className="rounded-md border border-line bg-surface-2 px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-start gap-2.5 text-[13.5px] text-ink-2">
          <Icon name="alert" size={16} />
          <span>
            Stop auto-rerun for this batch?{' '}
            <span className="text-ink-3">
              The current run will finish — the schedule won't fire again.
            </span>
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" onClick={() => setView('collapsed')}>
            Keep schedule
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onChange({ ...schedule, enabled: false });
              setView('collapsed');
            }}
          >
            Stop auto-rerun
          </Button>
        </div>
      </div>
    );
  }

  // Collapsed (default) — Flow C entry point.
  return (
    <div className="rounded-md border border-line bg-brand-tint px-5 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-[13.5px] text-ink">
        <span className="grid place-items-center w-7 h-7 rounded-full bg-brand-soft text-brand">
          <Icon name="replay" size={14} />
        </span>
        <span>
          <span className="font-medium">Auto-rerun:</span>{' '}
          {cadenceLabel(schedule.cadence)} —{' '}
          <span className="text-ink-2">
            {inProgressRun ? 'next run after this completes' : 'next run'}{' '}
            <span className="font-medium text-ink">
              {inProgressRun ? `~${nextRun}` : nextRun}
            </span>
          </span>
        </span>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" onClick={() => setView('editing')}>
          Change cadence
        </Button>
        <Button variant="ghost" onClick={() => setView('confirming-cancel')}>
          Cancel auto-rerun
        </Button>
      </div>
    </div>
  );
}

// ---------- Run history ----------

function RunHistory({ runs }: { runs: RunRecord[] }) {
  return (
    <Card>
      <div className="px-7 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Icon name="history" size={18} />
          <h3 className="font-serif text-[20px] font-normal m-0">Run history</h3>
        </div>
        <span className="font-mono text-[11.5px] text-ink-3">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'} total
        </span>
      </div>

      <div className="grid grid-cols-[60px_140px_1fr_120px_36px] gap-4 px-7 py-3 bg-surface-2 border-b border-line font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        <div>Run</div>
        <div>Date</div>
        <div>Status</div>
        <div className="text-right">Duration</div>
        <div />
      </div>

      {runs.map((run) => (
        <RunHistoryRow key={run.id} run={run} />
      ))}
    </Card>
  );
}

function RunHistoryRow({ run }: { run: RunRecord }) {
  const history = ReactRouterDOM.useHistory();
  const isInProgress = run.status === 'in-progress';

  const onClick = () => {
    if (!isInProgress) history.push('/result/high'); // demo target
  };

  const cls = `grid grid-cols-[60px_140px_1fr_120px_36px] gap-4 px-7 py-3.5 border-b border-line items-center ${
    isInProgress ? '' : 'cursor-pointer hover:bg-surface-2 transition-colors'
  }`;

  return (
    <div className={cls} onClick={onClick}>
      <div className="font-mono text-[12px] text-ink-2">
        #{run.id}
        {run.isInitial && (
          <span className="ml-1.5 font-mono text-[10px] text-ink-4 uppercase">
            initial
          </span>
        )}
      </div>
      <div className="text-[13px] text-ink-2">{formatDate(run.date)}</div>
      <div>
        {run.status === 'completed' && (
          <Pill variant="clean" dot>Completed</Pill>
        )}
        {run.status === 'in-progress' && (
          <Pill variant="brand" dot>In progress</Pill>
        )}
        {run.status === 'partial' && (
          <Pill variant="warn" dot>
            {run.errors} errors
          </Pill>
        )}
      </div>
      <div className="text-right text-[13px] text-ink-2 font-mono">
        {run.duration ?? <span className="text-ink-4">—</span>}
      </div>
      <div className="text-ink-3 grid place-items-center">
        {!isInProgress && <Icon name="arrow-right" size={14} />}
      </div>
    </div>
  );
}

// ---------- Sub-components ----------

const SUMMARY_TONE: Record<Risk, string> = {
  risk:  'bg-risk-soft text-risk-ink',
  warn:  'bg-warn-soft text-warn-ink',
  clean: 'bg-clean-soft text-clean-ink',
};

function SummaryStat({ tone, count, label }: { tone: Risk; count: number; label: string }) {
  return (
    <div className={`px-5 py-4 rounded-md ${SUMMARY_TONE[tone]}`}>
      <div className="font-serif text-[32px] font-normal leading-none mb-1">{count}</div>
      <div className="text-[13px] font-medium">{label}</div>
    </div>
  );
}

const VERDICT_LABEL: Record<Risk, string> = {
  risk:  'Likely Rented',
  warn:  'Possibly Rented',
  clean: 'No Public Evidence Found',
};

const ROUTE_FOR_RISK: Record<Risk, string> = {
  risk: '/result/high',
  warn: '/result/medium',
  clean: '/result/clean',
};

function BatchRowItem({ index, row }: { index: number; row: BatchRow }) {
  const history = ReactRouterDOM.useHistory();
  const isDone = row.status === 'done';
  const isRunning = row.status === 'running';
  const isQueued = row.status === 'queued';

  const onClick = () => {
    if (isDone && row.risk) history.push(ROUTE_FOR_RISK[row.risk]);
  };

  const rowCls = `group grid grid-cols-[40px_1fr_70px_220px_72px_72px] gap-4 px-7 py-3.5 border-b border-line items-center ${
    isQueued ? 'opacity-50' : ''
  } ${isDone ? 'cursor-pointer hover:bg-surface-2 transition-colors' : ''}`;

  return (
    <div className={rowCls} onClick={onClick}>
      <div className="font-mono text-[11.5px] text-ink-4">{String(index).padStart(2, '0')}</div>
      <div className="text-[13.5px] font-medium text-ink truncate">{row.address}</div>
      <div className="text-right font-serif text-[20px] leading-none">
        {isDone ? row.score : <span className="text-ink-4">—</span>}
      </div>
      <div>
        {isDone && row.risk && (
          <Pill
            variant={row.risk === 'risk' ? 'risk' : row.risk === 'warn' ? 'warn' : 'clean'}
          >
            {VERDICT_LABEL[row.risk]}
          </Pill>
        )}
        {isRunning && <Pill variant="brand" dot>Scanning</Pill>}
        {isQueued && <Pill>Queued</Pill>}
      </div>
      <div className="text-right text-[13px] text-ink-2">
        {isDone ? `${row.listings} found` : <span className="text-ink-4">—</span>}
      </div>
      <div className="flex items-center justify-end gap-1.5 text-ink-3">
        {isDone && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CertDownloadIcon
              payload={{
                address: row.address,
                date: new Date(),
                score: row.score,
                risk: row.risk,
                context: 'asheville-q2-2026.csv · Run #4',
              }}
              label="Save this property's certificate"
            />
          </span>
        )}
        {isDone && <Icon name="arrow-right" size={14} />}
      </div>
    </div>
  );
}
