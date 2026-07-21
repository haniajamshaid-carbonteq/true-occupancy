/* global React, AppShell, ScanContextBar, ConfidenceHero, AIInvestigator, PropertyOverview, ListingsPanel, CertificateSheet, AddressIntegrityBanner */
// Result · "Likely Rented" with the address-integrity banner stacked on
// top. Mirrors ResultHighScreen otherwise so the banner can be evaluated
// in real context.
//
// Only the tampered variant is surfaced — typos go through the normal
// scan path without flagging the lender.

const TAMPERED_SAMPLE = {
  submitted: '123 N0rthw3st Blvd, Albuqu3rqu3, NM 87104',
  canonical: '123 Northwest Blvd, Albuquerque, NM 87104',
  suspectIndices: [5, 10, 26, 30],
  plainReason:
    "Letters in this address were swapped with numbers that look similar — a 0 (zero) where O should be in 'Northwest', and 3 (three) where E should be in 'Albuquerque'. Typos rarely look like this; it usually means the address was disguised on purpose.",
};

function ResultTamperedScreen() {
  return (
    <AppShell>
      <ScanContextBar showDownloadPDF showAutomate showAI automateScenario="high" />
      <div className="mt-stack flex flex-col gap-stack">
        <AddressIntegrityBanner
          variant="tampered"
          submitted={TAMPERED_SAMPLE.submitted}
          canonical={TAMPERED_SAMPLE.canonical}
          suspectIndices={TAMPERED_SAMPLE.suspectIndices}
          plainReason={TAMPERED_SAMPLE.plainReason}
        />
        <ConfidenceHero scenario="high" />
        <AIInvestigator scenario="high" />
        <ListingsPanel scenario="high" />
        <PropertyOverview />
      </div>
      <CertificateSheet scenario="high" />
    </AppShell>
  );
}
