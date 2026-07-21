/* True Occupancy — shared Tailwind Play CDN config
 *
 * THE single runtime Tailwind config. Every HTML host loads this file
 * immediately after the Play CDN <script> and before any app code.
 *
 * Why this file exists
 * --------------------
 * This config used to be copy-pasted inline into seven HTML hosts. They
 * drifted: `navy` existed only in components.html, `verdict-*` in four of
 * seven, `hover-bg` in six. So `text-navy` and `bg-hover-bg` silently
 * resolved to nothing depending on which page you opened — which is why
 * raw hex values kept getting written into components. One file fixes the
 * class of bug, not just the instances.
 *
 * Every value points at a CSS custom property in tokens.css (or motion.css)
 * so tokens stay the single source of truth and runtime theme switches
 * flow through automatically.
 *
 * tailwind.config.js at the repo root mirrors this for tooling/editor
 * support. It is NOT loaded at runtime. Keep the two in sync.
 */

/* global tailwind */
tailwind.config = {
  // The Play CDN's JIT only generates utilities for classes it sees in the
  // live DOM. Conditionally-rendered classes (e.g. `bg-error-soft` on a
  // destructive menu item that isn't currently mounted) would be skipped.
  // Explicit safelist for the state-token utilities we want available
  // everywhere — kept as a flat string list so the CDN doesn't have to
  // expand a regex × variant matrix on boot.
  safelist: [
    'bg-success', 'bg-success-soft', 'text-success', 'text-success-ink', 'border-success', 'border-success-soft',
    'bg-warning', 'bg-warning-soft', 'text-warning', 'text-warning-ink', 'border-warning', 'border-warning-soft',
    'bg-error',   'bg-error-soft',   'text-error',   'text-error-ink',   'border-error',   'border-error-soft',
    'hover:bg-success-soft', 'hover:text-success-ink',
    'hover:bg-warning-soft', 'hover:text-warning-ink',
    'hover:bg-error-soft',   'hover:text-error-ink',
    'active:bg-success-soft', 'active:bg-warning-soft', 'active:bg-error-soft',
    // Verdict tones (purple / yellow / blue) — neutral categorical fills for
    // "Rented / Possibly rented / Not rented" pills + the matching header dot
    // on BatchScreen MetricCards.
    'bg-verdict-high', 'bg-verdict-high-soft', 'text-verdict-high', 'text-verdict-high-ink',
    'bg-verdict-med',  'bg-verdict-med-soft',  'text-verdict-med',  'text-verdict-med-ink',
    'bg-verdict-low',  'bg-verdict-low-soft',  'text-verdict-low',  'text-verdict-low-ink',
    // Type ramp — safelist all 11 size utilities so they're available even
    // before any code in the bundle uses them.
    'text-display', 'text-h1', 'text-h2', 'text-h3', 'text-h4',
    'text-body', 'text-body-sm', 'text-label', 'text-caption', 'text-micro', 'text-eyebrow',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)' },
        'pill-neutral': 'var(--pill-neutral-bg)',
        line: { DEFAULT: 'var(--line)', strong: 'var(--line-strong)' },
        'hover-bg': 'var(--hover-bg)',
        ink: { DEFAULT: 'var(--ink)', 2: 'var(--ink-2)', 3: 'var(--ink-3)', 4: 'var(--ink-4)' },
        brand: {
          DEFAULT: 'var(--brand)',
          2: 'var(--brand-2)',
          soft: 'var(--brand-soft)',
          tint: 'var(--brand-tint)',
          deep: 'var(--brand-deep)',
          link: 'var(--brand-link)',
          mid: 'var(--brand-mid)',
          footer: 'var(--brand-footer)',
        },
        // Authority family. `navy` previously existed in components.html
        // only, so `text-navy` resolved to nothing on every other host.
        navy: {
          DEFAULT: 'var(--navy)',
          quote: 'var(--navy-quote)',
          mid: 'var(--navy-mid)',
          link: 'var(--navy-link)',
        },
        clean: { DEFAULT: 'var(--clean)', soft: 'var(--clean-soft)', ink: 'var(--clean-ink)' },
        warn: { DEFAULT: 'var(--warn)', soft: 'var(--warn-soft)', ink: 'var(--warn-ink)', deep: 'var(--warn-deep)' },
        risk: { DEFAULT: 'var(--risk)', soft: 'var(--risk-soft)', ink: 'var(--risk-ink)' },
        verdict: {
          high: { DEFAULT: 'var(--verdict-high)', soft: 'var(--verdict-high-soft)', ink: 'var(--verdict-high-ink)' },
          med:  { DEFAULT: 'var(--verdict-med)',  soft: 'var(--verdict-med-soft)',  ink: 'var(--verdict-med-ink)' },
          low:  { DEFAULT: 'var(--verdict-low)',  soft: 'var(--verdict-low-soft)',  ink: 'var(--verdict-low-ink)' },
        },
        success: { DEFAULT: 'var(--success)', soft: 'var(--success-soft)', ink: 'var(--success-ink)' },
        warning: { DEFAULT: 'var(--warning)', soft: 'var(--warning-soft)', ink: 'var(--warning-ink)' },
        error:   { DEFAULT: 'var(--error)',   soft: 'var(--error-soft)',   ink: 'var(--error-ink)' },
        // Overlay / on-brand. Replaces inline `bg-black/40`, `stroke="white"`
        // and `border-white/20`.
        scrim: 'var(--scrim)',
        'on-brand': { DEFAULT: 'var(--on-brand)', divider: 'var(--on-brand-divider)' },
        airbnb: 'var(--airbnb)',
        vrbo: 'var(--vrbo)',
        fb: 'var(--fb)',
      },
      borderRadius: {
        xs: 'var(--r-xs)',
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
        pill: 'var(--r-pill)',
        dock: 'var(--r-dock)',
      },
      borderWidth: {
        hairline: 'var(--border-hairline)',
        emphasis: 'var(--border-emphasis)',
        indicator: 'var(--border-indicator)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        'focus-brand': '0 0 0 var(--border-focus) var(--brand-soft)',
        'focus-dock': '0 0 0 var(--border-indicator) var(--focus-ring-brand)',
      },
      fontFamily: { serif: 'var(--serif)', sans: 'var(--sans)', mono: 'var(--mono)' },
      // Type ramp — semantic names map to --text-* CSS vars in tokens.css.
      // Use `text-h1`, `text-body-sm`, `text-eyebrow` etc. instead of raw
      // `text-[14px]` so we have a single source of truth.
      fontSize: {
        display:   ['var(--text-display)', { lineHeight: '1.0' }],
        h1:        ['var(--text-h1)',      { lineHeight: '1.1' }],
        h2:        ['var(--text-h2)',      { lineHeight: '1.15' }],
        h3:        ['var(--text-h3)',      { lineHeight: '1.25' }],
        h4:        ['var(--text-h4)',      { lineHeight: '1.3' }],
        body:      ['var(--text-body)',    { lineHeight: '1.55' }],
        'body-sm': ['var(--text-body-sm)', { lineHeight: '1.5' }],
        label:     ['var(--text-label)',   { lineHeight: '1.4' }],
        caption:   ['var(--text-caption)', { lineHeight: '1.4' }],
        micro:     ['var(--text-micro)',   { lineHeight: '1.3' }],
        eyebrow:   ['var(--text-eyebrow)', { lineHeight: '1.2' }],
      },
      letterSpacing: {
        display: 'var(--tracking-display)',
        h1: 'var(--tracking-h1)',
        h2: 'var(--tracking-h2)',
        pill: 'var(--tracking-pill)',
        eyebrow: 'var(--tracking-eyebrow)',
        'eyebrow-loose': 'var(--tracking-eyebrow-loose)',
        'mono-label': 'var(--tracking-mono-label)',
      },
      // Spacing — semantic tokens layered on top of the default Tailwind
      // numeric scale. Prefer these names in new code (p-card, gap-section,
      // px-control-x).
      spacing: {
        'inline-tight': 'var(--pad-inline-tight)',
        'inline':       'var(--pad-inline)',
        'inline-loose': 'var(--pad-inline-loose)',
        'control-x':    'var(--pad-control-x)',
        'control-y':    'var(--pad-control-y)',
        'cell-x':       'var(--pad-cell-x)',
        'cell-y':       'var(--pad-cell-y)',
        'card':          'var(--pad-card)',
        'card-tight':    'var(--pad-card-tight)',
        'card-loose':    'var(--pad-card-loose)',
        'surface-x':     'var(--pad-surface-x)',
        'surface-y-h':   'var(--pad-surface-y-header)',
        'surface-y-b':   'var(--pad-surface-y-body)',
        'surface-y-f':   'var(--pad-surface-y-footer)',
        'stack-tight':   'var(--gap-stack-tight)',
        'stack-md':      'var(--gap-stack-md)',
        'stack':         'var(--gap-stack)',
        'section-tight': 'var(--gap-section-tight)',
        'section-sub':   'var(--gap-section-sub)',
        'section':       'var(--gap-section)',
        // Control + glyph sizing, for h-/w-/size- utilities.
        'control-sm':      'var(--size-control-sm)',
        'control-md':      'var(--size-control-md)',
        'control-lg':      'var(--size-control-lg)',
        'gutter-leading':  'var(--size-gutter-leading)',
        'gutter-trailing': 'var(--size-gutter-trailing)',
        'glyph-sm':        'var(--size-glyph-sm)',
        'glyph-md':        'var(--size-glyph-md)',
        'glyph-lg':        'var(--size-glyph-lg)',
        'glyph-xl':        'var(--size-glyph-xl)',
        'nav':             'var(--width-nav)',
        'nav-offset':      'var(--width-nav-offset)',
        'dock-top':        'var(--dock-top)',
      },
      maxWidth: {
        'modal-sm': 'var(--width-modal-sm)',
        'modal-md': 'var(--width-modal-md)',
        'modal-lg': 'var(--width-modal-lg)',
        content: 'var(--width-content)',
        prose: 'var(--width-prose)',
      },
      width: {
        nav: 'var(--width-nav)',
      },
      // Named stacking order. Replaces nine bare literals with an explicit
      // ascending contract — see tokens.css for what each layer means.
      zIndex: {
        base: 'var(--z-base)',
        raised: 'var(--z-raised)',
        sticky: 'var(--z-sticky)',
        nav: 'var(--z-nav)',
        scrim: 'var(--z-scrim)',
        popover: 'var(--z-popover)',
        dock: 'var(--z-dock)',
        modal: 'var(--z-modal)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        mid: 'var(--motion-mid)',
        slow: 'var(--motion-slow)',
        snap: 'var(--motion-snap)',
        morph: 'var(--motion-morph)',
      },
      transitionTimingFunction: {
        'out-token': 'var(--ease-out)',
        'in-out-token': 'var(--ease-in-out)',
        spring: 'var(--ease-spring)',
      },
    },
  },
};
