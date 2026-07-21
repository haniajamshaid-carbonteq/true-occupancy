/* global React */
// Pill — the single canonical small-label primitive. See design-spec.html.
//
// Sizes
//   md (default) — h-6 (24px) · px-2.5 · text-micro · 500 · uppercase · tracking .04em
//   sm           — h-5 (20px) · px-1.5 · text-eyebrow · 700 · uppercase · tracking .08em
//
// Variants (color pairs are token-driven, never inline)
//   default                       bg-pill-neutral · ink-2  · line border
//   clean / warn / risk           {status}-soft   · {status}-ink · no border
//   brand                         brand-soft      · brand-deep   · no border
//   verdict-high / -med / -low    purple / yellow / blue — categorical, not severity
//
// Modifiers
//   dot      — leading 6px currentColor dot (status / live indicator)
//   subtle   — surface-2 bg · ink-2 · normal weight · mixed-case (replaces old Tag)
//   icon     — optional leading icon (rendered at 12px @ .7 opacity, like old Tag)

type PillVariant =
  | 'default'
  | 'clean' | 'warn' | 'risk'
  | 'brand'
  | 'verdict-high' | 'verdict-med' | 'verdict-low';

type PillSize = 'sm' | 'md';

interface PillProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  variant?: PillVariant;
  size?: PillSize;
  /** Leading 6px dot in currentColor. */
  dot?: boolean;
  /** Quieter pill: surface-2 bg, ink-2, normal weight, mixed-case (former Tag). */
  subtle?: boolean;
  /** Leading icon — sized to 12px at .7 opacity. */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const PILL_SIZE: Record<PillSize, string> = {
  md: 'h-6 px-2.5 gap-1.5 text-micro font-medium uppercase tracking-pill',
  sm: 'h-5 px-1.5 gap-1 text-eyebrow font-bold uppercase tracking-eyebrow',
};

const PILL_VARIANTS: Record<PillVariant, string> = {
  default: 'bg-pill-neutral text-ink-2 border-line',
  clean: 'bg-clean-soft text-clean-ink border-transparent',
  warn: 'bg-warn-soft text-warn-ink border-transparent',
  risk: 'bg-risk-soft text-risk-ink border-transparent',
  brand: 'bg-brand-soft text-brand-deep border-transparent',
  'verdict-high': 'bg-verdict-high-soft text-verdict-high-ink border-transparent',
  'verdict-med':  'bg-verdict-med-soft text-verdict-med-ink border-transparent',
  'verdict-low':  'bg-verdict-low-soft text-verdict-low-ink border-transparent',
};

// `subtle` overrides typography (normal weight, mixed-case) on top of the
// chosen size. Keeps height/padding so subtle pills line up with regular ones.
const SUBTLE_TYPO = 'font-normal normal-case tracking-normal';

const PILL_BASE = 'inline-flex items-center rounded-pill font-sans border';

function Pill({
  variant = 'default',
  size = 'md',
  dot,
  subtle,
  icon,
  children,
  className = '',
  ...rest
}: PillProps) {
  const sizeCls = PILL_SIZE[size];
  const variantCls = subtle
    ? 'bg-surface-2 text-ink-2 border-line'
    : PILL_VARIANTS[variant];
  const typoOverride = subtle ? ` ${SUBTLE_TYPO}` : '';
  return (
    <span
      {...rest}
      className={`${PILL_BASE} ${sizeCls} ${variantCls}${typoOverride} ${className}`.trim()}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {icon && (
        <span className="inline-flex shrink-0 opacity-70 [&>svg]:w-3 [&>svg]:h-3">{icon}</span>
      )}
      {children}
    </span>
  );
}
