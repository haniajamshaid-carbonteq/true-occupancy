/* global React, Icon, Button, Pill, Card, RiskBadge, SearchBar, CommandSearch, Avatar, BatchHugCard, openCommandPalette, Checkbox, Input, Tabs, ChipRow, DateRangePicker, DataTable, TableSkeleton, MetricCard, Modal, Drawer, DropdownMenu, ScreenEmpty, ScreenError */
// Visual QA showcase. Renders every variant of every primitive so a
// designer / engineer can scan the whole UI library on one page.

// React.useState used directly to avoid colliding with sibling files that
// destructure useState in shared script scope.

// ---- local SVG previews (named to avoid shadowing the global Icon component) ----
const Glyph = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  replay: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  ),
  arrowRight: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 5 5 9-11" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 2 21h20Z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="18" r=".5" fill="currentColor" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6 18 18M18 6 6 18" />
    </svg>
  ),
  bed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18V8" />
      <path d="M3 11h18v7" />
      <path d="M21 18v-3a3 3 0 0 0-3-3h-7v3" />
      <circle cx="7" cy="13" r="1.5" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
};

// ---- small layout helpers ----
function Section({ num, title, desc, children }: {
  num: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-20">
      <div className="flex items-baseline gap-4 mb-6 pb-4 border-b border-line">
        <span className="font-mono text-label text-ink-4">{num}</span>
        <h2 className="font-sans text-3xl font-bold tracking-[-0.005em] m-0" style={{ color: 'var(--navy)' }}>{title}</h2>
        {desc && <span className="ml-auto text-sm text-ink-3 max-w-[42ch] leading-snug">{desc}</span>}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-6 items-center py-4 border-t border-dashed border-line first:border-t-0">
      <div className="font-mono text-micro uppercase tracking-wider text-ink-4">{label}</div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface border border-line rounded-md p-6">
      {children}
    </div>
  );
}

// --- Type ramp preview -------------------------------------------------
// Shows every type token at its true rendered size, with the px value and
// utility class beside it, plus a one-word usage hint. Lets a designer
// confirm the ramp in seconds without reaching for tokens.css.

interface RampRow {
  token: string;
  px: number;
  use: string;
  sample: string;
}

const TYPE_RAMP: RampRow[] = [
  { token: 'text-display', px: 64, use: 'Hero numeral',                sample: '87%' },
  { token: 'text-h1',      px: 40, use: 'Page title',                  sample: 'Verify Property Occupancy.' },
  { token: 'text-h2',      px: 28, use: 'Compact metric, large heading', sample: '14 properties' },
  { token: 'text-h3',      px: 22, use: 'Section heading, card title', sample: 'Recent Scans' },
  { token: 'text-h4',      px: 18, use: 'Subsection heading',          sample: 'Why This Score' },
  { token: 'text-body',    px: 16, use: 'Body lead',                   sample: 'One address — every public listing within a mile.' },
  { token: 'text-body-sm', px: 14, use: 'Default body, table row',     sample: '1428 Maplewood Drive, Asheville, NC 28804' },
  { token: 'text-label',   px: 13, use: 'UI label, dense body, button',sample: 'Run Scan · Download · Back' },
  { token: 'text-caption', px: 12, use: 'Caption, hint, secondary',    sample: 'Last verified 2 h ago' },
  { token: 'text-micro',   px: 11, use: 'Mono uppercase, kbd, badge',  sample: 'TO-7C57EEEB · ⌘K · Rented' },
  { token: 'text-eyebrow', px: 10, use: 'Tracked uppercase eyebrow',   sample: 'CONFIDENCE' },
];

function TypeRampPreview() {
  return (
    <div className="divide-y divide-line">
      {TYPE_RAMP.map((r) => (
        <div
          key={r.token}
          className="grid grid-cols-[140px_64px_1fr_180px] gap-6 items-baseline py-4 first:pt-0 last:pb-0"
        >
          <div className="font-mono text-micro uppercase tracking-wider text-ink-3">
            {r.token}
          </div>
          <div className="font-mono text-micro tabular-nums text-ink-4 text-right">
            {r.px}px
          </div>
          <div
            className={`${r.token} text-ink leading-tight`}
            style={{ color: 'var(--navy)' }}
          >
            {r.sample}
          </div>
          <div className="text-caption text-ink-3 leading-snug">{r.use}</div>
        </div>
      ))}
    </div>
  );
}

// ---- icon roster — kept in lock-step with src/components/ui/Icons.tsx.
//      If you add an icon there, append its name here so the gallery shows it.
const ICON_NAMES: string[] = [
  'search', 'history', 'flag', 'globe', 'pdf', 'settings',
  'check', 'x', 'alert', 'info', 'chevron',
  'pin', 'bed', 'bath', 'square', 'shield', 'cal', 'price', 'star',
  'spark', 'ai-star', 'replay', 'share', 'trend-up', 'trend-down', 'external',
  'arrow-right', 'upload', 'layers', 'sliders', 'mail', 'lock', 'eye', 'eye-off', 'google', 'user',
];

// ---- demo data for the DataTable section ----
interface DemoScan {
  id: string;
  address: string;
  city: string;
  status: 'clean' | 'warn' | 'risk';
  scanned: string;
  score: number;
}

const DEMO_ROWS: DemoScan[] = [
  { id: 'TO-7C57', address: '1428 Maplewood Drive',  city: 'Asheville, NC',  status: 'clean', scanned: '2 h ago',  score: 87 },
  { id: 'TO-4A92', address: '305 Walnut Court',      city: 'Asheville, NC',  status: 'warn',  scanned: 'Yesterday', score: 64 },
  { id: 'TO-1F3E', address: '210 Silver Creek Drive', city: 'Asheville, NC', status: 'risk',  scanned: '2 d ago',  score: 22 },
  { id: 'TO-8D11', address: '88 Oakridge Lane',      city: 'Asheville, NC',  status: 'clean', scanned: '3 d ago',  score: 91 },
];

const STATUS_ACCENT: Record<DemoScan['status'], string> = {
  clean: 'var(--clean)',
  warn:  'var(--warn)',
  risk:  'var(--risk)',
};

// ---- the page ----
function ComponentsPage() {
  const [query, setQuery] = React.useState('');
  const [checks, setChecks] = React.useState({ on: true, off: false, label: true });
  const [input, setInput] = React.useState('');
  const [tab, setTab] = React.useState<'recent' | 'scheduled' | 'archived'>('recent');
  const [chip, setChip] = React.useState('all');
  const [range, setRange] = React.useState<{ from?: string; to?: string }>({});
  const [modalOpen, setModalOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* page header */}
      <header className="px-20 pt-16 pb-12 max-w-[1100px]">
        <div className="font-mono text-xs uppercase tracking-widest text-brand mb-3">UI Library</div>
        <h1 className="font-sans text-5xl font-bold leading-[1.05] tracking-[-0.005em] m-0 mb-4" style={{ color: 'var(--navy)' }}>
          Components <span style={{ color: 'var(--brand-deep)' }}>showcase.</span>
        </h1>
        <p className="text-h4 text-ink-2 leading-relaxed m-0 max-w-[60ch]">
          Every primitive in <code className="font-mono text-sm bg-surface-2 px-1.5 py-0.5 rounded border border-line">src/components/ui/</code>, with every variant. Use this page to visually QA against the spec in <code className="font-mono text-sm bg-surface-2 px-1.5 py-0.5 rounded border border-line">design-spec.html</code>.
        </p>
      </header>

      <div className="px-20 pb-32 max-w-[1100px]">
        {/* === Type ramp === */}
        <Section num="00" title="Type ramp" desc="11 named slots. Use these tokens (text-display, text-h1 … text-eyebrow) instead of raw text-[Npx]. Each token bundles a paired line-height appropriate to that role.">
          <Stage>
            <TypeRampPreview />
          </Stage>
        </Section>

        {/* === Button === */}
        <Section num="01" title="Button" desc="36px tall, 8px radius, 13/500 sans. Three variants share padding and shape; only color and border change.">
          <Stage>
            <Row label="Primary">
              <Button variant="primary">Run Scan</Button>
              <Button variant="primary" icon={Glyph.search}>Run Scan</Button>
              <Button variant="primary" iconRight={Glyph.arrowRight}>Continue</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </Row>
            <Row label="Default">
              <Button>Export</Button>
              <Button icon={Glyph.download}>Export PDF</Button>
              <Button icon={Glyph.replay}>Replay scan</Button>
              <Button disabled>Disabled</Button>
            </Row>
            <Row label="Ghost">
              <Button variant="ghost">Cancel</Button>
              <Button variant="ghost" icon={Glyph.x}>Dismiss</Button>
              <Button variant="ghost" disabled>Disabled</Button>
            </Row>
          </Stage>
        </Section>

        {/* === Pill === */}
        <Section num="02" title="Pill" desc="The single canonical label primitive. md (24px) is the default; sm (20px) is reserved for nav counts and inline metadata. Status (clean/warn/risk) communicates severity; verdict (high/med/low) is categorical and must not read as good/bad; brand is reserved for live/system states. Token-driven: bg-{name}-soft + text-{name}-ink, never hardcoded.">
          <Stage>
            <Row label="Sizes">
              <Pill size="sm">12</Pill>
              <Pill size="sm" variant="brand">New</Pill>
              <Pill>Default · md</Pill>
              <Pill dot>With dot</Pill>
            </Row>
            <Row label="Default · pill-neutral bg, ink-2, line border">
              <Pill>Active</Pill>
              <Pill dot>Active</Pill>
              <Pill>1924 sqft</Pill>
            </Row>
            <Row label="Status · clean (clean-soft + clean-ink)">
              <Pill variant="clean">No findings</Pill>
              <Pill variant="clean" dot>Verified</Pill>
            </Row>
            <Row label="Status · warn (warn-soft + warn-ink)">
              <Pill variant="warn">Possible match</Pill>
              <Pill variant="warn" dot>Review</Pill>
            </Row>
            <Row label="Status · risk (risk-soft + risk-ink)">
              <Pill variant="risk">Rented</Pill>
              <Pill variant="risk" dot>3 platforms</Pill>
            </Row>
            <Row label="Brand · live / system (brand-soft + brand-deep)">
              <Pill variant="brand">Live scan</Pill>
              <Pill variant="brand" dot>Beta</Pill>
            </Row>
            <Row label="Verdict · categorical (purple / yellow / blue)">
              <Pill variant="verdict-high">Rented</Pill>
              <Pill variant="verdict-med">Possibly rented</Pill>
              <Pill variant="verdict-low">Not rented</Pill>
            </Row>
          </Stage>
        </Section>

        {/* === Card === */}
        <Section num="03" title="Card" desc="Surface + line + 18px radius + shadow-sm. Edge-to-edge by default; opt into padding via the prop.">
          <div className="grid grid-cols-3 gap-5">
            <Card padded>
              <div className="font-mono text-micro uppercase tracking-wider text-ink-3 mb-2">Default</div>
              <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Padded card</div>
              <p className="text-label text-ink-3 leading-relaxed mt-2 mb-0">
                Use <code className="font-mono text-xs">padded</code> to get inset content.
              </p>
            </Card>
            <Card>
              <div className="h-20 bg-gradient-to-b from-brand-soft to-surface" />
              <div className="p-5">
                <div className="font-mono text-micro uppercase tracking-wider text-ink-3 mb-2">Edge-to-edge</div>
                <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Bleed surface</div>
                <p className="text-label text-ink-3 leading-relaxed mt-2 mb-0">
                  No padding so the gradient header reaches the border.
                </p>
              </div>
            </Card>
            <Card flat padded>
              <div className="font-mono text-micro uppercase tracking-wider text-ink-3 mb-2">Flat</div>
              <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Nested</div>
              <p className="text-label text-ink-3 leading-relaxed mt-2 mb-0">
                Drops the shadow when nested inside another card.
              </p>
            </Card>
          </div>
        </Section>

        {/* === RiskBadge === */}
        <Section num="04" title="RiskBadge" desc="Verdict pill with a 22×22 circular glyph. Background is the soft tone; glyph fills with the solid status color.">
          <Stage>
            <Row label="Clean">
              <RiskBadge level="clean" glyph={Glyph.check}>Not Rented · High Confidence</RiskBadge>
            </Row>
            <Row label="Warn">
              <RiskBadge level="warn" glyph={Glyph.alert}>Possibly Rented · Medium Confidence</RiskBadge>
            </Row>
            <Row label="Risk">
              <RiskBadge level="risk" glyph={Glyph.x}>Rented · High Confidence</RiskBadge>
            </Row>
          </Stage>
        </Section>

        {/* === CommandSearch === */}
        <Section num="05" title="CommandSearch" desc="The hero search of the platform. 64px input, animated gradient focus ring, brand-tinted glow on focus, typewriter placeholder cycling through example queries. Inline mode hosts the Run scan button + try-chips; overlay mode is the body of the global ⌘K palette.">
          <div className="space-y-8">
            <div>
              <div className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mb-2">Inline (HomeScreen hero)</div>
              <CommandSearch
                mode="inline"
                value={query}
                onChange={setQuery}
                onRun={() => {}}
                sampleChips={[
                  { label: '28804 · Not Rented', value: '1428 Maplewood Drive, Asheville, NC 28804' },
                  { label: '28805 · Possibly Rented', value: '1428 Maplewood Drive, Asheville, NC 28805' },
                  { label: '28806 · Rented', value: '1428 Maplewood Drive, Asheville, NC 28806' },
                ]}
              />
            </div>
            <div>
              <div className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mb-2">Overlay (⌘K palette body)</div>
              <div className="rounded-[18px] p-6" style={{ background: 'rgba(20, 45, 85, 0.06)' }}>
                <CommandSearch
                  mode="overlay"
                  value=""
                  onChange={() => {}}
                  onRun={() => {}}
                  onClose={() => {}}
                />
              </div>
              <div className="mt-3">
                <Button variant="default" onClick={() => openCommandPalette()}>
                  Open the real ⌘K palette
                </Button>
              </div>
            </div>
          </div>
        </Section>

        {/* === Avatar === */}
        <Section num="06" title="Avatar" desc="Default 32px, warm-stone gradient, mono initials. Pass src for a real photo, or size= for compact lists / large profile.">
          <Stage>
            <Row label="Initials">
              <Avatar initials="JM" />
              <Avatar initials="AK" />
              <Avatar initials="ZK" />
              <Avatar initials="LT" />
            </Row>
            <Row label="Sizes">
              <Avatar initials="JM" size={20} />
              <Avatar initials="JM" size={28} />
              <Avatar initials="JM" size={32} />
              <Avatar initials="JM" size={48} />
              <Avatar initials="JM" size={72} />
            </Row>
            <Row label="With image">
              <Avatar src="https://i.pravatar.cc/64?img=12" initials="JM" alt="Jordan Marlow" />
              <Avatar src="https://i.pravatar.cc/96?img=32" initials="AK" alt="Alex K" size={48} />
            </Row>
          </Stage>
        </Section>

        {/* === Pill · subtle === */}
        <Section num="07" title="Pill · subtle" desc="Quieter Pill variant for descriptive metadata. Surface-2 background, ink-2, normal weight, mixed-case. Optional 12px leading icon at .7 opacity.">
          <Stage>
            <Row label="Text only">
              <Pill subtle>R-1 Single Family</Pill>
              <Pill subtle>Asheville, NC</Pill>
              <Pill subtle>1930</Pill>
            </Row>
            <Row label="With icon">
              <Pill subtle icon={Glyph.bed}>3 bed · 2 bath</Pill>
              <Pill subtle icon={Glyph.pin}>1428 Maplewood Dr</Pill>
              <Pill subtle icon={Glyph.check}>Verified parcel</Pill>
            </Row>
          </Stage>
        </Section>

        {/* === BatchHugCard === */}
        <Section
          num="08"
          title="Batch hug card"
          desc="Compact horizontal batch-status surface. Hug-width (inline-flex), thumbnail + title + meta + optional progress/actions, dismiss X top-right. Four states: scanning · completed · completed-with-errors · error."
        >
          <Stage>
            <Row label="Scanning">
              <BatchHugCard
                state="scanning"
                filename="properties-asheville.csv"
                scanned={12}
                total={14}
              />
            </Row>
            <Row label="Completed">
              <BatchHugCard
                state="completed"
                filename="properties-asheville.csv"
                scanned={14}
                total={14}
              />
            </Row>
            <Row label="Completed with errors">
              <BatchHugCard
                state="completed-errors"
                filename="properties-asheville.csv"
                scanned={12}
                total={14}
                failed={2}
              />
            </Row>
            <Row label="Error">
              <BatchHugCard
                state="error"
                filename="properties-asheville.csv"
                scanned={7}
                total={14}
                stoppedAt={8}
              />
            </Row>
          </Stage>
        </Section>

        {/* === Icon set === */}
        <Section num="09" title="Icon" desc="Single Icon component, name prop. 16px default, currentColor stroke. Sized via the size prop or the surrounding text color.">
          <Stage>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
              {ICON_NAMES.map((n) => (
                <div
                  key={n}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-md border border-line bg-surface"
                >
                  <span style={{ color: 'var(--ink-2)' }} className="[&>svg]:w-5 [&>svg]:h-5">
                    <Icon name={n} size={20} />
                  </span>
                  <code className="font-mono text-micro text-ink-4">{n}</code>
                </div>
              ))}
            </div>
          </Stage>
        </Section>

        {/* === Checkbox === */}
        <Section num="10" title="Checkbox" desc="Square check, brand-teal fill when checked. Hidden native input drives a11y + keyboard.">
          <Stage>
            <Row label="States">
              <Checkbox
                checked={checks.on}
                onChange={(e) => setChecks({ ...checks, on: e.currentTarget.checked })}
              />
              <Checkbox
                checked={checks.off}
                onChange={(e) => setChecks({ ...checks, off: e.currentTarget.checked })}
              />
              <Checkbox checked disabled />
              <Checkbox checked={false} disabled />
            </Row>
            <Row label="With label">
              <Checkbox
                checked={checks.label}
                onChange={(e) => setChecks({ ...checks, label: e.currentTarget.checked })}
                label="Include archived scans"
              />
            </Row>
          </Stage>
        </Section>

        {/* === Input === */}
        <Section num="11" title="Input" desc="44px tracked input. Optional label, leading icon, trailing slot, hint. Focus paints a brand-soft ring; error swaps to risk.">
          <Stage>
            <div className="grid grid-cols-2 gap-6 max-w-[640px]">
              <Input
                label="Property address"
                placeholder="1428 Maplewood Drive, Asheville, NC"
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
              />
              <Input
                label="Search"
                placeholder="Search scans, addresses, IDs"
                leadingIcon={<Icon name="search" size={16} />}
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                leadingIcon={<Icon name="mail" size={16} />}
                hint="We'll send the report here."
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leadingIcon={<Icon name="lock" size={16} />}
                trailing={
                  <button type="button" aria-label="Show password" className="grid w-10 h-11 place-items-center" style={{ color: 'var(--ink-3)' }}>
                    <Icon name="eye" size={16} />
                  </button>
                }
              />
              <Input
                label="ZIP"
                value="2880"
                error
                hint="ZIP must be 5 digits."
                onChange={() => {}}
              />
              <Input
                label="Unlabeled / plain"
                placeholder="Generic field"
              />
            </div>
          </Stage>
        </Section>

        {/* === Tabs === */}
        <Section num="12" title="Tabs" desc="Segmented strip on a bottom hairline. 2px brand underline animates between active tabs. Optional count badges and a right-aligned slot.">
          <Stage>
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: 'recent',    label: 'Recent',    count: 14 },
                { value: 'scheduled', label: 'Scheduled', count: 3 },
                { value: 'archived',  label: 'Archived' },
              ]}
              rightSlot={<Button variant="ghost" icon={Glyph.download}>Export</Button>}
            />
            <div className="mt-4 text-caption text-ink-3">
              Active: <code className="font-mono text-micro">{tab}</code>
            </div>
          </Stage>
        </Section>

        {/* === ChipRow === */}
        <Section num="13" title="ChipRow" desc="Labelled row of single-select chips. Same visual contract as the filter drawer chips on History / Scheduled (h-8, brand-tint when active). Optional count badge.">
          <Stage>
            <ChipRow
              label="Verdict"
              value={chip}
              onChange={setChip}
              options={[
                { value: 'all',    label: 'All',             count: 24 },
                { value: 'clean',  label: 'Not rented',      count: 9 },
                { value: 'warn',   label: 'Possibly rented', count: 6 },
                { value: 'risk',   label: 'Rented',          count: 9 },
              ]}
            />
          </Stage>
        </Section>

        {/* === DateRangePicker === */}
        <Section num="14" title="DateRangePicker" desc="From / To date inputs with optional preset chips. Drops into a filter drawer with eyebrow label, or inline with the form label style.">
          <Stage>
            <div className="max-w-[420px]">
              <DateRangePicker
                label="Scanned between"
                value={range}
                onChange={setRange}
                presets={[
                  { id: '7d',  label: '7 d',  range: { from: '2026-05-18', to: '2026-05-25' } },
                  { id: '30d', label: '30 d', range: { from: '2026-04-25', to: '2026-05-25' } },
                  { id: '90d', label: '90 d', range: { from: '2026-02-24', to: '2026-05-25' } },
                ]}
              />
            </div>
          </Stage>
        </Section>

        {/* === DropdownMenu === */}
        <Section num="15" title="DropdownMenu" desc="Click-to-open menu of actions. Floating popover on desktop, bottom sheet on mobile. Items may include icons, hints, disabled or destructive flags.">
          <Stage>
            <Row label="Default · end">
              <DropdownMenu
                trigger={<Button icon={Glyph.download} iconRight={Glyph.arrowRight}>Export</Button>}
                title="Export report"
                items={[
                  { label: 'PDF certificate',  icon: <Icon name="pdf" size={16} />,    onClick: () => {}, hint: 'Stamped, downloadable' },
                  { label: 'CSV (filtered)',   icon: <Icon name="layers" size={16} />, onClick: () => {} },
                  { label: 'Share via email',  icon: <Icon name="mail" size={16} />,   onClick: () => {} },
                  { label: 'Delete scan',      icon: <Icon name="x" size={16} />,      onClick: () => {}, destructive: true },
                  { label: 'Coming soon',      onClick: () => {}, disabled: true },
                ]}
              />
            </Row>
            <Row label="Aligned · start">
              <DropdownMenu
                align="start"
                trigger={<Button variant="ghost">Filter ▾</Button>}
                items={[
                  { label: 'Verified',    onClick: () => {} },
                  { label: 'Unverified',  onClick: () => {} },
                ]}
              />
            </Row>
          </Stage>
        </Section>

        {/* === TableSkeleton === */}
        <Section num="16" title="TableSkeleton" desc="Loading placeholder used inside DataTable when loading=true. Stand-alone here for reference.">
          <Stage>
            <TableSkeleton
              columns={[
                { key: 'id',      width: '120px' },
                { key: 'address', width: '1fr' },
                { key: 'score',   width: '80px', align: 'right' },
                { key: 'when',    width: '120px', align: 'right' },
              ]}
              count={4}
            />
          </Stage>
        </Section>

        {/* === DataTable === */}
        <Section num="17" title="DataTable" desc="Single primitive behind every tabular surface. Quiet header, optional 2px leading-edge accent per row, table↔card switch at md. Loading and empty states built in.">
          <Stage>
            <div className="space-y-6">
              <div>
                <div className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mb-2">Default</div>
                <DataTable
                  rows={DEMO_ROWS}
                  rowKey={(r) => r.id}
                  leadingAccent={(r) => STATUS_ACCENT[r.status]}
                  onRowClick={() => {}}
                  columns={[
                    { key: 'id',      label: 'ID',       width: '110px', cell: (r) => <span className="font-mono text-micro text-ink-3">{r.id}</span> },
                    { key: 'address', label: 'Address',  width: '1fr',   primary: true, cell: (r) => (
                      <div>
                        <div className="text-body-sm" style={{ color: 'var(--ink-2)' }}>{r.address}</div>
                        <div className="text-caption text-ink-3">{r.city}</div>
                      </div>
                    ) },
                    { key: 'status',  label: 'Status',   width: '160px', cell: (r) => (
                      <Pill variant={r.status} dot>
                        {r.status === 'clean' ? 'Not rented' : r.status === 'warn' ? 'Possibly' : 'Rented'}
                      </Pill>
                    ) },
                    { key: 'score',   label: 'Score',    width: '80px',  align: 'right', cell: (r) => <span className="font-mono tabular-nums">{r.score}</span> },
                    { key: 'when',    label: 'Scanned',  width: '120px', align: 'right', hideBelow: 'md', cell: (r) => <span className="text-ink-3">{r.scanned}</span> },
                  ]}
                />
              </div>
              <div>
                <div className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mb-2">Loading</div>
                <DataTable
                  loading
                  rows={[]}
                  rowKey={(_r, i) => String(i)}
                  columns={[
                    { key: 'id',      label: 'ID',      width: '110px', cell: () => null },
                    { key: 'address', label: 'Address', width: '1fr',   primary: true, cell: () => null },
                    { key: 'status',  label: 'Status',  width: '160px', cell: () => null },
                    { key: 'score',   label: 'Score',   width: '80px',  align: 'right', cell: () => null },
                  ]}
                />
              </div>
              <div>
                <div className="text-micro text-ink-3 uppercase tracking-[0.14em] font-semibold mb-2">Empty</div>
                <DataTable
                  rows={[]}
                  rowKey={(_r, i) => String(i)}
                  empty={
                    <div className="py-12 text-center text-ink-3 text-body-sm">
                      No scans match the current filter.
                    </div>
                  }
                  columns={[
                    { key: 'id',      label: 'ID',      width: '110px', cell: () => null },
                    { key: 'address', label: 'Address', width: '1fr',   primary: true, cell: () => null },
                    { key: 'status',  label: 'Status',  width: '160px', cell: () => null },
                    { key: 'score',   label: 'Score',   width: '80px',  align: 'right', cell: () => null },
                  ]}
                />
              </div>
            </div>
          </Stage>
        </Section>

        {/* === MetricCard === */}
        <Section num="18" title="MetricCard" desc="One primitive for every KPI tile. Eyebrow label, dominant tabular numeral, optional sparkline + delta footer. `primary` paints the brand gradient; `accent` adds a verdict-tone dot.">
          <Stage>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard
                label="Scans this week"
                value="14"
                delta={{ dir: 'up', value: '+3' }}
                hint="vs last week"
                sparkline={[3, 5, 4, 6, 5, 7, 8]}
              />
              <MetricCard
                label="Avg confidence"
                value="0.87"
                delta={{ dir: 'down', value: '-0.04' }}
                hint="vs last week"
                sparkline={[0.9, 0.88, 0.85, 0.86, 0.87]}
                sparklineTone="down"
              />
              <MetricCard
                primary
                label="Compliance rate"
                value="92%"
                hint="last 30 days"
                icon={<Icon name="shield" size={14} />}
                sparkline={[88, 90, 89, 91, 92]}
              />
              <MetricCard
                label="Rented"
                value="9"
                accent="verdict-high"
                hint="of 24 scans"
                size="sm"
              />
            </div>
          </Stage>
        </Section>

        {/* === Modal === */}
        <Section num="19" title="Modal" desc="Portal-rendered dialog. Backdrop blur, ESC + outside-click close, focus trap, body-scroll lock. Header + body + footer slots.">
          <Stage>
            <Row label="Trigger">
              <Button variant="primary" onClick={() => setModalOpen(true)}>Open modal</Button>
            </Row>
            <Modal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Confirm scan"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" onClick={() => setModalOpen(false)}>Run scan</Button>
                </>
              }
            >
              <p className="font-sans text-body-sm text-ink-3 leading-relaxed m-0">
                We'll search every public short-term-rental listing within one mile of
                this address. Results typically take 8–12 seconds.
              </p>
            </Modal>
          </Stage>
        </Section>

        {/* === Drawer === */}
        <Section num="20" title="Drawer" desc="Right-anchored slide-in. Same chrome contract as Modal. 380px on desktop, full viewport below sm.">
          <Stage>
            <Row label="Trigger">
              <Button onClick={() => setDrawerOpen(true)}>Open drawer</Button>
            </Row>
            <Drawer
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              title="Filters"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setDrawerOpen(false)}>Clear</Button>
                  <Button variant="primary" onClick={() => setDrawerOpen(false)}>Done</Button>
                </>
              }
            >
              <div className="space-y-6">
                <ChipRow
                  label="Verdict"
                  value={chip}
                  onChange={setChip}
                  options={[
                    { value: 'all',   label: 'All',             count: 24 },
                    { value: 'clean', label: 'Not rented',      count: 9 },
                    { value: 'warn',  label: 'Possibly rented', count: 6 },
                    { value: 'risk',  label: 'Rented',          count: 9 },
                  ]}
                />
                <DateRangePicker
                  label="Scanned between"
                  value={range}
                  onChange={setRange}
                />
              </div>
            </Drawer>
          </Stage>
        </Section>

        {/* === ScreenEmpty === */}
        <Section num="21" title="ScreenEmpty" desc="Full-surface 'never had any data' block. Brand-soft icon badge, navy title, optional CTA. Distinct from DataTable.empty (filter returned zero).">
          <Stage>
            <ScreenEmpty
              icon="history"
              title="No scans yet"
              message="Run your first property scan from the home screen to see results here."
              actionLabel="Run a scan"
              onAction={() => {}}
            />
          </Stage>
        </Section>

        {/* === ScreenError === */}
        <Section num="22" title="ScreenError" desc="Full-surface failure block. Sibling anatomy to ScreenEmpty with error-soft badge and primary Retry.">
          <Stage>
            <ScreenError
              onRetry={() => {}}
              onBack={() => {}}
            />
          </Stage>
        </Section>

        {/* === CommandPalette === */}
        <Section num="23" title="CommandPalette" desc="Global ⌘K overlay, mounted once at the app root. Pub/sub store means any component can trigger it without prop-drilling. Body is CommandSearch in overlay mode (see §05).">
          <Stage>
            <Row label="Trigger">
              <Button onClick={() => openCommandPalette()}>Open ⌘K palette</Button>
              <span className="text-caption text-ink-3">
                Also bound to <code className="font-mono text-micro">⌘K</code> / <code className="font-mono text-micro">Ctrl+K</code> globally.
              </span>
            </Row>
          </Stage>
        </Section>
      </div>
    </div>
  );
}
