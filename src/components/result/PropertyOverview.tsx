/* global React, PropertyMap, PropertySpecs, Icon */
// Composes the map + specs as a single bordered card with internal divider.
// On mobile the map is collapsed behind a "View map" toggle to keep the
// page short — specs are the primary content there.

function PropertyOverview() {
  const [mapOpen, setMapOpen] = React.useState(false);

  return (
    <section className="mt-8 sm:mt-12">
      <h2 className="font-sans font-semibold text-h3 sm:text-h2 tracking-[-0.005em] m-0 mb-3 sm:mb-3.5" style={{ color: 'var(--navy)' }}>
        Property overview
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-[0.55fr_1.45fr] bg-surface border border-line rounded-lg shadow-sm overflow-hidden">
        {/* Map: always-visible on lg+, toggled on mobile */}
        <div className="hidden lg:block">
          <PropertyMap />
        </div>
        <div className="lg:hidden border-b border-line">
          <button
            type="button"
            onClick={() => setMapOpen((v) => !v)}
            className="w-full flex items-center gap-2.5 px-5 py-3.5 bg-surface-2 hover:bg-hover-bg/40 transition-colors text-left"
            aria-expanded={mapOpen}
          >
            <span className="w-7 h-7 rounded-full bg-surface border border-line grid place-items-center text-ink-2 shrink-0">
              <Icon name="pin" size={14} />
            </span>
            <span className="font-sans text-label font-medium text-ink">
              {mapOpen ? 'Hide map' : 'View on map'}
            </span>
            <span
              className={`ml-auto w-6 h-6 grid place-items-center text-ink-3 transition-transform ${
                mapOpen ? 'rotate-180' : ''
              }`}
            >
              <Icon name="chevron" size={14} />
            </span>
          </button>
          {mapOpen && <PropertyMap />}
        </div>
        <PropertySpecs />
      </div>
    </section>
  );
}
