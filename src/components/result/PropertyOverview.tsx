/* global React, PropertyMap, PropertySpecs */
// Composes the map + specs as a single bordered card with internal divider.

function PropertyOverview() {
  return (
    <div className="grid grid-cols-[1.05fr_1fr] bg-surface border border-line rounded-lg shadow-sm overflow-hidden">
      <PropertyMap />
      <PropertySpecs />
    </div>
  );
}
