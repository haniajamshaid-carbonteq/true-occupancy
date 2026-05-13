// Lucide-style stroked icons
const Ico = ({ name, size = 16, ...rest }) => {
  const s = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  switch (name) {
    case 'search': return <svg viewBox="0 0 24 24" {...s}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
    case 'home': return <svg viewBox="0 0 24 24" {...s}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>;
    case 'history': return <svg viewBox="0 0 24 24" {...s}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v4l3 2"/></svg>;
    case 'flag': return <svg viewBox="0 0 24 24" {...s}><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>;
    case 'settings': return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.1a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'check': return <svg viewBox="0 0 24 24" {...s}><path d="m5 12 5 5 9-11"/></svg>;
    case 'x': return <svg viewBox="0 0 24 24" {...s}><path d="M6 6 18 18M18 6 6 18"/></svg>;
    case 'alert': return <svg viewBox="0 0 24 24" {...s}><path d="M12 3 2 21h20Z"/><path d="M12 10v5"/><circle cx="12" cy="18" r=".5" fill="currentColor"/></svg>;
    case 'info': return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".5" fill="currentColor"/></svg>;
    case 'chevron': return <svg viewBox="0 0 24 24" {...s}><path d="m6 9 6 6 6-6"/></svg>;
    case 'external': return <svg viewBox="0 0 24 24" {...s}><path d="M14 4h6v6"/><path d="m20 4-9 9"/><path d="M19 13v6H5V5h6"/></svg>;
    case 'pin': return <svg viewBox="0 0 24 24" {...s}><path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>;
    case 'bed': return <svg viewBox="0 0 24 24" {...s}><path d="M3 18V8"/><path d="M3 11h18v7"/><path d="M21 18v-3a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="13" r="1.5"/></svg>;
    case 'bath': return <svg viewBox="0 0 24 24" {...s}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M6 12V6a2 2 0 0 1 4 0"/><path d="M10 6h2"/></svg>;
    case 'square': return <svg viewBox="0 0 24 24" {...s}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
    case 'replay': return <svg viewBox="0 0 24 24" {...s}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>;
    case 'play': return <svg viewBox="0 0 24 24" {...s} fill="currentColor"><path d="M7 4v16l13-8z"/></svg>;
    case 'spark': return <svg viewBox="0 0 24 24" {...s}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'shield': return <svg viewBox="0 0 24 24" {...s}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/></svg>;
    case 'trend-up': return <svg viewBox="0 0 24 24" {...s}><path d="m3 17 6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case 'trend-down': return <svg viewBox="0 0 24 24" {...s}><path d="m3 7 6 6 4-4 8 9"/><path d="M14 18h7v-7"/></svg>;
    case 'star': return <svg viewBox="0 0 24 24" {...s}><path d="m12 3 2.7 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.3 6.5 20.3l1.1-6.3L3 9.6l6.3-.9z"/></svg>;
    case 'image': return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m21 15-5-5-9 9"/></svg>;
    case 'cal': return <svg viewBox="0 0 24 24" {...s}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'price': return <svg viewBox="0 0 24 24" {...s}><path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'globe': return <svg viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case 'pdf': return <svg viewBox="0 0 24 24" {...s}><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4"/></svg>;
    case 'share': return <svg viewBox="0 0 24 24" {...s}><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="m8 11 8-4M8 13l8 4"/></svg>;
    case 'menu': return <svg viewBox="0 0 24 24" {...s}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    default: return null;
  }
};

window.Ico = Ico;
