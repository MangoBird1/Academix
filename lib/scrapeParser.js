// Lightweight HTML field extractor (server-only — uses Cheerio).
//
// Given the raw HTML of a job / programme posting, this best-effort parser pulls
// out the fields Academix cares about. Every extraction is defensive: when a
// field cannot be found it is simply omitted from the result so the caller can
// fill only what is available and never clobber user-entered data.

import * as cheerio from 'cheerio';

const SKILL_DICTIONARY = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'Node.js', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'Swift', 'Kotlin', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'GraphQL', 'REST', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Terraform', 'CI/CD', 'Git', 'HTML', 'CSS', 'Tailwind CSS', 'Sass',
  'WebGL', 'Figma', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy',
  'Machine Learning', 'Deep Learning', 'NLP', 'Data Science',
  'Communication', 'Leadership', 'Agile', 'Scrum',
];

const DEADLINE_LABELS =
  /(application\s+deadline|apply\s+by|deadline|closing\s+date|closes?\s+on|due\s+date)/i;

function readMeta($, names) {
  for (const name of names) {
    const byProp = $(`meta[property="${name}"]`).attr('content');
    if (byProp) return byProp.trim();
    const byName = $(`meta[name="${name}"]`).attr('content');
    if (byName) return byName.trim();
  }
  return '';
}

const clean = (s) =>
  (s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (s, max) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

// Try several common date formats; return ISO "YYYY-MM-DD" or ''.
function parseDate(raw) {
  if (!raw) return '';
  const text = raw.trim();

  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y > 1970 && y < 2100) {
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  return '';
}

function extractDeadline($, bodyText) {
  const candidates = [];
  $('li, p, span, td, div, time').each((_, el) => {
    const t = clean($(el).text());
    if (t && t.length < 160 && DEADLINE_LABELS.test(t)) candidates.push(t);
  });
  const timeAttr = $('time[datetime]').attr('datetime');
  if (timeAttr) candidates.unshift(timeAttr);

  for (const c of candidates) {
    const iso = parseDate(c);
    if (iso) return iso;
  }

  const m = bodyText.match(
    new RegExp(`${DEADLINE_LABELS.source}[^.]{0,60}`, 'i')
  );
  if (m) return parseDate(m[0]);
  return '';
}

function extractSkills(bodyText) {
  const found = [];
  for (const skill of SKILL_DICTIONARY) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^\\w])${escaped}([^\\w]|$)`, 'i');
    if (re.test(bodyText)) found.push(skill);
  }
  return Array.from(new Set(found));
}

function extractLocation($, bodyText) {
  const metaLoc = readMeta($, ['og:locality', 'business:contact_data:locality']);
  if (metaLoc) return clean(metaLoc);

  let jsonLoc = '';
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jsonLoc) return;
    try {
      const data = JSON.parse($(el).contents().text());
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        const addr = node?.jobLocation?.address || node?.address;
        if (addr) {
          jsonLoc = clean(
            [addr.addressLocality, addr.addressRegion, addr.addressCountry]
              .filter(Boolean)
              .join(', ')
          );
          if (jsonLoc) return;
        }
        if (node?.jobLocationType === 'TELECOMMUTE') jsonLoc = 'Remote';
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });
  if (jsonLoc) return jsonLoc;

  const m = bodyText.match(/location[:\s]+([A-Z][A-Za-z .,'-]{2,40})/);
  if (m) return clean(m[1]);
  if (/\bremote\b/i.test(bodyText)) return 'Remote';
  return '';
}

/**
 * Parse raw HTML into a partial application payload.
 * Only present fields are returned.
 *
 * @param {string} html
 * @param {string} [sourceUrl]
 * @returns {object}
 */
export function parsePosting(html, sourceUrl = '') {
  if (!html || typeof html !== 'string') return {};
  const $ = cheerio.load(html);

  // Extract structured data (JSON-LD) BEFORE stripping scripts.
  const location = extractLocation($, '');

  // Strip non-content nodes (keep ld+json already consumed above is irrelevant
  // now) before reading visible body text.
  $('script, style, noscript, svg').remove();
  const bodyText = clean($('body').text() || $.root().text());

  const result = {};

  const title =
    clean(readMeta($, ['og:title'])) ||
    clean($('h1').first().text()) ||
    clean($('title').text());
  if (title) result.title = truncate(title, 140);

  const org =
    clean(readMeta($, ['og:site_name'])) ||
    clean($('[class*="company" i], [class*="employer" i]').first().text());
  if (org) result.organization_name = truncate(org, 120);

  const overview = clean(readMeta($, ['og:description', 'description']));
  if (overview) result.org_description = truncate(overview, 400);

  const descRegion =
    clean($('[class*="description" i]').first().text()) ||
    clean($('article').first().text()) ||
    clean($('main').first().text());
  if (descRegion) result.description = truncate(descRegion, 1500);

  // Fall back to body-text heuristics if structured data had no location.
  const resolvedLocation = location || extractLocation($, bodyText);
  if (resolvedLocation) result.location = resolvedLocation;

  const deadline = extractDeadline($, bodyText);
  if (deadline) result.application_deadline = deadline;

  const skills = extractSkills(bodyText);
  if (skills.length) result.skills = skills;

  const noteParts = [];
  if (sourceUrl) noteParts.push(`Source: ${sourceUrl}`);
  if (result.location) noteParts.push(`Location: ${result.location}`);
  if (result.application_deadline)
    noteParts.push(`Deadline: ${result.application_deadline}`);
  if (skills.length)
    noteParts.push(`Detected skills: ${skills.slice(0, 12).join(', ')}`);
  if (noteParts.length) {
    result.notes = `Auto-extracted ${new Date()
      .toISOString()
      .slice(0, 10)}\n${noteParts.join('\n')}`;
  }

  return result;
}

export default parsePosting;
