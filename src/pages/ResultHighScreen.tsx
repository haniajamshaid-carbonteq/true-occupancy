/* global React, AppShell, ScanContextBar, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, ReportCertificateBar */
// Screen 05 — Result · "Rented · High confidence" (strong signal).

function ResultHighScreen() {
  return (
    <AppShell>
      <ScanContextBar />
      <div className="mt-5 flex flex-col gap-5">
        <ReportCertificateBar kind="single" />
        <ScoreCard scenario="high" />
        <WhyCard scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
