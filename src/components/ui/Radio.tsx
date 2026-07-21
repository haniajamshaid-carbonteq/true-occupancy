/* global React */
// Radio / RadioGroup — the card-style single-select used by AutomateModal
// (cadence cards, retention-rule cards). NOT a classic radio row: each option
// is a bordered card with a title + hint and a small circular indicator, laid
// out by the group as a 1-up / 2-up grid.
//
// Extracted verbatim from the two hand-rolled `role="radiogroup"` blocks in
// AutomateModal. Deliberate constraints carried over from that original:
//   - No native <input type="radio">. The control is a <button role="radio">
//     with aria-checked, so the group does NOT get browser radio semantics.
//   - Selection is NOT managed here. `checked` is computed by the caller —
//     the cadence group compares option objects with sameCadence(), so a
//     value/onChange contract would not fit both call sites.
//   - No arrow-key roving tabindex and no explicit focus ring (see the a11y
//     note in the extraction report). Preserved as-is; adding either would
//     change behaviour/rendering and is a separate decision.

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the group (rendered as aria-label). */
  label: string;
  children?: React.ReactNode;
}

function RadioGroup({ label, className = '', children, ...rest }: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}

interface RadioProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  /** Card title — semibold label line. */
  label: React.ReactNode;
  /** Secondary line under the title. */
  hint?: React.ReactNode;
  /** Selected state. Computed by the caller (values may be objects). */
  checked: boolean;
  /** Fired on click when the card is chosen. */
  onSelect: () => void;
  /** Extra classes on the hint line. The retention cards tighten leading
   *  (`leading-snug`) because their hints wrap to two lines; the cadence
   *  cards do not. Kept as a prop so both render exactly as before. */
  hintClassName?: string;
}

function Radio({
  label,
  hint,
  checked,
  onSelect,
  hintClassName = '',
  className = '',
  ...rest
}: RadioProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`text-left flex items-start gap-inline-loose px-control-x py-3 rounded-md border transition-colors ${
        checked
          ? '!bg-brand-tint !border-brand/40'
          : 'bg-surface border-line hover:bg-hover-bg hover:border-line-strong'
      } ${className}`.trim()}
      {...rest}
    >
      <span
        className={`mt-0.5 w-4 h-4 rounded-full border-2 grid place-items-center shrink-0 transition-colors ${
          checked ? 'border-brand' : 'border-line-strong'
        }`}
        aria-hidden
      >
        {checked && <span className="w-1.5 h-1.5 rounded-full bg-brand" />}
      </span>
      <span className="min-w-0">
        <span
          className="block font-sans font-semibold text-label"
          style={{ color: checked ? 'var(--brand-deep)' : 'var(--navy)' }}
        >
          {label}
        </span>
        <span className={`block text-caption text-ink-3 mt-0.5 ${hintClassName}`.trim()}>
          {hint}
        </span>
      </span>
    </button>
  );
}
