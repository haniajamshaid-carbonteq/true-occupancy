/* Reusable static screen mocks (non-interactive copies of the live UI),
 * used inside the design spec canvas.  Each component renders at the
 * same dimensions as the production screen (1440 x ~960). */

/* global React, Ico, PROPERTY, PLATFORMS, SCENARIOS */

function StaticSidebar() {
  return (
    <aside className="sidebar" style={{ height: '100%', position: 'static' }}>
      <div className="logo">
        <div className="mark"><img src="halcyon-mark-v2.png" alt="Halcyon" /></div>
        <div className="product-name">
          True <em>Occupancy</em>
          <span className="tag">by Halcyon</span>
        </div>
      </div>
      <div className="nav">
        <div className="nav-section">Workspace</div>
        <div className="nav-item active"><Ico name="search" /> New scan</div>
      </div>
      <div className="sidebar-footer">
        <div className="avatar">JM</div>
        <div className="avatar-meta">
          <div className="name">J. Marlow</div>
          <div className="role">Code Compliance · Asheville</div>
        </div>
      </div>
    </aside>
  );
}

function StaticTopbar({ showBreadcrumb = true, showActions = true }) {
  return (
    <div className="topbar">
      {showBreadcrumb ? (
        <div className="breadcrumb">
          <span>Investigations</span><span className="sep">/</span>
          <span>Asheville · Active</span><span className="sep">/</span>
          <span className="current">1428 Maplewood Drive</span>
        </div>
      ) : <div />}
      {showActions && (
        <div className="topbar-actions">
          <button className="btn"><Ico name="share" /> Share</button>
          <button className="btn primary"><Ico name="pdf" /> Export report</button>
        </div>
      )}
    </div>
  );
}

function StaticHeader({ time, sub, showSearch = true, showTags = true, showSubtitle = false, showTimestamp = true, showMapButton = true }) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">True Occupancy</h1>
          {showSubtitle && sub && <p className="page-sub">{sub}</p>}
        </div>
        {showTimestamp && (
          <div style={{ textAlign: 'right' }}>
            <div className="score-label" style={{ marginBottom: 4 }}>Scan {time === 'just now · 8:42 AM' ? 'started' : 'completed'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>{time}</div>
          </div>
        )}
      </div>
      {showSearch && (
        <div className="search-wrap">
          <span className="icon"><Ico name="search" size={18} /></span>
          <input defaultValue={PROPERTY.address} readOnly />
          {showMapButton && <button className="btn ghost" tabIndex={-1}><Ico name="pin" /> Map</button>}
          <button className="btn primary" tabIndex={-1}>Run scan</button>
        </div>
      )}
      {showTags && (
        <div className="tag-row">
          <span className="tag"><Ico name="pin" />Asheville, NC · 28804</span>
          <span className="tag"><Ico name="square" />Parcel {PROPERTY.parcel}</span>
          <span className="tag"><Ico name="shield" />Zoning {PROPERTY.zoning}</span>
          <span className="tag"><Ico name="cal" />Permit · none on file</span>
        </div>
      )}
    </>
  );
}

// Static scan card — pass per-step status to render any frame.
function StaticScanCard({ steps, scanning, progress }) {
  return (
    <div className="card scan-card">
      <div className="scan-head">
        <div style={{ flex: 1 }}>
          <h3>Live scan</h3>
          <div className="scan-progress">
            <div className="bar"><div className="bar-fill" style={{ width: progress + '%' }} /></div>
            <div className="pct">{progress}%</div>
          </div>
        </div>
        <div className="meta">
          {scanning
            ? <><span className="live-dot" /> live</>
            : <span style={{ color: 'var(--clean)' }}>● complete</span>}
          <span>·</span>
          <span>{steps.filter(s => s.status === 'done').length}/{steps.length} steps</span>
        </div>
      </div>
      <div className="scan-checklist">
        {steps.map((s, i) => (
          <div key={i} className={`scan-step status-${s.status} kind-${s.kind || ''}`}>
            <div className="scan-step-icon">
              {s.status === 'pending' && <span className="cs-pending" />}
              {s.status === 'running' && <span className="cs-spin" />}
              {s.status === 'done' && (
                s.kind === 'warn'
                  ? <span className="cs-icon cs-warn"><Ico name="alert" size={13} /></span>
                  : <span className="cs-icon cs-ok"><Ico name="check" size={13} /></span>
              )}
            </div>
            <div className="scan-step-body">
              <div className="scan-step-label">{s.label}</div>
              <div className="scan-step-sub">
                {s.status === 'pending' && 'Waiting…'}
                {s.status === 'running' && s.sub}
                {s.status === 'done' && s.result}
              </div>
            </div>
            <div className="scan-step-tag">
              {s.status === 'pending' && <span className="pill">Queued</span>}
              {s.status === 'running' && <span className="pill brand"><span className="dot" />Checking</span>}
              {s.status === 'done' && s.kind === 'ok' && <span className="pill clean">Clear</span>}
              {s.status === 'done' && s.kind === 'warn' && <span className="pill warn">Match</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Static score card
function StaticScoreCard({ scenario, mode = 'investigator' }) {
  const sc = SCENARIOS[scenario];
  if (mode === 'resident') {
    const verdict = sc.risk === 'risk'
      ? { word: 'Yes', sub: 'This property appears to be rented out.' }
      : sc.risk === 'warn'
        ? { word: 'Maybe', sub: 'We found a possible match worth investigating.' }
        : { word: 'No', sub: 'We did not find any active rental listings.' };
    const platforms = Object.entries(sc.listings).filter(([_, l]) => l.length > 0).map(([id]) => {
      return ({ airbnb: 'Airbnb', vrbo: 'Vrbo', fb: 'Facebook Marketplace' })[id];
    });
    return (
      <div className="card score-card resident">
        <div className={`resident-hero r-${sc.risk}`}>
          <div className="r-eyebrow">Rental status</div>
          <div className="r-verdict">{verdict.word}</div>
          <div className="r-sub">{verdict.sub}</div>
          {platforms.length > 0 && (
            <div className="r-platforms">
              <span className="r-pf-label">Found on</span>
              <div className="r-pf-list">
                {platforms.map((n, i) => <span key={i} className="r-pf-chip">{n}</span>)}
              </div>
            </div>
          )}
        </div>
        <div className="score-summary">
          <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Ico name="pin" size={13} /> {PROPERTY.address}
          </div>
          <h3>What does this mean?</h3>
          <p>{sc.risk === 'risk'
            ? "If you're a neighbor or local official, this is worth reporting to your municipality. If you're a tenant, the property may not be available for long-term lease."
            : sc.risk === 'warn'
              ? "We're not certain. Open the details below to see what we found, or run another scan in a few days to see if more listings appear."
              : "Based on monitored platforms, this property is not currently being offered as a short-term rental. This sweep refreshes daily."}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="card score-card">
      <div className={`score-hero r-${sc.risk}`}>
        <div className="score-label">Confidence score</div>
        <div className="score-num">{sc.score}<span className="denom">/100</span></div>
        <div className="score-risk-row">
          <span className={`risk-badge ${sc.risk}`}>
            <span className="glyph">
              <Ico name={sc.risk === 'clean' ? 'check' : sc.risk === 'warn' ? 'info' : 'alert'} size={13} />
            </span>
            {sc.riskLabel}
          </span>
        </div>
      </div>
      <div className="score-summary">
        <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico name="pin" size={13} /> {PROPERTY.address}
        </div>
        <h3>{sc.headline}</h3>
        <p>{sc.summary}</p>
      </div>
    </div>
  );
}

function StaticWhyCard({ scenario, open = true }) {
  const sc = SCENARIOS[scenario];
  const rows = sc.breakdown || [];
  const net = rows.reduce((a, r) => a + r.impact, 0);
  return (
    <div className={`card why-card ${open ? 'open' : ''}`}>
      <div className="why-head">
        <div className="left">
          <span className="pill brand"><Ico name="spark" size={11} /> Explainability</span>
          <h3>Why this score?</h3>
          <span className="count">{rows.length} signals · net {net >= 0 ? '+' : ''}{net}%</span>
        </div>
        <div className="chev"><Ico name="chevron" /></div>
      </div>
      {open && (
        <div className="why-body" style={{ gridTemplateRows: '1fr' }}>
          <div>
            <div className="breakdown-table">
              <div className="bt-head">
                <div>Signal Type</div>
                <div>Detail</div>
                <div className="num">Impact</div>
              </div>
              {rows.map((r, i) => {
                const pos = r.impact > 0;
                const neg = r.impact < 0;
                const dirClass = pos ? 'neg' : neg ? 'pos' : 'zero';
                return (
                  <div key={i} className={`bt-row ${dirClass}`}>
                    <div className="bt-name">
                      <span className="bt-ico"><Ico name={pos ? 'trend-up' : neg ? 'trend-down' : 'check'} size={13} /></span>
                      <span>{r.title}</span>
                    </div>
                    <div className="bt-desc">{r.desc}</div>
                    <div className="bt-impact">
                      <div className="bt-bar"><div style={{ width: Math.min(100, Math.abs(r.impact) * 2) + '%' }} /></div>
                      <div className="bt-pct">{pos ? '+' : ''}{r.impact}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FactorColStatic({ kind, title, factors }) {
  return (
    <div className={`factor-col ${kind}`}>
      <h4><span className="swatch" /> {title}</h4>
      {factors.length === 0 && <div className="empty-state"><strong>None detected</strong> · no signals in this category.</div>}
      {factors.map((f, i) => (
        <div key={i} className={`factor ${kind}`}>
          <div className="ico"><Ico name={kind === 'pos' ? 'trend-down' : 'trend-up'} size={14} /></div>
          <div className="body">
            <div className="t">{f.title}</div>
            <div className="d">{f.desc}</div>
            <div className="signal-bar"><div style={{ width: f.signal + '%' }} /></div>
          </div>
          <div className="weight">{f.weight}</div>
        </div>
      ))}
    </div>
  );
}

function StaticListings({ scenario }) {
  const sc = SCENARIOS[scenario];
  const total = Object.values(sc.listings).reduce((a, l) => a + l.length, 0);
  return (
    <div>
      <div className="section-head">
        <h2>Discovered listings</h2>
        <div className="sub">Grouped by platform · {total} total</div>
      </div>
      {PLATFORMS.map(p => {
        const listings = sc.listings[p.id] || [];
        const open = listings.length > 0;
        return (
          <div key={p.id} className={`platform-section ${open || listings.length === 0 ? 'open' : ''}`}>
            <div className="ps-head">
              <div className={`pf-logo ${p.cls}`}>{p.mark}</div>
              <div className="name">{p.name}</div>
              <span className="count">{p.domain}</span>
              <div className="right">
                {listings.length === 0
                  ? <span className="pill clean"><Ico name="check" size={11} /> No matches</span>
                  : <span className="pill risk"><Ico name="alert" size={11} /> {listings.length} listing{listings.length !== 1 ? 's' : ''}</span>}
                <div className="chev"><Ico name="chevron" /></div>
              </div>
            </div>
            {listings.length === 0 && (
              <div className="ps-body" style={{ gridTemplateRows: '1fr' }}>
                <div>
                  <div className="ps-inner">
                    <div className="empty-state" style={{ textAlign: 'left' }}>
                      <strong>Nothing found on {p.name}.</strong> We swept the full 1.0 mi radius — no listings matched the property's photos, geocode, or fingerprint.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {open && (
              <div className="ps-body" style={{ gridTemplateRows: '1fr' }}>
                <div>
                  <div className="ps-inner">
                    {listings.map((l, i) => (
                      <div key={i} className="listing">
                        <div className="thumb" style={{ background: l.img }} />
                        <div className="body">
                          <div className="title">{l.title}</div>
                          <div className="meta-row">
                            {l.beds != null && <><Ico name="bed" size={11} /> {l.beds} bd</>}
                            <span className="sep">·</span>
                            {l.baths != null && <><Ico name="bath" size={11} /> {l.baths} ba</>}
                            {l.price && <><span className="sep">·</span><Ico name="price" size={11} /> {l.price}</>}
                            {l.rating && <><span className="sep">·</span><Ico name="star" size={11} /> {l.rating} ({l.reviews})</>}
                          </div>
                        </div>
                        <div className="match">
                          <span className={`match-pill ${l.match}`}>
                            {l.match === 'high' ? 'High match' : l.match === 'med' ? 'Med match' : 'Low match'}
                          </span>
                          <span className="ext">View on {p.name} <Ico name="external" size={11} /></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Static map card — leaflet-style street map placeholder with zoom controls + property pin
function StaticPropertyMap() {
  return (
    <div className="map-card">
      <div className="map-canvas">
        {/* Base tile color */}
        <div className="map-base" />
        {/* Streets */}
        <svg className="map-streets" viewBox="0 0 600 480" preserveAspectRatio="none">
          <defs>
            <pattern id="bldg-pattern" width="22" height="14" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="18" height="10" fill="#EFE9DC" stroke="#DAD2BE" strokeWidth=".5" />
            </pattern>
          </defs>
          {/* parcel block fill */}
          <rect x="60" y="190" width="320" height="180" fill="url(#bldg-pattern)" opacity=".7" />
          {/* main streets (white) */}
          <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
            <path d="M 0 110 L 600 90" strokeWidth="22" />
            <path d="M 0 250 L 600 240" strokeWidth="18" />
            <path d="M 0 380 L 600 390" strokeWidth="20" />
            <path d="M 130 0 L 110 480" strokeWidth="18" />
            <path d="M 320 0 L 340 480" strokeWidth="20" />
            <path d="M 480 0 L 470 480" strokeWidth="18" />
          </g>
          {/* minor streets */}
          <g stroke="#FFFFFF" fill="none" strokeWidth="9" opacity=".9">
            <path d="M 0 170 L 600 165" />
            <path d="M 0 320 L 600 310" />
            <path d="M 220 0 L 215 480" />
            <path d="M 400 0 L 405 480" />
            <path d="M 560 0 L 555 480" />
          </g>
          {/* selection box */}
          <rect x="58" y="186" width="324" height="186" fill="rgba(10,183,163,.08)" stroke="#0AB7A3" strokeWidth="1.5" />
          {/* small water blob */}
          <ellipse cx="540" cy="170" rx="34" ry="22" fill="#CFE0EE" />
          {/* labels */}
          <g fill="#475569" fontFamily="var(--sans), sans-serif" fontSize="11">
            <text x="20" y="335" transform="rotate(-2 20 335)">Silver Creek Drive</text>
            <text x="240" y="245">Kynette Drive</text>
            <text x="280" y="402">Signet Drive</text>
            <text x="160" y="50" transform="rotate(-2 160 50)">Westpark</text>
          </g>
          <g fill="#94A3B8" fontFamily="var(--sans), sans-serif" fontSize="9">
            <text x="180" y="220">202</text><text x="180" y="265">204</text>
            <text x="245" y="220">208</text><text x="245" y="265">210</text>
            <text x="305" y="220">212</text><text x="305" y="265">214</text>
            <text x="365" y="220">216</text>
          </g>
          {/* church marker */}
          <g transform="translate(290 295)">
            <path d="M 0 0 L -3 -3 L 0 -8 L 3 -3 Z" fill="#475569" />
            <text x="6" y="2" fontFamily="var(--sans), sans-serif" fontSize="9" fill="#475569">Grace Community Church</text>
          </g>
        </svg>
        {/* Pin */}
        <div className="map-pin">
          <svg viewBox="0 0 24 32" width="36" height="48">
            <defs>
              <linearGradient id="pinGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0498C6" />
                <stop offset="1" stopColor="#0AB7A3" />
              </linearGradient>
            </defs>
            <path d="M 12 0 C 5 0 0 5 0 12 C 0 22 12 32 12 32 C 12 32 24 22 24 12 C 24 5 19 0 12 0 Z" fill="url(#pinGrad)" />
            <circle cx="12" cy="12" r="4.5" fill="#FFFFFF" />
          </svg>
        </div>
        {/* Zoom controls */}
        <div className="map-zoom">
          <button>+</button>
          <button>−</button>
        </div>
        {/* Info popup */}
        <div className="map-popup">
          <div className="popup-close">×</div>
          <div className="popup-label">Searched Property</div>
          <div className="popup-addr">{PROPERTY.short}</div>
          <div className="popup-city">{PROPERTY.city}</div>
          <div className="popup-spec">{PROPERTY.bedrooms} beds · {PROPERTY.bathrooms} baths</div>
          <div className="popup-tail" />
        </div>
        {/* Attribution */}
        <div className="map-attr">Leaflet | © OpenStreetMap contributors</div>
      </div>
    </div>
  );
}

// Map + specs combined panel for result screens
function StaticPropertyOverview() {
  return (
    <div className="property-overview">
      <StaticPropertyMap />
      <StaticPropertySpecs />
    </div>
  );
}

// Static property-specs card — shown below confidence score on results page
function StaticPropertySpecs() {
  const specs = [
    { k: 'Bedrooms', v: PROPERTY.bedrooms },
    { k: 'Bathrooms', v: PROPERTY.bathrooms },
    { k: 'Area', v: PROPERTY.area },
    { k: 'Lot Size', v: PROPERTY.lotSize },
    { k: 'Year Built', v: PROPERTY.yearBuilt },
  ];
  return (
    <div className="card prop-specs-card">
      <div className="prop-specs-head">
        <div>
          <h2 className="prop-specs-title">{PROPERTY.short}</h2>
          <div className="prop-specs-city">{PROPERTY.city}</div>
        </div>
        <span className="prop-type-pill">{PROPERTY.propertyType}</span>
      </div>
      <div className="prop-specs-grid">
        {specs.map((s, i) => (
          <div key={i} className="prop-specs-cell">
            <div className="k">{s.k}</div>
            <div className="v">{s.v}</div>
          </div>
        ))}
      </div>
      <p className="prop-specs-desc">{PROPERTY.description}</p>
    </div>
  );
}

// FullScreen wraps a screen mock at 1440 width inside a frame
function ScreenFrame({ children, title, w = 1440, h = 'auto' }) {
  return (
    <div style={{ width: w, background: 'var(--bg)', minHeight: h, display: 'grid', gridTemplateColumns: '248px 1fr' }}>
      {children}
    </div>
  );
}

// Build a scan steps list for a given progression frame
function buildSteps(scenario, frame) {
  // frame: 'start' | 'mid' | 'done'
  const isHigh = scenario === 'high';
  const isMed = scenario === 'medium';
  const findings = isHigh
    ? { ab: { kind: 'warn', text: '2 strong matches found' }, vr: { kind: 'warn', text: '1 strong match found' }, fb: { kind: 'warn', text: '1 partial match found' } }
    : isMed
      ? { ab: { kind: 'warn', text: '1 partial match found' }, vr: { kind: 'ok', text: 'No matches found' }, fb: { kind: 'ok', text: '1 unrelated post · excluded' } }
      : { ab: { kind: 'ok', text: 'No matches found' }, vr: { kind: 'ok', text: 'No matches found' }, fb: { kind: 'ok', text: 'No matches found' } };

  const all = [
    { label: 'Geocoding address', sub: '1428 Maplewood Drive · Asheville, NC', result: 'Located within 25 ft of parcel', kind: 'ok' },
    { label: 'Searching Airbnb', sub: 'airbnb.com · 1.0 mi radius', result: findings.ab.text, kind: findings.ab.kind },
    { label: 'Searching Vrbo', sub: 'vrbo.com · 1.0 mi radius', result: findings.vr.text, kind: findings.vr.kind },
    { label: 'Scanning Facebook Marketplace', sub: 'facebook.com/marketplace · 1.0 mi', result: findings.fb.text, kind: findings.fb.kind },
    { label: 'Computing confidence score', sub: 'Weighing signals · cross-referencing records', result: 'Score ready', kind: 'ok' },
  ];
  if (frame === 'start') {
    return all.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'pending' }));
  }
  if (frame === 'mid') {
    return all.map((s, i) => ({ ...s, status: i < 2 ? 'done' : (i === 2 || i === 3 ? 'running' : 'pending') }));
  }
  return all.map(s => ({ ...s, status: 'done' }));
}

Object.assign(window, {
  StaticSidebar, StaticTopbar, StaticHeader, StaticScanCard, StaticScoreCard, StaticWhyCard, StaticListings,
  StaticPropertySpecs, StaticPropertyMap, StaticPropertyOverview, ScreenFrame, buildSteps,
});
