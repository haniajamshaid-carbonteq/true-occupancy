/* global */
// Domain data for screen mocks. Mirrors data.jsx but typed for the .tsx setup.
// Loaded as a global module via the bootstrap; downstream files reference
// PROPERTY / PLATFORMS / SCENARIOS / buildScanSteps directly.

type RiskKind = 'clean' | 'warn' | 'risk';
type MatchStrength = 'high' | 'med' | 'low';
type PlatformId = 'airbnb' | 'vrbo' | 'fb';

interface Property {
  address: string;
  short: string;
  city: string;
  zoning: string;
  parcel: string;
  permitStatus: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  lotSize: string;
  yearBuilt: number;
  propertyType: string;
  description: string;
}

interface Platform {
  id: PlatformId;
  name: string;
  domain: string;
  mark: string;
  /** Tailwind background class for the platform-mark tile. */
  markBg: string;
}

interface Listing {
  title: string;
  beds?: number;
  baths?: number;
  price?: string;
  rating?: number;
  reviews?: number;
  match: MatchStrength;
  /** CSS background value (gradient or color) for the placeholder thumb. */
  img: string;
}

interface Factor {
  title: string;
  desc: string;
  /** Signed % contribution. Positive = drives risk up, negative = drives it down. */
  impact: number;
}

interface Scenario {
  score: number;
  risk: RiskKind;
  riskLabel: string;
  summary: string;
  headline: string;
  listings: Record<PlatformId, Listing[]>;
  breakdown: Factor[];
}

type ScenarioKey = 'low' | 'medium' | 'high';

interface ScanStep {
  id: string;
  label: string;
  /** Sub-line shown while running. */
  sub: string;
  /** Sub-line shown when done. */
  result: string;
  kind: 'ok' | 'warn';
  status: 'pending' | 'running' | 'done';
}

const PROPERTY: Property = {
  address: '1428 Maplewood Drive, Asheville, NC 28804',
  short: '1428 Maplewood Drive',
  city: 'Asheville, NC 28804',
  zoning: 'R-1 Single Family',
  parcel: '9648-23-7104',
  permitStatus: 'No STR permit on file',
  bedrooms: 3,
  bathrooms: 2,
  area: '1,924 sq ft',
  lotSize: '1,125 sq ft',
  yearBuilt: 1930,
  propertyType: 'SINGLE_FAMILY',
  description:
    "RARE FIND and Priced to Sell! Don't miss this incredible opportunity to own a piece of the vibrant H Street Corridor in Washington, DC. This mixed-use property features commercial space on the ground floor with two residential units above, generating strong rental income. Walk to restaurants, the streetcar, and Union Station.",
};

const PLATFORMS: Platform[] = [
  { id: 'airbnb', name: 'Airbnb', domain: 'airbnb.com', mark: 'A', markBg: 'bg-airbnb' },
  { id: 'vrbo', name: 'Vrbo', domain: 'vrbo.com', mark: 'V', markBg: 'bg-vrbo' },
  { id: 'fb', name: 'Facebook Marketplace', domain: 'facebook.com/marketplace', mark: 'f', markBg: 'bg-fb' },
];

const SCENARIOS: Record<ScenarioKey, Scenario> = {
  high: {
    score: 87,
    risk: 'risk',
    riskLabel: 'Rented · High confidence',
    summary: 'Active listings on Airbnb, Vrbo, and Facebook Marketplace geocode to this parcel and report the same bedroom layout. No STR permit is on file for this address.',
    headline: '4 matched listings across 3 platforms',
    listings: {
      airbnb: [
        { title: 'Charming Mountain Retreat near Blue Ridge — Hot Tub & Fire Pit', beds: 3, baths: 2, price: '$248/nt', rating: 4.92, reviews: 184, match: 'high', img: 'linear-gradient(135deg,#3a4a3a,#7a8b6c)' },
        { title: 'Cozy 3BR Cabin · Walk to Downtown Asheville', beds: 3, baths: 2, price: '$229/nt', rating: 4.88, reviews: 67, match: 'high', img: 'linear-gradient(135deg,#5a4a3a,#a89373)' },
      ],
      vrbo: [
        { title: 'Maplewood Hideaway · 3BR Family Home with Mountain Views', beds: 3, baths: 2.5, price: '$265/nt', rating: 4.7, reviews: 42, match: 'high', img: 'linear-gradient(135deg,#3a3a4a,#8a7da3)' },
      ],
      fb: [
        { title: 'Available short-term rental — weekly & monthly rates', beds: 3, baths: 2, price: '$1,650/wk', match: 'med', img: 'linear-gradient(135deg,#4a3a3a,#a8736d)' },
      ],
    },
    breakdown: [
      { title: 'Address Match', desc: 'Listings geocoded within 25 ft of the parcel centroid across Airbnb and Vrbo.', impact: 40 },
      { title: 'Bedroom Match', desc: '3-bed / 2-bath layout matches county records on every active listing found.', impact: 20 },
      { title: 'Title Similarity', desc: "Listing titles reference 'Maplewood' and 'Blue Ridge' — high lexical overlap with property metadata.", impact: 15 },
      { title: 'Size Mismatch', desc: 'Vrbo listing reports 2.5 baths vs. 2 baths on county record — minor discrepancy.', impact: -5 },
    ],
  },
  medium: {
    score: 54,
    risk: 'warn',
    riskLabel: 'Possibly rented · Medium confidence',
    summary: 'One Airbnb listing within 0.4 mi shares the neighborhood and a keyword. Layout and exact address don\'t fully match — additional review may resolve.',
    headline: '1 partial match on Airbnb',
    listings: {
      airbnb: [
        { title: 'Quiet Studio near Maplewood — perfect for solo travelers', beds: 1, baths: 1, price: '$112/nt', rating: 4.81, reviews: 23, match: 'med', img: 'linear-gradient(135deg,#5b6b5e,#9bb29a)' },
      ],
      vrbo: [],
      fb: [
        { title: 'Roommate wanted — North Asheville', beds: 1, baths: 1, match: 'low', img: 'linear-gradient(135deg,#6b5b4e,#b29c89)' },
      ],
    },
    breakdown: [
      { title: 'Address Match', desc: 'Airbnb listing geocoded within 0.4 mi — neighborhood referenced but exact street masked.', impact: 22 },
      { title: 'Bedroom Match', desc: 'Listing reports 1-bed studio; county records 3-bed home — partial mismatch on layout.', impact: 8 },
      { title: 'Title Similarity', desc: "Title contains 'Maplewood' keyword overlap, but no street-level descriptors match.", impact: 15 },
      { title: 'Size Mismatch', desc: 'Square footage and photo count diverge from county property record — weakens the signal.', impact: -5 },
    ],
  },
  low: {
    score: 12,
    risk: 'clean',
    riskLabel: 'Not rented · High confidence',
    summary: 'No active short-term rental listings reference this property across any monitored platform.',
    headline: 'No active listings detected',
    listings: { airbnb: [], vrbo: [], fb: [] },
    breakdown: [
      { title: 'Address Match', desc: 'Zero address or geocode hits across 32 nearby Airbnb listings and 1 mi Vrbo sweep.', impact: 0 },
      { title: 'Bedroom Match', desc: 'No candidate listings to compare bedroom counts against — neutral signal.', impact: 0 },
      { title: 'Title Similarity', desc: "No active listing titles reference this property's street, neighborhood, or fingerprint.", impact: 0 },
      { title: 'Size Mismatch', desc: 'Owner-occupied (homestead exemption on file) — outside profile of typical STR operators.', impact: -5 },
    ],
  },
};

/** Build a scan-step list for a given scenario at a given progression frame. */
function buildScanSteps(scenario: ScenarioKey, frame: 'start' | 'mid' | 'done'): ScanStep[] {
  const findings: Record<PlatformId, { kind: 'ok' | 'warn'; text: string }> =
    scenario === 'high'
      ? { airbnb: { kind: 'warn', text: '2 strong matches found' }, vrbo: { kind: 'warn', text: '1 strong match found' }, fb: { kind: 'warn', text: '1 partial match found' } }
      : scenario === 'medium'
      ? { airbnb: { kind: 'warn', text: '1 partial match found' }, vrbo: { kind: 'ok', text: 'No matches found' }, fb: { kind: 'ok', text: '1 unrelated post · excluded' } }
      : { airbnb: { kind: 'ok', text: 'No matches found' }, vrbo: { kind: 'ok', text: 'No matches found' }, fb: { kind: 'ok', text: 'No matches found' } };

  const all: Omit<ScanStep, 'status'>[] = [
    { id: 'geo', label: 'Geocoding address', sub: '1428 Maplewood Drive · Asheville, NC', result: 'Located within 25 ft of parcel', kind: 'ok' },
    { id: 'airbnb', label: 'Searching Airbnb', sub: 'airbnb.com · 1.0 mi radius', result: findings.airbnb.text, kind: findings.airbnb.kind },
    { id: 'vrbo', label: 'Searching Vrbo', sub: 'vrbo.com · 1.0 mi radius', result: findings.vrbo.text, kind: findings.vrbo.kind },
    { id: 'fb', label: 'Scanning Facebook Marketplace', sub: 'facebook.com/marketplace · 1.0 mi', result: findings.fb.text, kind: findings.fb.kind },
    { id: 'score', label: 'Computing confidence score', sub: 'Weighing signals · cross-referencing records', result: 'Score ready', kind: 'ok' },
  ];

  if (frame === 'start') {
    return all.map((s, i) => ({ ...s, status: i === 0 ? 'running' : 'pending' }));
  }
  if (frame === 'mid') {
    return all.map((s, i) => ({ ...s, status: i < 2 ? 'done' : (i === 2 || i === 3 ? 'running' : 'pending') }));
  }
  return all.map((s) => ({ ...s, status: 'done' }));
}
