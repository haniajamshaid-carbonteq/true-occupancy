/* global React, Button, Icon, Modal, DropdownMenu, AutomateModal, useAppState,
   Cadence, ScopeRetention, cadenceLabel, cadenceShort, sameCadence */
// AutomationControl — single point of truth for the Automate CTA. Looks up
// the active schedule for a target via AppState; renders either:
//   - Automate button (no active schedule), or
//   - "Automated · every Nmo" pill-style menu trigger with change/cancel
//     actions (active schedule exists).
//
// When the caller passes `recommended`, a small green "Recommended" eyebrow sits
// directly UNDER the CTA, inset by the button's own horizontal padding so it
// tucks inside the control's edges rather than running out to them — absolutely
// positioned, so it fills the gap beneath the button without changing the
// height of the bar —
// with the reason on hover. That replaces the separate "Automation recommended"
// link that used to sit under the reconciliation tiles and inside the result
// hero: one recommendation, attached to the control that acts on it, instead of
// a nudge duplicating a CTA that was already on screen.
//
// Confirmation feedback is pushed to the notification dock (AppState.pushTransient)
// so both surfaces (single property and batch) share the same affordance.

// Cadence + ScopeRetention come from AppState (shared global script scope).
type Risk = 'clean' | 'warn' | 'risk';

const STATUS_HUMAN: Record<Risk, string> = {
  risk: 'Rented',
  warn: 'Possibly Rented',
  clean: 'Not Rented',
};

/** Render a status-set as an Oxford-comma-joined human phrase, e.g.
 *  ['risk','warn'] → "Rented and Possibly Rented". */
function describeScope(statuses: Risk[]): string {
  const labels = statuses.map((s) => STATUS_HUMAN[s]);
  if (labels.length === 0) return 'no statuses';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

interface BatchTarget {
  kind: 'batch';
  filename: string;
  total: number;
  /** Per-status counts from the latest scan. Drives the modal's status
   *  pill counts and the live "X of Y" scope card. If omitted, the modal
   *  falls back to "counts pending" mode (first scan still running). */
  scopeCounts?: { risk: number; warn: number; clean: number };
  /** Set true when the first scan hasn't completed yet, so we can't show
   *  meaningful counts. The user can still pre-pick a scope. */
  scopeCountsPending?: boolean;
  /** The batch's declared occupancy. Seeds the modal so the pre-selected
   *  re-scan bands are the ones that reconcile to "Needs review" for THIS
   *  batch, not for the org default. */
  intent?: string;
}

interface AutomationControlProps {
  target:
    | { kind: 'single'; address: string; scenario: 'low' | 'medium' | 'high' }
    | BatchTarget;
  /** Mark the CTA as recommended: brand "Recommended" pill + hover reason.
   *  Only honoured while no schedule exists — once automation is running the
   *  control shows its status instead and there is nothing left to recommend. */
  recommended?: boolean;
  /** Hover text explaining why automation is recommended (e.g. red rows were
   *  found). Required for the tooltip to say anything useful. */
  recommendReason?: string;
}

function AutomationControl({ target, recommended = false, recommendReason }: AutomationControlProps) {
  const {
    addSchedule,
    updateScheduleCadence,
    updateScheduleStatuses,
    updateScheduleRetention,
    cancelSchedule,
    findScheduleByTarget,
    pushTransient,
  } = useAppState();

  const existing = findScheduleByTarget(
    target.kind === 'single'
      ? { kind: 'single', address: target.address }
      : { kind: 'batch', filename: target.filename }
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  // Ties the CTA to its "Recommended" note for screen readers — the note sits
  // outside the button, so aria-describedby is what carries it across.
  const recommendId = `automate-recommended-${React.useId()}`;

  function handleCreate({ cadence, statuses, retention, intent }: { cadence: Cadence; statuses?: Risk[]; retention?: ScopeRetention; intent?: string }) {
    if (target.kind === 'single') {
      addSchedule({
        kind: 'single',
        address: target.address,
        scenario: target.scenario,
        cadence,
        intent,
      });
      pushTransient(`Automation scheduled · ${cadenceLabel(cadence)}`);
    } else {
      // Batch — statuses is required to be ≥1 by the modal's primary-disabled
      // rule, but defensively fall back to the spec default if it's missing.
      const finalStatuses: Risk[] = statuses && statuses.length > 0 ? statuses : ['risk', 'warn'];
      addSchedule({
        kind: 'batch',
        filename: target.filename,
        total: target.total,
        cadence,
        statuses: finalStatuses,
        retention: retention ?? 'monitor',
        intent,
      });
      const scopeWord = describeScope(finalStatuses);
      pushTransient(`Automation scheduled · ${cadenceLabel(cadence)} · ${scopeWord}`);
    }
    setCreateOpen(false);
  }

  function handleUpdate({ cadence, statuses, retention }: { cadence: Cadence; statuses?: Risk[]; retention?: ScopeRetention }) {
    if (!existing) return;
    const cadenceChanged = !sameCadence(cadence, existing.cadence);
    if (cadenceChanged) updateScheduleCadence(existing.id, cadence);
    if (existing.kind === 'batch' && statuses) {
      const prev = (existing as any).statuses ?? ['risk', 'warn'];
      const changed =
        prev.length !== statuses.length ||
        !prev.every((s: Risk) => statuses.includes(s));
      if (changed) updateScheduleStatuses(existing.id, statuses);
      if (retention && retention !== (existing as any).retention) {
        updateScheduleRetention(existing.id, retention);
      }
    }
    setEditOpen(false);
    pushTransient(`Automation updated · ${cadenceLabel(cadence)}`);
  }

  function handleCancel() {
    if (!existing) return;
    cancelSchedule(existing.id);
    setConfirmOpen(false);
    setEditOpen(false);
    pushTransient('Automation cancelled');
  }

  // Build the AutomateTarget payload that the modal renders (its summary
  // panel uses .address or .filename / .total).
  const modalTarget =
    target.kind === 'single'
      ? { kind: 'single' as const, address: target.address, scenario: target.scenario }
      : { kind: 'batch' as const, filename: target.filename, total: target.total };

  // ---- Not yet automated -> classic Automate button ---------------------
  if (!existing) {
    // Batch scope is unknown until the first scan finishes — without per-status
    // counts the user can't pick a meaningful re-scan set, so the entry CTA is
    // disabled until the scan completes.
    const scanPending = target.kind === 'batch' && target.scopeCountsPending === true;
    // The recommendation only reads while the CTA is actually actionable —
    // a disabled button keeps its "available once the scan completes" tooltip.
    const showRecommended = recommended && !scanPending;
    return (
      <>
        {/* `relative` anchors the recommendation note; the note itself is
            absolute so the surrounding bar keeps its single-row height. */}
        <div className="relative shrink-0">
          <Button
            variant="default"
            onClick={() => setCreateOpen(true)}
            icon={<Icon name="cal" size={14} />}
            disabled={scanPending}
            title={scanPending ? 'Available once the scan completes' : undefined}
            aria-describedby={showRecommended ? recommendId : undefined}
          >
            Automate
          </Button>
          {showRecommended && (
            <span
              id={recommendId}
              title={recommendReason}
              className="absolute right-control-x top-full mt-0.5 whitespace-nowrap font-sans text-eyebrow font-semibold leading-none text-success underline decoration-dotted underline-offset-2 cursor-help"
            >
              Recommended
            </span>
          )}
        </div>

        <AutomateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          target={modalTarget}
          onConfirm={handleCreate}
          {...(target.kind === 'batch'
            ? {
                scopeCounts: target.scopeCounts,
                scopeTotal: target.total,
                scopeCountsPending: target.scopeCountsPending,
                initialIntent: target.intent,
              }
            : {})}
        />
      </>
    );
  }

  // ---- Automated -> pill-style menu trigger -----------------------------
  const cadence = existing.cadence;

  return (
    <>
      <DropdownMenu
        align="end"
        title="Automation"
        trigger={(open: boolean) => (
          <button
            type="button"
            aria-label={`Automated ${cadenceLabel(cadence)}, open menu`}
            className="shrink-0 inline-flex items-center gap-inline h-9 px-control-x rounded-lg border bg-surface text-ink-2 border-line-strong hover:bg-hover-bg transition-colors cursor-pointer font-sans text-label font-medium"
          >
            <span className="inline-flex shrink-0 text-brand [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
              <Icon name="cal" size={14} />
            </span>
            <span>
              Automated · every {cadenceShort(cadence)}
            </span>
            <span
              className={`inline-flex shrink-0 text-ink-3 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
              aria-hidden
            >
              <Icon name="chevron" size={12} />
            </span>
          </button>
        )}
        items={[
          {
            label: 'Change Cadence',
            icon: <Icon name="cal" />,
            onClick: () => setEditOpen(true),
          },
          {
            label: 'Cancel',
            icon: <Icon name="x" />,
            destructive: true,
            onClick: () => setConfirmOpen(true),
          },
        ]}
      />

      <AutomateModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        target={modalTarget}
        onConfirm={handleUpdate}
        mode="edit"
        initialCadence={cadence}
        initialStatuses={
          existing.kind === 'batch' ? (existing as any).statuses ?? ['risk', 'warn'] : undefined
        }
        initialRetention={
          existing.kind === 'batch' ? (existing as any).retention ?? 'monitor' : undefined
        }
        {...(target.kind === 'batch'
          ? {
              scopeCounts: target.scopeCounts,
              scopeTotal: target.total,
              scopeCountsPending: target.scopeCountsPending,
            }
          : {})}
        onCancelAutomation={() => setConfirmOpen(true)}
      />

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        width={420}
        title="Cancel Automation?"
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
            This automation won't run again. You can re-create it any time from
            the same{' '}
            <span className="font-medium text-ink">
              {target.kind === 'batch' ? 'batch' : 'scan'}
            </span>{' '}
            page.
          </p>
        </div>
      </Modal>
    </>
  );
}
