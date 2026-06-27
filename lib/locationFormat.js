// Location standardization.
//
// Goal: accept whatever the user types ("berlin, de", "tokyo jp", "nyc",
// "remote us") and normalize it to a friendly, widely recognized
// "<City>, <Country/Region>" form for ages ~18–35 — preferring common English
// names over ambiguous ISO codes (DE -> Germany, CH -> Switzerland).
//
// No external geolocation APIs: this is a curated, best-effort mapping plus
// sensible fallbacks. `standardizeLocation` is idempotent and case-insensitive,
// so it can be used both to normalize input and to render a stored value.

const titleCase = (s) =>
  (s || '')
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');

// Region/country aliases -> friendly display name.
const COUNTRY_CANON = {
  us: 'USA', usa: 'USA', 'u.s.': 'USA', 'u.s.a.': 'USA',
  'united states': 'USA', america: 'USA',
  uk: 'UK', 'u.k.': 'UK', gb: 'UK', 'united kingdom': 'UK',
  england: 'UK', britain: 'UK', 'great britain': 'UK',
  de: 'Germany', ger: 'Germany', germany: 'Germany', deutschland: 'Germany',
  ch: 'Switzerland', switzerland: 'Switzerland', suisse: 'Switzerland',
  jp: 'Japan', jpn: 'Japan', japan: 'Japan',
  ca: 'Canada', can: 'Canada', canada: 'Canada',
  fr: 'France', france: 'France',
  nl: 'Netherlands', netherlands: 'Netherlands', holland: 'Netherlands',
  sg: 'Singapore', singapore: 'Singapore',
  au: 'Australia', aus: 'Australia', australia: 'Australia',
  in: 'India', india: 'India',
  ie: 'Ireland', ireland: 'Ireland',
  es: 'Spain', spain: 'Spain',
  it: 'Italy', italy: 'Italy',
  se: 'Sweden', sweden: 'Sweden',
  cn: 'China', china: 'China',
  kr: 'South Korea', 'south korea': 'South Korea', korea: 'South Korea',
  br: 'Brazil', brazil: 'Brazil',
  mx: 'Mexico', mexico: 'Mexico',
  eu: 'EU', emea: 'EMEA', apac: 'APAC', latam: 'LATAM', global: 'Global',
};

// Well-known cities -> canonical "City, Region" display. Resolves ambiguous
// region codes (e.g. "berlin, de" -> Germany, "san francisco, ca" -> CA).
const CITY_CANON = {
  berlin: 'Berlin, Germany',
  munich: 'Munich, Germany', münchen: 'Munich, Germany', muenchen: 'Munich, Germany',
  london: 'London, UK',
  zurich: 'Zürich, Switzerland', zürich: 'Zürich, Switzerland',
  geneva: 'Geneva, Switzerland',
  tokyo: 'Tokyo, Japan', osaka: 'Osaka, Japan',
  paris: 'Paris, France',
  singapore: 'Singapore',
  toronto: 'Toronto, Canada', vancouver: 'Vancouver, Canada', montreal: 'Montreal, Canada',
  'new york': 'New York, NY', nyc: 'New York, NY', 'new york city': 'New York, NY',
  'san francisco': 'San Francisco, CA', sf: 'San Francisco, CA',
  'los angeles': 'Los Angeles, CA', la: 'Los Angeles, CA',
  seattle: 'Seattle, WA', boston: 'Boston, MA', chicago: 'Chicago, IL',
  austin: 'Austin, TX', cambridge: 'Cambridge, MA',
  amsterdam: 'Amsterdam, Netherlands',
  sydney: 'Sydney, Australia', melbourne: 'Melbourne, Australia',
  bangalore: 'Bengaluru, India', bengaluru: 'Bengaluru, India',
};

// US state codes used to detect "city ST" without a comma.
const US_STATES = new Set([
  'al', 'ak', 'az', 'ar', 'co', 'ct', 'fl', 'ga', 'hi', 'id', 'il',
  'ia', 'ks', 'ky', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt',
  'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or',
  'pa', 'ri', 'sc', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi',
  'wy', 'dc',
]);

const displayRegion = (token) => {
  if (!token) return '';
  if (COUNTRY_CANON[token]) return COUNTRY_CANON[token];
  if (token.length <= 3) return token.toUpperCase();
  return titleCase(token);
};

export function standardizeLocation(input) {
  const raw = (input || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!raw) return '';

  // Remote / hybrid / on-site special forms.
  if (raw === 'remote') return 'Remote';
  if (raw === 'hybrid') return 'Hybrid';
  if (raw === 'onsite' || raw === 'on-site' || raw === 'on site') return 'On-site';
  if (raw.startsWith('remote')) {
    const region = raw.replace(/^remote/, '').replace(/[()\-]/g, ' ').trim();
    if (!region) return 'Remote';
    return `Remote (${displayRegion(region)})`;
  }

  let cityPart;
  let regionPart = '';
  if (raw.includes(',')) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    cityPart = parts[0];
    // "cambridge, ma, usa" -> use the state (2nd token) as the region.
    regionPart = parts.length >= 3 ? parts[1] : parts[1] || '';
  } else {
    const parts = raw.split(' ');
    const last = parts[parts.length - 1];
    if (parts.length > 1 && (COUNTRY_CANON[last] || US_STATES.has(last))) {
      regionPart = last;
      cityPart = parts.slice(0, -1).join(' ');
    } else {
      cityPart = raw;
    }
  }

  if (CITY_CANON[cityPart]) return CITY_CANON[cityPart];

  const cityDisp = titleCase(cityPart);
  if (!regionPart) return cityDisp;
  return `${cityDisp}, ${displayRegion(regionPart)}`;
}

// Canonical stored form (lowercase of the standardized display).
export const normalizeLocation = (input) =>
  standardizeLocation(input).toLowerCase();

export default standardizeLocation;
