/* global React, AppShell, Sidebar, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, CertDownloadButton, RunInvestigationCTA, PROPERTY, SCENARIOS */
// Result screen — "no public evidence found" verdict.

function ResultCleanScreen() {
  const rightActions = (
    <CertDownloadButton
      payload={{
        address: PROPERTY.address,
        date: new Date(),
        score: SCENARIOS.low.score,
        risk: SCENARIOS.low.risk,
      }}
    />
  );
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader rightSlot={rightActions} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="low" />
        <WhyCard scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
        <RunInvestigationCTA />
      </div>
    </AppShell>
  );
}
