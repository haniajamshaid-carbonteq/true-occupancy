/* global React, Icon, Button, Modal, AutomateModal, useAppState */
// AutomationBanner — full-width banner shown on the BatchScreen when a
// batch has an active automation. Replaces the compact "Automated · every
// Nmo" pill from AutomationControl on this surface (per spec May-14).
//
// Layout:
//   ⟳ Auto-rerun: every 3 months · 12 of 16 addresses (Rented, Possibly Rented)
//     Next run Aug 18, 2026.                                  [Edit]  [Cancel]
//
// The 12 of 16 count is a hover target — same per-status tooltip as the
// scope card uses. Edit opens AutomateModal preseeded with cadence + statuses.
// Cancel opens the same destructive-confirm dialog AutomationControl uses.

type Cadence = 3 | 4 | 6 | 12;
type Risk = 'clean' | 'warn' | 'risk';

interface AutomationBannerProps {
  /** The active schedule the banner reflects. */
  schedule: {
    id: string;
    cadenceMonths: Cadence;
    nextRunLabel: string;
    statuses?: Risk[];
  };
  /** Batch context — drives the modal + scope tooltip. */
  batch: {
    filename: string;
    total: number;
    /** Per-status counts from the latest scan. */
    counts: { risk: number; warn: number; clean: number };
    /** First scan still running — show "—" instead of counts. */
    countsPending?: boolean;
  };
}

const BANNER_STATUS_LABEL: Record<Risk, string> = {
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

function describeStatusList(statuses: Risk[]): string {
  const labels = statuses.map((s) => BANNER_STATUS_LABEL[s]);
  if (labels.length === 0) return 'no statuses';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return labels.join(', ');
}

function AutomationBanner({ schedule, batch }: AutomationBannerProps) {
  const { updateScheduleCadence, updateScheduleStatuses, cancelSchedule, pushTransient } =
    useAppState();
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const statuses: Risk[] = schedule.statuses && schedule.statuses.length > 0
    ? schedule.statuses
    : ['risk', 'warn'];

  const inScope = batch.countsPending
    ? null
    : (statuses.includes('risk')  ? batch.counts.risk  : 0) +
      (statuses.includes('warn')  ? batch.counts.warn  : 0) +
      (statuses.includes('clean') ? batch.counts.clean : 0);

  const tipLines = statuses
    .map((s) => `${BANNER_STATUS_LABEL[s]}: ${batch.counts[s]}`)
    .join('\n');
  const tip = `Per-status breakdown:\n${tipLines}`;

  function handleUpdate({ cadenceMonths, statuses: nextStatuses }: { cadenceMonths: Cadence; statuses?: Risk[] }) {
    if (cadenceMonths !== schedule.cadenceMonths) {
      updateScheduleCadence(schedule.id, cadenceMonths);
    }
    if (nextStatuses) {
      const changed =
        statuses.length !== nextStatuses.length ||
        !statuses.every((s) => nextStatuses.includes(s));
      if (changed) {
        updateScheduleStatuses(schedule.id, nextStatuses);
        const oldCount = inScope ?? 0;
        const newCount =
          (nextStatuses.includes('risk')  ? batch.counts.risk  : 0) +
          (nextStatuses.includes('warn')  ? batch.counts.warn  : 0) +
          (nextStatuses.includes('clean') ? batch.counts.clean : 0);
        pushTransient(`Scope updated · next run ${oldCount} → ${newCount} addresses`);
      } else {
        pushTransient(`Automation updated · every ${cadenceMonths} months`);
      }
    } else {
      pushTransient(`Automation updated · every ${cadenceMonths} months`);
    }
    setEditOpen(false);
  }

  function handleCancel() {
    cancelSchedule(schedule.id);
    setConfirmOpen(false);
    pushTransient('Automation cancelled. The current run, if any, will finish.');
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-line bg-brand-soft/40 px-4 py-3 flex items-start gap-3 flex-wrap"
    >
      <span
        className="inline-flex shrink-0 mt-0.5 w-7 h-7 rounded-full bg-brand-soft text-brand-deep grid place-items-center [&>svg]:w-3.5 [&>svg]:h-3.5"
        aria-hidden
      >
        <Icon name="replay" size={14} />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className="m-0 font-sans text-body-sm leading-relaxed"
          style={{ color: 'var(--ink)' }}
        >
          <span className="font-semibold">Auto-rerun:</span>{' '}
          every {schedule.cadenceMonths} months ·{' '}
          {batch.countsPending ? (
            <span className="text-ink-3">counts pending</span>
          ) : (
            <span
              className="underline decoration-dotted underline-offset-2 cursor-help"
              title={tip}
              aria-label={tip.replace(/\n/g, ' · ')}
            >
              {inScope} of {batch.total} addresses
            </span>
          )}{' '}
          <span className="text-ink-3">({describeStatusList(statuses)})</span>
        </p>
        <p className="m-0 mt-0.5 font-mono tabular-nums text-caption text-ink-3">
          Next run {schedule.nextRunLabel}.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" onClick={() => setEditOpen(true)} icon={<Icon name="cal" size={14} />}>
          Edit
        </Button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-inline-tight h-9 px-control-x rounded-lg bg-transparent border border-transparent font-sans text-label font-medium text-error-ink hover:bg-error-soft transition-colors cursor-pointer"
        >
          <Icon name="x" size={14} />
          Cancel
        </button>
      </div>

      <AutomateModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        target={{ kind: 'batch', filename: batch.filename, total: batch.total }}
        onConfirm={handleUpdate}
        mode="edit"
        initialCadence={schedule.cadenceMonths}
        initialStatuses={statuses}
        scopeCounts={batch.counts}
        scopeTotal={batch.total}
        scopeCountsPending={batch.countsPending}
        onCancelAutomation={() => setConfirmOpen(true)}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        width={420}
        title="Stop auto-rerun?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="flex-1 justify-center"
            >
              Keep Automation
            </Button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 inline-flex items-center justify-center gap-inline-tight h-9 px-control-x rounded-lg border border-error-soft bg-error-soft text-error-ink hover:bg-error/10 transition-colors cursor-pointer font-sans text-label font-medium"
            >
              <Icon name="x" size={14} />
              Cancel Automation
            </button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-3">
          <span
            className="shrink-0 w-9 h-9 rounded-full grid place-items-center bg-error-soft text-error-ink [&>svg]:w-[18px] [&>svg]:h-[18px]"
            aria-hidden
          >
            <Icon name="alert" size={18} />
          </span>
          <p className="text-body-sm text-ink-2 leading-relaxed m-0">
            This automation won't run again. The <span className="font-medium text-ink">current run, if any, will finish</span>.
            You can re-create it any time from this batch page.
          </p>
        </div>
      </Modal>
    </div>
  );
}
