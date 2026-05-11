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
    },
  },
  plugins: [],
};
