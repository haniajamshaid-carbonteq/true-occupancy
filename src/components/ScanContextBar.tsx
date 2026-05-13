/* global React, Icon, Button, Keycap, ReactRouterDOM, openCommandPalette, PROPERTY, AutomationControl, AICtaButton */
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
  /** Show the "Run AI Investigator" CTA in the top-right (result screens
   *  only). The CTA subscribes to the AI bus so it auto-hides once the
   *  result card is rendered in the page body. */
  showAI?: boolean;
  /** Scenario the AI CTA should investigate. Defaults to automateScenario. */
  aiScenario?: 'low' | 'medium' | 'high';
}

function ScanContextBar({
  address,
  eyebrow,
  backTo = '/',
  backLabel = 'Back',
  showDownloadPDF = false,
  showAutomate = false,
  automateScenario,
  showAI = false,
  aiScenario,
}: ScanContextBarProps) {
  const history = ReactRouterDOM.useHistory();
  const resolvedAddress =
    address ||
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanAddress')) ||
    PROPERTY.address;

  // Automate flow — encapsulated in <AutomationControl>. It looks up an
  // existing schedule for this address and either offers the create CTA
  // or an "Automated · every Nmo" menu trigger (change cadence / cancel).
  const scenarioForTarget =
    automateScenario ||
    ((typeof sessionStorage !== 'undefined' && sessionStorage.getItem('scanScenario')) as any) ||
    'high';

  return (
    <div className="flex items-center gap-3 sm:gap-4 mb-1">
      <button
        type="button"
        onClick={() => {
          if (history.length > 1) history.goBack();
          else history.push(backTo);
        }}
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
        {eyebrow && (
          <div
            className="font-sans text-eyebrow font-semibold tracking-[0.16em] uppercase"
            style={{ color: 'var(--ink-3)' }}
          >
            {eyebrow}
          </div>
        )}
        <div
          className={`${eyebrow ? 'mt-0.5' : ''} truncate font-sans font-semibold text-body sm:text-body leading-tight tracking-[-0.005em]`}
          style={{ color: 'var(--navy)' }}
        >
          {resolvedAddress}
        </div>
      </div>

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
        <Button
          variant="primary"
          onClick={() => window.print()}
          icon={<Icon name="pdf" size={14} />}
          className="shrink-0"
        >
          Download PDF
        </Button>
      )}

      {showAI && (
        <AICtaButton
          scenario={(aiScenario || scenarioForTarget) as 'low' | 'medium' | 'high'}
          size="md"
        />
      )}
    </div>
  );
}
