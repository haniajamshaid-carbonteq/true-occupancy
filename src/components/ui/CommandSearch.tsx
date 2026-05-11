/* global React, Button, Icon, Keycap */
// CommandSearch — the hero search surface (Linear/Raycast-flavored).
//
// Two modes share the same input, focus-ring, and Run scan action so the
// muscle-memory carries between them:
//   - inline   : the dominant card on HomeScreen (try-chips beneath)
//   - overlay  : the body of the global ⌘K palette (hint row beneath)
//
// Visuals: 64px input height, animated 2px gradient focus ring (brand teal →
// brand-2), backdrop-blur lift on focus, leading icon shifts ink-3 → brand.
//
// The animated typewriter placeholder cycles through example queries when
// the input is empty + unfocused. `prefers-reduced-motion: reduce` falls
// back to the first phrase, statically.

interface CommandSearchProps {
  mode?: 'inline' | 'overlay';
  value: string;
  onChange: (next: string) => void;
  onRun: (value?: string) => void;
  /** Hero only — try-chips (e.g. ZIP samples) shown beneath. */
  sampleChips?: { label: string; value: string }[];
  /** Overlay only — fired on Esc. */
  onClose?: () => void;
  /** Auto-focus the input on mount (overlay does this). */
  autoFocus?: boolean;
  /** Override the rotating placeholder list. */
  placeholders?: string[];
}

const DEFAULT_PHRASES = [
  'Enter a U.S. street address…',
  'Paste an Airbnb or Vrbo listing URL…',
  'Try a parcel ID — e.g. 9648-92-3271-00000…',
  'Or geocoded coords — 35.5951, -82.5515…',
];

// --- typewriter hook ------------------------------------------------------
// Cycles through phrases with type → hold → delete → next. Pauses while
// the input is non-empty or focused; resumes on blur+empty. Reduced-motion
// callers get the first phrase, frozen.

function useTypewriterPlaceholder(
  phrases: string[],
  paused: boolean
): string {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [text, setText] = React.useState(reduced ? phrases[0] || '' : '');
  const stateRef = React.useRef({ phrase: 0, ch: 0, mode: 'type' as 'type' | 'hold' | 'delete' });

  React.useEffect(() => {
    if (reduced || paused || phrases.length === 0) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      const s = stateRef.current;
      const current = phrases[s.phrase % phrases.length];
      if (s.mode === 'type') {
        s.ch += 1;
        setText(current.slice(0, s.ch));
        if (s.ch >= current.length) {
          s.mode = 'hold';
          timer = setTimeout(tick, 1600);
          return;
        }
        timer = setTimeout(tick, 38 + Math.random() * 30);
      } else if (s.mode === 'hold') {
        s.mode = 'delete';
        timer = setTimeout(tick, 24);
      } else {
        s.ch -= 1;
        setText(current.slice(0, Math.max(0, s.ch)));
        if (s.ch <= 0) {
          s.mode = 'type';
          s.phrase = (s.phrase + 1) % phrases.length;
          timer = setTimeout(tick, 320);
          return;
        }
        timer = setTimeout(tick, 18);
      }
    };
    timer = setTimeout(tick, 280);
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phrases, paused, reduced]);

  if (reduced) return phrases[0] || '';
  return text || ' '; // keep a non-empty placeholder so the input height is stable
}

// Keycap is now a shared primitive (src/components/ui/Keycap.tsx) — loaded
// before this file in the bootstrap order.

// --- main component -------------------------------------------------------

function CommandSearch({
  mode = 'inline',
  value,
  onChange,
  onRun,
  sampleChips,
  onClose,
  autoFocus = false,
  placeholders = DEFAULT_PHRASES,
}: CommandSearchProps) {
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Defer to next frame so overlay scale-in animation doesn't
      // get interrupted by focus scrolling.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus]);

  const animated = useTypewriterPlaceholder(
    placeholders,
    focused || value.length > 0
  );
  // When focused with an empty input the typewriter pauses; show a static
  // hint so the field never appears blank.
  const placeholder =
    focused && value.length === 0 ? placeholders[0] || '' : animated;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRun(value);
      onClose?.();
    } else if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
  }

  const wrapperHeight = mode === 'overlay' ? 64 : 64;

  return (
    <div className={mode === 'overlay' ? 'w-full' : 'w-full'}>
      {/* Glow layer — soft brand wash visible only when focused */}
      <div className="relative">
        <div
          className="pointer-events-none absolute -inset-2 rounded-[24px] transition-opacity duration-200"
          aria-hidden
          style={{
            background:
              'radial-gradient(60% 70% at 50% 50%, rgba(10,183,163,0.18), rgba(4,152,198,0.05) 60%, transparent 80%)',
            opacity: focused ? 1 : 0,
            filter: 'blur(14px)',
          }}
        />
        {/* Gradient ring — paints under the surface card on focus */}
        <div
          className="absolute inset-0 rounded-[14px] transition-opacity duration-200"
          aria-hidden
          style={{
            padding: '2px',
            background:
              'linear-gradient(120deg, var(--brand) 0%, var(--brand-2) 60%, var(--brand) 100%)',
            opacity: focused ? 1 : 0,
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
        <div
          className="relative flex items-center gap-3 bg-surface rounded-[14px] transition-shadow duration-200"
          style={{
            border: focused ? '1px solid transparent' : '1px solid var(--line-strong)',
            boxShadow: focused
              ? '0 12px 36px -12px rgba(20, 45, 85, 0.18), 0 2px 6px rgba(20, 45, 85, 0.06)'
              : 'var(--shadow-sm)',
            paddingLeft: 16,
            paddingRight: 8,
            height: wrapperHeight,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span
            className="grid place-items-center shrink-0 transition-colors duration-200 [&>svg]:w-[18px] [&>svg]:h-[18px]"
            style={{ color: focused ? 'var(--brand)' : 'var(--ink-3)' }}
            aria-hidden
          >
            <Icon name="search" size={18} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label="Search address, URL, parcel ID, or coordinates"
            className="flex-1 min-w-0 border-0 outline-none bg-transparent font-sans text-h4 leading-none text-ink placeholder:text-ink-4 tabular-nums"
            spellCheck={false}
            autoComplete="off"
          />
          {/* Same primary action in both modes — the home-screen search
              and the ⌘K overlay should feel identical, not like two
              different products bolted together. */}
          <Button
            variant="primary"
            onClick={() => onRun(value)}
            icon={<Icon name="search" size={14} />}
          >
            Run scan
          </Button>
        </div>
      </div>

      {/* Meta row */}
      {mode === 'inline' && sampleChips && sampleChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mr-1">
            Try
          </span>
          {sampleChips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onChange(c.value)}
              className="px-2.5 py-1 rounded-full border border-line text-caption text-ink-2 hover:border-line-strong hover:bg-line transition-colors"
            >
              {c.label}
            </button>
          ))}
          <span className="ml-auto text-caption text-ink-3 hidden sm:inline-flex items-center gap-1.5">
            <Keycap>⌘</Keycap>
            <Keycap>K</Keycap>
            <span className="text-ink-4">to open anywhere</span>
          </span>
        </div>
      )}
      {/* Overlay mode is intentionally blank below the input — the user
          arrived here via ⌘K and doesn't need that shortcut hinted again. */}
    </div>
  );
}
