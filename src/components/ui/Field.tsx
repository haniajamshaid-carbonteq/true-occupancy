/* global React */
// Field — the label + control + hint scaffold shared by form controls.
//
// Anatomy (top to bottom, 6-px stack): optional caption-weight label bound to
// the control via htmlFor, the control itself (passed as children), and an
// optional micro-size hint line below. `error` ONLY recolors the hint —
// it deliberately does not touch the control, because each control owns its
// own error affordance (see Input, whose border/ring only reacts to error
// while focused). Keeping that split is what makes this extraction visually
// neutral; do not "fix" it here.
//
// Accessibility gap preserved from the original inline copies: no
// aria-describedby wiring between hint and control, and no role="alert" on
// the error hint. Adding either changes the accessibility tree and is the
// owner's call, not this wrapper's.

interface FieldProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Visible label above the control. Omit for unlabeled fields. */
  label?: React.ReactNode;
  /** id of the control the label points at. Omit when there is no label. */
  htmlFor?: string;
  /** Optional sub-text below the control (errors, hints). */
  hint?: React.ReactNode;
  /** Error state — switches the hint from ink-3 to risk-ink. */
  error?: boolean;
  /** The form control. */
  children?: React.ReactNode;
}

function Field({
  label,
  htmlFor,
  hint,
  error = false,
  className = '',
  children,
  ...rest
}: FieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()} {...rest}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-sans text-caption font-semibold"
          style={{ color: 'var(--ink-2)' }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <div
          className="font-sans text-micro"
          style={{ color: error ? 'var(--risk-ink)' : 'var(--ink-3)' }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
