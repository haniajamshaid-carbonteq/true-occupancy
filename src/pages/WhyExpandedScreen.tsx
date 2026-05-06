/* global React, AppShell, PageHeader, ScoreCard, ModeToggle, WhyCard */
// Screen 06 — Why this score · expanded.
// Score card + the explainability card open by default, no other content,
// so the contributing factors are the focus.

function WhyExpandedScreen() {
  const [mode, setMode] = React.useState<AudienceMode>('investigator');
  return (
    <AppShell>
      <PageHeader rightSlot={<ModeToggle value={mode} onChange={setMode} />} />
      <div className="mt-5 flex flex-col gap-5">
        <ScoreCard scenario="high" mode={mode} />
        <WhyCard scenario="high" defaultOpen />
      </div>
    </AppShell>
  );
}
