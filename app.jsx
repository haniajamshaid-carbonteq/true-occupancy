/* global React, ReactDOM, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakButton,
   Sidebar, Topbar, PageHead, ScanCard, ScoreCard, WhyCard, ListingsPanel,
   SCENARIOS, buildScanScript, PLATFORMS */

const { useState, useEffect, useRef, useCallback } = React;

const TWEAK_DEFAULTS = (() => {
  try { return JSON.parse(document.getElementById('tweak-defaults').textContent.replace(/\/\*EDITMODE-(BEGIN|END)\*\//g, '')); }
  catch (e) { return { scenario: 'high' }; }
})();

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const scenario = tweaks.scenario || 'high';

  const [steps, setSteps] = useState(() => buildScanScript(scenario).map(s => ({ ...s, status: 'pending' })));
  const [scanning, setScanning] = useState(true);
  const [scoreLive, setScoreLive] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [doneAt, setDoneAt] = useState(null);

  const timersRef = useRef([]);

  const startScan = useCallback((scn) => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    const initial = buildScanScript(scn).map(s => ({ ...s, status: 'pending' }));
    setSteps(initial);
    setScanning(true);
    setScoreLive(0);
    setShowResults(false);
    setDoneAt(null);

    const targetScore = SCENARIOS[scn].score;

    initial.forEach((step, idx) => {
      // running
      timersRef.current.push(setTimeout(() => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'running' } : s));
      }, step.start));
      // done
      timersRef.current.push(setTimeout(() => {
        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done' } : s));
      }, step.end));
    });

    const lastEnd = initial[initial.length - 1].end;
    const finalize = setTimeout(() => {
      setScanning(false);
      setShowResults(true);
      setDoneAt(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      const dur = 900;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setScoreLive(Math.round(eased * targetScore));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, lastEnd + 250);
    timersRef.current.push(finalize);
  }, []);

  useEffect(() => { startScan(scenario); return () => timersRef.current.forEach(clearTimeout); }, [scenario, startScan]);

  const setScenario = (s) => setTweak('scenario', s);
  const replay = () => startScan(scenario);

  const total = steps.length;
  const completed = steps.filter(s => s.status === 'done').length;
  const running = steps.filter(s => s.status === 'running').length;
  const progressPct = scanning ? Math.min(100, ((completed + running * 0.5) / total) * 100) : 100;

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar scenario={scenario} setScenario={setScenario} onReplay={replay} scanning={scanning} />
        <PageHead scanning={scanning} doneAt={doneAt} />

        <div className="res-2col">
          <ScanCard steps={steps} progressPct={progressPct} scanning={scanning} />

          {showResults && (
            <>
              <ScoreCard scenario={scenario} scoreLive={scoreLive} />
              <WhyCard scenario={scenario} autoOpen={true} />
              <ListingsPanel scenario={scenario} />
            </>
          )}
        </div>
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Scenario" />
        <TweakRadio
          label="Outcome"
          value={scenario}
          onChange={(v) => setTweak('scenario', v)}
          options={[
            { label: 'Clean', value: 'low' },
            { label: 'Questionable', value: 'medium' },
            { label: 'Red flag', value: 'high' },
          ]}
        />
        <TweakSection label="Animation" />
        <TweakButton label="↻ Replay scan" onClick={replay} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
