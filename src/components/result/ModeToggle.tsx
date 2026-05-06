/* global React */
// Segmented control for switching the ScoreCard between investigator
// (0–100 score + signal weights) and resident (Yes / Maybe / No verdict) views.
// Sits top-right of result-screen page headers.

interface ModeToggleProps {
  value: AudienceMode;
  onChange: (mode: AudienceMode) => void;
}

const OPTIONS: { value: AudienceMode; label: string }[] = [
  { value: 'investigator', label: 'Investigator' },
  { value: 'resident', label: 'Resident' },
];

function ModeToggle({ value, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
        View as
      </span>
      <div className="inline-flex bg-surface border border-line-strong rounded-lg p-1 shadow-sm">
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`px-3.5 h-8 rounded-md font-sans text-[13px] font-medium transition-colors ${
                active
                  ? 'bg-brand text-white'
                  : 'bg-transparent text-ink-2 hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
