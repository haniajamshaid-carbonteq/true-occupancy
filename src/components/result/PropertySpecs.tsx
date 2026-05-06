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
    <div className="px-9 py-8">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h2 className="font-sans font-light text-[34px] leading-tight tracking-[-0.02em] m-0 mb-1.5 text-ink">
            {PROPERTY.short}
          </h2>
          <div className="text-base text-ink-3">{PROPERTY.city}</div>
        </div>
        <span className="inline-flex items-center h-[30px] px-3.5 rounded-sm bg-surface-2 border border-line font-mono text-[11.5px] font-medium text-ink-2 tracking-wide shrink-0">
          {PROPERTY.propertyType}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-4 py-5 border-t border-b border-line">
        {SPECS.map((s) => (
          <div key={s.k} className="min-w-0">
            <div className="text-[12px] text-ink-3 mb-1.5 font-normal">{s.k}</div>
            <div className="text-[16px] font-semibold text-ink tracking-tight whitespace-nowrap">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 mb-0 text-[15.5px] text-ink-2 leading-relaxed">{PROPERTY.description}</p>
    </div>
  );
}
