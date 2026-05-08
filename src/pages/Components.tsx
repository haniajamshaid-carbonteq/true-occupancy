/* global React, Button, Pill, Card, RiskBadge, SearchBar, Avatar, Tag */
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
        <span className="font-mono text-[13px] text-ink-4">{num}</span>
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
      <div className="font-mono text-[11px] uppercase tracking-wider text-ink-4">{label}</div>
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

// ---- the page ----
function ComponentsPage() {
  const [query, setQuery] = React.useState('');

  return (
    <div className="min-h-screen bg-bg text-ink font-sans">
      {/* page header */}
      <header className="px-20 pt-16 pb-12 max-w-[1100px]">
        <div className="font-mono text-xs uppercase tracking-widest text-brand mb-3">UI Library</div>
        <h1 className="font-sans text-5xl font-bold leading-[1.05] tracking-[-0.005em] m-0 mb-4" style={{ color: 'var(--navy)' }}>
          Components <span style={{ color: 'var(--brand-deep)' }}>showcase.</span>
        </h1>
        <p className="text-[17px] text-ink-2 leading-relaxed m-0 max-w-[60ch]">
          Every primitive in <code className="font-mono text-sm bg-surface-2 px-1.5 py-0.5 rounded border border-line">src/components/ui/</code>, with every variant. Use this page to visually QA against the spec in <code className="font-mono text-sm bg-surface-2 px-1.5 py-0.5 rounded border border-line">design-spec.html</code>.
        </p>
      </header>

      <div className="px-20 pb-32 max-w-[1100px]">
        {/* === Button === */}
        <Section num="01" title="Button" desc="36px tall, 8px radius, 13/500 sans. Three variants share padding and shape; only color and border change.">
          <Stage>
            <Row label="Primary">
              <Button variant="primary">Run scan</Button>
              <Button variant="primary" icon={Glyph.search}>Run scan</Button>
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
        <Section num="02" title="Pill" desc="24px tall, fully rounded. Mono 11/500 caps with .04em tracking. Status variants drop the border.">
          <Stage>
            <Row label="Default">
              <Pill>Active</Pill>
              <Pill dot>Active</Pill>
              <Pill>1924 sqft</Pill>
            </Row>
            <Row label="Clean">
              <Pill variant="clean">No findings</Pill>
              <Pill variant="clean" dot>Verified</Pill>
            </Row>
            <Row label="Warn">
              <Pill variant="warn">Possible match</Pill>
              <Pill variant="warn" dot>Review</Pill>
            </Row>
            <Row label="Risk">
              <Pill variant="risk">Red flag</Pill>
              <Pill variant="risk" dot>3 platforms</Pill>
            </Row>
            <Row label="Brand">
              <Pill variant="brand">Live scan</Pill>
              <Pill variant="brand" dot>Beta</Pill>
            </Row>
          </Stage>
        </Section>

        {/* === Card === */}
        <Section num="03" title="Card" desc="Surface + line + 18px radius + shadow-sm. Edge-to-edge by default; opt into padding via the prop.">
          <div className="grid grid-cols-3 gap-5">
            <Card padded>
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3 mb-2">Default</div>
              <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Padded card</div>
              <p className="text-[13.5px] text-ink-3 leading-relaxed mt-2 mb-0">
                Use <code className="font-mono text-xs">padded</code> to get inset content.
              </p>
            </Card>
            <Card>
              <div className="h-20 bg-gradient-to-b from-brand-soft to-surface" />
              <div className="p-5">
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3 mb-2">Edge-to-edge</div>
                <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Bleed surface</div>
                <p className="text-[13.5px] text-ink-3 leading-relaxed mt-2 mb-0">
                  No padding so the gradient header reaches the border.
                </p>
              </div>
            </Card>
            <Card flat padded>
              <div className="font-mono text-[11px] uppercase tracking-wider text-ink-3 mb-2">Flat</div>
              <div className="font-sans text-2xl font-bold" style={{ color: 'var(--navy)' }}>Nested</div>
              <p className="text-[13.5px] text-ink-3 leading-relaxed mt-2 mb-0">
                Drops the shadow when nested inside another card.
              </p>
            </Card>
          </div>
        </Section>

        {/* === RiskBadge === */}
        <Section num="04" title="RiskBadge" desc="Verdict pill with a 22×22 circular glyph. Background is the soft tone; glyph fills with the solid status color.">
          <Stage>
            <Row label="Clean">
              <RiskBadge level="clean" glyph={Glyph.check}>Not rented · High confidence</RiskBadge>
            </Row>
            <Row label="Warn">
              <RiskBadge level="warn" glyph={Glyph.alert}>Possibly rented · Medium confidence</RiskBadge>
            </Row>
            <Row label="Risk">
              <RiskBadge level="risk" glyph={Glyph.x}>Rented · High confidence</RiskBadge>
            </Row>
          </Stage>
        </Section>

        {/* === SearchBar === */}
        <Section num="05" title="SearchBar" desc="Card-shaped wrapper around a borderless input. 36px icon gutter, 16px input. Trailing slot for a Button.">
          <div className="space-y-5">
            <SearchBar
              icon={Glyph.search}
              placeholder="Search by address, parcel, or owner…"
              value={query}
              onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
            <SearchBar
              icon={Glyph.search}
              placeholder="With a trailing action…"
              trailing={<Button variant="primary">Scan</Button>}
            />
            <SearchBar
              placeholder="No icon — bare input variant"
            />
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

        {/* === Tag === */}
        <Section num="07" title="Tag" desc="Quieter than a Pill. Mono 11.5, surface-2 background, optional 12px leading icon at .7 opacity.">
          <Stage>
            <Row label="Text only">
              <Tag>R-1 Single Family</Tag>
              <Tag>Asheville, NC</Tag>
              <Tag>1930</Tag>
            </Row>
            <Row label="With icon">
              <Tag icon={Glyph.bed}>3 bed · 2 bath</Tag>
              <Tag icon={Glyph.pin}>1428 Maplewood Dr</Tag>
              <Tag icon={Glyph.check}>Verified parcel</Tag>
            </Row>
          </Stage>
        </Section>
      </div>
    </div>
  );
}
