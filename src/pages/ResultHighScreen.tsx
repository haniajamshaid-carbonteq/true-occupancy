/* global React, AppShell, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel */
// Screen 05 — Result · red flag (high risk).

function ResultHighScreen() {
  return (
    <AppShell>
      <PageHeader showTitle={false} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" />
        <WhyCard scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
