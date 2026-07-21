/* global React */
// Button — matches .btn in design-spec.html
//   height 36 · padding 0 14 · radius var(--r-sm) · 13/500 sans
//   default: bg-surface, ink-2 text, line-strong border
//   primary: bg-brand, white text, brand border
//   ghost:   transparent bg + border

type ButtonVariant = 'primary' | 'default' | 'ghost' | 'spotlight';
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
  md: 'h-control-md px-control-x text-label',
  sm: 'h-control-sm px-3 text-caption',
};

// Primary CTA per docs/DESIGN.md §3.1 + §10:
// - Rest:  Teal Green #0AB7A3 (primary brand color, gradient start) on white.
// - Hover: Teal Dark  #015E7A (mirrors the brand-book hyperlink hover).
//
// Gradient rule (revised Jul-2026, owner call): gradient was previously
// marketing-collateral only (§6), banned on the product surface (§10). It
// is now permitted for `spotlight` — the single hero CTA on a screen — and
// the §13.1 gradient inventory grows by that one entry. `primary` is still
// solid; do not gradient it.
const BTN_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand border-brand hover:bg-brand-deep hover:border-brand-deep',
  // Hero CTA. Carries the .ai-cta sheen from motion.css — the class is
  // registered motion, not a local effect. One per screen: a second
  // spotlight on the same view cancels the point of it.
  //
  // Contrast: white sits on #0AB7A3 at the light end, the same fill (and
  // the same sub-AA ratio) `primary` already uses, and improves to ~7.5:1
  // toward #015E7A. No worse than the button it sits beside — but the
  // white-on-teal open question in DESIGN.md §10 covers both and is still
  // unresolved.
  // No hover: utility here — `.ai-cta:hover` already owns the hover filter
  // (brightness 1.06 + saturate 1.05). Adding a Tailwind brightness on top
  // compounds into 1.06² and the button visibly jumps.
  spotlight:
    'ai-cta bg-gradient-to-br from-brand to-brand-deep text-on-brand border-transparent',
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
