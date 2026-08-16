/* global React, ReactRouterDOM */

// Enforces the session-timeout setting from Scan Configuration.
// Watches mouse / keyboard / touch activity; when the idle window expires,
// clears the session flag and redirects to /signin.

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
const LS_KEY = 'to-sessionTimeout';

function parseTimeoutMs(): number | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    if (!cfg.enabled) return null;
    const v = Number(cfg.value);
    if (!v || v <= 0) return null;
    const multiplier = cfg.unit === 'hours' ? 3_600_000
      : cfg.unit === 'days' ? 86_400_000
      : 60_000;
    return v * multiplier;
  } catch (_) {
    return null;
  }
}

function InactivityGuard() {
  const history = ReactRouterDOM.useHistory();
  const timerRef = React.useRef<number | null>(null);
  const timeoutMsRef = React.useRef<number | null>(parseTimeoutMs());

  const signOut = React.useCallback(() => {
    window.sessionStorage.removeItem('to-signedIn');
    history.push('/signin');
  }, [history]);

  const resetTimer = React.useCallback(() => {
    if (timerRef.current != null) clearTimeout(timerRef.current);
    const ms = timeoutMsRef.current;
    if (ms != null) {
      timerRef.current = window.setTimeout(signOut, ms);
    }
  }, [signOut]);

  React.useEffect(() => {
    function onConfigChange() {
      timeoutMsRef.current = parseTimeoutMs();
      resetTimer();
    }
    window.addEventListener('to-timeout-changed', onConfigChange);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === LS_KEY) onConfigChange();
    });
    return () => {
      window.removeEventListener('to-timeout-changed', onConfigChange);
    };
  }, [resetTimer]);

  React.useEffect(() => {
    resetTimer();
    const handler = () => resetTimer();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handler));
    };
  }, [resetTimer]);

  return null;
}
