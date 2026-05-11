/* global React, AppShell, ScanContextBar, ConfidenceHero */
// Screen 06 — Why this score · expanded.
// ConfidenceHero with the breakdown accordion open by default, no other
// content — contributing factors are the focus.

function WhyExpandedScreen() {
  return (
    <AppShell>
      <ScanContextBar
        eyebrow="Score breakdown"
        backTo="/result/high"
        backLabel="Back to result"
      />
      <div className="mt-5 flex flex-col gap-5">
        <ConfidenceHero scenario="high" defaultOpen />
      </div>
    </AppShell>
  );
}
