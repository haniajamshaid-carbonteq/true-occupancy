/* global React */
// Keycap — shared mono-styled keyboard hint, used wherever the UI
// surfaces a keyboard shortcut (⌘K trigger in PageHeader / ScanContextBar,
// the inline keycaps inside CommandSearch). White fill on the page's
// off-white bg so the key reads as physically lifted, plus an inset
// bottom shadow + soft drop shadow for the floating-key feel.

interface KeycapProps {
  children: React.ReactNode;
  /** Visually de-emphasise (used in dim hint rows). */
  muted?: boolean;
  className?: string;
}

function Keycap({ children, muted = false, className = '' }: KeycapProps) {
  return (
    <kbd
      className={[
        'inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5',
        'rounded-[5px] border border-line-strong bg-surface',
        'font-mono text-micro font-medium leading-none',
        muted ? 'text-ink-3' : 'text-ink-2',
        className,
      ].join(' ')}
      style={{
        boxShadow:
          'inset 0 -1px 0 rgba(20, 45, 85, 0.10), 0 1px 1.5px rgba(20, 45, 85, 0.06)',
      }}
    >
      {children}
    </kbd>
  );
}
