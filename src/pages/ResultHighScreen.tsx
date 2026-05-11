/* global React, AppShell, ScanContextBar, ConfidenceHero, PropertyOverview, ListingsPanel, CertificateSheet */
// Screen 05 — Result · "Rented · High confidence" (strong signal).

function ResultHighScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate automateScenario="high" />
      <div className="mt-5 flex flex-col gap-5">
        <ConfidenceHero scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="high" />
    </AppShell>
  );
}
