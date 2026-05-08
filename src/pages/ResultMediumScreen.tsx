/* global React, AppShell, PageHeader, ScoreCard, PropertyOverview, WhyCard, ListingsPanel */
// Screen 04 — Result · questionable (medium risk).

function ResultMediumScreen() {
  return (
    <AppShell>
      <PageHeader showTitle={false} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="medium" />
        <WhyCard scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
