/* global React, Card, Pill, Icon, SCENARIOS, MiniHalfGauge */

interface WhyCardProps {
  scenario: 'low' | 'medium' | 'high';
  /** Initial open state. Card is expandable on the chevron. */
  defaultOpen?: boolean;
}

function WhyCard({ scenario, defaultOpen = true }: WhyCardProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  const sc = SCENARIOS[scenario];
  const rows = sc.breakdown;
  const net = rows.reduce((acc, r) => acc + r.impact, 0);

  return (
    <Card>
      {/* Head — tighter padding, smaller H3, drop the redundant "Explainability" pill */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-transparent border-0 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-medium text-[16px] m-0">Why this score?</h3>
          <span className="font-mono text-[11px] text-ink-3">
            {rows.length} signals · net {net >= 0 ? '+' : ''}
            {net}%
          </span>
        </div>
        <span
          className={`w-6 h-6 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <Icon name="chevron" size={14} />
        </span>
      </button>

      {/* Body — stacked rows with mini gauge + title/desc + impact pill */}
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2.5">
          {rows.map((r, i) => {
            const abs = Math.min(100, Math.abs(r.impact) * 2);
            const pos = r.impact > 0;
            const neg = r.impact < 0;
            const risk: 'clean' | 'warn' | 'risk' = pos
              ? abs >= 60
                ? 'risk'
                : 'warn'
              : neg
              ? 'clean'
              : 'warn';
            const impactLabel = pos
              ? abs >= 60
                ? 'High impact'
                : 'Moderate impact'
              : neg
              ? 'Low impact'
              : 'Neutral';
            const impactPill = pos
              ? abs >= 60
                ? 'bg-risk-soft text-risk-ink'
                : 'bg-warn-soft text-warn-ink'
              : neg
              ? 'bg-clean-soft text-clean-ink'
              : 'bg-surface-2 text-ink-3';

            return (
              <div
                key={i}
                className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-4 py-3 rounded-2xl border border-line bg-surface"
              >
                <MiniHalfGauge score={Math.round(abs)} risk={risk} />
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-ink leading-tight mb-0.5">
                    {r.title}
                  </div>
                  <div className="text-[12.5px] text-ink-3 leading-snug">
                    {r.desc}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-[12px] font-medium shrink-0 ${impactPill}`}
                >
                  {impactLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
