/* global React, Card, RiskBadge, Icon, PROPERTY, SCENARIOS, PLATFORMS */
// ScenarioKey is declared in src/data/scenarios.tsx, AudienceMode in
// ./ModeToggle.tsx. In the no-bundler script context they're shared at
// the top-level type scope — re-declaring here would conflict.

interface ScoreCardProps {
  scenario: ScenarioKey;
  /** Audience view. Defaults to investigator (numeric confidence score). */
  mode?: AudienceMode;
}

const HERO_BG_BY_RISK: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'bg-gradient-to-b from-clean-soft to-surface',
  warn: 'bg-gradient-to-b from-warn-soft to-surface',
  risk: 'bg-gradient-to-b from-risk-soft to-surface',
};

const RISK_ICON: Record<'clean' | 'warn' | 'risk', 'check' | 'info' | 'alert'> = {
  clean: 'check',
  warn: 'info',
  risk: 'alert',
};

// Verdict text uses the brand teal for "No" so a clean result feels positive
// (per spec) instead of just "absence-of-risk green".
const VERDICT_COLOR: Record<'clean' | 'warn' | 'risk', string> = {
  clean: 'text-brand',
  warn: 'text-warn',
  risk: 'text-risk',
};

function ScoreCard({ scenario, mode = 'investigator' }: ScoreCardProps) {
  const sc = SCENARIOS[scenario];

  return (
    <Card className="grid grid-cols-[300px_1fr]">
      {mode === 'investigator' ? (
        <InvestigatorHero scenario={scenario} />
      ) : (
        <ResidentHero scenario={scenario} />
      )}

      {/* Right side */}
      <div className="px-7 py-5 flex flex-col gap-2.5">
        <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 flex items-center gap-2">
          <Icon name="pin" size={12} />
          {PROPERTY.address}
        </div>
        {mode === 'investigator' ? (
          <>
            <h3 className="font-serif text-[19px] font-normal m-0">{sc.headline}</h3>
            <p className="m-0 text-ink-2 text-[13.5px] leading-relaxed">{sc.summary}</p>
          </>
        ) : (
          <>
            <h3 className="font-serif text-[19px] font-normal m-0">What does this mean?</h3>
            <p className="m-0 text-ink-2 text-[13.5px] leading-relaxed">{RESIDENT_MEANING[sc.risk]}</p>
          </>
        )}
      </div>
    </Card>
  );
}

// ---- investigator hero ----

function InvestigatorHero({ scenario }: { scenario: ScenarioKey }) {
  const sc = SCENARIOS[scenario];
  return (
    <div className={`px-6 py-5 border-r border-line ${HERO_BG_BY_RISK[sc.risk]}`}>
      <div className="font-mono text-[10.5px] uppercase tracking-widest text-ink-3 mb-2">
        Confidence score
      </div>
      <div className="font-serif text-[72px] font-normal leading-[0.95] tracking-[-0.04em] flex items-baseline gap-1">
        {sc.score}
        <span className="text-[18px] text-ink-4 tracking-tight">/100</span>
      </div>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <RiskBadge level={sc.risk} glyph={<Icon name={RISK_ICON[sc.risk]} size={12} />}>
          {sc.riskLabel}
        </RiskBadge>
      </div>
    </div>
  );
}

// ---- resident hero ----

const VERDICT: Record<'clean' | 'warn' | 'risk', { word: string; sub: string }> = {
  risk:  { word: 'Yes',   sub: 'This property appears to be rented out short-term.' },
  warn:  { word: 'Maybe', sub: 'We found a possible match worth a closer look.' },
  clean: { word: 'No',    sub: "We didn't find any active rental listings." },
};

const RESIDENT_MEANING: Record<'clean' | 'warn' | 'risk', string> = {
  risk:  "If you're a neighbor or local official, this may be worth reporting to your municipality. If you're a prospective tenant, the property may not be available for long-term lease.",
  warn:  "We're not certain. Open the details below to see exactly what we found, or run another scan in a few days to see if more listings appear.",
  clean: "Based on the platforms we monitor, this property is not currently being offered as a short-term rental. This sweep refreshes daily.",
};

function ResidentHero({ scenario }: { scenario: ScenarioKey }) {
  const sc = SCENARIOS[scenario];
  const v = VERDICT[sc.risk];

  // Platform display names, only those with at least one listing in this scenario.
  const foundOn: string[] = (PLATFORMS as { id: string; name: string }[])
    .filter((p) => (sc.listings[p.id] || []).length > 0)
    .map((p) => p.name);

  return (
    <div className={`px-6 py-5 border-r border-line ${HERO_BG_BY_RISK[sc.risk]}`}>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-3 mb-2">
        Rental status
      </div>
      <div
        className={`font-serif text-[64px] font-normal leading-[0.95] tracking-[-0.03em] ${VERDICT_COLOR[sc.risk]}`}
      >
        {v.word}
      </div>
      <p className="text-[14px] text-ink-2 leading-snug mt-2 mb-0 max-w-[260px]">{v.sub}</p>

      {foundOn.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-line flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
            Found on
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {foundOn.map((n) => (
              <span
                key={n}
                className="text-[11.5px] px-2.5 py-0.5 rounded-full bg-surface border border-line text-ink-2 font-medium"
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
