/* global React, CommandSearch, ReactRouterDOM */
// CommandPalette — global ⌘K overlay. Same input as the hero, in a
// centered, top-anchored modal. Mounted once at the app root.
//
// Open state is held in a tiny module-scoped pub/sub so any component can
// call `openCommandPalette()` (e.g. PageHeader's persistent search trigger)
// without prop-drilling.

// NB: do NOT destructure useHistory at module top level — HomeScreen.tsx
// already does that, and a second top-level `const { useHistory }` in shared
// script scope throws "Identifier 'useHistory' has already been declared",
// killing the bootstrap. Call `ReactRouterDOM.useHistory()` inline instead.

// --- module-scoped store --------------------------------------------------

const __cpListeners: Array<(open: boolean) => void> = [];
let __cpOpen = false;

function setCommandPaletteOpen(next: boolean) {
  __cpOpen = next;
  __cpListeners.forEach((l) => l(next));
}

function openCommandPalette() {
  setCommandPaletteOpen(true);
}

function useCommandPaletteOpen(): [boolean, (n: boolean) => void] {
  const [open, setOpen] = React.useState(__cpOpen);
  React.useEffect(() => {
    const l = (n: boolean) => setOpen(n);
    __cpListeners.push(l);
    return () => {
      const i = __cpListeners.indexOf(l);
      if (i >= 0) __cpListeners.splice(i, 1);
    };
  }, []);
  return [open, setCommandPaletteOpen];
}

// --- the overlay ----------------------------------------------------------

function CommandPalette() {
  const history = ReactRouterDOM.useHistory();
  const [open, setOpen] = useCommandPaletteOpen();
  const [value, setValue] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  // ⌘K / Ctrl+K — global toggle.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isCmdK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');
      if (isCmdK) {
        e.preventDefault();
        setCommandPaletteOpen(!__cpOpen);
      } else if (e.key === 'Escape' && __cpOpen) {
        setCommandPaletteOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Animate in: mount → next frame → mounted=true → CSS transition runs.
  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(id);
    }
    setMounted(false);
    setValue('');
  }, [open]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function pickScenario(input: string): 'low' | 'medium' | 'high' {
    const zip = (input.match(/\b(\d{5})(?:-\d{4})?\b/) || [])[1];
    if (zip === '28805') return 'medium';
    if (zip === '28806') return 'high';
    return 'low';
  }

  function runScan(v?: string) {
    const next = (v ?? value).trim();
    const final = next || '1428 Maplewood Drive, Asheville, NC 28804';
    sessionStorage.setItem('scanScenario', pickScenario(final));
    sessionStorage.setItem('scanAddress', final);
    setCommandPaletteOpen(false);
    history.push('/scan/start');
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-modal flex items-start justify-center transition-opacity duration-150"
      style={{
        opacity: mounted ? 1 : 0,
        background: 'rgba(20, 45, 85, 0.36)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        paddingTop: '14vh',
      }}
      onMouseDown={(e: React.MouseEvent) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="w-[min(640px,calc(100vw-32px))] transition-all duration-200"
        style={{
          transform: mounted ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(-6px)',
          opacity: mounted ? 1 : 0,
        }}
      >
        <CommandSearch
          mode="overlay"
          value={value}
          onChange={setValue}
          onRun={runScan}
          onClose={() => setOpen(false)}
          autoFocus
        />
      </div>
    </div>
  );
}
