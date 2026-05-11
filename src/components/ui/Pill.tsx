/* global React */
// Pill — matches .pill in design-spec.html
//   height 24 · padding 0 10 · radius full · mono 11/500 uppercase, tracking .04em
//   default: bg-surface-2, ink-2 text, line border
//   clean / warn / risk: {status}-soft bg + {status}-ink text, transparent border
//   brand: brand-soft bg + brand text, transparent border

type PillVariant = 'default' | 'clean' | 'warn' | 'risk' | 'brand';

interface PillProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: PillVariant;
  /** Show the leading 6px dot (currentColor). */
  dot?: boolean;
  children?: React.ReactNode;
}

const PILL_BASE =
  "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full font-sans text-micro font-medium uppercase tracking-[0.04em] border";

const PILL_VARIANTS: Record<PillVariant, string> = {
  default: 'bg-surface-2 text-ink-2 border-line',
  clean: 'bg-clean-soft text-clean-ink border-transparent',
  warn: 'bg-warn-soft text-warn-ink border-transparent',
  risk: 'bg-risk-soft text-risk-ink border-transparent',
  brand: 'bg-brand-soft text-brand-deep border-transparent',
};

function Pill({ variant = 'default', dot, children, className = '', ...rest }: PillProps) {
  return (
    <span
      {...rest}
      className={`${PILL_BASE} ${PILL_VARIANTS[variant]} ${className}`.trim()}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
