/* global React */
// RiskBadge — matches .risk-badge in design-spec.html
//   inline-flex · gap 8 · padding 6 12 6 8 · radius full · 13/500
//   {status}-soft bg + {status}-ink text
//   .glyph: 22×22 round, white text, bg = solid {status} color

type RiskLevel = 'clean' | 'warn' | 'risk';

interface RiskBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  level: RiskLevel;
  /** SVG (or other node) rendered inside the 22×22 circular glyph. */
  glyph?: React.ReactNode;
  children: React.ReactNode;
}

const SHELL_BY_LEVEL: Record<RiskLevel, string> = {
  clean: 'bg-clean-soft text-clean-ink',
  warn: 'bg-warn-soft text-warn-ink',
  risk: 'bg-risk-soft text-risk-ink',
};

const GLYPH_BY_LEVEL: Record<RiskLevel, string> = {
  clean: 'bg-clean',
  warn: 'bg-warn',
  risk: 'bg-risk',
};

function RiskBadge({ level, glyph, children, className = '', ...rest }: RiskBadgeProps) {
  return (
    <span
      {...rest}
      className={`inline-flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full text-label font-medium font-sans ${SHELL_BY_LEVEL[level]} ${className}`.trim()}
    >
      <span
        className={`w-[22px] h-[22px] rounded-full grid place-items-center text-white shrink-0 [&>svg]:w-3 [&>svg]:h-3 ${GLYPH_BY_LEVEL[level]}`}
      >
        {glyph}
      </span>
      {children}
    </span>
  );
}
