/* global React, AppShell, ScanContextBar, ScoreCard, PropertyOverview, WhyCard, ListingsPanel, ReportCertificateBar */
// Screen 04 — Result · "Possibly rented · Medium confidence" (mixed signals).

function ResultMediumScreen() {
  return (
    <AppShell>
      <ScanContextBar />
      <div className="mt-5 flex flex-col gap-5">
        <ReportCertificateBar kind="single" />
        <ScoreCard scenario="medium" />
        <WhyCard scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
