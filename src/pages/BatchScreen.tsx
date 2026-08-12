/* global React, AppShell, Card, Button, Pill, Icon, Input, Textarea, DataTable, DropdownMenu, ReactRouterDOM,
   VERDICT_ACCENT, splitAddress, AutomationControl, AutomationBanner, VerdictTiles, EditableTitle,
   deriveTitleFromFilename, useAppState, AI_BAND_COPY, Modal, StatusPillSelector,
   ChipRow, reconcileOccupancy, INTENDED_OCCUPANCY_LABEL, RedFlag,
   OCC_INTENT_SHORT, OCC_VERDICT_LABEL, timeAgo, occMatchForRisk, RunHistory */
// Batch processing — upload a CSV (or click "Try a Sample Batch") to scan
// dozens of properties in one queue. The empty state is a configuration
// form (title, description, repeat cadence, optional advanced options);
// the live / completed state replaces it with an editable batch header,
// the AutomationBanner if a schedule exists, a progress summary, KPI tiles,
// and the per-row DataTable.
//
// NB: do NOT destructure `useHistory` at module top level — HomeScreen.tsx
// already does that, and a second top-level `const { useHistory }` in shared
// script scope throws "Identifier 'useHistory' has already been declared",
// killing the bootstrap. Call `ReactRouterDOM.useHistory()` inline instead.

type Risk = 'clean' | 'warn' | 'risk';
type RowStatus = 'done' | 'running' | 'queued' | 'failed';
type AiReportStatus = 'queued' | 'running' | 'done' | 'failed';

interface BatchRow {
  id: number;
  address: string;
  status: RowStatus;
  score?: number;
  risk?: Risk;
  listings?: number;
  errorReason?: string;
  /** Optional user-supplied identifier per the May-2026 lender spec. */
  reference?: string;
  /** Declared "as per loan" occupancy, mapped from the CSV column on upload.
   *  Undefined = fall back to the batch default. */
  intent?: IntendedOccupancy;
  /** The agentic AI report layered on top of the occupancy scan — mirrors
   *  LiveBatchRow.aiReport in AppState. Absent until AI is run on the row. */
  aiReport?: {
    status: AiReportStatus;
    verdictBand?: AIVerdictBand;
    errorReason?: string;
  };
}

const SAMPLE_BATCH: BatchRow[] = [
  { id: 1,  address: '412 Cumberland Ave, Asheville, NC 28801',   status: 'done', score: 87, risk: 'risk',  listings: 4 },
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

// A row is "red" when the config matrix reconciles its declared intent against
// what the scan found as Needs-review (status 'red'). Single source of truth:
// the Needs-review tile's count, the table filter, and the per-row ⚠ marker all
// read from this — so no address is red in one place and not another. Replaces
// the old hand-curated isRedAddress seed on this screen.
function isRowRed(row: BatchRow, defaultIntent?: IntendedOccupancy): boolean {
  if (row.status !== 'done') return false;
  return occMatchForRisk(row.intent ?? defaultIntent, row.risk)?.status === 'red';
}

// "Just now" within a minute, "N min ago" / "N h ago" / "N d ago" after.
// Relative-label formatter for the live batch identity strip; once the
// batch lands in history its `scannedAt` epoch drives `timeAgo()` instead.
function formatStartedAgo(startedAt: number): string {
  const elapsedMs = Date.now() - startedAt;
  const min = Math.floor(elapsedMs / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function BatchScreen() {
  const { liveBatch } = useAppState();

  // The page header is owned by whichever sub-tree is mounted:
  //   - BatchUpload renders the static "Batch Upload" h1 above the form.
  //   - BatchResults renders the editable batch title + identity strip.
  // Keeping it inside each branch lets the loaded state replace the page
  // header copy entirely instead of stacking two headings.
  return <AppShell>{liveBatch ? <BatchResults batch={liveBatch} /> : <BatchUpload />}</AppShell>;
}

// ---------- Empty state: upload form ----------

// Automation (cadence + verdict-band scope) is deliberately NOT collected
// here — both decisions belong on the results page where counts exist,
// and surfacing only "cadence" up front made the form heavier without
// completing the decision. Users opt into a recurring job via the
// post-results AutomationControl / AutomationBanner.

function BatchUpload() {
  const { startBatch, startSampleBatch, isBatchTitleTaken } = useAppState();

  // File state is just the filename for now — the no-build prototype doesn't
  // actually parse CSVs. Real wiring would expose row count + header
  // detection from here and feed them into the form. The filename is NOT
  // checked for uniqueness — a batch is identified to the user by its TITLE
  // (Trello #12), so the same file may back many batches with distinct titles.
  const [filename, setFilename] = React.useState<string>('');
  const [title, setTitle] = React.useState<string>('');
  // Track whether the user has hand-edited the title since the last file
  // drop. We auto-fill from the filename on drop, but never clobber a
  // title the user explicitly typed.
  const [titleTouched, setTitleTouched] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [addressColumn, setAddressColumn] = React.useState<string>('');
  // The "as per loan" occupancy default — applied to any property whose CSV
  // occupancy cell is blank or unmapped. 'not-sure' = observed-only (safe).
  const [defaultIntent, setDefaultIntent] = React.useState<IntendedOccupancy>('not-sure');
  const [advancedOpen, setAdvancedOpen] = React.useState<boolean>(false);
  // PROTOTYPE-ONLY: forces the Title field into a state for preview (app.html
  // demo affordance, see DemoStateToggle). 'error' paints the duplicate-title
  // error without an actual collision. Ignored wherever the demo flag is unset.
  const [demoTitleState, setDemoTitleState] = React.useState<'default' | 'error'>('default');

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the picker so re-selecting the same file still fires onChange.
    e.target.value = '';
    setFilename(file.name);
    // Auto-fill the title from the filename, but never clobber one the user
    // hand-typed. Uniqueness is validated below against the resolved title.
    if (!titleTouched) setTitle(deriveTitleFromFilename(file.name));
  }

  // The batch's effective title is what the user typed, else the derived
  // fallback BatchResults would show. Uniqueness is enforced on THAT value so
  // an empty field can't sneak a duplicate through via the fallback.
  const effectiveTitle = title.trim() || (filename ? deriveTitleFromFilename(filename) : '');
  // A duplicate title blocks the scan — no excludeFilename, since this is a
  // brand-new batch with no identity of its own to ignore.
  const titleTaken = effectiveTitle.length > 0 && isBatchTitleTaken(effectiveTitle);
  // Demo override forces the error on regardless of a real collision, so a dev
  // can preview it (app.html only). It's visual-only — it never gates submit.
  const demoError = demoTitleState === 'error';
  // Only surface the real error once a file is staged (an empty form isn't
  // "wrong"); the demo override shows it anytime for preview purposes.
  const showTitleError = demoError || (filename.length > 0 && titleTaken);
  // Sample title so the demo message reads naturally before any file is staged.
  const errorTitleText = effectiveTitle || 'Asheville Spring Sweep';

  function onSubmit() {
    if (!filename || titleTaken || !effectiveTitle) return;
    startBatch({
      filename,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      addressColumn: addressColumn.trim() || undefined,
      defaultIntent,
    });
  }

  const canSubmit = filename.length > 0 && effectiveTitle.length > 0 && !titleTaken;

  return (
    <>
      {/* Static page header — only the empty state shows it. Once a batch
          is live, BatchResults takes over with the editable batch title. */}
      <header className="mb-section-sub">
        <h1
          className="font-sans font-semibold text-h3 leading-[1.1] tracking-[-0.012em] m-0"
          style={{ color: 'var(--navy)' }}
        >
          Batch Upload
        </h1>
        <p className="text-body-sm text-ink-2 leading-relaxed m-0 mt-2">
          Upload a CSV to screen an entire list of addresses in one pass.
        </p>
      </header>

      <Card>
        {/* The page-header h1 + subtitle does the welcome job already, so
            the card skips its own hero band and opens straight onto the
            drop zone. Saves ~240 px of vertical real estate, putting the
            primary CTA at or near the fold on a standard viewport. */}
        <div className="px-card-loose py-card flex flex-col items-center">
          {/* ----- Drop zone ----- */}
          {/* Tall, centered drop target — min-h gives it real presence as
              the primary affordance on the page; content is vertically
              centered so the box reads as a deliberate "drop here" surface
              rather than a thin bar. */}
          <label
            htmlFor="batch-csv"
            className={`w-full max-w-[560px] min-h-[220px] cursor-pointer flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors px-card py-section text-center ${
              filename
                ? 'border-brand bg-brand-soft/40'
                : 'border-line bg-surface hover:bg-brand-soft hover:border-brand'
            }`}
          >
            {filename ? (
              <>
                <div className="font-medium text-ink-2 mb-stack-tight">
                  <span className="inline-flex items-center gap-2">
                    <Icon name="check" size={14} />
                    {filename}
                  </span>
                </div>
                <div className="font-sans text-micro uppercase tracking-widest text-ink-3">
                  Click to swap file
                </div>
              </>
            ) : (
              <>
                <div className="font-medium text-ink-2 mb-stack-tight">
                  Drop a CSV here, or <span className="text-brand">browse</span>
                </div>
                <div className="font-sans text-micro uppercase tracking-widest text-ink-4">
                  Required column: address · Up to 500 rows
                </div>
              </>
            )}
            <input
              id="batch-csv"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFilePicked}
            />
          </label>

          {/* ----- About this batch ----- */}
          <FormSection label="About this batch" className="mt-section-sub w-full max-w-[560px]">
            {/* Title is the batch's identity — it must be unique (Trello #12).
                A collision blocks the scan and surfaces the design-system error
                on the field itself (the fixable thing), not on the drop zone. */}
            <Input
              label="Title"
              value={title}
              placeholder="Asheville Q2 2026"
              maxLength={80}
              error={showTitleError}
              hint={
                showTitleError
                  ? `A batch titled “${errorTitleText}” already exists. Choose a different title.`
                  : undefined
              }
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
            />
            {/* Prototype-only preview switch — renders solely in app.html so a
                dev can see the duplicate-title error state on demand. */}
            <DemoStateToggle
              label="Title field"
              value={demoTitleState}
              onChange={(v) => setDemoTitleState(v as 'default' | 'error')}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'error', label: 'Duplicate title' },
              ]}
            />
            <Textarea
              id="batch-description"
              label={
                <>
                  Description <span className="text-ink-3 font-normal">(optional)</span>
                </>
              }
              value={description}
              maxLength={280}
              rows={3}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(e.target.value)
              }
              placeholder="Add context that&rsquo;ll appear on the batch detail page."
              hint="Up to 280 characters · shown on the batch detail page."
            />
          </FormSection>

          {/* ----- Intended occupancy (as per loan) — batch level -----
               One declaration for the whole batch. Per-row occupancy was
               dropped at the client's direction: intended behaviour is a
               batch-level fact, not row-level. Every property in the batch
               inherits this value, reconciled against what its scan finds. */}
          <div className="mt-section-sub w-full max-w-[560px] flex flex-col gap-stack-tight">
            <ChipRow
              label="Intended Occupancy"
              value={defaultIntent}
              onChange={(v: string) => setDefaultIntent(v as IntendedOccupancy)}
              options={[
                { value: 'owner-occupied', label: 'Owner-occupied' },
                { value: 'rental', label: 'Rental / investment' },
                { value: 'second-home', label: 'Second home' },
                { value: 'not-sure', label: 'Not sure' },
              ]}
            />
            <p className="font-sans text-caption" style={{ color: 'var(--ink-3)' }}>
              Applied to every property in this batch. We compare it against
              what each scan finds and flag the ones that don&rsquo;t match.
            </p>
          </div>

          {/* ----- Advanced (collapsed) ----- */}
          <div className="mt-section-sub w-full max-w-[560px]">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              aria-expanded={advancedOpen}
              className="inline-flex items-center gap-stack-tight font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-hover-bg"
              style={{ color: 'var(--ink-3)' }}
            >
              <span
                className={`inline-flex shrink-0 transition-transform ${
                  advancedOpen ? 'rotate-180' : ''
                } [&>svg]:w-3 [&>svg]:h-3`}
                aria-hidden
              >
                <Icon name="chevron" size={12} />
              </span>
              Advanced
              <span
                className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded border border-line normal-case tracking-normal"
                style={{ background: 'var(--surface-2)', color: 'var(--ink-3)' }}
              >
                1 option
              </span>
            </button>
            {advancedOpen && (
              <div className="mt-stack-md flex flex-col gap-stack">
                <Input
                  label="Address column name"
                  value={addressColumn}
                  placeholder='e.g. "address" or "fulladdress"'
                  hint="We auto-detect a column named 'address' by default."
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setAddressColumn(e.target.value)
                  }
                />
              </div>
            )}
          </div>

          {/* ----- Submit + escape hatch ----- */}
          <div className="mt-section w-full max-w-[560px] flex flex-col items-center gap-stack-tight">
            <Button
              variant="primary"
              icon={<Icon name="layers" />}
              onClick={onSubmit}
              disabled={!canSubmit}
              className="w-full justify-center"
            >
              Start batch scan
            </Button>
            {!canSubmit && (
              <div className="font-sans text-micro" style={{ color: 'var(--ink-3)' }}>
                {filename.length === 0
                  ? 'Drop a CSV to continue.'
                  : showTitleError
                  ? 'Give this batch a unique title to continue.'
                  : 'Add a title to continue.'}
              </div>
            )}
            <div
              className="mt-stack-tight inline-flex items-center gap-stack-tight font-sans text-caption"
              style={{ color: 'var(--ink-3)' }}
            >
              <span>or</span>
              <Button
                variant="ghost"
                size="sm"
                icon={<Icon name="layers" />}
                onClick={startSampleBatch}
              >
                Try a sample batch
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// DemoStateToggle — PROTOTYPE-ONLY state previewer. app.html sets
// window.__TO_DEMO_STATES__ (see its bootstrap); this renders a small dashed
// "Demo · <label>" chip row that lets a dev force a component into a given
// state — e.g. the duplicate-title error — so they can SEE how it renders
// without having to reproduce the collision. It returns null wherever the flag
// is unset (states-spec / occupancy-spec handoff canvases, and Prod, which
// never ships this prototype), so no host-specific wiring or files-array edits
// are needed — drop it in and it self-scopes to app.html.
function DemoStateToggle({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  if (typeof window === 'undefined' || !(window as any).__TO_DEMO_STATES__) return null;
  return (
    <div
      className="w-full max-w-[560px] mt-stack-tight rounded-md border border-dashed px-3 py-2 flex items-center gap-2 flex-wrap"
      style={{ background: 'var(--surface-2)', borderColor: 'var(--line)' }}
    >
      <span
        className="font-sans text-micro font-semibold uppercase tracking-[0.14em]"
        style={{ color: 'var(--ink-4)' }}
      >
        Demo · {label}
      </span>
      <div className="flex items-center gap-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              aria-pressed={active}
              className={`font-sans text-micro font-medium rounded px-2 py-1 border transition-colors ${
                active
                  ? 'border-brand bg-brand-soft text-brand-deep'
                  : 'border-line text-ink-3 hover:bg-hover-bg'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// FormSection — eyebrow-label group used inside BatchUpload. Keeps the form
// readable by grouping logically-related fields under a one-line label,
// matching the "About this batch" / "Repeat this job" / "Advanced" rhythm
// in the locked design without introducing a new heavyweight primitive.
function FormSection({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div
        className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-stack-md"
        style={{ color: 'var(--ink-3)' }}
      >
        {label}
      </div>
      <div className="flex flex-col gap-stack">{children}</div>
    </div>
  );
}

// ---------- Loaded state: header + table ----------

function BatchResults({ batch, readOnly }: { batch: any; readOnly?: boolean }) {
  const routerHistory = ReactRouterDOM.useHistory();
  const {
    clearBatch,
    retryBatchRow,
    startBatchAIReports,
    runRowAIReport,
    findScheduleByTarget,
    renameBatch,
    setBatchDescription,
    isBatchTitleTaken,
  } = useAppState();
  const rows: BatchRow[] = batch.rows;
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  // Reconciliation status per scanned row (declared intent × verdict), the
  // number the tiles + filters now key off. green/yellow/red → Consistent /
  // Inconclusive / Needs review.
  const matchStatusOf = (r: BatchRow) =>
    r.status === 'done' ? occMatchForRisk(r.intent ?? batch.defaultIntent, r.risk)?.status : undefined;
  const consistentCount = rows.filter((r) => matchStatusOf(r) === 'green').length;
  const inconclusiveCount = rows.filter((r) => matchStatusOf(r) === 'yellow').length;
  const needsReviewCount = rows.filter((r) => matchStatusOf(r) === 'red').length;
  const progress = Math.round((done / total) * 100);
  const isComplete = batch.status === 'complete';

  // ----- AI report batch phase -----
  // The AI phase spans only the rows the trigger queued (those carrying an
  // `aiReport`). Counts drive the AI progress banner and the trigger's
  // enable/disable + "N flagged" copy. Gated on `!readOnly` end to end: the
  // historical detail view sources from a frozen history snapshot, not the
  // live batch the AI worker mutates, so its AI controls would be dead.
  const aiPhase = batch.aiPhase as { status: 'running' | 'complete'; scope: Risk[] } | undefined;
  const aiRows = rows.filter((r) => r.aiReport);
  const aiTotal = aiRows.length;
  const aiDone = aiRows.filter((r) => r.aiReport!.status === 'done').length;
  const aiActive = aiRows.filter(
    (r) => r.aiReport!.status === 'running' || r.aiReport!.status === 'queued'
  ).length;
  const aiRunning = aiPhase?.status === 'running';
  const aiProgress = aiTotal > 0 ? Math.round((aiDone / aiTotal) * 100) : 0;
  const canRunAI = !readOnly && isComplete;
  // Which verdict statuses to run occupancy reports for. Multi-select (any
  // combination) — a user may want just "Inconclusive", or "Needs review +
  // Consistent", not only the old cumulative tiers. startBatchAIReports already
  // accepts any Risk[]; this lets the UI express it.
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportScope, setReportScope] = React.useState<Risk[]>(['risk']);
  const [lastReportRun, setLastReportRun] = React.useState<{
    time: Date;
    categories: Risk[];
  } | null>(null);

  // Rows a run with the current scope would actually queue: completed,
  // in-scope, and not already holding a done report (failed ones re-run).
  // Drives the primary button's count + disabled state.
  const reportEligible = rows.filter(
    (r) =>
      r.status === 'done' &&
      r.risk &&
      reportScope.includes(r.risk) &&
      (!r.aiReport || r.aiReport.status === 'failed')
  ).length;

  const runReports = () => {
    if (reportScope.length === 0 || reportEligible === 0) return;
    startBatchAIReports(reportScope);
    setLastReportRun({ time: new Date(), categories: [...reportScope] });
    setReportOpen(false);
  };

  // Per-status counts feed both the AutomateModal scope card and the
  // AutomationBanner. Re-derived on every render off the latest rows so the
  // "X of Y" follows the data after retries / new scans.
  const scopeCounts = { risk: flagged, warn, clean };
  const scopeCountsPending = !isComplete;

  // Active schedule for this batch, if any. When present we replace the
  // compact AutomationControl button with the verbose AutomationBanner.
  const activeSchedule: any = findScheduleByTarget({ kind: 'batch', filename: batch.filename });

  const failedRows = rows.filter((r) => r.status === 'failed');
  const failedCount = failedRows.length;
  const onRetryAllFailed = readOnly
    ? undefined
    : () => {
        failedRows.forEach((r) => retryBatchRow(r.id));
      };

  type MatchFilter = 'all' | 'consistent' | 'inconclusive' | 'needsReview';
  const MATCH_FILTER_STATUS: Record<Exclude<MatchFilter, 'all'>, 'green' | 'yellow' | 'red'> = {
    consistent: 'green',
    inconclusive: 'yellow',
    needsReview: 'red',
  };
  const [query, setQuery] = React.useState('');
  const [matchFilter, setMatchFilter] = React.useState<MatchFilter>('all');
  // How many properties in THIS batch are flagged red. Red = the config
  // matrix's "Needs review" status, so this is the same number the tile shows
  // and the same rows that carry the ⚠ marker — one definition, everywhere.
  const redCount = needsReviewCount;

  // Arriving from a "N red" badge pre-applies the red (Needs-review) filter so
  // the user lands on just the red properties. One-shot: cleared once read.
  React.useEffect(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('batchOpenRedFilter') === '1') {
      sessionStorage.removeItem('batchOpenRedFilter');
      if (redCount > 0) setMatchFilter('needsReview');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = rows.filter((r) => {
    if (matchFilter !== 'all') {
      if (r.status !== 'done' || matchStatusOf(r) !== MATCH_FILTER_STATUS[matchFilter]) return false;
    }
    if (query && !r.address.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleMatch = (v: 'consistent' | 'inconclusive' | 'needsReview') =>
    setMatchFilter((cur) => (cur === v ? 'all' : v));

  const uploadedLabel: string =
    batch.scannedAt ? timeAgo(batch.scannedAt) : (batch.startedAt ? formatStartedAgo(batch.startedAt) : 'Just now');

  // Resolved display title — user-chosen, falling back to a derived label so
  // legacy seeds and unnamed batches still read as a name, not a filename.
  const displayTitle = batch.title?.trim() || deriveTitleFromFilename(batch.filename);

  return (
    <div className="flex flex-col gap-section-sub">
      {/* Page header — editable batch title + description + identity strip
          on the left; action buttons (automation, download, new batch) on
          the right. Replaces the static "Batch Upload" h1 used in the
          upload state. */}
      <header className="flex items-start justify-between gap-6 flex-wrap">
        <div className="min-w-0 flex-1 flex flex-col gap-stack-tight">
          {/* Title + description are metadata annotation, not run data, so
              they stay editable on every view — including the historical
              detail page and when empty (the placeholder lets the user add
              one later). `renameBatch`/`setBatchDescription` propagate the
              edit into the stored history entry by filename. The `readOnly`
              flag governs row-level re-execution (retry) only — NOT
              automation, which is a forward-looking schedule independent of
              the run beneath it, so it's offered on historical views too. */}
          <EditableTitle
            value={displayTitle}
            onSave={(next) => renameBatch(batch.id, next)}
            validate={(next) =>
              isBatchTitleTaken(next, batch.filename)
                ? `A batch titled “${next.trim()}” already exists. Choose a different title.`
                : null
            }
            placeholder="Untitled batch"
            maxLength={80}
            variant="h1"
            ariaLabel="Batch title"
          />
          <EditableTitle
            value={batch.description}
            onSave={(next) => setBatchDescription(batch.id, next)}
            placeholder="Add a description"
            maxLength={280}
            variant="body-sm"
            multiline
            ariaLabel="Batch description"
          />
          {/* Identity strip — audit fact, never editable. Mono caption so it
              reads as a tag line of facts rather than user-facing copy. */}
          <div
            className="font-mono text-caption tabular-nums truncate"
            style={{ color: 'var(--ink-3)' }}
          >
            {batch.filename} · {total} {total === 1 ? 'property' : 'properties'} · Uploaded {uploadedLabel}
          </div>
          {/* Batch-level intended occupancy — one declaration for the whole
              batch (per the client: intent is a batch-level fact). Stated up top
              so the reconciliation counts below read against a known baseline. */}
          {batch.defaultIntent && INTENDED_OCCUPANCY_LABEL[batch.defaultIntent] && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 font-sans text-caption">
              <span
                className="text-eyebrow font-semibold tracking-[0.14em] uppercase"
                style={{ color: 'var(--ink-3)' }}
              >
                Intended occupancy
              </span>
              <span className="font-semibold" style={{ color: 'var(--navy)' }}>
                {INTENDED_OCCUPANCY_LABEL[batch.defaultIntent]}
              </span>
              <span className="text-ink-4" aria-hidden>·</span>
              <span className="text-ink-3">applies to all {total}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          {!activeSchedule && (
            <AutomationControl
              target={{
                kind: 'batch',
                filename: batch.filename,
                total,
                scopeCounts,
                scopeCountsPending,
              }}
            />
          )}
          {/* Run AI reports — the batch AI phase trigger. Offered once the
              occupancy scan is complete (you can't reason over rows that
              haven't landed) and only on the live batch, never the read-only
              historical view. Scope options match the red-threshold flow. */}
          {canRunAI && (
            <Button
              icon={
                aiRunning ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full border-[1.6px] border-current border-t-transparent animate-spin"
                    aria-hidden
                  />
                ) : (
                  <Icon name="ai-star" />
                )
              }
              iconRight={
                aiTotal > 0 && !aiRunning ? (
                  <span className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded bg-brand-soft text-brand-deep">
                    {aiDone}
                  </span>
                ) : undefined
              }
              onClick={() => setReportOpen(true)}
            >
              {aiRunning
                ? `Running… ${aiDone}/${aiTotal}`
                : aiTotal > 0
                ? 'Run more reports'
                : 'Run occupancy reports'}
            </Button>
          )}
          <DropdownMenu
            title="Download Report"
            trigger={(open: boolean) => (
              <Button
                icon={<Icon name="pdf" />}
                iconRight={
                  <span
                    className={`inline-flex shrink-0 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
                    aria-hidden
                  >
                    <Icon name="chevron" size={12} />
                  </span>
                }
              >
                Download
              </Button>
            )}
            items={[
              {
                label: 'PDF report',
                hint: 'Lender-ready certificate with live evidence links',
                icon: <Icon name="pdf" />,
                onClick: () => window.print(),
              },
              {
                label: 'CSV',
                hint: 'Tabular data for spreadsheets',
                icon: <Icon name="layers" />,
                onClick: () => {},
              },
              {
                label: 'ZIP archive',
                hint: 'PDF + CSV + per-listing screenshots',
                icon: <Icon name="layers" />,
                onClick: () => {},
              },
            ]}
          />
          {/* "New Batch" is always available, including on the read-only
              historical view — "go start another scan" is a navigation
              affordance, not an edit action, so there's no reason to hide
              it when the user is reviewing a past batch. */}
          <Button
            variant="primary"
            icon={<Icon name="upload" />}
            onClick={() => {
              clearBatch();
              routerHistory.push('/batch');
            }}
          >
            New Batch
          </Button>
        </div>
      </header>

      {/* Active automation banner — shown on BOTH the live batch view and
          a historical detail view, because the schedule is a separate live
          entity from the (read-only) batch run beneath it. readOnly here
          only governs row-level actions like retry, not the automation. */}
      {activeSchedule && activeSchedule.kind === 'batch' && (
        <AutomationBanner
          schedule={{
            id: activeSchedule.id,
            cadence: activeSchedule.cadence,
            nextRunLabel: activeSchedule.nextRunLabel,
            statuses: activeSchedule.statuses,
            retention: activeSchedule.retention,
          }}
          batch={{
            filename: batch.filename,
            total,
            counts: scopeCounts,
            countsPending: scopeCountsPending,
          }}
        />
      )}

      {/* Summary card — now just the progress headline + bar. Action
          buttons moved up to the page header so the card stays focused
          on the actual "what's happening to my scan" signal. */}
      <Card allowOverflow>
        <div className="px-card-loose py-card">
          <h2
            className="font-sans font-semibold text-h3 tracking-[-0.005em] m-0 mb-section-tight leading-tight"
            style={{ color: 'var(--navy)' }}
          >
            {isComplete ? (
              <span className="status-text-in">{total} properties scanned</span>
            ) : (
              <span className="status-text-pulse">
                Scanning {done} of {total}
                <span className="status-dots" aria-hidden="true">
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </span>
            )}
          </h2>

          {/* Progress */}
          <div className="flex items-center gap-stack-md">
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-sans text-xs text-ink-3 shrink-0 tabular-nums">
              {done}/{total} scanned{!isComplete && running > 0 ? ` · ${running} in progress` : ''}
            </div>
          </div>

          {/* Occupancy-report status — a compact secondary row inside the same
              card, not a second full-width progress surface. While running it
              shows a live count + slim bar; once done it collapses to a single
              confirmation line. Per-row occupancy lands in the table column. */}
          {aiPhase && (
            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {aiRunning ? (
                  <span
                    className="w-4 h-4 rounded-full border-[1.8px] border-brand border-t-transparent animate-spin shrink-0"
                    aria-hidden
                  />
                ) : (
                  <span
                    className="w-5 h-5 rounded-full grid place-items-center bg-clean text-white shrink-0 [&>svg]:w-3 [&>svg]:h-3"
                    aria-hidden
                  >
                    <Icon name="check" size={12} />
                  </span>
                )}
                <span
                  className="font-sans text-body-sm font-medium truncate"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {aiPhase.status === 'complete'
                    ? `${aiDone} occupancy report${aiDone === 1 ? '' : 's'} generated`
                    : `Generating occupancy reports · ${aiDone} of ${aiTotal}`}
                </span>
              </div>
              {aiRunning && (
                <div className="w-28 sm:w-40 h-1 bg-line rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-500"
                    style={{ width: `${aiProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Reconciliation counts — sit outside the summary card, mirroring the
          dashboard KPI strip. Declared intent × verdict, not raw verdict. */}
      <VerdictTiles
        consistent={consistentCount}
        inconclusive={inconclusiveCount}
        needsReview={needsReviewCount}
        redCount={redCount}
        onSelect={toggleMatch}
        selected={matchFilter === 'all' ? null : matchFilter}
        onAutomate={
          !activeSchedule && isComplete
            ? () => window.dispatchEvent(new Event('halcyon:open-automate'))
            : undefined
        }
      />

      {/* Properties — same DataTable primitive as Home + History */}
      <div>
        <div className="flex items-end justify-between mb-stack-md gap-stack flex-wrap">
          <h3
            className="font-sans font-semibold text-h4 sm:text-h3 tracking-[-0.005em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            Properties
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRetryAllFailed && failedCount > 0 && (
              <button
                type="button"
                onClick={onRetryAllFailed}
                aria-label={`Retry ${failedCount} failed ${failedCount === 1 ? 'scan' : 'scans'}`}
                title={`Retry ${failedCount} failed ${failedCount === 1 ? 'scan' : 'scans'}`}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border text-caption font-medium transition-colors shrink-0 bg-risk-soft text-risk-ink border-transparent hover:opacity-90"
              >
                <Icon name="replay" size={14} />
                <span className="hidden sm:inline">Retry Failed</span>
                <span className="tabular-nums text-micro font-semibold px-1.5 py-0.5 rounded bg-white/60">
                  {failedCount}
                </span>
              </button>
            )}
            <div className="relative flex-1 sm:flex-initial sm:w-[260px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 [&>svg]:w-3.5 [&>svg]:h-3.5">
                <Icon name="search" size={14} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Filter by address"
                className="w-full h-8 pl-8 pr-3 rounded-md bg-surface border border-line text-label outline-none focus:border-brand placeholder:text-ink-4"
              />
            </div>
          </div>
        </div>
        <BatchTable
          rows={filteredRows}
          onRunRowAI={canRunAI ? runRowAIReport : undefined}
          defaultIntent={batch.defaultIntent}
          redView={matchFilter === 'needsReview'}
        />
      </div>

      {/* Run occupancy reports — pick ANY combination of verdict statuses to
          reason over, then run. Multi-select replaces the old cumulative-only
          presets (Needs review / +Inconclusive / +All). Only completed, in-scope rows
          without a done report are queued; failed ones re-run. */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Run occupancy reports"
        width={460}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={reportEligible === 0}
              onClick={runReports}
            >
              {reportScope.length === 0
                ? 'Select a status'
                : reportEligible > 0
                ? `Run ${reportEligible} report${reportEligible === 1 ? '' : 's'}`
                : 'No eligible rows'}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-ink-2 mb-4 leading-relaxed">
          Choose which reconciliation statuses to generate occupancy reports for. Pick
          any combination. Reports run on completed scans only — rows that
          already have a report are skipped, and failed ones re-run.
        </p>
        <StatusPillSelector
          options={[
            { value: 'risk',  label: 'Needs review',  count: scopeCounts.risk },
            { value: 'warn',  label: 'Inconclusive', count: scopeCounts.warn },
            { value: 'clean', label: 'Consistent',   count: scopeCounts.clean },
          ]}
          value={reportScope}
          onChange={(next) => setReportScope(next)}
          countsPending={scopeCountsPending}
          ariaLabel="Which reconciliation statuses to run occupancy reports for"
        />
        <p className="text-caption text-ink-3 mt-4">
          {reportScope.length === 0
            ? 'Select at least one status to run.'
            : reportEligible === 0
            ? 'No completed rows in the selected statuses need a report right now.'
            : `${reportEligible} ${reportEligible === 1 ? 'row' : 'rows'} will be queued.`}
        </p>
        {lastReportRun && (
          <p className="text-caption text-ink-3 mt-2">
            <span className="font-medium">Note:</span>{' '}
            Last run {lastReportRun.time.toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: 'numeric',
              minute: '2-digit', hour12: true,
            })}{' · '}
            {lastReportRun.categories.map(c =>
              c === 'risk' ? 'Needs review' : c === 'warn' ? 'Inconclusive' : 'Consistent'
            ).join(', ')}
          </p>
        )}
      </Modal>

      {/* Run history — prior runs of this same CSV. Re-runs don't stack new
          History rows; they collapse to one and the timeline lives here. */}
      <RunHistory kind="batch" filename={batch.filename} />

    </div>
  );
}

function BatchTable({
  rows,
  onRunRowAI,
  defaultIntent,
  redView,
}: {
  rows: BatchRow[];
  /** Per-row "run AI now" handler. Undefined on the read-only historical
   *  view, which collapses the AI column's idle cell to a dash. */
  onRunRowAI?: (rowId: number) => void;
  /** Batch-level occupancy default — applied to rows with no mapped intent. */
  defaultIntent?: IntendedOccupancy;
  /** Red-flags filter is active — show Declared vs Found instead of the
   *  score/AI columns, so the user can see WHY each row is red. */
  redView?: boolean;
}) {
  const history = ReactRouterDOM.useHistory();

  function openIfDone(row: BatchRow) {
    // Every done row — red or not — opens its occupancy report. Red rows keep
    // their flag in the cell; the report is where the finding is reviewed.
    if (row.status === 'done' && row.risk) {
      history.push(ROUTE_FOR_RISK[row.risk]);
    }
  }

  const columns = React.useMemo(
    () => (redView ? buildBatchRedColumns(defaultIntent) : buildBatchColumns(onRunRowAI, defaultIntent)),
    [onRunRowAI, defaultIntent, redView]
  );

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(r: BatchRow) => String(r.id)}
      onRowClick={openIfDone}
      pageSize={25}
      leadingAccent={(r: BatchRow) =>
        r.status === 'done' && r.risk
          ? VERDICT_ACCENT[r.risk]
          : r.status === 'failed'
          ? VERDICT_ACCENT.risk
          : undefined
      }
    />
  );
}

// ---------- Sub-components ----------

const VERDICT_LABEL: Record<Risk, string> = {
  risk: 'Needs review',
  warn: 'Inconclusive',
  clean: 'Consistent',
};

// Map a row's risk band to the matching detail-screen route, so the demo
// has somewhere believable to drill into.
// Column set shown when the batch table is filtered to Red flags. Trades the
// score/listings/AI columns for Declared vs Found, so the reason a row is red
// is visible in-line (mirrors the standalone red list). Few, modest widths so
// the address track keeps its room.
function buildBatchRedColumns(defaultIntent?: IntendedOccupancy): any[] {
  const verdictOf = (row: BatchRow): string =>
    row.risk === 'risk' ? 'rented' : row.risk === 'warn' ? 'possibly-rented' : 'not-rented';
  const intentOf = (row: BatchRow): string => row.intent ?? defaultIntent ?? 'owner-occupied';
  return [
    {
      key: 'address',
      label: 'Address',
      primary: true,
      cell: (row: BatchRow) => {
        const [street, locality] = splitAddress(row.address);
        return (
          <div className="min-w-0">
            <div className="flex items-center gap-inline min-w-0">
              <span className="font-sans font-semibold text-body-sm leading-tight truncate" style={{ color: 'var(--navy)' }}>
                {street}
              </span>
              {isRowRed(row, defaultIntent) && <RedFlag address={row.address} />}
            </div>
            {locality && (
              <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">{locality}</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'declared',
      label: 'Declared',
      width: '132px',
      hideBelow: 'md' as const,
      cell: (row: BatchRow) => (
        <span className="font-sans text-caption text-ink-2">{OCC_INTENT_SHORT[intentOf(row)]}</span>
      ),
    },
    {
      key: 'found',
      label: 'Found',
      width: '132px',
      cell: (row: BatchRow) => (
        <span className="font-sans text-caption text-ink-2">{OCC_VERDICT_LABEL[verdictOf(row)]}</span>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      width: '72px',
      align: 'right' as const,
      hideBelow: 'lg' as const,
      cell: (row: BatchRow) => (
        <span className="font-mono tabular-nums text-caption text-ink-3">{row.score ?? '—'}</span>
      ),
    },
  ];
}

const ROUTE_FOR_RISK: Record<Risk, string> = {
  risk: '/result/high',
  warn: '/result/medium',
  clean: '/result/clean',
};

// Column definitions for the BatchTable. Mirrors the SCAN_COLUMNS shape
// from HomeScreen so both data tables share rhythm, hover treatment, and
// the table↔card switch via the global DataTable primitive.
// Reconciliation tag styling — a secondary annotation under the declared
// value, deliberately quieter than the Verdict pill beside it.
// Wording kept in lockstep with the reconciliation labels shown everywhere
// else (OCC_STATUS_MATCH_LABEL) so one row never reads "Exception" here and
// "Needs review" in the Result column.
const RECONCILIATION_META: Record<string, { label: string; color: string }> = {
  exception:    { label: 'Needs review', color: 'var(--warn-deep)' },
  consistent:   { label: 'Consistent',   color: 'var(--clean-ink)' },
  inconclusive: { label: 'Inconclusive', color: 'var(--ink-3)' },
};

function buildBatchColumns(
  onRunRowAI?: (rowId: number) => void,
  defaultIntent?: IntendedOccupancy
): any[] {
  const cols: any[] = [
  {
    key: 'index',
    label: '#',
    width: '36px',
    hideOnMobile: true,
    cell: (_row: BatchRow, i: number) => (
      <span className="font-mono text-micro text-ink-4 tabular-nums">
        {String(i + 1).padStart(2, '0')}
      </span>
    ),
  },
  {
    key: 'address',
    label: 'Address',
    primary: true,
    cell: (row: BatchRow) => {
      const [street, locality] = splitAddress(row.address);
      const dim = row.status === 'queued';
      return (
        <div className={`min-w-0 ${dim ? 'opacity-60' : ''}`}>
          <div className="flex items-center gap-inline min-w-0">
            <span
              className="font-sans font-semibold text-body-sm leading-tight truncate"
              style={{ color: 'var(--navy)' }}
            >
              {street}
            </span>
            {isRowRed(row, defaultIntent) && <RedFlag address={row.address} />}
          </div>
          {locality && (
            <div className="font-sans text-caption text-ink-3 mt-0.5 leading-tight truncate">
              {locality}
            </div>
          )}
        </div>
      );
    },
  },
  {
    key: 'score',
    label: 'Score',
    width: '128px',
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) => {
      if (row.status !== 'done') {
        return <span className="text-ink-4">—</span>;
      }
      return (
        <div className="flex items-center gap-inline">
          <span
            className="font-mono tabular-nums font-semibold text-label w-[24px] text-right leading-none"
            style={{ color: 'var(--navy)' }}
          >
            {row.score}
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="relative h-1 w-full rounded-full overflow-hidden"
              style={{ background: 'var(--surface-2)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-brand-2"
                style={{ width: `${Math.min(100, Math.max(0, row.score ?? 0))}%` }}
              />
            </div>
          </div>
        </div>
      );
    },
  },
  {
    // Result — the reconciliation of declared intent vs. what the scan found
    // (Consistent / Inconclusive / Needs review), NOT the raw verdict. The raw
    // Rented/Possibly/Not-rented finding lives on the property page now.
    key: 'result',
    label: 'Result',
    width: '156px',
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) => {
      if (row.status === 'done' && row.risk) {
        const m = occMatchForRisk(row.intent ?? defaultIntent, row.risk);
        return m ? <Pill variant={m.tone as any}>{m.label}</Pill> : <span className="text-ink-4">—</span>;
      }
      if (row.status === 'running') {
        return <Pill variant="brand" dot>Scanning</Pill>;
      }
      if (row.status === 'failed') {
        return (
          <Pill variant="risk" title={row.errorReason}>
            Failed
          </Pill>
        );
      }
      return <Pill>Queued</Pill>;
    },
  },
  {
    key: 'listings',
    label: 'Listings',
    width: '88px',
    align: 'right' as const,
    hideBelow: 'md' as const,
    cell: (row: BatchRow) =>
      row.status === 'done' ? (
        <span className="font-mono tabular-nums text-caption text-ink-3">
          {row.listings} found
        </span>
      ) : (
        <span className="text-ink-4">—</span>
      ),
  },
  {
    key: 'aireport',
    label: 'Occupancy report',
    width: '188px',
    hideBelow: 'md' as const,
    cell: (row: BatchRow) => {
      // AI reasons over a completed occupancy scan, so an unscanned /
      // in-flight / failed occupancy row has nothing to run against yet.
      if (row.status !== 'done') return <span className="text-ink-4">—</span>;

      const ai = row.aiReport;

      // Idle — no AI report yet. Offer an on-demand "run now" (the bypass-
      // the-batch path), or a dash on the read-only historical view.
      if (!ai) {
        if (!onRunRowAI) return <span className="text-ink-4">—</span>;
        return (
          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRunRowAI(row.id);
            }}
            aria-label="Run AI report now"
            title="Run AI report now"
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-line text-caption font-medium text-ink-2 transition-colors hover:bg-brand-soft hover:border-brand hover:text-brand-deep"
          >
            <Icon name="ai-star" size={13} />
            <span>Run now</span>
          </button>
        );
      }

      if (ai.status === 'queued') return <Pill>Queued</Pill>;
      if (ai.status === 'running') return <Pill variant="brand" dot>Running…</Pill>;
      if (ai.status === 'failed') {
        return (
          <Pill variant="risk" title={ai.errorReason}>
            Failed
          </Pill>
        );
      }
      // done — the occupancy status declared "as per loan" on upload, plus how
      // it reconciles against what the scan observed.
      const intent = row.intent ?? defaultIntent ?? 'not-sure';
      const rec = reconcileOccupancy(intent, row.risk);
      return (
        <div className="min-w-0 flex flex-col items-start gap-1">
          <Pill>{INTENDED_OCCUPANCY_LABEL[intent]}</Pill>
          {rec && (
            <span
              className="inline-flex items-center gap-1 font-sans text-micro font-semibold"
              style={{ color: RECONCILIATION_META[rec].color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: RECONCILIATION_META[rec].color }}
              />
              {RECONCILIATION_META[rec].label}
            </span>
          )}
        </div>
      );
    },
  },
];
  return cols;
}
