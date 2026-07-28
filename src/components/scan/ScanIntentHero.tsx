/* global React, CommandSearch, ChipRow, Icon */
// ScanIntentHero — the scan-intake hero, composed (not invented) from three
// registered components:
//   CommandSearch  (the address command bar)  ·  ChipRow (single-select intent)
//   + the CommandSearch spotlight "Run scan" button as the gated trigger.
//
// It captures the REQUIRED "intended occupancy" declaration at scan time
// without breaking the type-and-go command-bar feel:
//
//   1. Empty            → just the address field. Calm, single decision.
//   2. Address entered  → the intent row reveals (card-rise) beneath it.
//   3. Run with no pick  → the run is blocked and the intent row is flagged
//                          (state = error), rather than firing a blind scan.
//   4. Declared          → ready. Running compares observed vs declared.
//
// Nothing here is canonical: it's pure composition + a callback intercept on
// CommandSearch.onRun. No new component, token, or motion value is defined.
//
// The declaration is neutral input, never a verdict — so the active chip uses
// the brand tint ChipRow already owns, and is never coloured clean/warn/risk.

interface IntentOption {
  value: string;
  label: string;
}

// The scan-time axis is deliberately coarse: only "is non-owner occupancy
// expected here?" changes how a finding reconciles. The finer taxonomy
// (long-term vs STR, vacant/under-construction) lives in the batch template,
// not the hero.
const INTENT_OPTIONS: IntentOption[] = [
  { value: 'owner-occupied', label: 'Owner-occupied' },
  { value: 'rental',         label: 'Rental / investment' },
  { value: 'second-home',    label: 'Second home' },
  { value: 'not-sure',       label: 'Not sure' },
];

interface ScanIntentHeroProps {
  /** Seed the address field (spec frames render deterministic snapshots). */
  initialAddress?: string;
  /** Seed the chosen intent — '' means nothing selected yet. */
  initialIntent?: string;
  /** Seed the post-submit gate state (Run pressed with no intent). */
  initialGateHit?: boolean;
  /**
   * Live-app hook. Called once the gate passes, with the entered address and
   * the declared intent. When omitted (spec frames), a local confirmation
   * renders instead so the ready→run transition stays legible offline.
   */
  onRun?: (address: string, intent: string) => void;
  /** Override the address command-bar sample chips. */
  sampleChips?: { label: string; value: string }[];
}

const DEFAULT_SAMPLE_CHIPS = [
  { label: '28804 · residential', value: '1428 Maplewood Drive, Asheville, NC 28804' },
  { label: '28801 · downtown',    value: '19 Edgemont Rd, Asheville, NC 28801' },
];

function ScanIntentHero({
  initialAddress = '',
  initialIntent = '',
  initialGateHit = false,
  onRun,
  sampleChips = DEFAULT_SAMPLE_CHIPS,
}: ScanIntentHeroProps) {
  const [address, setAddress] = React.useState(initialAddress);
  const [intent, setIntent] = React.useState(initialIntent);
  const [gateHit, setGateHit] = React.useState(initialGateHit);
  const [ran, setRan] = React.useState(false);

  // Progressive reveal: the second decision only surfaces once there's an
  // address to attach it to. Keeps the empty state a single clean field.
  const revealed = address.trim().length > 0;

  function handleRun() {
    if (!revealed) return;
    if (!intent) {
      // Hard gate — do NOT run a scan we can't reconcile. Flag, don't fire.
      setGateHit(true);
      return;
    }
    // Live app drives the real scan; spec frames fall back to a local echo.
    if (onRun) onRun(address.trim(), intent);
    else setRan(true);
  }

  function handleIntent(next: string) {
    setIntent(next);
    setGateHit(false); // an active choice clears the required-field flag
    setRan(false);
  }

  const gateError = gateHit && !intent;

  // One message slot, four variants. Default is the "why required" helper;
  // it swaps to the error message on a blocked run, or to the consequence
  // line when the user knowingly declares "Not sure".
  let msgIcon = 'info';
  let msgTone = 'text-ink-3';
  let msg =
    'What the loan or policy says it should be — required before running.';
  if (gateError) {
    msgIcon = 'alert';
    msgTone = 'text-error-ink';
    msg = 'Choose an intended use to run — the scan is compared against it.';
  } else if (intent === 'not-sure') {
    msg = "We'll report observed occupancy only — no exception check.";
  } else if (intent) {
    msg = 'Running will flag any occupancy that contradicts this.';
  }

  return (
    <div className="w-full">
      {/* Address command bar — the real registered hero, unchanged. Its
          spotlight "Run scan" button is intercepted below as the gated
          trigger, so muscle-memory (type · Enter) still lands here. */}
      <CommandSearch
        mode="inline"
        value={address}
        onChange={setAddress}
        onRun={handleRun}
        sampleChips={sampleChips}
      />

      {/* Intent reveal — appears once an address exists. */}
      {revealed && (
        <div
          className="card-rise mt-5 pt-5 border-t border-line"
          style={{ ['--rise-delay' as any]: '40ms' }}
        >
          {/* Error emphasis on a blocked run: a soft ring around the whole
              intent block, using the state error-soft token (no new value,
              no invented motion — a static shadow, not a pulse). */}
          <div
            className="rounded-lg -mx-2 px-2 py-1 transition-shadow duration-200"
            style={{ boxShadow: gateError ? '0 0 0 3px var(--error-soft)' : 'none' }}
          >
            <ChipRow
              label="Intended occupancy"
              value={intent}
              onChange={handleIntent}
              options={INTENT_OPTIONS}
            />

            {/* Message slot */}
            <div className="mt-2.5 flex items-start gap-2">
              <span
                className={`${msgTone} shrink-0 mt-px [&>svg]:w-3.5 [&>svg]:h-3.5`}
                aria-hidden
              >
                <Icon name={msgIcon} size={14} />
              </span>
              <span className={`text-caption leading-snug ${msgTone}`}>{msg}</span>
            </div>
          </div>
        </div>
      )}

      {/* Prototype-only confirmation so the ready → run transition is legible
          in the spec. In the app this navigates to /scan/start. */}
      {ran && (
        <div className="mt-4 flex items-center gap-2 text-caption text-brand-deep">
          <span className="[&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="check" size={14} />
          </span>
          <span>
            Scanning — reconciling against{' '}
            <strong className="font-semibold">
              {INTENT_OPTIONS.find((o) => o.value === intent)?.label}
            </strong>
            .
          </span>
        </div>
      )}
    </div>
  );
}
