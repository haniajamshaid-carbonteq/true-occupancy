/* global React, ReactDOM, StaticSidebar, StaticTopbar, StaticHeader, StaticScanCard,
   StaticScoreCard, StaticWhyCard, StaticListings, buildSteps, Ico,
   useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakSlider */

const { useEffect, useState } = React;

const TWEAK_DEFAULTS = (() => {
  try { return JSON.parse(document.getElementById('tweak-defaults').textContent.replace(/\/\*EDITMODE-(BEGIN|END)\*\//g, '')); }
  catch (e) { return {}; }
})();

// Each screen is a 1440-wide, scaled-down preview frame
function Screen({ label, title, desc, scale = 0.62, dim = '1440 × 960', children }) {
  return (
    <div className="screen-wrap">
      <div className="screen-meta">
        <span className="label">{label}</span>
        <h3>{title}</h3>
        <span className="dim">{dim} · @{Math.round(scale * 100)}%</span>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div className="screen-frame" style={{ width: 1440 * scale + 2 }}>
        <div className="browser-bar">
          <div className="dots"><span /><span /><span /></div>
          <div className="url">trueoccupancy.app / scan / 1428-maplewood-dr</div>
        </div>
        <div style={{ width: 1440 * scale, height: 'auto', overflow: 'hidden' }}>
          <div className="screen-canvas" style={{ transform: `scale(${scale})`, width: 1440 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable screen layout
function FullScreen({ children, header, tweaks }) {
  const t = tweaks || {};
  return (
    <div className="app" style={t.showSidebar === false ? { gridTemplateColumns: '1fr' } : null}>
      {t.showSidebar !== false && <StaticSidebar />}
      <main className="main">
        <StaticTopbar showBreadcrumb={t.showBreadcrumb !== false} showActions={t.showTopActions !== false} />
        {header}
        <div className="res-2col">
          {children}
        </div>
      </main>
    </div>
  );
}

function buildHeaders(tweaks) {
  const t = tweaks || {};
  const common = {
    showSearch: t.showSearch !== false,
    showTags: t.showTags !== false,
    showSubtitle: !!t.showSubtitle,
    showTimestamp: t.showTimestamp !== false,
    showMapButton: t.showMapButton !== false,
  };
  return {
    scanning: <StaticHeader
      sub="We're cross-checking Airbnb, Vrbo, and Facebook Marketplace in real time. Results stream in below as each source responds."
      time='just now · 8:42 AM'
      {...common} />,
    done: <StaticHeader
      sub="Cross-check whether a property is being operated as a short-term rental on Airbnb, Vrbo, or Facebook Marketplace."
      time='completed · 8:42 AM'
      {...common} />,
  };
}

function SpecCard({ title, items }) {
  return (
    <div className="spec-card">
      <h4>{title}</h4>
      <ul>
        {items.map((it, i) => (
          <li key={i}>
            <span className="k">{it.k}</span>
            <span className="v" dangerouslySetInnerHTML={{ __html: it.v }} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const Tokens = () => (
  <>
    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '0 0 16px' }}>Color tokens</h3>
    <div className="token-row">
      {[
        ['Background',     '--bg',          '#F7F5F0'],
        ['Surface',        '--surface',     '#FFFFFF'],
        ['Surface 2',      '--surface-2',   '#FBF9F4'],
        ['Line',           '--line',        '#E8E3D8'],
        ['Ink',            '--ink',         '#1C1B17'],
        ['Ink 3',          '--ink-3',       '#76736A'],
        ['Brand',          '--brand',       '#0F8FB8'],
        ['Brand 2',        '--brand-2',     '#14B5A6'],
        ['Brand soft',     '--brand-soft',  '#E0F4F4'],
        ['Clean',          '--clean',       '#5B8A6A'],
        ['Warn',           '--warn',        '#C68A3C'],
        ['Risk',           '--risk',        '#C0533C'],
      ].map(([n, v, h]) => (
        <div className="token" key={v}>
          <div className="swatch" style={{ background: h }} />
          <div className="name">{n}</div>
          <div className="var">{v}</div>
          <div className="hex">{h}</div>
        </div>
      ))}
    </div>

    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '32px 0 16px' }}>Typography</h3>
    <div style={{ marginBottom: 18, fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
      Four pairings to explore — switch via the <strong style={{ color: 'var(--ink)' }}>Tweaks panel → Typography</strong>. The active pairing drives <code style={{ fontFamily: 'var(--mono)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--line)' }}>--serif / --sans / --mono</code> and reflows every screen below.
    </div>
    <div className="type-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {[
        { id: 'editorial', name: 'A · Editorial', desc: 'Current — Instrument Serif + Geist + Geist Mono. Editorial polish, technical body.', serif: '"Instrument Serif", Georgia, serif', sans: '"Geist", system-ui, sans-serif', mono: '"Geist Mono", ui-monospace, monospace' },
        { id: 'institutional', name: 'B · Institutional', desc: 'IBM Plex triplet. Compliance / audit-grade. Subtle technical edge from the slab serifs.', serif: '"IBM Plex Serif", Georgia, serif', sans: '"IBM Plex Sans", system-ui, sans-serif', mono: '"IBM Plex Mono", ui-monospace, monospace' },
        { id: 'editorial-warm', name: 'C · Editorial Warm', desc: 'Newsreader + Inter + JetBrains Mono. Warmer reading experience, all-free.', serif: '"Newsreader", Georgia, serif', sans: '"Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
        { id: 'brand-forward', name: 'D · Brand-forward', desc: 'Recoleta + General Sans. Friendlier, matches the curved Halcyon mark.', serif: '"Recoleta", Georgia, serif', sans: '"General Sans", "Inter", system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace' },
      ].map(p => (
        <div className="type-card" key={p.id}>
          <div className="meta"><b>{p.name}</b><span>{p.desc}</span></div>
          <div className="preview" style={{ fontFamily: p.serif, fontSize: 44, lineHeight: 1.05, letterSpacing: '-0.015em', marginBottom: 12 }}>
            Confidence <em style={{ color: 'var(--brand)', fontStyle: 'italic' }}>87</em>/100
          </div>
          <div className="preview" style={{ fontFamily: p.sans, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)', marginBottom: 8 }}>
            Strong evidence this property is operating as a short-term rental across multiple platforms.
          </div>
          <div className="preview" style={{ fontFamily: p.mono, fontSize: 12, color: 'var(--ink-3)' }}>
            parcel-9648-23-7104 · 35.6428°N · airbnb.com
          </div>
          <div className="meta" style={{ marginTop: 14, fontSize: 11 }}>
            <span style={{ fontFamily: p.serif }}>serif: {p.serif.split(',')[0].replace(/"/g, '')}</span>
            <span style={{ fontFamily: p.sans }}>sans: {p.sans.split(',')[0].replace(/"/g, '')}</span>
            <span style={{ fontFamily: p.mono }}>mono: {p.mono.split(',')[0].replace(/"/g, '')}</span>
          </div>
        </div>
      ))}
    </div>

    <h3 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 400, margin: '32px 0 16px' }}>Spacing &amp; radius</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div className="spec-card">
        <h4>Spacing scale (px)</h4>
        <div className="spacing-row">
          {[4, 8, 12, 16, 20, 24, 28, 32, 48].map(n => (
            <div className="spacing-item" key={n}>
              <div className="spacing-block" style={{ width: n, height: n }} />
              <div className="lbl">{n}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="spec-card">
        <h4>Border radius</h4>
        <div className="radius-row">
          {[
            ['sm', 8, '--r-sm'],
            ['md', 12, '--r-md'],
            ['lg', 18, '--r-lg'],
            ['xl', 28, '--r-xl'],
            ['pill', 999, 'pill'],
          ].map(([n, r, v]) => (
            <div className="radius-item" key={n}>
              <div className="radius-block" style={{ borderRadius: r }} />
              <div className="lbl" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>{n} · {r === 999 ? '999px' : r + 'px'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
);

const Components = () => (
  <>
    <div className="comp-strip">
      <div className="comp-card">
        <div className="preview">
          <button className="btn primary" style={{ pointerEvents: 'none' }}>Run scan</button>
          <button className="btn" style={{ pointerEvents: 'none' }}>Share</button>
          <button className="btn ghost" style={{ pointerEvents: 'none' }}>Replay</button>
        </div>
        <h5>Buttons</h5>
        <p>Three variants: primary (brand fill), secondary (outline), ghost (transparent).</p>
        <div className="specs">
          <span>height: 36px · padding: 0 14px</span>
          <span>radius: 8px · font: 13/500</span>
          <span>icon size: 14px · gap: 8px</span>
        </div>
      </div>
      <div className="comp-card">
        <div className="preview" style={{ flexDirection: 'column' }}>
          <span className="pill brand"><span className="dot" />Checking</span>
          <span className="pill clean">Clear</span>
          <span className="pill warn">Match</span>
          <span className="pill risk">High match</span>
        </div>
        <h5>Status pills</h5>
        <p>Risk-coded status indicators. Always paired with a soft-tinted background.</p>
        <div className="specs">
          <span>height: 24px · padding: 0 10px</span>
          <span>radius: 999px · font-mono 11/500/uppercase</span>
        </div>
      </div>
      <div className="comp-card">
        <div className="preview">
          <div className="search-wrap" style={{ width: '100%', pointerEvents: 'none' }}>
            <span className="icon"><Ico name="search" size={18} /></span>
            <input defaultValue="1428 Maplewood Drive" readOnly />
          </div>
        </div>
        <h5>Search input</h5>
        <p>Inline action layout — icon, input, secondary, primary CTA in a single rounded shell.</p>
        <div className="specs">
          <span>radius: 18px · padding: 8px</span>
          <span>focus: brand ring 4px / 8% alpha</span>
        </div>
      </div>
    </div>

    <div className="comp-strip">
      <div className="comp-card">
        <div className="preview" style={{ background: 'var(--surface-2)', padding: 16 }}>
          <div className="scan-step status-running" style={{ width: '100%' }}>
            <div className="scan-step-icon"><span className="cs-spin" /></div>
            <div className="scan-step-body">
              <div className="scan-step-label">Searching Airbnb</div>
              <div className="scan-step-sub">airbnb.com · 1.0 mi radius</div>
            </div>
            <div className="scan-step-tag"><span className="pill brand"><span className="dot" />Checking</span></div>
          </div>
        </div>
        <h5>Scan step row</h5>
        <p>Grid: <code>32px · 1fr · auto</code>. States: pending (dashed ring, 50% opacity) · running (raised surface, brand spinner) · done (filled icon, kind-tinted).</p>
        <div className="specs">
          <span>row padding: 14px 12px</span>
          <span>icon: 24px circle (done) / 16px ring (running)</span>
        </div>
      </div>
      <div className="comp-card">
        <div className="preview" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="risk-badge risk"><span className="glyph"><Ico name="alert" size={13} /></span>High Risk · Red Flag</span>
          <span className="risk-badge warn"><span className="glyph"><Ico name="info" size={13} /></span>Medium Risk · Questionable</span>
          <span className="risk-badge clean"><span className="glyph"><Ico name="check" size={13} /></span>Low Risk · Clean</span>
        </div>
        <h5>Risk badge</h5>
        <p>Three thresholds: Low (≤30) · Medium (31–69) · High (≥70). Background uses the kind's <code>-soft</code> token; glyph uses solid.</p>
        <div className="specs">
          <span>radius: 999px · padding: 6 12 6 8</span>
          <span>glyph: 22px circle · white icon</span>
        </div>
      </div>
      <div className="comp-card">
        <div className="preview">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <span className="match-pill high">High match</span>
            <span className="match-pill med">Med match</span>
            <span className="match-pill low">Low match</span>
          </div>
        </div>
        <h5>Match pill</h5>
        <p>Per-listing similarity strength surfaced on each result row.</p>
        <div className="specs">
          <span>font-mono 10.5px · 2 8 padding</span>
          <span>high → risk soft · med → warn soft · low → neutral</span>
        </div>
      </div>
    </div>
  </>
);

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const headers = buildHeaders(tweaks);
  const scale = tweaks.screenScale || 0.62;
  React.useEffect(() => {
    document.body.dataset.typePairing = tweaks.typePairing || 'editorial';
  }, [tweaks.typePairing]);
  return (
    <div>
      <TweaksPanel title="Tweaks">
        <TweakSection title="Result mode" subtitle="Investigator gets a 0–100 score and signal weights. Resident gets a yes/no answer in plain language.">
          <TweakRadio label="Audience" value={tweaks.viewMode || 'investigator'}
            options={['investigator', 'resident']}
            onChange={v => setTweak('viewMode', v)} />
        </TweakSection>
        <TweakSection title="Page header" subtitle="What appears at the top of every screen.">
          <TweakToggle label="Show subtitle / description" value={!!tweaks.showSubtitle} onChange={v => setTweak('showSubtitle', v)} />
          <TweakToggle label="Show timestamp" value={tweaks.showTimestamp !== false} onChange={v => setTweak('showTimestamp', v)} />
          <TweakToggle label="Show search bar" value={tweaks.showSearch !== false} onChange={v => setTweak('showSearch', v)} />
          <TweakToggle label="Show map button (in search)" value={tweaks.showMapButton !== false} onChange={v => setTweak('showMapButton', v)} />
          <TweakToggle label="Show property tags" value={tweaks.showTags !== false} onChange={v => setTweak('showTags', v)} />
        </TweakSection>
        <TweakSection title="App chrome">
          <TweakToggle label="Show sidebar" value={tweaks.showSidebar !== false} onChange={v => setTweak('showSidebar', v)} />
          <TweakToggle label="Show breadcrumb" value={tweaks.showBreadcrumb !== false} onChange={v => setTweak('showBreadcrumb', v)} />
          <TweakToggle label="Show top actions (Share / Export)" value={tweaks.showTopActions !== false} onChange={v => setTweak('showTopActions', v)} />
        </TweakSection>
        <TweakSection title="Typography" subtitle="Try alternate font pairings.">
          <TweakRadio label="Pairing" value={tweaks.typePairing || 'editorial'}
            options={['editorial', 'institutional', 'editorial-warm', 'brand-forward']}
            onChange={v => setTweak('typePairing', v)} />
        </TweakSection>
        <TweakSection title="Preview">
          <TweakSlider label="Screen scale" min={0.4} max={0.85} step={0.01} value={scale} unit="" onChange={v => setTweak('screenScale', v)} />
        </TweakSection>
      </TweaksPanel>

      <div className="nav-anchor">
        <span className="brand">True Occupancy</span>
        <a href="#tokens">Tokens</a>
        <a href="#components">Components</a>
        <a href="#flow">User flow</a>
        <a href="#screen-1">Scan · start</a>
        <a href="#screen-2">Scan · mid</a>
        <a href="#screen-3">Result · clean</a>
        <a href="#screen-4">Result · medium</a>
        <a href="#screen-5">Result · high</a>
        <a href="#screen-6">Why this score</a>
      </div>

      <div className="spec-shell">
        <header className="spec-header">
          <div className="eyebrow">Design specification · v1.0 · May 2026</div>
          <h1>True <em>Occupancy</em> <br />— developer handoff</h1>
          <p>Annotated screen specs, design tokens, and component definitions for the property occupancy investigation tool. Each screen is shown at 1440 × 960 (the canonical desktop frame). All measurements are in pixels and refer to CSS variables defined in <code style={{ fontFamily: 'var(--mono)', background: 'var(--surface-2)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--line)' }}>:root</code>.</p>
          <div className="spec-meta">
            <div><strong>Target:</strong> Desktop web · ≥1280px</div>
            <div><strong>Audience:</strong> Compliance / fraud investigators</div>
            <div><strong>Stack:</strong> React 18 · system font stack</div>
            <div><strong>Live prototype:</strong> <a href="true-occupancy.html" style={{ color: 'var(--brand)' }}>true-occupancy.html</a></div>
          </div>
        </header>

        {/* ─── 1. Foundations ─── */}
        <section className="spec-section" id="tokens">
          <div className="spec-section-head">
            <span className="num">01</span>
            <h2>Foundations</h2>
            <div className="desc">Design tokens — colors, typography, spacing, radii. All other specs reference these.</div>
          </div>
          <Tokens />
        </section>

        {/* ─── 2. Components ─── */}
        <section className="spec-section" id="components">
          <div className="spec-section-head">
            <span className="num">02</span>
            <h2>Core components</h2>
            <div className="desc">Building blocks used across every screen. Specs include sizing, padding, and state behavior.</div>
          </div>
          <Components />
        </section>

        {/* ─── 3. User flow ─── */}
        <section className="spec-section" id="flow">
          <div className="spec-section-head">
            <span className="num">03</span>
            <h2>User flow</h2>
            <div className="desc">A user enters a property address, watches the live scan, and reviews the resulting confidence assessment.</div>
          </div>
          <div className="spec-card">
            <ul>
              <li><span className="k">Step 1</span><span className="v"><strong>Search.</strong> User enters or pastes property address into the persistent search bar. Address is geocoded server-side.</span></li>
              <li><span className="k">Step 2</span><span className="v"><strong>Live scan.</strong> 5 sequential checks run (geocode → 3 platforms in parallel → compute score). Each step posts back within ≤1s.</span></li>
              <li><span className="k">Step 3</span><span className="v"><strong>Auto-route to result.</strong> Once the final step (compute score) lands, the scan UI is replaced by a dedicated result screen — no manual click needed.</span></li>
              <li><span className="k">Step 4</span><span className="v"><strong>Review confidence + property.</strong> Result page leads with the confidence score, then surfaces property specs (beds, baths, area, lot, year, type, description) below it. Search bar persists at top.</span></li>
              <li><span className="k">Step 5</span><span className="v"><strong>Investigate.</strong> User expands "Why this score?" to inspect contributing signals, opens listings to verify matches, exports report.</span></li>
            </ul>
          </div>
        </section>

        {/* ─── 4. Screens ─── */}
        <section className="spec-section">
          <div className="spec-section-head">
            <span className="num">04</span>
            <h2>Screens</h2>
            <div className="desc">Each screen below is a pixel-accurate mock. Below each screen is a spec card listing layout, copy, behavior, and acceptance criteria.</div>
          </div>

          <div id="screen-1">
            <Screen scale={scale} label="Screen 01" title="Live scan · just started"
              desc="Initial scan state — geocoding step is running, all platform checks queued. Page header reflects the active state, search bar shows the parsed address.">
              <FullScreen header={headers.scanning} tweaks={tweaks}>
                <StaticScanCard steps={buildSteps('high', 'start')} scanning={true} progress={8} />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Layout" items={[
                { k: 'Frame', v: '1440 × 960 desktop · 248px sidebar + flexible main' },
                { k: 'Main padding', v: '<code>32px 48px 80px</code>' },
                { k: 'Section gap', v: '<code>20px</code> between cards in <code>.res-2col</code>' },
                { k: 'Header', v: 'H1 + subtitle (left) · scan-started timestamp (right)' },
              ]} />
              <SpecCard title="Behavior" items={[
                { k: 'On mount', v: 'Auto-runs scan animation. Steps fire at <code>start</code> ms (running) and <code>end</code> ms (done).' },
                { k: 'Step states', v: 'pending · running · done — see Components §02' },
                { k: 'Progress bar', v: 'Fills proportionally to <code>(done + running × 0.5) / total</code>' },
                { k: 'Live indicator', v: 'Pulsing 8px green dot · 1.6s loop' },
                { k: 'Acceptance', v: '6.2 — UI clearly distinguishes "not yet checked" (queued, dashed ring) from "no results" (filled green ✓ done state)' },
              ]} />
            </div>
          </div>

          <div id="screen-2">
            <Screen scale={scale} label="Screen 02" title="Live scan · mid-flight"
              desc="Geocoding and Airbnb completed (matches found, warn-tinted). Vrbo and Facebook Marketplace are running in parallel. Computing score is still queued.">
              <FullScreen header={headers.scanning} tweaks={tweaks}>
                <StaticScanCard steps={buildSteps('high', 'mid')} scanning={true} progress={50} />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Visual diff vs. screen 01" items={[
                { k: 'Step 1, 2', v: 'Status → done · icon swaps to filled circle (kind-colored)' },
                { k: 'Step 3, 4', v: 'Status → running · raised white surface + brand spinner' },
                { k: 'Step 5', v: 'Still pending · 50% opacity, dashed ring' },
                { k: 'Progress', v: '50% · bar fill animates with 400ms ease' },
              ]} />
              <SpecCard title="Acceptance criteria" items={[
                { k: '6.2 (a)', v: 'Each platform shows one of: Loading · Success · No Match · Error' },
                { k: '6.2 (b)', v: 'Results appear within &lt;1s per source' },
                { k: '6.2 (c)', v: 'Parallel checks visible — Vrbo & FB both spinning simultaneously' },
              ]} />
            </div>
          </div>

          <div id="screen-3">
            <Screen scale={scale} label="Screen 03" title="Result · clean (low risk)"
              desc="After the scan completes, the user lands on the result screen. Confidence score sits at the top, then a map + property specs panel, then explainability and listings.">
              <FullScreen header={headers.done} tweaks={tweaks}>
                <StaticScoreCard scenario="low" mode={tweaks.viewMode || 'investigator'} />
                <StaticPropertyOverview />
                <StaticWhyCard scenario="low" />
                <StaticListings scenario="low" />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Result page composition" items={[
                { k: 'Order', v: '<code>1.</code> Header (search retained) · <code>2.</code> Confidence score · <code>3.</code> Property specs · <code>4.</code> Why this score · <code>5.</code> Listings' },
                { k: 'Navigation', v: 'Auto-pushed once final scan step (compute score) completes — replaces scan view' },
                { k: 'Search bar', v: 'Persists at top of result screen so user can re-scan a different address without backing out' },
                { k: 'No scan card', v: 'Live scan UI disappears on completion — only confidence + property data remain' },
              ]} />
              <SpecCard title="Property overview panel" items={[
                { k: 'Layout', v: 'Side-by-side · <code>1.05fr · 1fr</code> grid · 1px divider · combined card radius 18px' },
                { k: 'Map (left)', v: 'Leaflet base tiles · zoom controls top-left · property pin · info popup with address + bed/bath' },
                { k: 'Specs (right)', v: 'Title row (address + city) · property-type pill · 5-col specs grid · description below' },
                { k: 'Map height', v: 'min 480px · matches specs panel height · responsive' },
                { k: 'Pin', v: '36 × 48 brand-color teardrop · white inner dot · drop-shadow' },
              ]} />
              <SpecCard title="Score card" items={[
                { k: 'Layout', v: '<code>380px · 1fr</code> grid · divider on column 1' },
                { k: 'Hero gradient', v: 'top: clean-soft → surface (80% stop) · varies by risk band' },
                { k: 'Numeral', v: 'Instrument Serif · 128px · -4% tracking' },
                { k: 'Animation', v: '0 → final score · 900ms · cubic ease-out' },
              ]} />
              <SpecCard title="Listings panel · empty state" items={[
                { k: 'Group', v: 'Each platform rendered as collapsed accordion · "No matches" pill' },
                { k: 'Empty body', v: 'Dashed-bordered card · italic ink-3 copy explaining sweep radius' },
                { k: 'Acceptance', v: '6.3 — empty states shown per platform if no matches' },
              ]} />
            </div>
          </div>

          <div id="screen-4">
            <Screen scale={scale} label="Screen 04" title="Result · questionable (medium risk)"
              desc="One partial Airbnb match, no Vrbo, one excluded FB post. Score 54, risk = Medium · Questionable. Map + property specs panel sits directly under the score.">
              <FullScreen header={headers.done} tweaks={tweaks}>
                <StaticScoreCard scenario="medium" mode={tweaks.viewMode || 'investigator'} />
                <StaticPropertyOverview />
                <StaticWhyCard scenario="medium" />
                <StaticListings scenario="medium" />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Mixed-state platforms" items={[
                { k: 'Airbnb', v: 'Open accordion · 1 listing · "Med match" pill' },
                { k: 'Vrbo', v: 'Collapsed · "No matches" clean pill · empty body' },
                { k: 'Facebook MP', v: 'Open · 1 listing · "Low match" pill (excluded from risk math)' },
              ]} />
              <SpecCard title="Why this score" items={[
                { k: 'Auto-open', v: 'Card opens by default on result reveal' },
                { k: 'Columns', v: '2-col · negative (left) / positive (right)' },
                { k: 'Signal bar', v: '6px high · width = signal strength %' },
                { k: 'Acceptance', v: '6.4 — at least 3 contributing factors shown · categorized pos / neg' },
              ]} />
            </div>
          </div>

          <div id="screen-5">
            <Screen scale={scale} label="Screen 05" title="Result · red flag (high risk)"
              desc="Active listings on all three platforms. Score 87, risk = High · Red Flag. Hero uses risk-soft tint, all listing accordions open by default. Map + specs anchor the page below the score.">
              <FullScreen header={headers.done} tweaks={tweaks}>
                <StaticScoreCard scenario="high" mode={tweaks.viewMode || 'investigator'} />
                <StaticPropertyOverview />
                <StaticWhyCard scenario="high" />
                <StaticListings scenario="high" />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Listing card spec" items={[
                { k: 'Grid', v: '<code>56px · 1fr · auto</code> · 12px gap' },
                { k: 'Thumb', v: '56 × 56 · radius 8 · gradient placeholder when no image' },
                { k: 'Title', v: '13.5px / 500 · 2-line clamp · ellipsis' },
                { k: 'Meta row', v: 'Mono 11px · beds · baths · price · rating' },
                { k: 'Match pill', v: 'High → risk-soft · Med → warn-soft · Low → neutral' },
                { k: 'External link', v: '"View on {Platform}" · 11px ink-4 · external icon' },
              ]} />
              <SpecCard title="Acceptance criteria" items={[
                { k: '6.3 (a)', v: 'Listings grouped by platform · header shows match count' },
                { k: '6.3 (b)', v: 'Each listing shows title, beds/baths, match strength, external link' },
                { k: '6.3 (c)', v: '≥3 platforms supported (Airbnb, Vrbo, Facebook Marketplace)' },
                { k: '6.4 (a)', v: 'Score displayed with risk label (Low/Medium/High)' },
              ]} />
            </div>
          </div>

          <div id="screen-6">
            <Screen scale={scale} label="Screen 06" title="Why this score · expanded"
              desc="Detail view of the explainability card. Negative signals raise risk (left), positive signals lower it (right). Each factor shows a strength bar and a numeric weight contribution.">
              <FullScreen header={headers.done} tweaks={tweaks}>
                <StaticScoreCard scenario="high" mode={tweaks.viewMode || 'investigator'} />
                <StaticWhyCard scenario="high" open={true} />
              </FullScreen>
            </Screen>
            <div className="spec-grid">
              <SpecCard title="Factor row" items={[
                { k: 'Grid', v: '<code>28px · 1fr · auto</code> · 12px gap' },
                { k: 'Icon tile', v: '28 × 28 · radius 8 · trend-up (neg) / trend-down (pos)' },
                { k: 'Title', v: '14px / 500 · max 1 line · then 13px / ink-3 description' },
                { k: 'Signal bar', v: '6px high · 6px top margin · neg-color or pos-color fill' },
                { k: 'Weight chip', v: 'Mono 11px · soft kind-tinted bg · sign-prefixed (+/−)' },
              ]} />
              <SpecCard title="Acceptance criteria" items={[
                { k: '6.4 (a)', v: 'Risk label visible above breakdown · matches score band' },
                { k: '6.4 (b)', v: 'Section is expandable (click header to collapse)' },
                { k: '6.4 (c)', v: '≥3 contributing factors displayed when available' },
                { k: '6.4 (d)', v: 'Categorized as Positive · Negative signals' },
                { k: '6.4 (e)', v: 'Score and signal weights update dynamically as new data arrives' },
              ]} />
            </div>
          </div>
        </section>

        {/* ─── 5. Notes ─── */}
        <section className="spec-section">
          <div className="spec-section-head">
            <span className="num">05</span>
            <h2>Implementation notes</h2>
            <div className="desc">Things a developer should not have to guess.</div>
          </div>
          <div className="spec-grid">
            <SpecCard title="Animation" items={[
              { k: 'Score reveal', v: '900ms · cubic ease-out · raf-driven counter' },
              { k: 'Step transition', v: 'pending → running → done · CSS background + opacity 250ms' },
              { k: 'Progress bar', v: 'width transition 400ms ease' },
              { k: 'Spinner', v: '0.8s linear · border-top transparent technique' },
              { k: 'Pulse dot', v: 'box-shadow keyframe · 1.6s ease infinite' },
            ]} />
            <SpecCard title="Data contract" items={[
              { k: 'Scan event', v: '<code>{ id, label, status: pending|running|done, kind: ok|warn|err, result }</code>' },
              { k: 'Listing', v: '<code>{ title, beds, baths, price, rating, reviews, match: high|med|low, url }</code>' },
              { k: 'Factor', v: '<code>{ title, desc, weight: signed string, signal: 0..100, kind: pos|neg }</code>' },
              { k: 'Risk', v: '<code>{ score: 0..100, label, kind: clean|warn|risk, summary }</code>' },
            ]} />
            <SpecCard title="Accessibility" items={[
              { k: 'Color', v: 'All risk states paired with iconography (✓ / ⚠ / ! ) · never color alone' },
              { k: 'Focus', v: 'Search input → 4px brand ring · 8% alpha' },
              { k: 'Labels', v: 'All status pills include readable text (not just dots)' },
              { k: 'Reduced motion', v: 'Recommend honoring <code>prefers-reduced-motion</code> by skipping the score counter and pulse' },
            ]} />
            <SpecCard title="Responsive" items={[
              { k: '≥1100px', v: 'Score card 380 · 1fr · why-card 2-col' },
              { k: '&lt;1100px', v: 'Score card stacks · why-card 1-col · platforms 1-col' },
              { k: '&lt;900px', v: 'Sidebar collapses to icon rail (TBD — out of v1 scope)' },
            ]} />
          </div>
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
