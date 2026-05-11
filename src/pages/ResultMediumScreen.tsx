/* global React, AppShell, ScanContextBar, ConfidenceHero, PropertyOverview, ListingsPanel */
// Screen 04 — Result · "Possibly rented · Medium confidence" (mixed signals).

function ResultMediumScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF />
      <div className="mt-5 flex flex-col gap-5">
        <ConfidenceHero scenario="medium" />
        <ListingsPanel scenario="medium" />
        <PropertyOverview />
      </div>
    </AppShell>
  );
}
