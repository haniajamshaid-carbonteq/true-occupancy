/* global React */
// Button — matches .btn in design-spec.html
//   height 36 · padding 0 14 · radius var(--r-sm) · 13/500 sans
//   default: bg-surface, ink-2 text, line-strong border
//   primary: bg-brand, white text, brand border
//   ghost:   transparent bg + border

type ButtonVariant = 'primary' | 'default' | 'ghost';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

const BTN_BASE =
  'inline-flex items-center gap-inline rounded-lg font-medium font-sans border cursor-pointer transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

// md is the spec default (h-9 / 36px, 13/500). sm is a tighter variant for
// inline CTAs inside cards or strips where the standard size feels heavy.
const BTN_SIZES: Record<ButtonSize, string> = {
  md: 'h-9 px-control-x text-label',
  sm: 'h-8 px-3 text-caption',
};

// Primary CTA per docs/DESIGN.md §3.1 + §10:
// - Rest:  Teal Green #0AB7A3 (primary brand color, gradient start) on white.
// - Hover: Teal Dark  #015E7A (mirrors the brand-book hyperlink hover).
// Solid fill, no gradient — gradient is reserved for marketing-collateral
// hero bands (§6), not the product surface (§10).
const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white border-brand hover:bg-brand-deep hover:border-brand-deep',
  default: 'bg-surface text-ink-2 border-line-strong hover:bg-hover-bg hover:border-line-strong',
  // Ghost / link buttons across the app land on neutral grey on hover —
  // the pale brand-tint they used to use looked washed-out against the
  // surrounding cards. Text colour stays put; the bg shift is enough.
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-hover-bg',
};

function Button({
  variant = 'default',
  size = 'md',
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
      className={`${BTN_BASE} ${BTN_SIZES[size]} ${BTN_VARIANTS[variant]} ${className}`.trim()}
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
