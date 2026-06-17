/* global React, Card, Icon */
// Address integrity banner.
//   Surfaces above the verdict when the backend flags the submitted
//   address as either tampered (deliberate manipulation — homoglyphs,
//   character substitutions) or as a likely typo. Compact card pattern
//   matching the AIInvestigator ErrorCard look — solid status-soft bg
//   with a circular icon chip on the left, no gradient.
//
//   The banner is an orthogonal signal. It does NOT lower the rental
//   confidence; the verdict below is the system's reading of the
//   resolved address.

type AddressIntegrityVariant = 'tampered' | 'typo';

interface AddressIntegrityBannerProps {
  variant: AddressIntegrityVariant;
  submitted: string;
  canonical: string;
  /** Character indices in `submitted` flagged by the integrity check. */
  suspectIndices?: number[];
  /** Plain-English explanation revealed on click. Keep it short. */
  plainReason: string;
  onDismiss?: () => void;
}

interface BannerTone {
  bg: string;
  borderColor: string;
  iconFill: string;
  iconColor: string;
  titleColor: string;
  bodyColor: string;
  iconName: 'alert' | 'info';
  highlightBg: string;
}

// Inline-style values follow the existing AIInvestigator pattern in this
// codebase — status tokens referenced as CSS vars, not Tailwind class
// strings, so the Play CDN doesn't need to be told to emit them.
const TONE: Record<AddressIntegrityVariant, BannerTone> = {
  tampered: {
    bg:          'var(--risk-soft)',
    borderColor: 'var(--risk)',
    iconFill:    'var(--surface)',
    iconColor:   'var(--risk)',
    titleColor:  'var(--risk-ink)',
    bodyColor:   'var(--risk-ink)',
    iconName:    'alert',
    highlightBg: 'var(--risk)',
  },
  typo: {
    bg:          'var(--warn-soft)',
    borderColor: 'var(--warn)',
    iconFill:    'var(--surface)',
    iconColor:   'var(--warn-ink)',
    titleColor:  'var(--warn-ink)',
    bodyColor:   'var(--warn-ink)',
    iconName:    'info',
    highlightBg: 'var(--warn)',
  },
};

const TITLE: Record<AddressIntegrityVariant, string> = {
  tampered: 'Address may have been altered',
  typo:     'Address looks unusual',
};

const LEAD: Record<AddressIntegrityVariant, string> = {
  tampered:
    'This address looks like it may have been deliberately changed. We resolved it to a standard form before scanning — verify with the borrower before relying on this result.',
  typo:
    'This address appears to contain a typo. We scanned the closest standard match — please confirm with the borrower.',
};

function AddressIntegrityBanner({
  variant,
  submitted,
  canonical,
  suspectIndices = [],
  plainReason,
  onDismiss,
}: AddressIntegrityBannerProps) {
  const t = TONE[variant];
  const [showReasoning, setShowReasoning] = React.useState(false);

  return (
    <Card
      padded
      style={{ background: t.bg, borderColor: t.borderColor }}
    >
      <div className="flex items-start gap-3">
        {/* Circular icon chip — matches AIInvestigator ErrorCard */}
        <span
          aria-hidden
          className="w-7 h-7 rounded-full grid place-items-center shrink-0"
          style={{ background: t.iconFill, color: t.iconColor }}
        >
          <Icon name={t.iconName} size={16} />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <h3
              className="font-sans font-semibold m-0 leading-none"
              style={{ fontSize: 'var(--text-h4)', color: t.titleColor }}
            >
              {TITLE[variant]}
            </h3>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss banner"
                className="bg-transparent border-0 cursor-pointer p-0 shrink-0"
                style={{ color: t.bodyColor, opacity: 0.7 }}
              >
                <Icon name="x" size={14} />
              </button>
            )}
          </div>

          <p
            className="font-sans text-body-sm m-0 mt-1.5 leading-snug"
            style={{ color: t.bodyColor }}
          >
            {LEAD[variant]}
          </p>

          {/* Disclosure: address comparison + plain-English reasoning.
              Default state is just the title + lead + toggle, so the
              banner stays compact until the user opts in. */}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={() => setShowReasoning((v: boolean) => !v)}
              className="bg-transparent border-0 cursor-pointer p-0 inline-flex items-center gap-1.5 font-sans text-caption font-medium"
              style={{ color: t.bodyColor }}
            >
              <span
                className="inline-flex transition-transform"
                style={{ transform: showReasoning ? 'rotate(180deg)' : 'none' }}
              >
                <Icon name="chevron" size={11} />
              </span>
              {showReasoning ? 'Hide details' : 'Why we flagged this'}
            </button>

            {showReasoning && (
              <div className="mt-2.5">
                {/* Address comparison */}
                <div
                  className="rounded-md border overflow-hidden"
                  style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}
                >
                  <AddressDiffRow
                    label="Submitted"
                    address={submitted}
                    suspectIndices={suspectIndices}
                    highlightBg={t.highlightBg}
                  />
                  <div style={{ borderTop: '1px solid var(--line)' }} />
                  <AddressDiffRow label="Resolved to" address={canonical} />
                </div>

                {/* Plain-English reasoning */}
                <p
                  className="font-sans text-body-sm m-0 mt-3 leading-snug"
                  style={{ color: t.bodyColor }}
                >
                  {plainReason}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function AddressDiffRow({
  label,
  address,
  suspectIndices = [],
  highlightBg,
}: {
  label: string;
  address: string;
  suspectIndices?: number[];
  highlightBg?: string;
}) {
  const suspectSet = new Set(suspectIndices);
  const isResolved = label === 'Resolved to';
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <span
        className="font-mono uppercase tracking-widest text-ink-3 shrink-0 pt-0.5"
        style={{ fontSize: 'var(--text-eyebrow)', width: '78px' }}
      >
        {label}
      </span>
      <span className="font-mono text-body-sm text-ink leading-snug break-all">
        {[...address].map((char, i) => {
          const isHighlighted = !isResolved && suspectSet.has(i);
          return (
            <span
              key={i}
              style={
                isHighlighted
                  ? { background: highlightBg, color: 'white', borderRadius: '2px', padding: '0 2px' }
                  : undefined
              }
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
