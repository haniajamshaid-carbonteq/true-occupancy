/* global React */
// Tag — matches .tag in design-spec.html
//   inline-flex · gap 6 · height 26 · padding 0 10 · radius full
//   bg-surface-2 · 1px line border · ink-2 text · mono 11.5
//   svg children: 12×12, opacity .7

interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

function Tag({ icon, children, className = '', ...rest }: TagProps) {
  return (
    <span
      {...rest}
      className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full bg-surface-2 border border-line text-ink-2 font-sans text-[11.5px] ${className}`.trim()}
    >
      {icon && (
        <span className="inline-flex shrink-0 opacity-70 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
      )}
      {children}
    </span>
  );
}
