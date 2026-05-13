/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet */
// Screen 04 — Result · "Possibly rented · Medium confidence" (mixed signals).

function ResultMediumScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate showAI automateScenario="medium" />
      <div className="mt-stack flex flex-col gap-stack">
        <AIInvestigator scenario="medium" />
        <ConfidenceHero scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="medium" />
    </AppShell>
  );
}
