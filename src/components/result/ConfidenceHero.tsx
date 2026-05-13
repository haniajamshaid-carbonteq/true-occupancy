/* global React, Card, Icon, Pill, SCENARIOS */
// ConfidenceHero — promotes the composite confidence score to the top of the
// result page and exposes the factor breakdown ("Why this score") as an
// accordion underneath. Compact waffle-grid hero (10×10 dots filled to the
// score) on the right; large score + headline + summary on the left.
// Uses the soft-rainbow palette from tokens.css (--rb-1 … --rb-6).

interface ConfidenceHeroProps {
  scenario: ScenarioKey;
  /** Whether the "Why this score" accordion starts open. Default true. */
  defaultOpen?: boolean;
}

// Color along the soft rainbow at position p (0–100). Linear-interpolates
// between the six --rb-* stops so each waffle dot can carry its own hue.
function rainbowAt(p: number): string {
  const stops: [number, [number, number, number]][] = [
    [0,   [0xF4, 0xA6, 0xA0]],
    [20,  [0xF4, 0xC2, 0x8A]],
    [40,  [0xF4, 0xDD, 0x7A]],
    [60,  [0xA8, 0xE0, 0xC2]],
    [80,  [0x9C, 0xC9, 0xF0]],
    [100, [0xB3, 0xE5, 0xC5]],
  ];
  const x = Math.max(0, Math.min(100, p));
  let i = 0;
  while (i < stops.length - 1 && stops[i + 1][0] < x) i++;
  const [p0, c0] = stops[i];
  const [p1, c1] = stops[Math.min(i + 1, stops.length - 1)];
  const t = p1 === p0 ? 0 : (x - p0) / (p1 - p0);
  const r = Math.round(c0[0] + (c1[0] - c0[0]) * t);
  const g = Math.round(c0[1] + (c1[1] - c0[1]) * t);
  const b = Math.round(c0[2] + (c1[2] - c0[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function WaffleGrid({ score }: { score: number }) {
  // Asymmetric gaps: vertical gap kept tight so the 10-row grid height stays
  // roughly the same as before (~178–180px), while a wider horizontal gap
  // stretches the grid across the right column to absorb middle whitespace.
  const DOT = 16;
  const GAP_Y = 2;
  const GAP_X = 8;
  const WIDTH = DOT * 10 + GAP_X * 9; // 232

  // Sequential fill on mount — dots pop in reading order over ~800ms total.
  // The whole 100-dot grid animates in via CSS keyframe with per-dot delay.
  const TOTAL_FILL_MS = 800;
  const dots = Array.from({ length: 100 }, (_, i) => {
    const idx = i + 1;
    const filled = idx <= score;
    const finalOpacity = filled ? 1 : 0.16;
    return (
      <div
        key={i}
        className="rounded-full waffle-dot-anim"
        style={
          {
            width: DOT,
            height: DOT,
            background: rainbowAt(idx),
            '--final-opacity': finalOpacity,
            '--waffle-delay': `${Math.round((i / 100) * TOTAL_FILL_MS)}ms`,
            opacity: finalOpacity, // fallback for reduced-motion
          } as React.CSSProperties
        }
      />
    );
  });

  return (
    <div className="shrink-0">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(10, ${DOT}px)`,
          columnGap: GAP_X,
          rowGap: GAP_Y,
        }}
        aria-hidden
      >
        {dots}
      </div>
      <div
        className="mt-1 flex justify-between font-sans text-ink-4"
        style={{ fontSize: "var(--text-eyebrow)", letterSpacing: '0.05em', width: WIDTH }}
      >
        <span>1</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}

// One factor row in the "Why this score" breakdown. Positive-only render:
// magnitude shown as a soft teal Pill, no signed sign or impact bar.
// Mounts with a staggered fade+rise so the list reveals in cadence with the
// waffle grid above (parent re-keys rows on accordion toggle, so the entrance
// also fires every time the user reopens).
function FactorRow({
  title,
  desc,
  impact,
  index,
}: {
  title: string;
  desc: string;
  impact: number;
  index: number;
}) {
  const abs = Math.abs(impact);

  return (
    <div
      className="py-3.5 card-rise"
      style={{ '--rise-delay': `${80 + index * 60}ms` } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-sans font-semibold text-body-sm text-ink-2 leading-tight min-w-0">
          {title}
        </div>
        <Pill variant="clean" size="md" className="tabular-nums shrink-0">
          {abs}%
        </Pill>
      </div>
      <div className="mt-1.5 font-sans text-caption text-ink-3 leading-snug">
        {desc}
      </div>
    </div>
  );
}

function WhyThisScore({
  scenario,
  defaultOpen,
}: {
  scenario: ScenarioKey;
  defaultOpen: boolean;
}) {
  const sc = SCENARIOS[scenario];
  const rows = sc.breakdown;
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="mt-5 pt-5 border-t border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer text-left p-0"
      >
        <h3
          className="font-sans font-semibold text-ink m-0"
          style={{ fontSize: 'var(--text-h4)' }}
        >
          Why This Score
        </h3>
        <span
          className={`w-6 h-6 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      <AccordionPanel open={open}>
        <div className="mt-3 divide-y divide-line">
          {rows.map((r, i) => (
            <FactorRow
              key={`${open ? 'o' : 'c'}-${i}`}
              title={r.title}
              desc={r.desc}
              impact={r.impact}
              index={i}
            />
          ))}
        </div>
      </AccordionPanel>
    </div>
  );
}

// Measures child scrollHeight and animates max-height + opacity for a smooth
// open/close. Children always rendered when `open` is true; collapsed state
// is height 0 + zero opacity.
function AccordionPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      // measure on next frame so children are laid out
      const raf = requestAnimationFrame(() => {
        setMaxHeight(el.scrollHeight);
      });
      return () => cancelAnimationFrame(raf);
    }
    setMaxHeight(0);
  }, [open, children]);

  return (
    <div
      ref={ref}
      className="accordion-content"
      style={{
        maxHeight,
        opacity: open ? 1 : 0,
      }}
      aria-hidden={!open}
    >
      {children}
    </div>
  );
}

// Count-up driven by setInterval — eases from 0 → target with cubic
// ease-out. Interval is more reliable than RAF here because the score
// component remounts on every route change (the RouteCrossfade wrapper
// keys on pathname) and the strict-mode double-effect-cancel was leaving
// RAF in a stuck state.
function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    setValue(0);
    const startTime = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const id = setInterval(() => {
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

const VERDICT_TEXT: Record<ScenarioKey, string> = {
  high:   'Rented',
  medium: 'Likely Rented',
  low:    'Not Rented',
};

function ConfidenceHero({ scenario, defaultOpen = true }: ConfidenceHeroProps) {
  const sc = SCENARIOS[scenario];
  const animatedScore = useCountUp(sc.score, 800);

  return (
    <Card className="px-6 py-5">
      {/* Hero row — verdict stacked above its supporting text on the left, waffle on the right */}
      <div className="flex items-center justify-between gap-8">
        <div className="min-w-0">
          <div
            className="font-sans font-semibold leading-[0.95] tracking-[-0.025em]"
            style={{ fontSize: "var(--text-h1)", color: 'var(--navy)' }}
          >
            {VERDICT_TEXT[scenario]}
          </div>
          <div className="mt-3 font-sans text-label text-ink-3 tabular-nums">
            <span className="font-semibold text-ink-2">{animatedScore}%</span> confidence
          </div>
          <div className="mt-3 max-w-[44ch]">
            <div className="font-sans text-body font-medium text-ink-2 leading-snug">
              {sc.headline}
            </div>
            <div className="mt-1.5 font-sans text-label text-ink-3 leading-relaxed">
              {sc.summary}
            </div>
          </div>
        </div>

        <WaffleGrid score={sc.score} />
      </div>

      {/* Why this score — accordion */}
      <WhyThisScore scenario={scenario} defaultOpen={defaultOpen} />
    </Card>
  );
}
