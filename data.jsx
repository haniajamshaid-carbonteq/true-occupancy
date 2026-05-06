// Three scenarios — same address, different findings
const PROPERTY = {
  address: "1428 Maplewood Drive, Asheville, NC 28804",
  short: "1428 Maplewood Drive",
  city: "Asheville, NC 28804",
  zoning: "R-1 Single Family",
  parcel: "9648-23-7104",
  permitStatus: "No STR permit on file",
  bedrooms: 3,
  bathrooms: 2,
  area: "1,924 sq ft",
  lotSize: "1,125 sq ft",
  yearBuilt: 1930,
  propertyType: "SINGLE_FAMILY",
  description: "RARE FIND and Priced to Sell! Don't miss this incredible opportunity to own a piece of the vibrant H Street Corridor in Washington, DC. This mixed-use property features commercial space on the ground floor with two residential units above, generating strong rental income. Walk to restaurants, the streetcar, and Union Station.",
};

const PLATFORMS = [
  { id: 'airbnb', name: 'Airbnb',             domain: 'airbnb.com',            cls: 'airbnb', mark: 'A' },
  { id: 'vrbo',   name: 'Vrbo',               domain: 'vrbo.com',              cls: 'vrbo',   mark: 'V' },
  { id: 'fb',     name: 'Facebook Marketplace', domain: 'facebook.com/marketplace', cls: 'fb', mark: 'f' },
];

// Scenarios drive: score, risk, factors, listings per platform
const SCENARIOS = {
  high: {
    score: 87,
    risk: 'risk',
    riskLabel: 'High Risk · Red Flag',
    summary: "Strong evidence this property is operating as a short-term rental across multiple platforms without a permit on file.",
    headline: "Listed across 3 platforms",
    listings: {
      airbnb: [
        { title: "Charming Mountain Retreat near Blue Ridge — Hot Tub & Fire Pit", beds: 3, baths: 2, price: '$248/nt', rating: 4.92, reviews: 184, match: 'high', img: 'linear-gradient(135deg,#3a4a3a,#7a8b6c)' },
        { title: "Cozy 3BR Cabin · Walk to Downtown Asheville", beds: 3, baths: 2, price: '$229/nt', rating: 4.88, reviews: 67, match: 'high', img: 'linear-gradient(135deg,#5a4a3a,#a89373)' },
      ],
      vrbo: [
        { title: "Maplewood Hideaway · 3BR Family Home with Mountain Views", beds: 3, baths: 2.5, price: '$265/nt', rating: 4.7, reviews: 42, match: 'high', img: 'linear-gradient(135deg,#3a3a4a,#8a7da3)' },
      ],
      fb: [
        { title: "Available short-term rental — weekly & monthly rates", beds: 3, baths: 2, price: '$1,650/wk', match: 'med', img: 'linear-gradient(135deg,#4a3a3a,#a8736d)' },
      ],
    },
    breakdown: [
      { title: "Address Match",    desc: "Listings geocoded within 25 ft of the parcel centroid across Airbnb and Vrbo.",                  impact: 40, dir: 'neg' },
      { title: "Bedroom Match",    desc: "3-bed / 2-bath layout matches county records on every active listing found.",                  impact: 20, dir: 'neg' },
      { title: "Title Similarity", desc: "Listing titles reference 'Maplewood' and 'Blue Ridge' — high lexical overlap with property metadata.", impact: 15, dir: 'neg' },
      { title: "Size Mismatch",    desc: "Vrbo listing reports 2.5 baths vs. 2 baths on county record — minor discrepancy.",                impact: -5, dir: 'pos' },
    ],
  },

  medium: {
    score: 54,
    risk: 'warn',
    riskLabel: 'Medium Risk · Questionable',
    summary: "We found one strong match and one ambiguous signal. Worth a closer look before flagging.",
    headline: "Possible match on Airbnb",
    listings: {
      airbnb: [
        { title: "Quiet Studio near Maplewood — perfect for solo travelers", beds: 1, baths: 1, price: '$112/nt', rating: 4.81, reviews: 23, match: 'med', img: 'linear-gradient(135deg,#5b6b5e,#9bb29a)' },
      ],
      vrbo: [],
      fb: [
        { title: "Roommate wanted — North Asheville", beds: 1, baths: 1, match: 'low', img: 'linear-gradient(135deg,#6b5b4e,#b29c89)' },
      ],
    },
    breakdown: [
      { title: "Address Match",    desc: "Airbnb listing geocoded within 0.4 mi — neighborhood referenced but exact street masked.",        impact: 22, dir: 'neg' },
      { title: "Bedroom Match",    desc: "Listing reports 1-bed studio; county records 3-bed home — partial mismatch on layout.",         impact: 8,  dir: 'neg' },
      { title: "Title Similarity", desc: "Title contains 'Maplewood' keyword overlap, but no street-level descriptors match.",            impact: 15, dir: 'neg' },
      { title: "Size Mismatch",    desc: "Square footage and photo count diverge from county property record — drags confidence down.",   impact: -5, dir: 'pos' },
    ],
  },

  low: {
    score: 12,
    risk: 'clean',
    riskLabel: 'Low Risk · Clean',
    summary: "No active short-term rental listings found for this property across any monitored platform.",
    headline: "No listings detected",
    listings: { airbnb: [], vrbo: [], fb: [] },
    breakdown: [
      { title: "Address Match",    desc: "Zero address or geocode hits across 32 nearby Airbnb listings and 1 mi Vrbo sweep.",        impact: 0,  dir: 'pos' },
      { title: "Bedroom Match",    desc: "No candidate listings to compare bedroom counts against — neutral signal.",                impact: 0,  dir: 'pos' },
      { title: "Title Similarity", desc: "No active listing titles reference this property's street, neighborhood, or fingerprint.",   impact: 0,  dir: 'pos' },
      { title: "Size Mismatch",    desc: "Owner-occupied (homestead exemption on file) — outside profile of typical STR operators.",  impact: -5, dir: 'pos' },
    ],
  },
};

// Scripted scan steps — clean checklist, one row per task
function buildScanScript(scenario) {
  // Each step: { id, label, start (ms), end (ms), result (after end), resultKind }
  // resultKind: 'ok' | 'empty' | 'warn'
  const findings = {
    high: {
      airbnb: { kind: 'warn', text: '2 strong matches found',  pCount: 2 },
      vrbo:   { kind: 'warn', text: '1 strong match found',    pCount: 1 },
      fb:     { kind: 'warn', text: '1 partial match found',   pCount: 1 },
    },
    medium: {
      airbnb: { kind: 'warn', text: '1 partial match found',   pCount: 1 },
      vrbo:   { kind: 'ok',   text: 'No matches found',        pCount: 0, empty: true },
      fb:     { kind: 'ok',   text: '1 unrelated post · excluded', pCount: 1 },
    },
    low: {
      airbnb: { kind: 'ok', text: 'No matches found', pCount: 0, empty: true },
      vrbo:   { kind: 'ok', text: 'No matches found', pCount: 0, empty: true },
      fb:     { kind: 'ok', text: 'No matches found', pCount: 0, empty: true },
    },
  }[scenario];

  return [
    { id: 'geo',    label: 'Geocoding address',         sub: '1428 Maplewood Drive · Asheville, NC',
      start: 0,    end: 600,  result: 'Located within 25 ft of parcel', kind: 'ok' },
    { id: 'airbnb', label: 'Searching Airbnb',          sub: 'airbnb.com · 1.0 mi radius',
      start: 500,  end: 1700, result: findings.airbnb.text, kind: findings.airbnb.kind,
      platform: { id: 'airbnb', count: findings.airbnb.pCount, empty: findings.airbnb.empty } },
    { id: 'vrbo',   label: 'Searching Vrbo',            sub: 'vrbo.com · 1.0 mi radius',
      start: 700,  end: 2000, result: findings.vrbo.text, kind: findings.vrbo.kind,
      platform: { id: 'vrbo', count: findings.vrbo.pCount, empty: findings.vrbo.empty } },
    { id: 'fb',     label: 'Scanning Facebook Marketplace', sub: 'facebook.com/marketplace · 1.0 mi',
      start: 900,  end: 2300, result: findings.fb.text, kind: findings.fb.kind,
      platform: { id: 'fb', count: findings.fb.pCount, empty: findings.fb.empty } },
    { id: 'score',  label: 'Computing confidence score', sub: 'Weighing signals · cross-referencing records',
      start: 2300, end: 2900, result: 'Score ready', kind: 'ok' },
  ];
}

window.PROPERTY = PROPERTY;
window.PLATFORMS = PLATFORMS;
window.SCENARIOS = SCENARIOS;
window.buildScanScript = buildScanScript;
