/* global React, Screen, SpecSection,
   HomeScreen, HistoryScreen, BatchScreen,
   ScanStartScreen, ScanMidScreen,
   ResultCleanScreen, ResultMediumScreen, ResultHighScreen,
   WhyExpandedScreen, ComponentsPage */
// Top-level design-spec layout. Each <Screen> mounts a real production page
// from src/pages — no copies, no drift. Add a new page to src/pages and a
// new <Screen> here to feature it.

function SpecApp() {
  return (
    <div className="spec-canvas">
      <nav className="nav-anchor">
        <span className="brand">True Occupancy · spec</span>
        <a href="#section-01">Home</a>
        <a href="#section-02">Scan</a>
        <a href="#section-03">Results</a>
        <a href="#section-04">Why</a>
        <a href="#section-05">Components</a>
      </nav>

      <header className="spec-header">
        <div className="eyebrow">Halcyon · True Occupancy</div>
        <h1>Design <em>spec</em></h1>
        <p>
          Living reference for every screen. Mounts the production
          <code> /src </code> tree at scale — edit a component in
          <code> /src/components </code>or
          <code> /src/pages </code>and it updates here automatically.
          Use this surface to prototype new screens, audit visual
          consistency, and hand off to engineering.
        </p>
      </header>

      <SpecSection
        num="01"
        title="Home & navigation"
        desc="Entry points, scan history, and batch operations."
      >
        <Screen label="01.1" title="Home" initialPath="/">
          <HomeScreen />
        </Screen>
        <Screen label="01.2" title="History" initialPath="/history">
          <HistoryScreen />
        </Screen>
        <Screen label="01.3" title="Batch" initialPath="/batch">
          <BatchScreen />
        </Screen>
      </SpecSection>

      <SpecSection
        num="02"
        title="Scanning"
        desc="In-flight scan states — start, mid, and the moment of reveal."
      >
        <Screen label="02.1" title="Scan · start" initialPath="/scan/start">
          <ScanStartScreen />
        </Screen>
        <Screen label="02.2" title="Scan · mid" initialPath="/scan/mid">
          <ScanMidScreen />
        </Screen>
      </SpecSection>

      <SpecSection
        num="03"
        title="Results — three confidence states"
        desc="Same address, three findings. Neutral verdict copy by design."
      >
        <Screen
          label="03.1"
          title="Not rented · High confidence"
          initialPath="/result/clean"
        >
          <ResultCleanScreen />
        </Screen>
        <Screen
          label="03.2"
          title="Possibly rented · Medium confidence"
          initialPath="/result/medium"
        >
          <ResultMediumScreen />
        </Screen>
        <Screen
          label="03.3"
          title="Rented · High confidence"
          initialPath="/result/high"
        >
          <ResultHighScreen />
        </Screen>
      </SpecSection>

      <SpecSection
        num="04"
        title="Why this score"
        desc="Expanded factor breakdown for investigators."
      >
        <Screen
          label="04.1"
          title="Why · expanded"
          initialPath="/why-expanded"
        >
          <WhyExpandedScreen />
        </Screen>
      </SpecSection>

      <SpecSection
        num="05"
        title="Components reference"
        desc="Every primitive used across the product, in one canvas."
      >
        <Screen label="05.1" title="Components" initialPath="/components">
          <ComponentsPage />
        </Screen>
      </SpecSection>
    </div>
  );
}
