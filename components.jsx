/* global React, Ico, PROPERTY, PLATFORMS, SCENARIOS */

const { useState, useEffect, useMemo, useRef } = React;

// ---------- Sidebar ----------
function Sidebar({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="logo">
            <img className="mark" src="halcyon-mark.png" alt="Halcyon Solutions" />
            <div className="logo-text">
              <div className="logo-parent">Halcyon</div>
              <div className="logo-product">TrueOccupancy<sup>™</sup></div>
            </div>
          </div>
          <button
            className="sidebar-close"
            type="button"
            aria-label="Close menu"
            onClick={onClose}
          >
            <Ico name="x" size={18} />
          </button>
        </div>

        <div className="nav">
          <div className="nav-section">Workspace</div>
          <div className="nav-item active"><Ico name="search" /> New scan</div>
          <div className="nav-item"><Ico name="history" /> History <span className="badge">142</span></div>
          <div className="nav-item"><Ico name="flag" /> Flagged <span className="badge">9</span></div>

          <div className="nav-section">Tools</div>
          <div className="nav-item"><Ico name="globe" /> Watchlist</div>
          <div className="nav-item"><Ico name="pdf" /> Reports</div>
          <div className="nav-item"><Ico name="settings" /> Settings</div>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">JM</div>
          <div className="avatar-meta">
            <div className="name">J. Marlow</div>
            <div className="role">Code Compliance · Asheville</div>
          </div>
        </div>
      </aside>
    </>
  );
}

// ---------- Topbar ----------
function Topbar({ scenario, setScenario, onReplay, scanning, onMenuOpen }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className="menu-btn"
          type="button"
          aria-label="Open menu"
          onClick={onMenuOpen}
        >
          <Ico name="menu" size={18} />
        </button>
        <div className="breadcrumb">
          <span>Investigations</span>
          <span className="sep">/</span>
          <span>Asheville · Active</span>
          <span className="sep">/</span>
          <span className="current">1428 Maplewood Drive</span>
        </div>
      </div>
      <div className="topbar-actions">
        <div className="state-chips" role="tablist" aria-label="Outcome scenarios">
          <button className={scenario === 'low' ? 'active' : ''} onClick={() => setScenario('low')}>Clean</button>
          <button className={scenario === 'medium' ? 'active' : ''} onClick={() => setScenario('medium')}>Questionable</button>
          <button className={scenario === 'high' ? 'active' : ''} onClick={() => setScenario('high')}>Red flag</button>
        </div>
        <button className="btn ghost replay-btn-action" onClick={onReplay} disabled={scanning}>
          <Ico name="replay" /> <span className="btn-label">Replay scan</span>
        </button>
        <button className="btn share-btn"><Ico name="share" /> <span className="btn-label">Share</span></button>
        <button className="btn primary export-btn"><Ico name="pdf" /> <span className="btn-label">Export report</span></button>
      </div>
    </div>
  );
}

// ---------- Page header + search ----------
function PageHead({ scanning, doneAt }) {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Verify property occupancy and <em>flag short-term rental fraud.</em></h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="score-label" style={{ marginBottom: 4 }}>{scanning ? 'Scan started' : 'Scan completed'}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--ink-2)' }}>
            {doneAt ? doneAt : 'just now · 8:42 AM'}
          </div>
        </div>
      </div>

      <div className="search-wrap" role="search">
        <span className="icon"><Ico name="search" size={18} /></span>
        <input defaultValue={PROPERTY.address} aria-label="Property address" />
        <button className="btn ghost" type="button" tabIndex={-1}><Ico name="pin" /> Map</button>
        <button className="btn primary" type="button" tabIndex={-1}>Run scan</button>
      </div>

      <div className="tag-row">
        <span className="tag"><Ico name="pin" />Asheville, NC · 28804</span>
        <span className="tag"><Ico name="square" />Parcel {PROPERTY.parcel}</span>
        <span className="tag"><Ico name="shield" />Zoning {PROPERTY.zoning}</span>
        <span className="tag"><Ico name="cal" />Permit · none on file</span>
      </div>
    </div>
  );
}

// ---------- Live scan ----------
// Renders a clean checklist of high-level steps.
// Each step has a status: pending | running | done.
function ScanCard({ steps, progressPct, scanning }) {
  const completed = steps.filter(s => s.status === 'done').length;
  return (
    <div className="card scan-card">
      <div className="scan-head">
        <div style={{ flex: 1 }}>
          <h3>Live scan</h3>
          <div className="scan-progress">
            <div className="bar"><div className="bar-fill" style={{ width: progressPct + '%' }} /></div>
            <div className="pct">{Math.round(progressPct)}%</div>
          </div>
        </div>
        <div className="meta">
          {scanning && <><span className="live-dot" /> live</>}
          {!scanning && <span style={{ color: 'var(--clean)' }}>● complete</span>}
          <span>·</span>
          <span>{completed}/{steps.length} steps</span>
        </div>
      </div>

      <div className="scan-checklist">
        {steps.map((s) => <ScanStep key={s.id} step={s} />)}
      </div>
    </div>
  );
}

function ScanStep({ step }) {
  const { status, label, sub, result, kind } = step;
  return (
    <div className={`scan-step status-${status} kind-${kind || ''}`}>
      <div className="scan-step-icon">
        {status === 'pending' && <span className="cs-pending" />}
        {status === 'running' && <span className="cs-spin" />}
        {status === 'done' && (
          kind === 'warn'
            ? <span className="cs-icon cs-warn"><Ico name="alert" size={13} /></span>
            : <span className="cs-icon cs-ok"><Ico name="check" size={13} /></span>
        )}
      </div>
      <div className="scan-step-body">
        <div className="scan-step-label">{label}</div>
        <div className="scan-step-sub">
          {status === 'pending' && 'Waiting…'}
          {status === 'running' && sub}
          {status === 'done' && result}
        </div>
      </div>
      <div className="scan-step-tag">
        {status === 'pending' && <span className="pill">Queued</span>}
        {status === 'running' && <span className="pill brand"><span className="dot" />Checking</span>}
        {status === 'done' && kind === 'ok' && <span className="pill clean">Clear</span>}
        {status === 'done' && kind === 'warn' && <span className="pill warn">Match</span>}
      </div>
    </div>
  );
}

function PlatformProbe_REMOVED() { return null; }

// ---------- Score hero ----------
function ScoreCard({ scenario, scoreLive }) {
  const sc = SCENARIOS[scenario];
  return (
    <div className="card score-card">
      <div className={`score-hero r-${sc.risk}`}>
        <div className="score-label">Confidence score</div>
        <div className="score-num">
          {scoreLive}<span className="denom">/100</span>
        </div>
        <div className="score-risk-row">
          <span className={`risk-badge ${sc.risk}`}>
            <span className="glyph">
              <Ico name={sc.risk === 'clean' ? 'check' : sc.risk === 'warn' ? 'info' : 'alert'} size={13} />
            </span>
            {sc.riskLabel}
          </span>
          <button className="copy-btn"><Ico name="external" size={11} /> share</button>
        </div>
      </div>
      <div className="score-summary">
        <div className="score-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ico name="pin" size={13} /> {PROPERTY.address}
        </div>
        <h3>{sc.headline}</h3>
        <p>{sc.summary}</p>
        <div className="property-meta">
          <div className="cell"><div className="k">Zoning</div><div className="v">{PROPERTY.zoning}</div></div>
          <div className="cell"><div className="k">Parcel</div><div className="v">{PROPERTY.parcel}</div></div>
          <div className="cell"><div className="k">STR Permit</div><div className="v">{PROPERTY.permitStatus}</div></div>
        </div>
      </div>
    </div>
  );
}

// ---------- Why this score ----------
function WhyCard({ scenario, autoOpen }) {
  const [open, setOpen] = useState(autoOpen ?? false);
  useEffect(() => { if (autoOpen) setOpen(true); }, [scenario, autoOpen]);
  const sc = SCENARIOS[scenario];
  const total = sc.factors.pos.length + sc.factors.neg.length;

  return (
    <div className={`card why-card ${open ? 'open' : ''}`}>
      <div className="why-head" onClick={() => setOpen(o => !o)}>
        <div className="left">
          <span className="pill brand"><Ico name="spark" size={11} /> Explainability</span>
          <h3>Why this score?</h3>
          <span className="count">{total} signals weighted</span>
        </div>
        <div className="chev"><Ico name="chevron" /></div>
      </div>
      <div className="why-body">
        <div>
          <div className="why-inner">
            <FactorCol kind="neg" title="Negative signals (raise risk)" factors={sc.factors.neg} />
            <FactorCol kind="pos" title="Positive signals (lower risk)" factors={sc.factors.pos} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FactorCol({ kind, title, factors }) {
  return (
    <div className={`factor-col ${kind}`}>
      <h4><span className="swatch" /> {title}</h4>
      {factors.length === 0 && (
        <div className="empty-state"><strong>None detected</strong> · no signals in this category.</div>
      )}
      {factors.map((f, i) => (
        <div key={i} className={`factor ${kind}`}>
          <div className="ico">
            <Ico name={kind === 'pos' ? 'trend-down' : 'trend-up'} size={14} />
          </div>
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

// ---------- Listings panel ----------
function ListingsPanel({ scenario }) {
  const sc = SCENARIOS[scenario];
  return (
    <div>
      <div className="section-head">
        <h2>Discovered listings</h2>
        <div className="sub">Grouped by platform · {totalListings(sc)} total</div>
      </div>
      {PLATFORMS.map(p => (
        <PlatformGroup key={p.id} platform={p} listings={sc.listings[p.id] || []} defaultOpen={(sc.listings[p.id] || []).length > 0} />
      ))}
    </div>
  );
}

function totalListings(sc) {
  return Object.values(sc.listings).reduce((a, l) => a + l.length, 0);
}

function PlatformGroup({ platform, listings, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`platform-section ${open ? 'open' : ''}`}>
      <div className="ps-head" onClick={() => setOpen(o => !o)}>
        <div className={`pf-logo ${platform.cls}`}>{platform.mark}</div>
        <div className="name">{platform.name}</div>
        <span className="count">{platform.domain}</span>
        <div className="right">
          {listings.length === 0
            ? <span className="pill clean"><Ico name="check" size={11} /> No matches</span>
            : <span className="pill risk"><Ico name="alert" size={11} /> {listings.length} listing{listings.length !== 1 ? 's' : ''}</span>}
          <div className="chev"><Ico name="chevron" /></div>
        </div>
      </div>
      <div className="ps-body">
        <div>
          <div className="ps-inner">
            {listings.length === 0 ? (
              <div className="empty-state">
                <strong>Nothing found on {platform.name}.</strong> We swept the full 1.0 mi radius — no listings matched the property's photos, geocode, or fingerprint.
              </div>
            ) : (
              listings.map((l, i) => <ListingRow key={i} listing={l} platform={platform} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingRow({ listing, platform }) {
  return (
    <a className="listing" href="#" onClick={e => e.preventDefault()}>
      <div className="thumb" style={{ background: listing.img }} />
      <div className="body">
        <div className="title">{listing.title}</div>
        <div className="meta-row">
          {listing.beds != null && <><Ico name="bed" size={11} /> {listing.beds} bd</>}
          <span className="sep">·</span>
          {listing.baths != null && <><Ico name="bath" size={11} /> {listing.baths} ba</>}
          {listing.price && <><span className="sep">·</span><Ico name="price" size={11} /> {listing.price}</>}
          {listing.rating && <><span className="sep">·</span><Ico name="star" size={11} /> {listing.rating} ({listing.reviews})</>}
        </div>
      </div>
      <div className="match">
        <span className={`match-pill ${listing.match}`}>
          {listing.match === 'high' ? 'High match' : listing.match === 'med' ? 'Med match' : 'Low match'}
        </span>
        <span className="ext">View on {platform.name} <Ico name="external" size={11} /></span>
      </div>
    </a>
  );
}

Object.assign(window, {
  Sidebar, Topbar, PageHead, ScanCard, ScoreCard, WhyCard, ListingsPanel,
});
