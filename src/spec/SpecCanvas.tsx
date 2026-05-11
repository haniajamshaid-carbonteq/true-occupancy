/* global React, ReactRouterDOM */
// Spec canvas primitives — wrap real production pages in scaled-down browser
// frames so the design spec stays in sync with /src automatically. Each page
// is mounted under its own MemoryRouter so navigation hooks (Link, useLocation)
// resolve as if the page were live at that path.

const { MemoryRouter } = ReactRouterDOM;

interface ScreenProps {
  label: string;
  title: string;
  desc?: string;
  scale?: number;
  width?: number;
  height?: number;
  url?: string;
  initialPath?: string;
  children: React.ReactNode;
}

function Screen({
  label,
  title,
  desc,
  scale = 0.62,
  width = 1440,
  height = 960,
  url,
  initialPath = '/',
  children,
}: ScreenProps) {
  const displayUrl = url ?? `trueoccupancy.app${initialPath === '/' ? '' : initialPath}`;
  const frameWidth = Math.round(width * scale);
  const frameHeight = Math.round(height * scale);
  return (
    <div className="screen-wrap">
      <div className="screen-meta">
        <span className="label">{label}</span>
        <h3>{title}</h3>
        <span className="dim">{width} × {height} · @{Math.round(scale * 100)}%</span>
        {desc && <div className="desc">{desc}</div>}
      </div>
      <div className="screen-frame" style={{ width: frameWidth + 2 }}>
        <div className="browser-bar">
          <div className="dots"><span /><span /><span /></div>
          <div className="url">{displayUrl}</div>
        </div>
        <div style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
          <div
            className="screen-canvas"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width,
              minHeight: height,
            }}
          >
            <MemoryRouter initialEntries={[initialPath]}>
              {children}
            </MemoryRouter>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SpecSectionProps {
  num: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}

function SpecSection({ num, title, desc, children }: SpecSectionProps) {
  return (
    <section className="spec-section" id={`section-${num}`}>
      <header className="spec-section-head">
        <span className="num">{num}</span>
        <h2>{title}</h2>
        {desc && <span className="desc">{desc}</span>}
      </header>
      <div className="spec-row">{children}</div>
    </section>
  );
}
