/* global React, AppShell, ScanContextBar, ScoreCard, WhyCard */
// Screen 06 — Why this score · expanded.
// Score card + the explainability card open by default, no other content,
// so the contributing factors are the focus.

function WhyExpandedScreen() {
  return (
    <AppShell>
      <ScanContextBar
        eyebrow="Score breakdown"
        backTo="/result/high"
        backLabel="Back to result"
      />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" />
        <WhyCard scenario="high" defaultOpen />
      </div>
    </AppShell>
  );
}
