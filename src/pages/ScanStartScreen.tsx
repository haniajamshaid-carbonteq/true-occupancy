/* global React, AppShell, buildScanSteps, ReactRouterDOM */
// Screen 01 — Live scan, just started. Auto-advances to /scan/mid.

function ScanStartScreen() {
  const history = ReactRouterDOM.useHistory();
  const scenario =
    (sessionStorage.getItem('scanScenario') as 'low' | 'medium' | 'high') || 'high';
  const steps = buildScanSteps(scenario, 'start');

  React.useEffect(() => {
    const t = setTimeout(() => history.push('/scan/mid'), 2800);
    return () => clearTimeout(t);
  }, [history]);

  return (
    <AppShell>
      <ScanStage steps={steps} progress={8} />
    </AppShell>
  );
}
