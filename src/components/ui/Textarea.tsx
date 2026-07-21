/* global React */
// Textarea — labeled multi-line field primitive. Sibling of Input.tsx: same
// label / field-track / hint anatomy and the same warm-teal brand-soft focus
// ring, sized for a block of copy instead of a single line.
//
// One deliberate difference from Input.tsx: the focus treatment here is pure
// CSS (`focus:border-brand focus:shadow-[...]`) rather than Input's React
// focus-state + inline boxShadow. That is how the extracted call site
// (BatchScreen's description field) already rendered — it has no resting
// shadow-sm, so reusing Input's exact recipe would change pixels. Preserved
// as-is; unifying the two is a separate decision.

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label above the field. Skip for unlabeled fields. */
  label?: React.ReactNode;
  /** Optional sub-text below the field (character caps, hints). */
  hint?: React.ReactNode;
  containerClassName?: string;
}

function Textarea({
  label,
  hint,
  containerClassName = '',
  className = '',
  id,
  ...rest
}: TextareaProps) {
  const fallbackId = React.useId ? React.useId() : undefined;
  const fieldId = id || fallbackId;

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`.trim()}>
      {label && (
        <label
          htmlFor={fieldId}
          className="font-sans text-caption font-semibold"
          style={{ color: 'var(--ink-2)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={fieldId}
        {...rest}
        className={`w-full bg-surface border border-line rounded-lg px-4 py-2.5 text-body-sm font-sans outline-none focus:border-brand focus:shadow-[0_0_0_3px_var(--brand-soft)] placeholder:text-ink-4 resize-none transition-shadow ${className}`.trim()}
        style={{ color: 'var(--ink)' }}
      />
      {hint && (
        <div className="font-sans text-micro" style={{ color: 'var(--ink-3)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}
