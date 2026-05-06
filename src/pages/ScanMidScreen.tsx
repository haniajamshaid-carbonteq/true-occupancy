/* global React, AppShell, Sidebar, PageHeader, ScanCard, buildScanSteps */
// Screen 02 — Live scan · mid-flight.
// Geocoding & Airbnb done; Vrbo + FB running in parallel; score still queued.

function ScanMidScreen() {
  const steps = buildScanSteps('high', 'mid');
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader />
      <div className="mt-5">
        <ScanCard steps={steps} scanning progress={50} />
      </div>
    </AppShell>
  );
}
