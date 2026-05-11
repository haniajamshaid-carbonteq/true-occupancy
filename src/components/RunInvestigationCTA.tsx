/* global React, Icon */
// Full-width "Run AI investigation" CTA used at the bottom of every result
// screen. Solid brand fill, brain glyph, generous vertical padding.

function RunInvestigationCTA({ onRun }: { onRun?: () => void }) {
  const [busy, setBusy] = React.useState(false);

  const handleClick = () => {
    if (busy) return;
    setBusy(true);
    // Stub: the production handler kicks off a long-running AI pass and
    // probably navigates to a results-pending state.
    setTimeout(() => {
      setBusy(false);
      if (onRun) onRun();
    }, 900);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="w-full h-12 rounded-md bg-brand text-white font-medium text-[15px] inline-flex items-center justify-center gap-2.5 hover:bg-brand-deep transition-colors disabled:opacity-80 disabled:cursor-progress shadow-sm [&>svg]:w-4 [&>svg]:h-4"
    >
      <Icon name={busy ? 'replay' : 'brain'} size={18} />
      <span>{busy ? 'Starting investigation…' : 'Run AI investigation'}</span>
    </button>
  );
}
