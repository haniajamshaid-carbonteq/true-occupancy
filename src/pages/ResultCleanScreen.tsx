/* global React, AppShell, ScanContextBar, ConfidenceHero, PropertyOverview, ListingsPanel */
// Screen 03 — Result · "Not rented · High confidence" (low signal strength).

function ResultCleanScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate automateScenario="low" />
      <div className="mt-5 flex flex-col gap-5">
        <ConfidenceHero scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
