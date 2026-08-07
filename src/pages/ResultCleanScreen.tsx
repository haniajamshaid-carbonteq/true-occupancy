/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet, RunHistory */
// Screen 03 — Result · "Not rented · High confidence" (low signal strength).

function ResultCleanScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate automateScenario="low" />
      <div className="mt-stack flex flex-col gap-stack">
        <ConfidenceHero scenario="low" defaultOpen={false} />
        <AIInvestigator scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
      <RunHistory kind="single" />
      <CertificateSheet scenario="low" />
    </AppShell>
  );
}
