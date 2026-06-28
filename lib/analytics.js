// Centralized analytics module.
//
// All analytics are *derived* from the same unified application data model used
// across the app — nothing is stored or cached manually. Call `computeAnalytics`
// with the current applications array; because it is a pure function of its
// input, any change to an application (add / edit / patch / delete, or changes
// to skills or timeline events) yields fresh analytics on the next render.
//
// Every field access is defensive: null / missing values are skipped so charts
// never receive NaN or undefined rows.

import { titleCase } from '@/components/MetadataSection';

// Group an ISO date (YYYY-MM-DD or full timestamp) into a "YYYY-MM" bucket.
export function monthKey(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m] = iso.split('-');
  return y && m ? `${y}-${m}` : null;
}

// Convert a count map into sorted { label, value } rows (descending by count).
function toRows(map, formatter = (k) => k) {
  return Object.entries(map)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: formatter(k), value: v }));
}

// Convert a month-keyed map into rows sorted chronologically.
function toMonthRows(map) {
  return Object.entries(map)
    .filter(([, v]) => Number.isFinite(v) && v > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => ({ label: k, value: v }));
}

// Collect AI-extracted + manual skills for one application, de-duplicated.
export function collectSkills(app) {
  if (!app) return [];
  const technical = Array.isArray(app?.requirements?.technical_skills)
    ? app.requirements.technical_skills
    : [];
  const custom = Array.isArray(app?.custom_skills) ? app.custom_skills : [];
  return Array.from(
    new Set(
      [...technical, ...custom]
        .filter((s) => typeof s === 'string' && s.trim())
        .map((s) => s.trim())
    )
  );
}

/**
 * Compute every analytics metric from the live applications array.
 *
 * @param {Array<object>} applications
 * @returns {{
 *   total: number,
 *   categoriesTracked: number,
 *   timelineEventCount: number,
 *   categoryRows: Array<{label:string, value:number}>,
 *   statusRows: Array<{label:string, value:number}>,
 *   outcomeRows: Array<{label:string, value:number}>,
 *   skillRows: Array<{label:string, value:number}>,
 *   timelineRows: Array<{label:string, value:number}>,
 *   deadlineRows: Array<{label:string, value:number}>,
 * }}
 */
export function computeAnalytics(applications) {
  const apps = Array.isArray(applications) ? applications : [];

  const byCategory = {};
  const byStatus = {};
  const byOutcome = {};
  const skillFreq = {};
  const timelineByMonth = {};
  const deadlinesByMonth = {};

  apps.forEach((app) => {
    if (!app || typeof app !== 'object') return;

    const cat = (app.category || 'other').toString().trim().toLowerCase();
    if (cat) byCategory[cat] = (byCategory[cat] || 0) + 1;

    const status = (app.status || 'Unknown').toString().trim();
    if (status) byStatus[status] = (byStatus[status] || 0) + 1;

    const outcome = (app.outcome || 'None').toString().trim();
    if (outcome) byOutcome[outcome] = (byOutcome[outcome] || 0) + 1;

    collectSkills(app).forEach((s) => {
      skillFreq[s] = (skillFreq[s] || 0) + 1;
    });

    if (Array.isArray(app.timeline)) {
      app.timeline.forEach((ev) => {
        const mk = monthKey(ev?.date);
        if (mk) timelineByMonth[mk] = (timelineByMonth[mk] || 0) + 1;
      });
    }

    const dmk = monthKey(app.application_deadline);
    if (dmk) deadlinesByMonth[dmk] = (deadlinesByMonth[dmk] || 0) + 1;
  });

  const timelineRows = toMonthRows(timelineByMonth);

  return {
    total: apps.length,
    categoriesTracked: Object.keys(byCategory).length,
    timelineEventCount: timelineRows.reduce((s, r) => s + r.value, 0),
    categoryRows: toRows(byCategory, (k) => titleCase(k)),
    statusRows: toRows(byStatus),
    outcomeRows: toRows(byOutcome),
    skillRows: toRows(skillFreq).slice(0, 10),
    timelineRows,
    deadlineRows: toMonthRows(deadlinesByMonth),
  };
}

export default computeAnalytics;
