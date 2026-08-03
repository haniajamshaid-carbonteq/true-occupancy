/* global React, Drawer, Button, Pill, Icon, Textarea, OCC_INTENT_LABEL,
   OCC_VERDICT_LABEL, OCC_CADENCE_LABEL, formatUsDateTime, formatUsRelative */

// Red property detail — opens from the red addresses list.
//
// One action: stop the recurring scan. This says "the finding stands, stop
// re-checking it" — the property stays red, only the automation stops. It
// carries a reason and its own audit record. (An earlier design also let you
// "clear" the red status; that was removed — a red finding is a fact, not
// something an operator dismisses.)

type RedDrawerMode = 'detail' | 'stop' | 'done-stop' | 'done-restart';

interface RedPropertyDrawerProps {
  open: boolean;
  onClose: () => void;
  property?: any;
  /** Spec frames drive this directly; the live app starts at 'detail'. */
  mode?: RedDrawerMode;
  onModeChange?: (next: RedDrawerMode) => void;
  /** Apply a stop/restart to the shared store. address, stopped. */
  onApply?: (address: string, stopped: boolean) => void;
}

// Scan history — the recurring red-flag scans that have run for this property.
// Answers "when was this last checked?": the two most recent by date, with a
// "View all" toggle to reveal the rest inline.
function RedScanHistory({ history }: { history: { at: string; verdict: string }[] }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!history || history.length === 0) return null;
  const sorted = [...history].sort((a, b) => (a.at < b.at ? 1 : -1));
  const shown = expanded ? sorted : sorted.slice(0, 2);
  return (
    <div>
      <div className="font-sans text-eyebrow font-semibold tracking-[0.14em] uppercase mb-stack-tight" style={{ color: 'var(--ink-3)' }}>
        Scan history
      </div>
      <div className="divide-y divide-line">
        {shown.map((s, i) => (
          <div key={i} className="flex items-baseline justify-between gap-stack py-1.5">
            <span className="font-sans text-caption tabular-nums" style={{ color: 'var(--ink-2)' }}>
              {formatUsDateTime(s.at)}
            </span>
            <span className="font-sans text-caption shrink-0" style={{ color: 'var(--ink-3)' }}>
              {formatUsRelative(s.at)}
            </span>
          </div>
        ))}
      </div>
      {sorted.length > 2 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-stack-tight font-sans text-caption font-medium underline underline-offset-2 hover:no-underline"
          style={{ color: 'var(--brand-deep)' }}
        >
          {expanded ? 'Show less' : `View all ${sorted.length} scans`}
        </button>
      )}
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-stack py-1.5">
      <span className="font-sans text-caption shrink-0" style={{ color: 'var(--ink-3)' }}>
        {label}
      </span>
      <span className="font-sans text-caption text-right" style={{ color: 'var(--ink-2)' }}>
        {children}
      </span>
    </div>
  );
}

// Content is split out from the Drawer shell for one concrete reason: Drawer
// portals to document.body, so a spec frame can never contain it. The spec
// canvas renders RedPropertyPanel directly; the app renders RedPropertyDrawer.
// Both share this one implementation, so the canvas cannot drift from the app.
function useRedPropertyContent({
  property,
  mode,
  onModeChange,
  onClose,
  onApply,
}: {
  property?: any;
  mode: RedDrawerMode;
  onModeChange?: (next: RedDrawerMode) => void;
  onClose: () => void;
  onApply?: (address: string, stopped: boolean) => void;
}) {
  const [reason, setReason] = React.useState('');
  const p = property ?? {};
  const go = (next: RedDrawerMode) => onModeChange?.(next);

  const header = (
    <span className="inline-flex items-center gap-inline">
      <span className="shrink-0 w-2 h-2 rounded-pill" style={{ background: 'var(--risk)' }} aria-hidden />
      {p.address}
    </span>
  );

  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (mode === 'stop') {
    body = (
      <div className="flex flex-col gap-stack-md">
        <div className="rounded-lg p-3 bg-warn-soft">
          <p className="font-sans text-caption" style={{ color: 'var(--warn-ink)' }}>
            The property stays red. Only the recurring scan stops — you will not
            be re-checked on this address until you start it again.
          </p>
        </div>
        <Textarea
          id="red-reason"
          label="Reason"
          value={reason}
          rows={3}
          maxLength={280}
          placeholder="e.g. Property sold; monitoring no longer required."
          hint="Recorded against this property with your name and the date."
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
        />
      </div>
    );
    footer = (
      <div className="flex justify-end gap-inline">
        <Button variant="default" onClick={() => go('detail')}>
          Back
        </Button>
        <Button
          variant="primary"
          disabled={reason.trim().length === 0}
          onClick={() => {
            onApply?.(p.address, true);
            go('done-stop');
          }}
        >
          Stop recurring scans
        </Button>
      </div>
    );
  } else if (mode === 'done-stop') {
    body = (
      <div className="flex flex-col items-start gap-stack">
        <span
          className="w-10 h-10 rounded-pill grid place-items-center bg-clean-soft [&>svg]:w-5 [&>svg]:h-5"
          style={{ color: 'var(--clean-ink)' }}
          aria-hidden
        >
          <Icon name="check" size={20} />
        </span>
        <div>
          <p className="font-sans text-h4 font-semibold" style={{ color: 'var(--navy)' }}>
            Recurring scans stopped
          </p>
          <p className="font-sans text-caption mt-1" style={{ color: 'var(--ink-2)' }}>
            This property stays on the red list. It will not be re-scanned
            automatically.
          </p>
        </div>
      </div>
    );
    footer = (
      <div className="flex justify-between gap-inline">
        {/* Undo reverts the stop immediately — a low-friction safety net. */}
        <Button
          variant="default"
          onClick={() => {
            onApply?.(p.address, false);
            go('detail');
          }}
        >
          Undo
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  } else if (mode === 'done-restart') {
    body = (
      <div className="flex flex-col items-start gap-stack">
        <span
          className="w-10 h-10 rounded-pill grid place-items-center bg-clean-soft [&>svg]:w-5 [&>svg]:h-5"
          style={{ color: 'var(--clean-ink)' }}
          aria-hidden
        >
          <Icon name="replay" size={20} />
        </span>
        <div>
          <p className="font-sans text-h4 font-semibold" style={{ color: 'var(--navy)' }}>
            Recurring scans restarted
          </p>
          <p className="font-sans text-caption mt-1" style={{ color: 'var(--ink-2)' }}>
            This property is re-scanned automatically again under the red-flag rule.
          </p>
        </div>
      </div>
    );
    footer = (
      <div className="flex justify-end">
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-stack-md">
        <div className="rounded-lg p-3 bg-risk-soft">
          <p className="font-sans text-label font-medium" style={{ color: 'var(--risk-ink)' }}>
            Declared {String(OCC_INTENT_LABEL[p.intent] ?? '').toLowerCase()} · found{' '}
            {String(OCC_VERDICT_LABEL[p.verdict] ?? '').toLowerCase()}
          </p>
          <p className="font-sans text-caption mt-1" style={{ color: 'var(--risk-ink)' }}>
            Confidence <span className="tabular-nums">{p.confidence}</span> · above your
            organisation&rsquo;s rented threshold.
          </p>
        </div>

        <div className="divide-y divide-line">
          <MetaRow label="Declared">{OCC_INTENT_LABEL[p.intent]}</MetaRow>
          <MetaRow label="Found">{OCC_VERDICT_LABEL[p.verdict]}</MetaRow>
          <MetaRow label="Source">{p.source}</MetaRow>
          <MetaRow label="Recurring scan">
            {p.scansStopped ? (
              <Pill variant="default" size="sm" subtle>
                Stopped
              </Pill>
            ) : (
              <span className="tabular-nums">{OCC_CADENCE_LABEL[p.recurring ?? 'none']}</span>
            )}
          </MetaRow>
          <MetaRow label="Served">
            <span className="tabular-nums">{formatUsDateTime(p.servedAt)}</span>
          </MetaRow>
        </div>

        {p.scanHistory && p.scanHistory.length > 0 && (
          <RedScanHistory history={p.scanHistory} />
        )}

        {/* Automation block — this scan is NOT a schedule the user created;
            it's driven by the global red-flag rule. So the schedule can't be
            edited per property (that lives in Configuration), and the copy
            spells out why it's running. Cancelling opts THIS property out. */}
        <div className="rounded-lg border border-line p-3">
          <div className="flex items-center gap-inline mb-stack-tight">
            <span className="shrink-0 [&>svg]:w-4 [&>svg]:h-4" style={{ color: 'var(--risk)' }} aria-hidden>
              <Icon name="replay" size={16} />
            </span>
            <div className="min-w-0">
              <p className="font-sans text-label font-medium" style={{ color: 'var(--ink)' }}>
                {p.scansStopped ? 'Automated re-scan · stopped' : 'Automated by the red-flag rule'}
              </p>
              <p className="font-sans text-caption mt-0.5" style={{ color: 'var(--ink-3)' }}>
                {p.scansStopped
                  ? 'This property is no longer re-scanned automatically.'
                  : `Re-scanned ${String(OCC_CADENCE_LABEL[p.recurring ?? 'none']).toLowerCase()} because it's flagged red — not a schedule you set up.`}
              </p>
            </div>
          </div>

          {!p.scansStopped && (
            <>
              <div className="flex flex-wrap gap-inline">
                <Button
                  variant="default"
                  size="sm"
                  disabled
                  icon={<Icon name="cal" size={14} />}
                  title="Cadence is set globally in Configuration"
                >
                  Edit schedule
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  icon={<Icon name="x" size={14} />}
                  onClick={() => go('stop')}
                >
                  Cancel automation
                </Button>
              </div>
              <p className="font-sans text-caption mt-stack-tight" style={{ color: 'var(--ink-3)' }}>
                Cadence for every red-flagged property is set in{' '}
                <button
                  type="button"
                  className="underline underline-offset-2 hover:no-underline"
                  style={{ color: 'var(--brand-deep)' }}
                  onClick={() => {
                    window.location.hash = '#/settings/scan';
                    onClose();
                  }}
                >
                  Configuration → Recurring scans
                </button>
                , not per property. Cancelling opts this one property out.
              </p>
            </>
          )}

          {p.scansStopped && (
            <div className="flex flex-wrap gap-inline">
              <Button
                variant="default"
                size="sm"
                icon={<Icon name="replay" size={14} />}
                onClick={() => {
                  onApply?.(p.address, false);
                  go('done-restart');
                }}
              >
                Restart scans
              </Button>
            </div>
          )}
        </div>
      </div>
    );
    footer = (
      <div className="flex justify-between gap-inline">
        <Button
          variant="default"
          icon={<Icon name="external" />}
          onClick={() => {
            // Open the property's report, carrying the red row's served date
            // so the freshness banner reflects how old this finding is.
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('scanAddress', p.address);
              sessionStorage.setItem('scanScenario', 'high');
              sessionStorage.setItem('resultServedAt', p.servedAt || new Date().toISOString());
              sessionStorage.removeItem('resultCached');
            }
            window.location.hash = '#/result/high';
            onClose();
          }}
        >
          Open full report
        </Button>
        <Button variant="default" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }

  return { header, body, footer };
}

/** The real app surface. */
function RedPropertyDrawer({
  open,
  onClose,
  property,
  mode = 'detail',
  onModeChange,
  onApply,
}: RedPropertyDrawerProps) {
  const { header, body, footer } = useRedPropertyContent({
    property,
    mode,
    onModeChange,
    onClose,
    onApply,
  });
  return (
    <Drawer open={open} onClose={onClose} title={header} footer={footer} width={440}>
      {body}
    </Drawer>
  );
}

/** Same content, rendered inline — for spec frames, which a portal escapes. */
function RedPropertyPanel({
  property,
  mode = 'detail',
  onModeChange,
  onClose = () => {},
  onApply,
}: {
  property?: any;
  mode?: RedDrawerMode;
  onModeChange?: (next: RedDrawerMode) => void;
  onClose?: () => void;
  onApply?: (address: string, stopped: boolean) => void;
}) {
  const { header, body, footer } = useRedPropertyContent({
    property,
    mode,
    onModeChange,
    onClose,
    onApply,
  });
  return (
    <div
      className="bg-surface border border-line rounded-lg shadow-sm flex flex-col"
      style={{ width: 440 }}
    >
      <div className="px-card pt-card pb-stack-tight border-b border-line">
        <p className="font-sans text-h4 font-semibold" style={{ color: 'var(--navy)' }}>
          {header}
        </p>
      </div>
      <div className="p-card">{body}</div>
      <div className="px-card pb-card pt-stack-tight border-t border-line">{footer}</div>
    </div>
  );
}
