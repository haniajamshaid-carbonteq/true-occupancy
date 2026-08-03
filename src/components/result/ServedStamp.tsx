/* global React, Button, Icon, DEFAULT_OCC_CONFIG, formatUsDateTime,
   formatUsRelative, occDaysSince */

interface ServedStampProps {
  servedAt?: string;
  config?: any;
  onRerun?: () => void;
  className?: string;
}

function ServedStamp({ servedAt, config = DEFAULT_OCC_CONFIG, onRerun, className = '' }: ServedStampProps) {
  const [, forceTick] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const onUpdate = () => forceTick();
    window.addEventListener('halcyon:served-updated', onUpdate);
    return () => window.removeEventListener('halcyon:served-updated', onUpdate);
  }, []);

  const fallbackNow = React.useMemo(() => new Date().toISOString(), []);
  const effective =
    servedAt ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('resultServedAt')) ||
    fallbackNow;

  React.useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (!sessionStorage.getItem('resultServedAt')) {
      sessionStorage.setItem('resultServedAt', effective);
    }
    if (!sessionStorage.getItem('resultFirstServedAt')) {
      sessionStorage.setItem('resultFirstServedAt', effective);
    }
  }, []);

  return (
    <div className={`font-sans text-caption tabular-nums ${className}`} style={{ color: 'var(--ink-3)' }}>
      <span className="font-semibold uppercase tracking-[0.08em]" style={{ fontSize: '10px' }}>Updated </span>
      {formatUsDateTime(effective)}
      <span className="ml-1 opacity-60">({formatUsRelative(effective)})</span>
    </div>
  );
}
