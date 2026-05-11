/* global React */
// Lucide-style stroked SVG set, currentColor-driven so they inherit text color.
// Keep this list narrow — add only what screens actually use.

type IconName =
  | 'search' | 'history' | 'flag' | 'globe' | 'pdf' | 'settings'
  | 'check' | 'x' | 'alert' | 'info' | 'chevron'
  | 'pin' | 'bed' | 'bath' | 'square' | 'shield' | 'cal' | 'price' | 'star'
  | 'spark' | 'replay' | 'share' | 'trend-up' | 'trend-down' | 'external'
  | 'arrow-right' | 'upload' | 'layers' | 'brain';

interface IconProps extends Omit<React.SVGAttributes<SVGSVGElement>, 'children'> {
  name: IconName;
  size?: number;
}

function Icon({ name, size = 16, className = '', ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    viewBox: '0 0 24 24',
    className,
    ...rest,
  };
  switch (name) {
    case 'search':     return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'history':    return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>;
    case 'flag':       return <svg {...common}><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>;
    case 'globe':      return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'pdf':        return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>;
    case 'settings':   return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.2l-2 1.6 2 3.4 2.4-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.5a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2z"/></svg>;
    case 'check':      return <svg {...common} strokeWidth={2}><path d="m5 12 5 5 9-11"/></svg>;
    case 'x':          return <svg {...common} strokeWidth={2}><path d="M6 6 18 18M18 6 6 18"/></svg>;
    case 'alert':      return <svg {...common} strokeWidth={2}><path d="M12 3 2 21h20Z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".5" fill="currentColor"/></svg>;
    case 'info':       return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".5" fill="currentColor"/></svg>;
    case 'chevron':    return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    case 'pin':        return <svg {...common}><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'bed':        return <svg {...common}><path d="M3 18V8"/><path d="M3 11h18v7"/><path d="M21 18v-3a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="13" r="1.5"/></svg>;
    case 'bath':       return <svg {...common}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M10 6h2"/></svg>;
    case 'square':     return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
    case 'shield':     return <svg {...common}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/></svg>;
    case 'cal':        return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'price':      return <svg {...common}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'star':       return <svg {...common}><path d="m12 3 2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3 6.5 20.3l1.1-6.3L3 9.6l6.3-.9z"/></svg>;
    case 'spark':      return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'brain':      return <svg {...common}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 0 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4M9 13a4.5 4.5 0 0 0 3-4"/></svg>;
    case 'replay':     return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>;
    case 'share':      return <svg {...common}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>;
    case 'trend-up':   return <svg {...common}><path d="m3 17 6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case 'trend-down': return <svg {...common}><path d="m3 7 6 6 4-4 8 9"/><path d="M14 18h7v-7"/></svg>;
    case 'external':   return <svg {...common}><path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M19 13v6H5V5h6"/></svg>;
    case 'arrow-right':return <svg {...common}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
    case 'upload':     return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>;
    case 'layers':     return <svg {...common}><path d="m12 2 10 5-10 5L2 7l10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>;
    default:           return null;
  }
}
