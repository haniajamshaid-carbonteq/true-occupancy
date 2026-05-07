/* global React, AppShell, PageHeader, ScoreCard, ModeToggle, PropertyOverview, WhyCard, ListingsPanel */
// Screen 03 — Result · clean (low risk).

function ResultCleanScreen() {
  const [mode, setMode] = React.useState<AudienceMode>('investigator');
  return (
    <AppShell>
      <PageHeader showTitle={false} rightSlot={<ModeToggle value={mode} onChange={setMode} />} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="low" mode={mode} />
        <WhyCard scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
