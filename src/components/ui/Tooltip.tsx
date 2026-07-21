/* global React */
// Tooltip — truncation-gated text tooltip. Extracted verbatim from the
// file-private `TruncatedText` helper in ListingsPanel.
//
// This is NOT a general always-on tooltip. The trigger is the text itself:
// it renders with `truncate` and the bubble only appears when the text is
// actually clipped (scrollWidth > clientWidth). That gating is the point —
// callers wrap every cell unconditionally and only overflowing ones get a
// tooltip. A hover-anything tooltip would need different mount/gate logic,
// so it is deliberately not folded in here.
//
// The bubble is `position: fixed` and anchored to the trigger's viewport
// rect so it escapes table/overflow clipping. It re-measures via
// ResizeObserver whenever the trigger or its children change.
//
// Note: the bubble background is `--navy` (not a brand fill), so its text
// color stays the literal `white` rather than `--on-brand`.

interface TooltipProps {
  /** The (possibly clipped) text. Rendered inside the truncating span. */
  children: React.ReactNode;
  /** Appended to the trigger span's classes. */
  className?: string;
  /** Inline style on the trigger span. */
  style?: React.CSSProperties;
  /** Bubble text. Defaults to `children` when children is a plain string. */
  tooltip?: string;
}

function Tooltip({ children, className, style, tooltip }: TooltipProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  const tip = tooltip ?? (typeof children === 'string' ? children : '');

  const check = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollWidth > el.clientWidth + 1);
  }, []);

  React.useEffect(() => {
    check();
    const ro = new ResizeObserver(check);
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, [check, children]);

  function onEnter(e: React.MouseEvent<HTMLSpanElement>) {
    if (!overflowing) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPos({ x: r.left, y: r.top });
    setHover(true);
  }
  function onLeave() {
    setHover(false);
  }

  return (
    <>
      <span
        ref={ref}
        className={`truncate block min-w-0 ${className ?? ''}`}
        style={style}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {children}
      </span>
      {hover && overflowing && pos && (
        <div
          role="tooltip"
          className="fixed z-popover pointer-events-none px-2 py-1 rounded-md text-caption font-sans shadow-md max-w-sm break-words"
          style={{
            left: pos.x,
            top: pos.y - 8,
            transform: 'translateY(-100%)',
            background: 'var(--navy)',
            color: 'white',
            whiteSpace: 'normal',
          }}
        >
          {tip}
        </div>
      )}
    </>
  );
}
