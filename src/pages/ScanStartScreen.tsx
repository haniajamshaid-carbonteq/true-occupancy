/* global React, AppShell, Sidebar, PageHeader, ScanCard, buildScanSteps */
// Screen 01 — Live scan · just started.
// Geocoding step is running, all platform checks queued.

function ScanStartScreen() {
  const steps = buildScanSteps('high', 'start');
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader />
      <div className="mt-5">
        <ScanCard steps={steps} scanning progress={8} />
      </div>
    </AppShell>
  );
}
