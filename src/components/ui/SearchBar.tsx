/* global React */
// SearchBar — matches .search-wrap in design-spec.html
//   bg-surface · 1px line border · radius var(--r-lg) · padding 8 · shadow-sm
//   .icon: 36px wide square, ink-3
//   input: borderless, 16px, 8px y-padding, ink-4 placeholder

interface SearchBarProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Leading icon — sized to the 36px gutter. */
  icon?: React.ReactNode;
  /** Optional trailing slot (e.g. a Button). */
  trailing?: React.ReactNode;
  containerClassName?: string;
}

function SearchBar({
  icon,
  trailing,
  containerClassName = '',
  className = '',
  type = 'search',
  ...rest
}: SearchBarProps) {
  return (
    <div
      className={`bg-surface border border-line rounded-lg shadow-sm p-2 flex items-center gap-2 ${containerClassName}`.trim()}
    >
      {icon && (
        <span className="hidden sm:grid w-gutter-leading place-items-center text-ink-3 shrink-0 [&>svg]:w-4 [&>svg]:h-4">
          {icon}
        </span>
      )}
      <input
        type={type}
        {...rest}
        className={`flex-1 border-0 outline-none bg-transparent text-base py-2 text-ink placeholder:text-ink-4 font-sans ${className}`.trim()}
      />
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
