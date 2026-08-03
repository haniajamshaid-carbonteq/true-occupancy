/* global React, AppShell, buildScanSteps, ReactRouterDOM, SCENARIOS, useAppState */
// Screen 02 — Live scan, mid-flight. Auto-advances to the matching result.

const SCENARIO_TO_RESULT: Record<'low' | 'medium' | 'high', string> = {
  low: '/result/clean',
  medium: '/result/medium',
  high: '/result/high',
};

function ScanMidScreen() {
  const history = ReactRouterDOM.useHistory();
  const { addSingleScanToHistory } = useAppState();
  const scenario =
    (sessionStorage.getItem('scanScenario') as 'low' | 'medium' | 'high') || 'high';
  const steps = buildScanSteps(scenario, 'mid');

  React.useEffect(() => {
    const t = setTimeout(() => {
      // Only create a history entry for fresh scans (no scanHistoryId means
      // this isn't a re-open from history).
      if (!sessionStorage.getItem('scanHistoryId')) {
        const address = sessionStorage.getItem('scanAddress') || '';
        const reference = sessionStorage.getItem('scanReference') || undefined;
        const sc = SCENARIOS[scenario];
        const platforms = sc
          ? Object.values(sc.listings).filter((arr: any) => arr.length > 0).length
          : 0;
        const id = addSingleScanToHistory(address, scenario, platforms, reference);
        sessionStorage.setItem('scanHistoryId', id);
      }
      history.push(SCENARIO_TO_RESULT[scenario]);
    }, 3200);
    return () => clearTimeout(t);
  }, [history, scenario]);

  return (
    <AppShell>
      <ScanStage steps={steps} progress={50} />
    </AppShell>
  );
}
