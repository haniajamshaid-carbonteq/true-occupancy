/* global React, AppShell, Card, Button, Pill, Icon, Input, DataTable, DropdownMenu, ReactRouterDOM,
   VERDICT_ACCENT, splitAddress, AutomationControl, AutomationBanner, VerdictTiles, EditableTitle,
   deriveTitleFromFilename, useAppState */
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
}

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

// "Just now" within a minute, "N min ago" / "N h ago" / "N d ago" after.
// Matches the relative-label voice used by history's `scannedAgo` so the
// live identity-strip caption reads identically once the batch lands in
// history.
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
  const { startBatch, startSampleBatch } = useAppState();

  // File state is just the filename for now — the no-build prototype doesn't
  // actually parse CSVs. Real wiring would expose row count + header
  // detection from here and feed them into the form.
  const [filename, setFilename] = React.useState<string>('');
  const [title, setTitle] = React.useState<string>('');
  // Track whether the user has hand-edited the title since the last file
  // drop. We auto-fill from the filename on drop, but never clobber a
  // title the user explicitly typed.
  const [titleTouched, setTitleTouched] = React.useState<boolean>(false);
  const [description, setDescription] = React.useState<string>('');
  const [addressColumn, setAddressColumn] = React.useState<string>('');
  const [advancedOpen, setAdvancedOpen] = React.useState<boolean>(false);

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFilename(file.name);
    if (!titleTouched) setTitle(deriveTitleFromFilename(file.name));
  }

  function onSubmit() {
    if (!filename) return;
    startBatch({
      filename,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      addressColumn: addressColumn.trim() || undefined,
    });
  }

  const canSubmit = filename.length > 0;

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
            <Input
              label="Title"
              value={title}
              placeholder="Asheville Q2 2026"
              maxLength={80}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTitle(e.target.value);
                setTitleTouched(true);
              }}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="batch-description"
                className="font-sans text-caption font-semibold"
                style={{ color: 'var(--ink-2)' }}
              >
                Description <span className="text-ink-3 font-normal">(optional)</span>
              </label>
              <textarea
                id="batch-description"
                value={description}
                maxLength={280}
                rows={3}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder="Add context that&rsquo;ll appear on the batch detail page."
                className="w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-body-sm font-sans outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)] placeholder:text-ink-4 resize-none transition-shadow"
                style={{ color: 'var(--ink)' }}
              />
              <div className="font-sans text-micro" style={{ color: 'var(--ink-3)' }}>
                Up to 280 characters · shown on the batch detail page.
              </div>
            </div>
          </FormSection>

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
                  advancedOpen ? 'rotate-90' : ''
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
                Drop a CSV to continue.
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
    findScheduleByTarget,
    renameBatch,
    setBatchDescription,
  } = useAppState();
  const rows: BatchRow[] = batch.rows;
  const total = rows.length;
  const done = rows.filter((r) => r.status === 'done').length;
  const running = rows.filter((r) => r.status === 'running').length;
  const flagged = rows.filter((r) => r.risk === 'risk').length;
  const warn = rows.filter((r) => r.risk === 'warn').length;
  const clean = rows.filter((r) => r.risk === 'clean').length;
  const progress = Math.round((done / total) * 100);
  const isComplete = batch.status === 'complete';

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

  type VerdictFilter = 'all' | 'risk' | 'warn' | 'clean';
  const [query, setQuery] = React.useState('');
  const [verdictFilter, setVerdictFilter] = React.useState<VerdictFilter>('all');

  const filteredRows = rows.filter((r) => {
    if (verdictFilter !== 'all') {
      if (r.status !== 'done' || r.risk !== verdictFilter) return false;
    }
    if (query && !r.address.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleVerdict = (v: 'risk' | 'warn' | 'clean') =>
    setVerdictFilter((cur) => (cur === v ? 'all' : v));

  // Identity-strip "uploaded" label. Live batches carry `startedAt` (epoch);
  // history entries carry `scannedAgo` (pre-formatted). Falling back to
  // "Just now" preserves the column on freshly-completed batches.
  const uploadedLabel: string =
    batch.scannedAgo ?? (batch.startedAt ? formatStartedAgo(batch.startedAt) : 'Just now');

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
              flag below governs re-execution only (retry / automation). */}
          <EditableTitle
            value={displayTitle}
            onSave={(next) => renameBatch(batch.id, next)}
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
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          {!activeSchedule && !readOnly && (
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
            cadenceMonths: activeSchedule.cadenceMonths,
            nextRunLabel: activeSchedule.nextRunLabel,
            statuses: activeSchedule.statuses,
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
        </div>
      </Card>

      {/* Status counts — sit outside the summary card, mirroring the dashboard KPI strip */}
      <VerdictTiles
        flagged={flagged}
        warn={warn}
        clean={clean}
        onSelect={toggleVerdict}
        selected={verdictFilter === 'all' ? null : verdictFilter}
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
        <BatchTable rows={filteredRows} />
      </div>

    </div>
  );
}

function BatchTable({ rows }: { rows: BatchRow[] }) {
  const history = ReactRouterDOM.useHistory();

  function openIfDone(row: BatchRow) {
    if (row.status === 'done' && row.risk) {
      history.push(ROUTE_FOR_RISK[row.risk]);
    }
  }

  const columns = React.useMemo(() => buildBatchColumns(), []);

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
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

// Map a row's risk band to the matching detail-screen route, so the demo
// has somewhere believable to drill into.
const ROUTE_FOR_RISK: Record<Risk, string> = {
  risk: '/result/high',
  warn: '/result/medium',
  clean: '/result/clean',
};

// Column definitions for the BatchTable. Mirrors the SCAN_COLUMNS shape
// from HomeScreen so both data tables share rhythm, hover treatment, and
// the table↔card switch via the global DataTable primitive.
function buildBatchColumns(): any[] {
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
          <div
            className="font-sans font-semibold text-body-sm leading-tight truncate"
            style={{ color: 'var(--navy)' }}
          >
            {street}
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
    key: 'verdict',
    label: 'Verdict',
    width: '150px',
    hideBelow: 'sm' as const,
    cell: (row: BatchRow) => {
      if (row.status === 'done' && row.risk) {
        const variant =
          row.risk === 'risk'  ? 'verdict-high'
          : row.risk === 'warn'  ? 'verdict-med'
          : 'verdict-low';
        return <Pill variant={variant as any}>{VERDICT_LABEL[row.risk]}</Pill>;
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
];
  return cols;
}
