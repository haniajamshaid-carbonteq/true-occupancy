/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet */
// Screen 05 — Result · "Rented · High confidence" (strong signal).

function ResultHighScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate showAI automateScenario="high" />
      <div className="mt-stack flex flex-col gap-stack">
        <AIInvestigator scenario="high" />
        <ConfidenceHero scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="high" />
    </AppShell>
  );
}
