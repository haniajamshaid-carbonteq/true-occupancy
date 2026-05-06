/* global React */
// Button — matches .btn in design-spec.html
//   height 36 · padding 0 14 · radius var(--r-sm) · 13/500 sans
//   default: bg-surface, ink-2 text, line-strong border
//   primary: bg-brand, white text, brand border
//   ghost:   transparent bg + border

type ButtonVariant = 'primary' | 'default' | 'ghost';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

const BTN_BASE =
  'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium font-sans border cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white border-brand hover:bg-brand-deep hover:border-brand-deep',
  default: 'bg-surface text-ink-2 border-line-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-2',
};

function Button({
  variant = 'default',
  icon,
  iconRight,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${className}`.trim()}
    >
      {icon && (
        <span className="inline-flex shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      )}
      {children}
      {iconRight && (
        <span className="inline-flex shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{iconRight}</span>
      )}
    </button>
  );
}
