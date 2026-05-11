/* global React, AppShell, Sidebar, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, CertDownloadButton, RunInvestigationCTA, PROPERTY, SCENARIOS */
// Result screen — moderate confidence "possibly rented" verdict.

function ResultMediumScreen() {
  const rightActions = (
    <CertDownloadButton
      payload={{
        address: PROPERTY.address,
        date: new Date(),
        score: SCENARIOS.medium.score,
        risk: SCENARIOS.medium.risk,
      }}
    />
  );
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader rightSlot={rightActions} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="medium" />
        <WhyCard scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
        <RunInvestigationCTA />
      </div>
    </AppShell>
  );
}
