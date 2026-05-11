/* global React */
// Checkbox — square check with brand-teal fill when checked.
// Renders a hidden native input for accessibility + keyboard support, plus
// a styled facade that follows the design tokens.

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Visible label rendered next to the box. */
  label?: React.ReactNode;
}

function Checkbox({
  label,
  checked,
  className = '',
  id,
  ...rest
}: CheckboxProps) {
  const fallbackId = React.useId ? React.useId() : undefined;
  const cbId = id || fallbackId;

  return (
    <label
      htmlFor={cbId}
      className={`inline-flex items-center gap-2 cursor-pointer select-none font-sans text-caption ${className}`.trim()}
      style={{ color: 'var(--ink-2)' }}
    >
      <span
        className="relative inline-grid place-items-center w-4 h-4 rounded transition-colors"
        style={{
          background: checked ? 'var(--brand)' : 'var(--surface)',
          border: `1px solid ${checked ? 'var(--brand)' : 'var(--line-strong)'}`,
        }}
        aria-hidden
      >
        {checked && (
          <svg
            viewBox="0 0 16 16"
            className="w-3 h-3"
            fill="none"
            stroke="white"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m4 8 3 3 5-7" />
          </svg>
        )}
      </span>
      <input
        id={cbId}
        type="checkbox"
        checked={checked}
        {...rest}
        className="sr-only"
      />
      {label && <span>{label}</span>}
    </label>
  );
}
