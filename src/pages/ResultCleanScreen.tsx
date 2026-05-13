/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet */
// Screen 03 — Result · "Not rented · High confidence" (low signal strength).

function ResultCleanScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate showAI automateScenario="low" />
      <div className="mt-stack flex flex-col gap-stack">
        <AIInvestigator scenario="low" />
        <ConfidenceHero scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="low" />
    </AppShell>
  );
}
