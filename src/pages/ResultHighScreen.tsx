/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet, RunHistory */
// Screen 05 — Result · "Rented · High confidence" (strong signal).

function ResultHighScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate automateScenario="high" />
      <div className="mt-stack flex flex-col gap-stack">
        <ConfidenceHero scenario="high" defaultOpen={false} />
        <AIInvestigator scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
      {/* Re-scans of this same address don't spawn new History rows — they
          collapse to one row and the timeline lives here. */}
      <RunHistory kind="single" />
      <CertificateSheet scenario="high" />
    </AppShell>
  );
}
