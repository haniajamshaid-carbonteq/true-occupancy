/* global React, Card, Icon, Button, ReactRouterDOM */
// BatchRerunBanner — read-only context banner shown on BatchDetailScreen
// when the batch is part of an automation chain (its id appears in some
// schedule.runHistoryIds). Tells the user three things they otherwise have
// to piece together by jumping back to the schedule:
//
//   1. This batch is part of an automation — and which one
//   2. Where it sits in the sequence (Run N of M)
//   3. How to navigate up to the schedule (and across to siblings)
//
// Distinct from <AutomationBanner>: that one lives on the LIVE batch page
// and exposes Edit / Cancel for an active schedule. This one is purely
// historical — no controls, just provenance + cross-navigation.

type Cadence = 3 | 4 | 6 | 12;
type Risk = 'clean' | 'warn' | 'risk';

interface BatchRerunBannerProps {
  /** Schedule the current batch belongs to. */
  schedule: {
    id: string;
    filename: string;
    cadenceMonths: Cadence;
    total: number;
    statuses?: Risk[];
    runHistoryIds: string[];
  };
  /** History id of the batch currently displayed. */
  currentRunId: string;
  /** All linked runs, in the same order as schedule.runHistoryIds, with
   *  whatever fields exist on the history entry. Used to surface "Run N of M"
   *  and the prev/next sibling links. */
  runs: { id: string; scannedAgo: string; total: number }[];
}

const RERUN_STATUS_LABEL: Record<Risk, string> = {
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

function describeStatusList(statuses: Risk[]): string {
  if (statuses.length === 0) return 'no statuses';
  const labels = statuses.map((s) => RERUN_STATUS_LABEL[s]);
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return labels.join(', ');
}

function BatchRerunBanner({ schedule, currentRunId, runs }: BatchRerunBannerProps) {
  const routerHistory = ReactRouterDOM.useHistory();

  // runHistoryIds is authored newest-first throughout the codebase, but the
  // "Run N of M" framing reads more naturally when the originating scan is
  // Run 1 and subsequent re-runs increment. So we count from the END.
  const total = runs.length;
  const indexNewestFirst = runs.findIndex((r) => r.id === currentRunId);
  const runNumber = indexNewestFirst < 0 ? total : total - indexNewestFirst;

  const prev = indexNewestFirst >= 0 && indexNewestFirst < runs.length - 1
    ? runs[indexNewestFirst + 1]
    : null;
  const next = indexNewestFirst > 0 ? runs[indexNewestFirst - 1] : null;

  const statuses: Risk[] = schedule.statuses && schedule.statuses.length > 0
    ? schedule.statuses
    : ['risk', 'warn'];

  // The originating run carries the full address pool; subsequent runs are
  // scoped subsets. Distinguishing helps the user understand why the row
  // count on the current page might be smaller than the schedule's `total`.
  const isOriginating = runNumber === 1;

  return (
    <Card
      role="status"
      className="!bg-brand-soft/40 px-card py-card-tight flex items-start gap-3 flex-wrap"
    >
      <span
        className="inline-flex shrink-0 mt-0.5 w-7 h-7 rounded-full bg-brand-soft text-brand-deep grid place-items-center [&>svg]:w-3.5 [&>svg]:h-3.5"
        aria-hidden
      >
        <Icon name="replay" size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="m-0 font-sans text-body-sm leading-relaxed text-ink">
          <span className="font-semibold">
            {isOriginating ? 'Originating run' : 'Re-run'} of {schedule.filename}
          </span>{' '}
          <span className="text-ink-3">
            · Run {runNumber} of {total}
          </span>
        </p>
        <p className="m-0 mt-0.5 font-sans text-caption text-ink-3 leading-relaxed">
          Automated every {schedule.cadenceMonths} months · Scope:{' '}
          {describeStatusList(statuses)} ({schedule.total} addresses on file)
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {prev && (
          <button
            type="button"
            onClick={() => routerHistory.push(`/batch/${prev.id}`)}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md bg-transparent text-ink-2 hover:bg-hover-bg transition-colors cursor-pointer font-sans text-label"
            aria-label={`Previous run · ${prev.scannedAgo}`}
            title={`Previous run · ${prev.scannedAgo}`}
          >
            <Icon name="chevron" size={12} className="rotate-90" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        )}
        {next && (
          <button
            type="button"
            onClick={() => routerHistory.push(`/batch/${next.id}`)}
            className="inline-flex items-center gap-1 h-9 px-2.5 rounded-md bg-transparent text-ink-2 hover:bg-hover-bg transition-colors cursor-pointer font-sans text-label"
            aria-label={`Next run · ${next.scannedAgo}`}
            title={`Next run · ${next.scannedAgo}`}
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="chevron" size={12} className="-rotate-90" />
          </button>
        )}
        <Button
          variant="ghost"
          onClick={() => routerHistory.push(`/scheduled/${schedule.id}`)}
          icon={<Icon name="cal" size={14} />}
        >
          View schedule
        </Button>
      </div>
    </Card>
  );
}
