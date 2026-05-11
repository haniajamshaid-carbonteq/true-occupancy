/** @type {import('tailwindcss').Config} */

// Each value points at the matching CSS custom property in
// src/styles/tokens.css so design tokens stay the single source of truth.
// Runtime theme switches (e.g. Tweaks panel) flow through automatically.

module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx,html}',
    './*.{html,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        'pill-neutral': 'var(--pill-neutral-bg)',
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
          4: 'var(--ink-4)',
        },
        brand: {
          DEFAULT: 'var(--brand)',
          2: 'var(--brand-2)',
          soft: 'var(--brand-soft)',
          tint: 'var(--brand-tint)',
          deep: 'var(--brand-deep)',
        },
        clean: {
          DEFAULT: 'var(--clean)',
          soft: 'var(--clean-soft)',
          ink: 'var(--clean-ink)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          soft: 'var(--warn-soft)',
          ink: 'var(--warn-ink)',
        },
        risk: {
          DEFAULT: 'var(--risk)',
          soft: 'var(--risk-soft)',
          ink: 'var(--risk-ink)',
        },
        airbnb: 'var(--airbnb)',
        vrbo: 'var(--vrbo)',
        fb: 'var(--fb)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      fontFamily: {
        serif: 'var(--serif)',
        sans: 'var(--sans)',
        mono: 'var(--mono)',
      },
      // Type scale points at the matching CSS custom property in tokens.css so
      // utilities (text-h1) and inline tokens (style={{ fontSize: 'var(--text-h1)' }})
      // share one source of truth.
      fontSize: {
        display:  ['var(--text-display)',  { lineHeight: '1' }],
        h1:       ['var(--text-h1)',       { lineHeight: '1.1' }],
        h2:       ['var(--text-h2)',       { lineHeight: '1.15' }],
        h3:       ['var(--text-h3)',       { lineHeight: '1.25' }],
        h4:       ['var(--text-h4)',       { lineHeight: '1.3' }],
        body:     ['var(--text-body)',     { lineHeight: '1.5' }],
        'body-sm':['var(--text-body-sm)',  { lineHeight: '1.5' }],
        label:    ['var(--text-label)',    { lineHeight: '1.4' }],
        caption:  ['var(--text-caption)',  { lineHeight: '1.4' }],
        micro:    ['var(--text-micro)',    { lineHeight: '1.4' }],
        eyebrow:  ['var(--text-eyebrow)',  { lineHeight: '1.4', letterSpacing: '0.08em' }],
      },
      // Spacing scale extends (does not replace) Tailwind's default so numeric
      // utilities keep working during incremental migration. The named keys
      // below are the destination — prefer them in new code:
      //   p-card / p-card-tight        cards
      //   px-surface-x / py-surface-y-*  modal & drawer
      //   px-control-x / py-control-y    buttons & inputs
      //   gap-inline / gap-inline-tight / gap-inline-loose  icon+text
      //   gap-stack / gap-stack-tight    grouped items
      //   gap-section / gap-section-sub  page sections
      spacing: {
        'inline-tight': 'var(--pad-inline-tight)',
        'inline':       'var(--pad-inline)',
        'inline-loose': 'var(--pad-inline-loose)',
        'control-x':    'var(--pad-control-x)',
        'control-y':    'var(--pad-control-y)',
        'cell-x':       'var(--pad-cell-x)',
        'cell-y':       'var(--pad-cell-y)',
        'card':         'var(--pad-card)',
        'card-tight':   'var(--pad-card-tight)',
        'surface-x':    'var(--pad-surface-x)',
        'surface-y-h':  'var(--pad-surface-y-header)',
        'surface-y-b':  'var(--pad-surface-y-body)',
        'surface-y-f':  'var(--pad-surface-y-footer)',
        'stack-tight':  'var(--gap-stack-tight)',
        'stack':        'var(--gap-stack)',
        'section-sub':  'var(--gap-section-sub)',
        'section':      'var(--gap-section)',
      },
    },
  },
  plugins: [],
};
