/* global React, AppShell, ScanContextBar, ConfidenceHero, PropertyOverview, ListingsPanel, CertificateSheet */
// Screen 04 — Result · "Possibly rented · Medium confidence" (mixed signals).

function ResultMediumScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate automateScenario="medium" />
      <div className="mt-stack flex flex-col gap-stack">
        <ConfidenceHero scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="medium" />
    </AppShell>
  );
}
