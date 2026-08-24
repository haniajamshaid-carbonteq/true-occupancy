/* global React, Icon, Button, Keycap, ReactRouterDOM, openCommandPalette, PROPERTY, AutomationControl, DropdownMenu, useAppState, RedFlag, INTENDED_OCCUPANCY_LABEL, occMatchForRisk, SCENARIOS, DEFAULT_OCC_CONFIG, popReturnFrame, PropertyTimelineDrawer */
// ScanContextBar — replaces the persistent search trigger on detail
// pages (result + why-expanded). Shows a back button plus the address
// currently being viewed, so the user knows what scan they're looking at
// without needing the search bar to keep that context.
//
// The ⌘K palette is still reachable from any page, so a small keycap
// hint is included on the right rather than a full search affordance.
// On result pages, the Download-PDF CTA also sits in the top-right
// alongside ⌘K so it's reachable without scrolling.

interface ScanContextBarProps {
  /** Optional override; defaults to the address stored at scan time. */
  address?: string;
  /** Optional eyebrow line above the address. */
  eyebrow?: string;
  /** Override the back destination. Defaults to "/". */
  backTo?: string;
  /** Override the back-button label. */
  backLabel?: string;
  /** Show the Download-PDF CTA in the top-right (result screens only). */
  showDownloadPDF?: boolean;
  /** Show the Automate CTA next to Download PDF. Pass the row's scenario
   *  so the schedule entry carries the verdict band. */
  showAutomate?: boolean;
  /** Scenario for the Automate target (defaults to whatever sessionStorage
   *  has at scan time, else 'high' to keep the demo populated). */
  automateScenario?: 'low' | 'medium' | 'high';
}

function ScanContextBar({
  address,
  eyebrow,
  backTo = '/',
  backLabel = 'Back',
  showDownloadPDF = false,
  showAutomate = false,
  automateScenario,
}: ScanContextBarProps) {
  const history = ReactRouterDOM.useHistory();
  const { getHistoryForAddress } = useAppState();
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  // The declared "as per loan" occupancy for this scan, stamped in
  // sessionStorage at scan/open time. Resolved here ONLY for the red-flag
  // check below — the "Intended · …" eyebrow it used to feed was removed as a
  // duplicate: ConfidenceHero's "Why this result" line is now the one place a
  // result page states the intent. An explicit `eyebrow` prop still renders.
  const rawIntent =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanIntent') : null;
  // Demo-only (app.html sets window.__TO_DEMO_STATES__): fall back to the org
  // default when nothing was declared, so red derivation agrees with
  // ConfidenceHero during review. Production leaves the flag unset.
  const demoIntent =
    typeof window !== 'undefined' && (window as any).__TO_DEMO_STATES__
      ? DEFAULT_OCC_CONFIG.defaultIntent
      : null;
  const resolvedRawIntent = rawIntent || demoIntent;
  const intent =
    resolvedRawIntent && INTENDED_OCCUPANCY_LABEL[resolvedRawIntent] ? resolvedRawIntent : undefined;
  const resolvedEyebrow = eyebrow;

  // Red flag beside the address follows the config matrix (declared × found),
  // not a hardcoded list — so it agrees with the batch, History and Scheduled.
  const rawScenario =
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanScenario') : null;
  const risk = rawScenario ? SCENARIOS[rawScenario as keyof typeof SCENARIOS]?.risk : undefined;
  const isRed = occMatchForRisk(intent, risk)?.status === 'red';

  // The history report stays clickable even when only one scan is on file —
  // a single-row report is still a useful audit record. The hint just
  // surfaces the count so the user knows what they're about to download.
  const priorScanCount = getHistoryForAddress(resolvedAddress).length;

  function printCertificate(v: 'single' | 'history') {
    if (typeof sessionStorage !== 'undefined') {
      if (v === 'history') sessionStorage.setItem('certVariant', 'history');
      else sessionStorage.removeItem('certVariant');
    }
    // Dispatch the variant change BEFORE calling print() so the cert's
    // listener can setState while React's not blocked by the print dialog.
    // Two rAFs give React one frame to commit and the browser one frame to
    // paint before we snapshot — setting state inside beforeprint instead
    // gets batched and never lands in the printed output.
    window.dispatchEvent(new CustomEvent('halcyon:certvariant', { detail: v }));
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }

  // The top-bar Back and ConfidenceHero's in-hero "Back to the latest report"
  // are the same action: when this report was reached through a "View that
  // report" chain, one press pops ONE frame off the shared back stack —
  // restoring that page's snapshot and URL — rather than a plain goBack() that
  // would re-render the previous page against this report's stamps. Repeated
  // presses unwind the whole chain. popReturnFrame lives in ConfidenceHero
  // (shared global scope); the typeof guard covers hosts that load this bar
  // without it, and the pathname gate keeps ordinary Back untouched elsewhere.
  function handleBack() {
    if (
      typeof popReturnFrame === 'function' &&
      history.location.pathname.startsWith('/result/') &&
      /(^|[?&])r=/.test(history.location.search)
    ) {
      const currentHistoryId =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('scanHistoryId') : null;
      if (popReturnFrame(history, currentHistoryId)) return;
    }
    if (history.length > 1) history.goBack();
    else history.push(backTo);
  }

  // Property timeline flyout — reachable from every report page (including an
  // older report opened from the corroboration links). Rendered only where the
  // drawer component is actually loaded (app.html / design-spec.html); the
  // spec hosts that load this bar in isolation simply omit the trigger.
  const [timelineOpen, setTimelineOpen] = React.useState(false);
  const timelineAvailable = typeof PropertyTimelineDrawer !== 'undefined';

  // Automate flow — encapsulated in <AutomationControl>. It looks up an
  // existing schedule for this address and either offers the create CTA
  // or an "Automated · every Nmo" menu trigger (change cadence / cancel).
  const scenarioForTarget =
    automateScenario ||
    ((typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanScenario')) as any) ||
    'high';
  // The report freshness timestamp lives beneath the verdict now (ConfidenceHero
  // → ServedStamp), not in this top bar.

  return (
    <div className="flex items-center gap-3 sm:gap-4 mb-1">
      <button
        type="button"
        onClick={handleBack}
        className="group inline-flex items-center gap-1 h-9 px-2.5 -ml-2.5 rounded-md bg-transparent border-0 text-label text-ink-2 hover:bg-hover-bg transition-colors shrink-0 cursor-pointer"
        aria-label={backLabel}
      >
        <span
          className="grid place-items-center w-4 h-4 transition-transform group-hover:-translate-x-0.5 [&>svg]:w-3.5 [&>svg]:h-3.5"
          aria-hidden
        >
          {/* chevron-left — Icons.tsx only ships chevron-right, so an inline arrow */}
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="m10 4-4 4 4 4" />
          </svg>
        </span>
        <span>{backLabel}</span>
      </button>

      <div className="flex-1 min-w-0">
        {resolvedEyebrow && (
          <div
            className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--ink-3)' }}
          >
            {resolvedEyebrow}
          </div>
        )}
        <div
          className={`${resolvedEyebrow ? 'mt-0.5' : ''} flex items-center gap-inline min-w-0 font-sans font-semibold text-body sm:text-body leading-tight tracking-[-0.005em]`}
          style={{ color: 'var(--navy)' }}
        >
          <span className="truncate">{resolvedAddress}</span>
          {isRed && <RedFlag address={resolvedAddress} />}
        </div>
      </div>

      {timelineAvailable && (
        <button
          type="button"
          onClick={() => setTimelineOpen(true)}
          className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-caption text-ink-2 hover:bg-hover-bg transition-colors shrink-0"
          aria-label="Open property timeline"
          title="Property timeline — every scan of this address"
        >
          <span className="[&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="history" size={14} />
          </span>
          <span className="hidden sm:inline">Timeline</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => openCommandPalette()}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-caption text-ink-2 hover:bg-hover-bg transition-colors shrink-0"
        aria-label="Open search"
      >
        <Icon name="search" size={14} />
        <Keycap>⌘</Keycap>
        <Keycap>K</Keycap>
      </button>

      {showAutomate && (
        <AutomationControl
          target={{ kind: 'single', address: resolvedAddress, scenario: scenarioForTarget }}
        />
      )}

      {showDownloadPDF && (
        <DropdownMenu
          align="end"
          title="Download report"
          menuWidth="w-64"
          trigger={(open: boolean) => (
            <Button
              variant="primary"
              icon={<Icon name="pdf" size={14} />}
              className="shrink-0"
            >
              Download PDF
              <span
                className={`inline-flex shrink-0 ml-1 transition-transform ${open ? 'rotate-180' : ''} [&>svg]:w-3 [&>svg]:h-3`}
                aria-hidden
              >
                <Icon name="chevron" size={12} />
              </span>
            </Button>
          )}
          items={[
            {
              label: 'Single-scan certificate',
              icon: <Icon name="pdf" />,
              hint: 'The current scan, full detail',
              onClick: () => printCertificate('single'),
            },
            {
              label: 'Scan history report',
              icon: <Icon name="history" />,
              hint:
                priorScanCount === 0
                  ? 'No prior scans on record yet'
                  : `${priorScanCount} ${priorScanCount === 1 ? 'scan' : 'scans'} for this property`,
              onClick: () => printCertificate('history'),
            },
          ]}
        />
      )}

      {timelineAvailable && (
        <PropertyTimelineDrawer
          open={timelineOpen}
          onClose={() => setTimelineOpen(false)}
          address={resolvedAddress}
        />
      )}
    </div>
  );
}
