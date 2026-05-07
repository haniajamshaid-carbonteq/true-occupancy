/* global React, PROPERTY */

const SPECS = [
  { k: 'Bedrooms', v: PROPERTY.bedrooms },
  { k: 'Bathrooms', v: PROPERTY.bathrooms },
  { k: 'Area', v: PROPERTY.area },
  { k: 'Lot Size', v: PROPERTY.lotSize },
  { k: 'Year Built', v: PROPERTY.yearBuilt },
];

function PropertySpecs() {
  return (
    <div className="px-5 py-6 sm:px-9 sm:py-8">
      <div className="flex items-start justify-between gap-3 sm:gap-6 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h2
            className="font-sans font-light leading-tight tracking-[-0.02em] m-0 mb-1.5 text-ink"
            style={{ fontSize: 'clamp(16px, 5vw, 30px)' }}
          >
            {PROPERTY.short}
          </h2>
          <div className="text-sm sm:text-base text-ink-3">{PROPERTY.city}</div>
        </div>
        <span className="inline-flex items-center h-[26px] sm:h-[30px] px-2.5 sm:px-3.5 rounded-sm bg-surface-2 border border-line font-sans text-[10.5px] sm:text-[11.5px] font-medium text-ink-2 tracking-wide shrink-0">
          {PROPERTY.propertyType}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-4 sm:gap-x-5 py-4 sm:py-5 border-t border-b border-line">
        {SPECS.map((s) => (
          <div key={s.k} className="min-w-0">
            <div className="text-[11px] sm:text-[12px] text-ink-3 mb-1 sm:mb-1.5 font-normal">{s.k}</div>
            <div className="text-[14px] sm:text-[16px] font-semibold text-ink tracking-tight">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 sm:mt-5 mb-0 text-[14px] sm:text-[15.5px] text-ink-2 leading-relaxed">{PROPERTY.description}</p>
    </div>
  );
}
