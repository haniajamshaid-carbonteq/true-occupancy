/* global React, Icon */
// Scan loading view: quiet header + a stack of steps that fade in from the
// bottom and fade out at the top, like content streaming past.

interface ScanStep {
  id: string;
  label: string;
  sub: string;
  result: string;
  kind: 'ok' | 'warn';
  status: 'pending' | 'running' | 'done';
}

interface ScanStageProps {
  steps: ScanStep[];
  progress: number;
}

function StepDot({ status, kind }: { status: ScanStep['status']; kind: ScanStep['kind'] }) {
  if (status === 'pending') {
    return <span className="w-3 h-3 rounded-full border border-line-strong shrink-0" aria-hidden />;
  }
  if (status === 'running') {
    return (
      <span
        className="w-3.5 h-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin shrink-0"
        aria-hidden
      />
    );
  }
  return (
    <span
      className={`w-4 h-4 rounded-full grid place-items-center text-white shrink-0 ${
        kind === 'warn' ? 'bg-warn' : 'bg-clean'
      }`}
      aria-hidden
    >
      <Icon name={kind === 'warn' ? 'alert' : 'check'} size={10} />
    </span>
  );
}

function ScanStage({ steps, progress }: ScanStageProps) {
  const address =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    '1428 Maplewood Drive, Asheville, NC';
  const done = steps.filter((s) => s.status === 'done').length;

  // Animated trailing dots after "Scanning"
  const [dotPhase, setDotPhase] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setDotPhase((p) => (p + 1) % 4), 350);
    return () => clearInterval(id);
  }, []);
  const dots = '.'.repeat(dotPhase);

  return (
    <div className="relative min-h-[calc(100vh-9rem)] flex flex-col items-center justify-start pt-12 px-6 overflow-hidden">
      {/* Header */}
      <div className="text-center mb-12 relative">
        <div
          className="font-sans font-bold text-[36px] sm:text-[42px] leading-[1.08] tracking-[-0.005em] max-w-[28ch] mx-auto mb-4"
          style={{ color: 'var(--navy)' }}
        >
          {address}
        </div>
        <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-ink-3 inline-flex items-center gap-2">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-brand opacity-70 animate-ping" />
            <span className="relative w-2 h-2 rounded-full bg-brand" />
          </span>
          <span className="tabular-nums">
            Scanning{dots}
            <span className="opacity-30">{'.'.repeat(3 - dotPhase)}</span> · {progress}% ·{' '}
            {done}/{steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-6 mx-auto w-full max-w-[420px] h-[2px] bg-line rounded-full overflow-hidden">
          <div
            className="h-full bg-brand rounded-full transition-[width] duration-[700ms] ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step list — top + bottom mask makes rows fade into the background */}
      <div
        className="w-full max-w-[520px] relative"
        style={{
          maskImage:
            'linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(180deg, transparent 0%, black 14%, black 86%, transparent 100%)',
          paddingTop: '24px',
          paddingBottom: '24px',
        }}
      >
        {steps.map((s, i) => {
          const isDone = s.status === 'done';
          const isRunning = s.status === 'running';
          const isPending = s.status === 'pending';
          return (
            <div
              key={s.id}
              className={`relative flex items-start gap-3.5 px-3 py-3.5 ${
                i > 0 ? 'border-t border-line/60' : ''
              } ${isPending ? 'opacity-45' : ''}`}
              style={{
                animation: `rowDrift 0.85s cubic-bezier(0.16, 1, 0.3, 1) ${i * 110}ms both`,
                transition: 'opacity 600ms ease',
              }}
            >
              <div className="flex items-center h-[17.5px] shrink-0">
                <StepDot status={s.status} kind={s.kind} />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={`text-[14px] leading-tight font-medium ${
                    isRunning ? 'text-brand' : 'text-ink'
                  }`}
                >
                  {s.label}
                </div>
                <div className="text-[11.5px] text-ink-3 leading-tight mt-0.5 truncate">
                  {isDone || isRunning ? s.result : s.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes rowDrift {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
