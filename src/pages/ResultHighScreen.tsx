/* global React, AppShell, Sidebar, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, CertDownloadButton, RunInvestigationCTA, PROPERTY, SCENARIOS */
// Result screen — high confidence "likely rented" verdict.

function ResultHighScreen() {
  const rightActions = (
    <CertDownloadButton
      payload={{
        address: PROPERTY.address,
        date: new Date(),
        score: SCENARIOS.high.score,
        risk: SCENARIOS.high.risk,
      }}
    />
  );
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader rightSlot={rightActions} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" />
        <WhyCard scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
        <RunInvestigationCTA />
      </div>
    </AppShell>
  );
}
