/* global React, Button, Icon, Modal, DropdownMenu, AutomateModal, useAppState */
// AutomationControl — single point of truth for the Automate CTA. Looks up
// the active schedule for a target via AppState; renders either:
//   - Automate button (no active schedule), or
//   - "Automated · every Nmo" pill-style menu trigger with change/cancel
//     actions (active schedule exists).
//
// Confirmation feedback is pushed to the notification dock (AppState.pushTransient)
// so both surfaces (single property and batch) share the same affordance.

type Cadence = 3 | 4 | 6 | 12;

interface AutomationControlProps {
  target:
    | { kind: 'single'; address: string; scenario: 'low' | 'medium' | 'high' }
    | { kind: 'batch'; filename: string; total: number };
}

function AutomationControl({ target }: AutomationControlProps) {
  const {
    addSchedule,
    updateScheduleCadence,
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

  function handleCreate({ cadenceMonths }: { cadenceMonths: Cadence }) {
    if (target.kind === 'single') {
      addSchedule({
        kind: 'single',
        address: target.address,
        scenario: target.scenario,
        cadenceMonths,
      });
    } else {
      addSchedule({
        kind: 'batch',
        filename: target.filename,
        total: target.total,
        cadenceMonths,
      });
    }
    setCreateOpen(false);
    pushTransient(`Automation scheduled · every ${cadenceMonths} months`);
  }

  function handleUpdate({ cadenceMonths }: { cadenceMonths: Cadence }) {
    if (!existing) return;
    updateScheduleCadence(existing.id, cadenceMonths);
    setEditOpen(false);
    pushTransient(`Automation updated · every ${cadenceMonths} months`);
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
    return (
      <>
        <Button
          variant="default"
          onClick={() => setCreateOpen(true)}
          icon={<Icon name="cal" size={14} />}
          className="shrink-0"
        >
          Automate
        </Button>

        <AutomateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          target={modalTarget}
          onConfirm={handleCreate}
        />
      </>
    );
  }

  // ---- Automated -> pill-style menu trigger -----------------------------
  const cadenceMonths = existing.cadenceMonths;

  return (
    <>
      <DropdownMenu
        align="end"
        title="Automation"
        trigger={(open: boolean) => (
          <button
            type="button"
            aria-label={`Automated every ${cadenceMonths} months — open menu`}
            className="shrink-0 inline-flex items-center gap-inline h-9 px-control-x rounded-lg border bg-surface text-ink-2 border-line-strong hover:bg-hover-bg transition-colors cursor-pointer font-sans text-label font-medium"
          >
            <span className="inline-flex shrink-0 text-brand [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
              <Icon name="cal" size={14} />
            </span>
            <span>
              Automated · every {cadenceMonths}mo
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
        initialCadence={cadenceMonths}
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
