/* global React, PROPERTY */
// Faux Leaflet street map. Stylized SVG instead of real tiles —
// good enough for screen mocks; the production app will swap this
// for a Leaflet/Maplibre canvas.

function PropertyMap() {
  return (
    <div className="relative min-h-[260px] sm:min-h-[360px] lg:min-h-[360px] border-b lg:border-b-0 lg:border-r border-line bg-[#ECEEF1] overflow-hidden">
      {/* Streets */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 600 480"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="bldg-pattern" width="22" height="14" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="18" height="10" fill="#E2E5E9" stroke="#C8CCD2" strokeWidth=".5" />
          </pattern>
        </defs>
        <rect x="60" y="190" width="320" height="180" fill="url(#bldg-pattern)" opacity=".7" />
        {/* Main streets */}
        <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
          <path d="M 0 110 L 600 90" strokeWidth="22" />
          <path d="M 0 250 L 600 240" strokeWidth="18" />
          <path d="M 0 380 L 600 390" strokeWidth="20" />
          <path d="M 130 0 L 110 480" strokeWidth="18" />
          <path d="M 320 0 L 340 480" strokeWidth="20" />
          <path d="M 480 0 L 470 480" strokeWidth="18" />
        </g>
        {/* Minor streets */}
        <g stroke="#FFFFFF" fill="none" strokeWidth="9" opacity=".9">
          <path d="M 0 170 L 600 165" />
          <path d="M 0 320 L 600 310" />
          <path d="M 220 0 L 215 480" />
          <path d="M 400 0 L 405 480" />
          <path d="M 560 0 L 555 480" />
        </g>
        {/* Selection box */}
        <rect x="58" y="186" width="324" height="186" fill="rgba(10,183,163,.08)" stroke="#0AB7A3" strokeWidth="1.5" />
        {/* Water */}
        <ellipse cx="540" cy="170" rx="34" ry="22" fill="#CFE0EE" />
        {/* Street labels */}
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
      </svg>

      {/* Pin */}
      <div className="absolute left-[35%] top-[52%] -translate-x-1/2 -translate-y-full drop-shadow">
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
      <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-col bg-white border border-black/20 rounded overflow-hidden shadow">
        <button type="button" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px] border-0 bg-white text-base sm:text-lg text-neutral-700 leading-none">+</button>
        <button type="button" className="w-[24px] h-[24px] sm:w-[30px] sm:h-[30px] border-0 bg-white text-base sm:text-lg text-neutral-700 leading-none border-t border-black/20">−</button>
      </div>

      {/* Info popup */}
      <div className="absolute left-[24%] top-[30%] bg-white border border-black/10 rounded p-2 pr-3 sm:p-3 sm:pr-4 shadow-md min-w-[150px] sm:min-w-[200px] max-w-[60%]">
        <div className="absolute top-1 right-2 sm:top-1.5 sm:right-2.5 text-neutral-400 text-xs sm:text-sm cursor-pointer leading-none">×</div>
        <div className="font-semibold text-caption sm:text-sm text-ink mb-0.5 sm:mb-1">Searched Property</div>
        <div className="text-micro sm:text-label text-ink-2">{PROPERTY.short}</div>
        <div className="text-micro sm:text-label text-ink-2 mb-1.5 sm:mb-2">{PROPERTY.city}</div>
        <div className="text-micro sm:text-label text-ink-2">
          {PROPERTY.bedrooms} beds · {PROPERTY.bathrooms} baths
        </div>
        <div className="absolute -bottom-[7px] left-6 sm:left-8 w-3 h-3 bg-white border-r border-b border-black/10 rotate-45" />
      </div>

      {/* Attribution */}
      <div className="absolute bottom-0 right-0 bg-white/85 text-eyebrow text-neutral-600 px-1.5 py-0.5 font-sans">
        Leaflet | © OpenStreetMap contributors
      </div>
    </div>
  );
}
