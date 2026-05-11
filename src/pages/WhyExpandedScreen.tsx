/* global React, AppShell, Sidebar, PageHeader, ScoreCard, WhyCard */
// Why this score · expanded.
// Confidence card + the explainability card open by default — contributing
// signals are the focus.

function WhyExpandedScreen() {
  return (
    <AppShell sidebar={<Sidebar />}>
      <PageHeader />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" />
        <WhyCard scenario="high" defaultOpen />
      </div>
    </AppShell>
  );
}
