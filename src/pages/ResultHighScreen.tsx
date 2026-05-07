/* global React, AppShell, PageHeader, ScoreCard, ModeToggle, PropertyOverview, WhyCard, ListingsPanel */
// Screen 05 — Result · red flag (high risk).

function ResultHighScreen() {
  const [mode, setMode] = React.useState<AudienceMode>('investigator');
  return (
    <AppShell>
      <PageHeader showTitle={false} rightSlot={<ModeToggle value={mode} onChange={setMode} />} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" mode={mode} />
        <WhyCard scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
