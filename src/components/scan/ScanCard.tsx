/* global React, Card, Pill, Icon */

interface ScanStep {
  id: string;
  label: string;
  sub: string;
  result: string;
  kind: 'ok' | 'warn';
  status: 'pending' | 'running' | 'done';
}

interface ScanCardProps {
  steps: ScanStep[];
  scanning: boolean;
  /** 0–100. */
  progress: number;
}

function StepIcon({ status, kind }: { status: ScanStep['status']; kind: ScanStep['kind'] }) {
  if (status === 'pending') {
    return <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-dashed border-line-strong" />;
  }
  if (status === 'running') {
    return (
      <span
        className="w-4 h-4 rounded-full border-[1.8px] border-brand border-t-transparent animate-spin"
        aria-hidden
      />
    );
  }
  // done
  const bg = kind === 'warn' ? 'bg-warn' : 'bg-clean';
  return (
    <span className={`w-6 h-6 rounded-full grid place-items-center text-white ${bg}`}>
      <Icon name={kind === 'warn' ? 'alert' : 'check'} size={13} />
    </span>
  );
}

function StepTag({ status, kind }: { status: ScanStep['status']; kind: ScanStep['kind'] }) {
  if (status === 'pending') return <Pill>Queued</Pill>;
  if (status === 'running') return <Pill variant="brand" dot>Checking</Pill>;
  if (kind === 'warn') return <Pill variant="warn">Match</Pill>;
  return <Pill variant="clean">Clear</Pill>;
}

function ScanCard({ steps, scanning, progress }: ScanCardProps) {
  const done = steps.filter((s) => s.status === 'done').length;

  return (
    <Card>
      {/* Head */}
      <div className="px-7 pt-5 pb-4 flex items-center justify-between border-b border-line gap-3.5">
        <div className="flex-1">
          <h3 className="font-serif text-[22px] font-normal m-0">Live scan</h3>
          <div className="flex items-center gap-2 mt-3.5">
            <div className="flex-1 h-1 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-brand-2 rounded-full transition-[width] duration-[400ms] ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="font-mono text-xs text-ink-3 w-10 text-right">{progress}%</div>
          </div>
        </div>
        <div className="flex items-center gap-3.5 font-mono text-xs text-ink-3">
          {scanning ? (
            <>
              <span className="w-2 h-2 rounded-full bg-clean" />
              <span>live</span>
            </>
          ) : (
            <span className="text-clean">● complete</span>
          )}
          <span>·</span>
          <span>
            {done}/{steps.length} steps
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-surface-2 px-4 py-4 flex flex-col gap-1">
        {steps.map((s) => {
          const rowBg =
            s.status === 'running'
              ? 'bg-surface shadow-sm'
              : s.status === 'pending'
              ? 'opacity-50'
              : '';
          const labelColor = s.status === 'running' ? 'text-brand' : 'text-ink';
          const subText =
            s.status === 'pending' ? 'Waiting…' : s.status === 'running' ? s.sub : s.result;
          return (
            <div
              key={s.id}
              className={`grid grid-cols-[32px_1fr_auto] gap-3.5 items-center px-3 py-3.5 rounded-md ${rowBg}`}
            >
              <div className="w-8 h-8 grid place-items-center">
                <StepIcon status={s.status} kind={s.kind} />
              </div>
              <div>
                <div className={`text-[14.5px] font-medium leading-tight ${labelColor}`}>
                  {s.label}
                </div>
                <div className="font-mono text-[11.5px] text-ink-3 mt-0.5">{subText}</div>
              </div>
              <div>
                <StepTag status={s.status} kind={s.kind} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
