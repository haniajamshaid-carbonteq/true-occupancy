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

interface ListingHost {
  handle: string;
  displayName?: string;
  /** Fuzzy-match score between host name/handle and the borrower-of-record name. */
  fuzzyMatchPct?: number;
}

type SignalKind = 'pass' | 'warn' | 'fail';

interface ListingSignal {
  kind: SignalKind;
  label: string;
}

interface Listing {
  title: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  price?: string;
  rating?: number;
  reviews?: number;
  match: MatchStrength;
  /** Confidence the listing IS the subject property. 0–100. */
  confidencePct: number;
  host: ListingHost;
  /** Human-readable when the listing first appeared. */
  firstSeen: string;
  /** Days between mortgage close and first-seen — the load-bearing fraud datum. */
  daysPostClose?: number;
  /** Human-readable when we last re-scanned the listing. */
  lastVerified: string;
  /** Why we matched (or partially matched) — investigator-readable signals. */
  signals: ListingSignal[];
  /** External URL for the listing page on the platform. */
  url: string;
  /** Legacy CSS background — kept for back-compat, no longer rendered. */
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
        {
          title: 'Charming Mountain Retreat near Blue Ridge — Hot Tub & Fire Pit',
          beds: 3, baths: 2, sqft: 1924, price: '$248/nt', rating: 4.92, reviews: 184,
          match: 'high', confidencePct: 94,
          host: { handle: 'm.harlow_avl', displayName: 'Maggie H.', fuzzyMatchPct: 87 },
          firstSeen: 'Apr 18, 2025', daysPostClose: 37, lastVerified: '2 h ago',
          signals: [
            { kind: 'pass', label: 'Address geocode' },
            { kind: 'pass', label: 'Photo fingerprint' },
            { kind: 'pass', label: 'Host handle' },
            { kind: 'pass', label: 'Bedroom layout' },
          ],
          url: 'https://airbnb.com/rooms/example-12848319',
          img: 'linear-gradient(135deg,#3a4a3a,#7a8b6c)',
        },
        {
          title: 'Cozy 3BR Cabin · Walk to Downtown Asheville',
          beds: 3, baths: 2, sqft: 1900, price: '$229/nt', rating: 4.88, reviews: 67,
          match: 'high', confidencePct: 88,
          host: { handle: 'mhar_rentals', displayName: 'M Harlow Rentals', fuzzyMatchPct: 72 },
          firstSeen: 'May 02, 2025', daysPostClose: 51, lastVerified: '4 h ago',
          signals: [
            { kind: 'pass', label: 'Address geocode' },
            { kind: 'pass', label: 'Bedroom layout' },
            { kind: 'warn', label: 'Photo overlap 64%' },
          ],
          url: 'https://airbnb.com/rooms/example-99102271',
          img: 'linear-gradient(135deg,#5a4a3a,#a89373)',
        },
      ],
      vrbo: [
        {
          title: 'Maplewood Hideaway · 3BR Family Home with Mountain Views',
          beds: 3, baths: 2.5, sqft: 2050, price: '$265/nt', rating: 4.7, reviews: 42,
          match: 'high', confidencePct: 82,
          host: { handle: 'maple_hideaway', displayName: 'M. Harlow', fuzzyMatchPct: 81 },
          firstSeen: 'Mar 28, 2025', daysPostClose: 16, lastVerified: 'Yesterday',
          signals: [
            { kind: 'pass', label: 'Address geocode' },
            { kind: 'pass', label: 'Host handle' },
            { kind: 'warn', label: 'Sqft +6% vs. record' },
            { kind: 'fail', label: 'Bath count 2.5 vs. 2' },
          ],
          url: 'https://vrbo.com/listing/example-2010932',
          img: 'linear-gradient(135deg,#3a3a4a,#8a7da3)',
        },
      ],
      fb: [
        {
          title: 'Available short-term rental — weekly & monthly rates',
          beds: 3, baths: 2, price: '$1,650/wk',
          match: 'med', confidencePct: 64,
          host: { handle: 'maggie.h.avl', displayName: 'Maggie Harlow', fuzzyMatchPct: 92 },
          firstSeen: 'Jun 11, 2025', daysPostClose: 91, lastVerified: '1 d ago',
          signals: [
            { kind: 'warn', label: 'Geocode masked' },
            { kind: 'warn', label: 'No photos shared' },
          ],
          url: 'https://facebook.com/marketplace/item/example-770223',
          img: 'linear-gradient(135deg,#4a3a3a,#a8736d)',
        },
      ],
    },
    breakdown: [
      { title: 'Address Match', desc: 'Listings geocoded within 25 ft of the parcel centroid across Airbnb and Vrbo.', impact: 40 },
      { title: 'Bedroom Match', desc: '3-bed / 2-bath layout matches county records on every active listing found.', impact: 22 },
      { title: 'Title Similarity', desc: "Listing titles reference 'Maplewood' and 'Blue Ridge' — high lexical overlap with property metadata.", impact: 18 },
      { title: 'Size Mismatch', desc: 'Vrbo listing reports 2.5 baths vs. 2 baths on county record — minor discrepancy.', impact: -12 },
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
        {
          title: 'Quiet Studio near Maplewood — perfect for solo travelers',
          beds: 1, baths: 1, sqft: 480, price: '$112/nt', rating: 4.81, reviews: 23,
          match: 'med', confidencePct: 58,
          host: { handle: 'avl_studio', displayName: 'AVL Hosting', fuzzyMatchPct: 28 },
          firstSeen: 'Feb 09, 2025', daysPostClose: -32, lastVerified: '6 h ago',
          signals: [
            { kind: 'pass', label: 'Neighborhood geocode' },
            { kind: 'warn', label: 'Title keyword only' },
            { kind: 'fail', label: 'Layout mismatch' },
          ],
          url: 'https://airbnb.com/rooms/example-44910022',
          img: 'linear-gradient(135deg,#5b6b5e,#9bb29a)',
        },
      ],
      vrbo: [],
      fb: [
        {
          title: 'Roommate wanted — North Asheville',
          beds: 1, baths: 1,
          match: 'low', confidencePct: 22,
          host: { handle: 'kayla.r', displayName: 'Kayla R.', fuzzyMatchPct: 12 },
          firstSeen: 'Aug 14, 2025', daysPostClose: 155, lastVerified: '2 d ago',
          signals: [
            { kind: 'warn', label: 'Same neighborhood' },
            { kind: 'fail', label: 'Different listing type' },
          ],
          url: 'https://facebook.com/marketplace/item/example-330119',
          img: 'linear-gradient(135deg,#6b5b4e,#b29c89)',
        },
      ],
    },
    breakdown: [
      { title: 'Address Match', desc: 'Airbnb listing geocoded within 0.4 mi — neighborhood referenced but exact street masked.', impact: 25 },
      { title: 'Bedroom Match', desc: 'Listing reports 1-bed studio; county records 3-bed home — partial mismatch on layout.', impact: 10 },
      { title: 'Title Similarity', desc: "Title contains 'Maplewood' keyword overlap, but no street-level descriptors match.", impact: 18 },
      { title: 'Size Mismatch', desc: 'Square footage and photo count diverge from county property record — weakens the signal.', impact: -14 },
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
      { title: 'Address Match', desc: 'Zero address or geocode hits across 32 nearby Airbnb listings and the 1 mi Vrbo sweep.', impact: -28 },
      { title: 'Title Similarity', desc: "No active listing titles reference this property's street, neighborhood, or fingerprint.", impact: -22 },
      { title: 'Owner Profile', desc: 'Owner-occupied (homestead exemption on file) — outside the profile of typical STR operators.', impact: -18 },
      { title: 'Bedroom Match', desc: 'No candidate listings surfaced to compare bedroom counts against — search returned empty.', impact: -10 },
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
