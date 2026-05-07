/* global React, AppShell, PageHeader, ScoreCard, ModeToggle, PropertyOverview, WhyCard, ListingsPanel */
// Screen 04 — Result · questionable (medium risk).

function ResultMediumScreen() {
  const [mode, setMode] = React.useState<AudienceMode>('investigator');
  return (
    <AppShell>
      <PageHeader showTitle={false} rightSlot={<ModeToggle value={mode} onChange={setMode} />} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="medium" mode={mode} />
        <WhyCard scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
