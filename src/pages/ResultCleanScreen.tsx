/* global React, AppShell, ScanContextBar, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, ReportCertificateBar */
// Screen 03 — Result · "Not rented · High confidence" (low signal strength).

function ResultCleanScreen() {
  return (
    <AppShell>
      <ScanContextBar />
      <div className="mt-5 flex flex-col gap-5">
        <ReportCertificateBar kind="single" />
        <ScoreCard scenario="low" />
        <WhyCard scenario="low" />
        <ListingsPanel scenario="low" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
