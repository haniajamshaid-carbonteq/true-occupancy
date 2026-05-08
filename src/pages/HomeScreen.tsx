/* global React, AppShell, Button, Icon, SearchBar, ReactRouterDOM */
// Home — single-purpose tool. User types a property address, we route them
// through the scan animation and into the matching result.
//
// Scenario routing is keyed off the ZIP for the demo:
//   28804 -> clean      (low risk)
//   28805 -> medium     (questionable)
//   28806 -> high       (red flag)
//   anything else -> clean (safe default)

const { useHistory } = ReactRouterDOM;

const ZIP_TO_SCENARIO: Record<string, 'low' | 'medium' | 'high'> = {
  '28804': 'low',
  '28805': 'medium',
  '28806': 'high',
};

const STEPS = [
  {
    numeral: '01',
    icon: 'search' as const,
    title: 'Enter an address',
    body: 'Paste any U.S. street address, parcel ID, or geocoded coordinates.',
  },
  {
    numeral: '02',
    icon: 'layers' as const,
    title: 'We sweep the platforms',
    body: 'Cross-check Airbnb, Vrbo, and Facebook Marketplace within a 1 mile radius — in seconds.',
  },
  {
    numeral: '03',
    icon: 'shield' as const,
    title: 'Read the verdict',
    body: 'Get a 0–100 confidence score with every contributing signal, ready to share or export.',
  },
];

const STEP_VISUALS: Record<string, { src: string; objectPosition?: string }> = {
  '01': { src: 'uploads/step-01.jpg' },
  '02': { src: 'uploads/step-02.jpg' },
  '03': { src: 'uploads/step-03.jpg' },
};

// Cycles through three risk states (clean → questionable → red flag) with a
// count-up animation per cycle, so the client can watch the score behave.
const DEMO_CYCLE: {
  score: number;
  label: string;
  tint: string;
  ring: string;
  text: string;
  platforms: { airbnb: string; vrbo: string; fb: string };
}[] = [
  {
    score: 12, label: 'Clean', tint: 'bg-clean-soft', ring: 'ring-clean/30', text: 'text-clean-ink',
    platforms: { airbnb: 'No matches', vrbo: 'No matches', fb: 'No matches' },
  },
  {
    score: 54, label: 'Questionable', tint: 'bg-warn-soft', ring: 'ring-warn/30', text: 'text-warn-ink',
    platforms: { airbnb: '1 partial match', vrbo: 'No matches', fb: '1 unrelated' },
  },
  {
    score: 87, label: 'Red flag', tint: 'bg-risk-soft', ring: 'ring-risk/30', text: 'text-risk-ink',
    platforms: { airbnb: '2 strong matches', vrbo: '1 strong match', fb: '1 partial match' },
  },
];

const COUNT_MS = 1200;
const HOLD_MS = 1600;

// Phase clock shared by both demo cards so they stay in sync.
function useDemoPhase() {
  const [phase, setPhase] = React.useState(0);
  React.useEffect(() => {
    const t = window.setTimeout(
      () => setPhase((p) => (p + 1) % DEMO_CYCLE.length),
      COUNT_MS + HOLD_MS
    );
    return () => clearTimeout(t);
  }, [phase]);
  return phase;
}

function AnimatedScoreCard({ phase }: { phase: number }) {
  const [display, setDisplay] = React.useState(0);
  const target = DEMO_CYCLE[phase];

  // Count-up animation toward the current target.
  React.useEffect(() => {
    let start: number | null = null;
    let raf = 0;
    const from = display;

    function tick(t: number) {
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / COUNT_MS);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (target.score - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Score arc: maps 0–100 to a 270° arc (3/4 circle).
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const arcLen = circumference * 0.75;
  const dash = arcLen * (display / 100);

  return (
    <div
      className={`rounded-xl sm:rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-lg transition-colors duration-500 ${target.tint}`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-1 gap-2">
        <div className="font-sans text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink-3">
          Confidence
        </div>
        <div
          className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-surface border border-line font-sans text-[9.5px] uppercase tracking-wider ${target.text}`}
        >
          {target.label}
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex items-baseline">
          <div className="font-sans font-bold text-[34px] sm:text-[56px] leading-none tracking-[-0.02em] tabular-nums" style={{ color: 'var(--navy)' }}>
            {display}
          </div>
          <div className="font-sans text-ink-3 text-[11px] sm:text-[15px] ml-0.5 sm:ml-1">/100</div>
        </div>

        <svg viewBox="0 0 200 200" className="w-[52px] h-[52px] sm:w-[88px] sm:h-[88px] -rotate-[135deg]" aria-hidden>
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${arcLen} ${circumference}`}
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: 'stroke-dasharray 80ms linear' }}
          />
        </svg>
      </div>
    </div>
  );
}

function AnimatedPlatformsCard({ phase }: { phase: number }) {
  const target = DEMO_CYCLE[phase];
  const rows: { name: string; dot: string; key: 'airbnb' | 'vrbo' | 'fb' }[] = [
    { name: 'Airbnb',   dot: 'bg-airbnb', key: 'airbnb' },
    { name: 'Vrbo',     dot: 'bg-vrbo',   key: 'vrbo' },
    { name: 'Facebook', dot: 'bg-fb',     key: 'fb' },
  ];

  return (
    <div className="rounded-xl sm:rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3 gap-2">
        <div className="font-sans text-[8px] sm:text-[9.5px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-ink-3">
          Platforms scanned
        </div>
        <div className="font-sans text-[8.5px] sm:text-[10px] text-ink-3 tabular-nums">3 / 3</div>
      </div>

      {rows.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-1.5 sm:gap-2.5 py-1 sm:py-1.5 border-b last:border-b-0 border-line"
        >
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${p.dot}`} />
          <span className="text-[10.5px] sm:text-[12.5px] text-ink font-medium leading-none">
            {p.name}
          </span>
          <span
            key={`${phase}-${p.key}`}
            className="ml-auto text-[9.5px] sm:text-[11.5px] text-ink-3 transition-opacity duration-500 animate-[fadeIn_0.4s_ease-out] truncate max-w-[55%]"
            style={{ animation: 'platformFade 0.45s ease-out' }}
          >
            {target.platforms[p.key]}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes platformFade {
          from { opacity: 0; transform: translateY(2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Fade + lift on scroll-into-view. Uses IntersectionObserver, runs once.
function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 20% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 1100ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

function pickScenario(input: string): 'low' | 'medium' | 'high' {
  const zip = (input.match(/\b(\d{5})(?:-\d{4})?\b/) || [])[1];
  if (zip && ZIP_TO_SCENARIO[zip]) return ZIP_TO_SCENARIO[zip];
  return 'low';
}

function HomeScreen() {
  const history = useHistory();
  const [address, setAddress] = React.useState('');
  const demoPhase = useDemoPhase();

  function startScan() {
    const scenario = pickScenario(address);
    sessionStorage.setItem('scanScenario', scenario);
    sessionStorage.setItem(
      'scanAddress',
      address || '1428 Maplewood Drive, Asheville, NC 28804'
    );
    history.push('/scan/start');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') startScan();
  }

  return (
    <AppShell contained={false}>
      {/* Image hero — full-bleed within a small page margin, like the reference */}
      <section className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden mb-12 mx-3 sm:mx-4 md:mx-6">
        <img
          src="uploads/hero.jpg"
          alt=""
          className="block w-full h-[460px] sm:h-[540px] lg:h-[640px] object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Center-weighted gradient for text legibility */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(15,18,22,0.55) 0%, rgba(15,18,22,0.25) 60%, rgba(15,18,22,0) 100%)',
          }}
        />

        {/* Centered hero copy + inline search, vertically + horizontally centered */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6">
          {/* Halcyon eyebrow pill — brand parent → product hierarchy */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 mb-5">
            <span className="font-sans text-[10.5px] sm:text-[11.5px] font-bold tracking-[0.16em] uppercase text-white">
              Halcyon
            </span>
            <span className="text-white/50">·</span>
            <span className="font-sans text-[10.5px] sm:text-[11.5px] font-medium tracking-[0.04em] text-white/90">
              TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
            </span>
          </div>
          <h1
            className="font-sans font-bold text-white leading-[1.05] tracking-[-0.01em] m-0 mb-5 drop-shadow-[0_2px_24px_rgba(20,45,85,0.45)] max-w-[18ch]"
            style={{ fontSize: 'clamp(30px, 8.5vw, 72px)' }}
          >
            Verify property occupancy and flag short-term rental fraud.
          </h1>
          <p className="text-white/90 text-[13px] sm:text-[17px] leading-relaxed m-0 mb-6 sm:mb-7 max-w-[52ch]">
            One address, every public short-term-rental listing within a one-mile
            radius — cross-checked against Airbnb, Vrbo, and Facebook Marketplace
            in seconds.
          </p>

          <div className="w-[min(820px,100%)]">
            <SearchBar
              value={address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAddress(e.target.value)
              }
              onKeyDown={onKeyDown}
              placeholder="Enter a property address"
              containerClassName="rounded-2xl shadow-2xl ring-1 ring-white/40 bg-surface/95 backdrop-blur transition-shadow focus-within:shadow-2xl focus-within:ring-2 focus-within:ring-brand/40 pl-3 sm:pl-4 pr-2 py-2 flex-wrap sm:flex-nowrap"
              trailing={
                <Button
                  variant="primary"
                  onClick={startScan}
                  className="h-10 rounded-full sm:rounded-lg w-10 sm:w-auto !p-0 sm:!px-5 !flex items-center justify-center gap-1.5"
                >
                  <Icon name="search" size={14} />
                  <span className="hidden sm:inline">Run scan</span>
                </Button>
              }
            />
          </div>

          {/* Demo "Try" chips — sit directly under the search, on the image */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[12px]">
            <span className="font-sans uppercase tracking-wider text-white/60 mr-1">Try</span>
            {[
              { zip: '28804', label: 'Clean' },
              { zip: '28805', label: 'Questionable' },
              { zip: '28806', label: 'Red flag' },
            ].map((d) => (
              <button
                key={d.zip}
                type="button"
                onClick={() =>
                  setAddress(`1428 Maplewood Drive, Asheville, NC ${d.zip}`)
                }
                className="px-2.5 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 hover:border-white/50 text-white/90 text-[12px] transition"
              >
                {d.zip} · {d.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — header always visible, only the cards fade in */}
      <div className="px-4 md:px-6 lg:px-32 xl:px-44">
        {/* Header — always rendered so the heading peeks above the fold,
            telling the user there's more below */}
        <Reveal>
          {/* Header row — heading on the left, pill top-right. Both share the
              same horizontal extent as the cards row below, so the pill's
              right edge aligns with card 3's right edge (minus mr-8 nudge). */}
          <div className="flex flex-col-reverse md:flex-row md:items-start md:justify-between gap-4 md:gap-12 mb-10">
            <div className="max-w-[760px]">
              <div
                className="inline-flex items-center px-3 py-1 rounded-full font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase mb-5"
                style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}
              >
                The solution
              </div>
              <h2
                className="font-sans font-bold leading-[1.08] tracking-[-0.005em] m-0 mb-5"
                style={{ fontSize: 'clamp(28px, 5.5vw, 48px)', color: 'var(--navy)' }}
              >
                From address to verdict in seconds.
              </h2>
              <p className="text-[14px] text-ink-3 leading-relaxed m-0 max-w-[52ch]">
                One scan cross-references every public short-term-rental listing
                within a one-mile radius and returns a confidence score with the
                signals that drove it.
              </p>
            </div>
            <div
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-[0.04em] uppercase w-fit shrink-0 self-start"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}
            >
              How it works
            </div>
          </div>

          {/* Cards row — same horizontal extent as header row above. */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {STEPS.map((s) => (
            <article
              key={s.numeral}
              className="bg-surface border border-line rounded-2xl p-6 transition-all hover:border-brand/40 hover:shadow-md"
            >
              {/* Top row: left image + right-aligned numeral */}
              <div className="flex items-start justify-between mb-6">
                <div className="rounded-xl overflow-hidden w-[55%] aspect-[16/10] bg-surface-2">
                  <img
                    src={STEP_VISUALS[s.numeral].src}
                    alt=""
                    className="w-full h-full object-cover block"
                    style={{
                      objectPosition: STEP_VISUALS[s.numeral].objectPosition || 'center',
                    }}
                  />
                </div>
                <div
                  className="font-sans font-bold text-[36px] leading-none tabular-nums"
                  style={{ color: 'var(--brand)' }}
                >
                  {s.numeral}
                </div>
              </div>

              {/* Body spans the full bottom of the card */}
              <p className="text-[15px] text-ink leading-[1.5] m-0">
                {s.body}
              </p>
            </article>
          ))}
          </div>
        </Reveal>
      </div>


      {/* Mission statement — plain text, no banner */}
      <Reveal>
      <section className="mt-16 sm:mt-28 mb-16 sm:mb-24 px-4 sm:px-6">
        <div className="max-w-[860px] mx-auto text-center">
          <p
            className="font-sans font-medium text-[20px] sm:text-[26px] md:text-[30px] leading-[1.4] tracking-[-0.005em] m-0"
            style={{ color: 'var(--navy)' }}
          >
            We give code-compliance teams an honest, evidence-backed read on
            every short-term rental in their jurisdiction.
          </p>
        </div>
      </section>
      </Reveal>

      {/* Sample result — asymmetric two-column with overlapping score card */}
      <section className="px-4 sm:px-6 mt-24 sm:mt-48 mb-20 sm:mb-32">
        <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-x-6 items-center">
          {/* LEFT — text column (5/12). Always visible so it acts as the
              landing cue that there's more below the fold. */}
          <Reveal className="lg:col-span-5 lg:pl-2 lg:pr-6 max-w-[560px]">
            <div
              className="inline-flex items-center px-3 py-1 rounded-full font-sans text-[10.5px] font-bold tracking-[0.16em] uppercase mb-7"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand-deep)' }}
            >
              Sample result
            </div>

            <h2
              className="font-sans font-bold leading-[1.08] tracking-[-0.005em] m-0 mb-6"
              style={{ fontSize: 'clamp(28px, 5.5vw, 48px)', color: 'var(--navy)' }}
            >
              See exactly what a scan returns.
            </h2>

            <p className="text-[15.5px] text-ink-2 leading-[1.55] m-0 max-w-[48ch]">
              A live preview of an actual result for a questionable property —
              the confidence score, contributing factors, and matched listings
              across every platform we cover.
            </p>
          </Reveal>

          {/* RIGHT — smaller image with score card overlapping top-left (7/12) */}
          <Reveal className="lg:col-span-7 relative lg:pt-10" delay={120}>
            {/* Property image — wider, shorter aspect */}
            <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden aspect-[5/4] sm:aspect-[16/9] lg:aspect-[3/2] shadow-md">
              <img
                src="uploads/property-sample.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(15,18,22,0.35) 0%, rgba(15,18,22,0) 55%)',
                }}
              />
            </div>

            {/* Confidence card — overlaps top-left, smaller, slight tilt */}
            <div className="absolute left-[-8px] top-[-12px] sm:left-[-20px] sm:top-[-20px] lg:left-[-48px] lg:top-[-20px] w-[150px] sm:w-[220px] lg:w-[260px] z-10 -rotate-[3deg] origin-top-left">
              <AnimatedScoreCard phase={demoPhase} />
            </div>

            {/* Platform-coverage card — overlaps bottom-right of the image, slight tilt the other way */}
            <div className="absolute right-[-8px] bottom-[-12px] sm:right-[-20px] sm:bottom-[-20px] lg:right-[-32px] lg:bottom-[-28px] w-[150px] sm:w-[210px] lg:w-[240px] z-10 rotate-[3deg] origin-bottom-right">
              <AnimatedPlatformsCard phase={demoPhase} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer — brand-book §6: teal-gradient footer bar, white type */}
      <Reveal>
      <footer
        className="text-white"
        style={{ background: 'var(--brand-gradient)' }}
      >
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-12 sm:py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-md grid place-items-center">
                <img
                  src="halcyon-mark-v2.png"
                  alt="Halcyon Solutions"
                  className="w-7 h-7 object-contain block"
                />
              </div>
              <div className="leading-tight">
                <div className="font-sans text-[16px] font-bold tracking-[0.04em] uppercase text-white">
                  Halcyon
                </div>
                <div className="font-sans text-[11.5px] font-medium text-white/80 tracking-[0.01em]">
                  TrueOccupancy<sup className="text-[0.6em] align-top">™</sup>
                </div>
              </div>
            </div>
            <p className="text-[13.5px] text-white/85 leading-relaxed m-0 mb-3 max-w-[40ch]">
              AI-powered data intelligence for financial services and the
              jurisdictions that protect them. Decide with certainty.
            </p>
          </div>

          {/* Product */}
          <div>
            <div className="font-sans text-[10.5px] uppercase tracking-[0.16em] font-bold text-white/70 mb-3">
              Product
            </div>
            <ul className="m-0 p-0 list-none space-y-2 text-[13px] text-white/90">
              <li><a href="#" className="no-underline hover:text-white">New scan</a></li>
              <li><a href="#" className="no-underline hover:text-white">Batch scan</a></li>
              <li><a href="#" className="no-underline hover:text-white">Flagged listings</a></li>
              <li><a href="#" className="no-underline hover:text-white">Pricing</a></li>
            </ul>
          </div>

          {/* Halcyon suite */}
          <div>
            <div className="font-sans text-[10.5px] uppercase tracking-[0.16em] font-bold text-white/70 mb-3">
              Halcyon suite
            </div>
            <ul className="m-0 p-0 list-none space-y-2 text-[13px] text-white/90">
              <li><a href="#" className="no-underline hover:text-white">TrueTax</a></li>
              <li><a href="#" className="no-underline hover:text-white">TrueCalc</a></li>
              <li><a href="#" className="no-underline hover:text-white">TrueMark</a></li>
              <li><a href="#" className="no-underline hover:text-white">TrueYou</a></li>
              <li><a href="#" className="no-underline hover:text-white">TrueReport</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <div className="font-sans text-[10.5px] uppercase tracking-[0.16em] font-bold text-white/70 mb-3">
              Contact
            </div>
            <ul className="m-0 p-0 list-none space-y-2 text-[13px] text-white/90">
              <li><a href="https://www.halcyonsolutions.ai" className="no-underline hover:text-white">halcyonsolutions.ai</a></li>
              <li><a href="mailto:sales@halcyonsolutions.ai" className="no-underline hover:text-white">sales@halcyonsolutions.ai</a></li>
              <li><a href="mailto:info@halcyonsolutions.ai" className="no-underline hover:text-white">info@halcyonsolutions.ai</a></li>
              <li><a href="tel:+18448801040" className="no-underline hover:text-white">844-880-1040</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20">
          <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-white/75">
            <div>© 2026 Halcyon Solutions · TrueOccupancy<sup className="text-[0.6em] align-top">™</sup> — Decide with certainty.</div>
            <div className="flex items-center gap-5">
              <a href="#" className="no-underline hover:text-white">Privacy</a>
              <a href="#" className="no-underline hover:text-white">Terms</a>
              <a href="#" className="no-underline hover:text-white">Status</a>
            </div>
          </div>
        </div>
      </footer>
      </Reveal>
    </AppShell>
  );
}
