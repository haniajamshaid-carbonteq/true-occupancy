/* global React */
// Toggle — a track+thumb switch for a single on/off boolean. Distinct from
// Checkbox (a 16px square check): this is the sliding switch used to enable or
// disable a setting (e.g. "Session timeout" in Scan configuration). Renders a
// real <button role="switch"> so keyboard and assistive tech get native switch
// semantics; an optional label/description sits to the right and is clickable.
//
// Motion binds to tokens (--motion-fast / --ease-out) and drops to no transition
// under prefers-reduced-motion. On = brand track; off = neutral line-strong.

interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Visible label to the right of the switch. */
  label?: React.ReactNode;
  /** Optional helper line under the label. */
  description?: React.ReactNode;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Accessible name when no visible label is rendered. */
  ariaLabel?: string;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
  ariaLabel,
}: ToggleProps) {
  const fallbackId = React.useId ? React.useId() : undefined;
  const tId = id || fallbackId;
  const toggle = () => {
    if (!disabled) onChange(!checked);
  };

  const track = (
    <button
      type="button"
      role="switch"
      id={tId}
      aria-checked={checked}
      aria-label={label ? undefined : ariaLabel}
      disabled={disabled}
      onClick={toggle}
      className={`relative inline-flex items-center shrink-0 h-6 w-10 rounded-full transition-colors duration-[var(--motion-fast)] ease-[var(--ease-out)] motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ background: checked ? 'var(--brand)' : 'var(--line-strong)' }}
    >
      <span
        className="absolute left-0.5 h-5 w-5 rounded-full shadow-sm transition-transform duration-[var(--motion-fast)] ease-[var(--ease-out)] motion-reduce:transition-none"
        style={{
          background: 'var(--on-brand)',
          transform: checked ? 'translateX(16px)' : 'translateX(0)',
        }}
        aria-hidden
      />
    </button>
  );

  if (!label && !description) {
    return className ? <span className={className}>{track}</span> : track;
  }

  return (
    <div className={`flex items-start gap-3 ${className}`.trim()}>
      {track}
      <span
        onClick={toggle}
        className={`min-w-0 select-none ${disabled ? '' : 'cursor-pointer'}`}
      >
        {label && (
          <span className="block font-sans text-label font-medium" style={{ color: 'var(--ink)' }}>
            {label}
          </span>
        )}
        {description && (
          <span className="block font-sans text-caption mt-0.5" style={{ color: 'var(--ink-3)' }}>
            {description}
          </span>
        )}
      </span>
    </div>
  );
}
