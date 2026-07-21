/* global React, Field */
// Input — labeled text-input primitive used by AuthScreen and any form.
//
// Anatomy: Field supplies the label + hint scaffold; Input owns the bordered
// track wrapping a borderless <input>, with optional leading icon and
// trailing slot (eye toggle for passwords, etc.). Focus ring uses brand-soft
// so it reads as warm-teal confirmation rather than the default browser blue.
//
// Known gap, preserved deliberately: `error` only changes the border/ring
// while the field is FOCUSED — a blurred errored field is visually identical
// to a valid one apart from the hint color. There is also no aria-invalid and
// no role="alert". Fixing either changes rendering; that is the owner's call.

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Visible label above the input. Skip for unlabeled fields. */
  label?: string;
  /** Leading icon (sized to the 36-px gutter). */
  leadingIcon?: React.ReactNode;
  /** Trailing slot — e.g. an eye-toggle button for passwords. */
  trailing?: React.ReactNode;
  /** Optional sub-text below the input (errors, hints). */
  hint?: string;
  /** Error state — switches hint color and ring to risk. */
  error?: boolean;
  containerClassName?: string;
}

function Input({
  label,
  leadingIcon,
  trailing,
  hint,
  error = false,
  containerClassName = '',
  className = '',
  id,
  ...rest
}: InputProps) {
  const fallbackId = React.useId ? React.useId() : undefined;
  const inputId = id || fallbackId;
  const [focused, setFocused] = React.useState(false);

  const ringColor = error ? 'var(--risk-soft)' : 'var(--brand-soft)';
  const borderColor = focused
    ? error
      ? 'var(--risk)'
      : 'var(--brand)'
    : 'var(--line)';

  return (
    <Field
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={containerClassName}
    >
      <div
        className="flex items-center gap-2 rounded-lg transition-shadow"
        style={{
          background: 'var(--surface)',
          border: `1px solid ${borderColor}`,
          boxShadow: focused
            ? `0 0 0 3px ${ringColor}, var(--shadow-sm)`
            : 'var(--shadow-sm)',
        }}
      >
        {leadingIcon && (
          <span
            className="grid w-gutter-leading h-control-lg place-items-center shrink-0 [&>svg]:w-4 [&>svg]:h-4"
            style={{ color: 'var(--ink-3)' }}
            aria-hidden
          >
            {leadingIcon}
          </span>
        )}
        <input
          id={inputId}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          className={`flex-1 min-w-0 bg-transparent border-0 outline-none h-control-lg text-body-sm font-sans placeholder:text-ink-4 ${
            leadingIcon ? '' : 'pl-4'
          } ${trailing ? '' : 'pr-4'} ${className}`.trim()}
          style={{ color: 'var(--ink)' }}
        />
        {trailing && (
          <span
            className="grid w-gutter-trailing h-control-lg place-items-center shrink-0"
            style={{ color: 'var(--ink-3)' }}
          >
            {trailing}
          </span>
        )}
      </div>
    </Field>
  );
}
