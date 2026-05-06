/* global React */
// Avatar — matches .avatar in design-spec.html
//   32×32 circle · linear-gradient(135deg, #C9B89E, #8C7A5B) · white text
//   12/600 mono, centered

interface AvatarProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Initials shown when no image is provided. Truncated to 2 chars. */
  initials?: string;
  /** Optional image source. Falls back to initials. */
  src?: string;
  alt?: string;
  /** Pixel size (square). Defaults to 32 to match the spec. */
  size?: number;
}

// Cool neutral gradient — replaces the previous warm tan→brown so the
// avatar doesn't push the surrounding white bg to read as cream.
const GRADIENT = 'linear-gradient(135deg, #B6BDC6, #6E7A87)';

function Avatar({
  initials = '',
  src,
  alt,
  size = 32,
  className = '',
  style,
  ...rest
}: AvatarProps) {
  const trimmed = initials.slice(0, 2).toUpperCase();
  return (
    <span
      {...rest}
      className={`inline-grid place-items-center rounded-full text-white font-mono font-semibold overflow-hidden shrink-0 ${className}`.trim()}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, Math.round(size * 0.375)),
        background: src ? undefined : GRADIENT,
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={alt ?? trimmed} className="w-full h-full object-cover" />
      ) : (
        trimmed
      )}
    </span>
  );
}
