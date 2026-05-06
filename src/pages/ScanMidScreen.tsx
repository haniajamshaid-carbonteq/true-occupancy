/* global React, AppShell, buildScanSteps, ReactRouterDOM */
// Screen 02 — Live scan, mid-flight. Auto-advances to the matching result.

const SCENARIO_TO_RESULT: Record<'low' | 'medium' | 'high', string> = {
  low: '/result/clean',
  medium: '/result/medium',
  high: '/result/high',
};

function ScanMidScreen() {
  const history = ReactRouterDOM.useHistory();
  const scenario =
    (sessionStorage.getItem('scanScenario') as 'low' | 'medium' | 'high') || 'high';
  const steps = buildScanSteps(scenario, 'mid');

  React.useEffect(() => {
    const t = setTimeout(() => history.push(SCENARIO_TO_RESULT[scenario]), 3200);
    return () => clearTimeout(t);
  }, [history, scenario]);

  return (
    <AppShell>
      <ScanStage steps={steps} progress={50} />
    </AppShell>
  );
}
