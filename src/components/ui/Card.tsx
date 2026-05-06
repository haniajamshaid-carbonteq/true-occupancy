/* global React */
// Card — matches .card in design-spec.html
//   bg-surface · 1px line border · radius var(--r-lg) (18) · shadow-sm

interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Add internal padding. Defaults to none so the card can host
   *  edge-to-edge content (tables, gradients, split panels). */
  padded?: boolean;
  /** Drop the shadow — useful when nesting cards. */
  flat?: boolean;
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

const CARD_BASE = 'bg-surface border border-line rounded-lg overflow-hidden';

function Card({
  padded = false,
  flat = false,
  as: Tag = 'div',
  children,
  className = '',
  ...rest
}: CardProps) {
  const cls = [
    CARD_BASE,
    flat ? '' : 'shadow-sm',
    padded ? 'p-6' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag {...rest} className={cls}>
      {children}
    </Tag>
  );
}
