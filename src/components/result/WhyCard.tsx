/* global React, Card, Pill, Icon, SCENARIOS */

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
      {/* Head */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-7 py-5 flex items-center justify-between bg-transparent border-0 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5">
          <Pill variant="brand">
            <Icon name="spark" size={11} />
            Explainability
          </Pill>
          <h3 className="font-serif text-[20px] font-normal m-0">Why this score?</h3>
          <span className="font-mono text-[11.5px] text-ink-3">
            {rows.length} signals · net {net >= 0 ? '+' : ''}
            {net}%
          </span>
        </div>
        <span
          className={`w-7 h-7 rounded-full bg-surface-2 grid place-items-center text-ink-2 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          <Icon name="chevron" />
        </span>
      </button>

      {/* Body */}
      {open && (
        <div className="px-7 pb-7">
          <div className="grid grid-cols-[220px_1fr_180px] gap-6 pt-2.5 pb-3 border-b border-line font-mono text-[10.5px] uppercase tracking-widest text-ink-3">
            <div>Signal Type</div>
            <div>Detail</div>
            <div className="text-right">Impact</div>
          </div>
          {rows.map((r, i) => {
            const pos = r.impact > 0;
            const neg = r.impact < 0;
            const last = i === rows.length - 1;

            const iconBg = pos ? 'bg-risk-soft text-risk' : neg ? 'bg-clean-soft text-clean' : 'bg-surface-2 text-ink-3';
            const barColor = pos ? 'bg-risk' : neg ? 'bg-clean' : 'bg-ink-3 opacity-30';
            const pctColor = pos ? 'text-risk' : neg ? 'text-clean' : 'text-ink-3';
            const trendIcon: 'trend-up' | 'trend-down' | 'check' = pos ? 'trend-up' : neg ? 'trend-down' : 'check';

            return (
              <div
                key={i}
                className={`grid grid-cols-[220px_1fr_180px] gap-6 py-[18px] items-center ${
                  last ? '' : 'border-b border-dashed border-line'
                }`}
              >
                <div className="flex items-center gap-2.5 text-[14.5px] font-medium text-ink">
                  <span className={`w-[26px] h-[26px] rounded-md grid place-items-center shrink-0 ${iconBg}`}>
                    <Icon name={trendIcon} size={13} />
                  </span>
                  <span>{r.title}</span>
                </div>
                <div className="text-[13px] text-ink-3 leading-normal">{r.desc}</div>
                <div className="flex items-center gap-3 justify-end">
                  <div className="flex-1 max-w-[90px] h-1.5 bg-line rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.min(100, Math.abs(r.impact) * 2)}%` }}
                    />
                  </div>
                  <div className={`font-mono text-[13px] font-semibold min-w-[42px] text-right ${pctColor}`}>
                    {pos ? '+' : ''}
                    {r.impact}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
