/* global React, AppShell, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel */
// Screen 03 — Result · clean (low risk).

function ResultCleanScreen() {
  return (
    <AppShell>
      <PageHeader showTitle={false} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="low" />
        <WhyCard scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
