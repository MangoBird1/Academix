'use client';

// Client-side helper for the source-URL auto-extraction flow.
//
// `extractFromUrl` calls the server route that fetches + parses the posting.
// `buildScrapePatch` turns the extracted fields into a partial application patch
// that ONLY fills empty fields and never overwrites user-entered notes.

import { normalizeLocation } from '@/lib/locationFormat';

export async function extractFromUrl(url) {
  const res = await fetch('/api/scrape/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Extraction failed.');
  }
  return data.extracted || {};
}

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

/**
 * Merge extracted fields into a patch, filling only empty target fields.
 *
 * @param {object} app       current application (source of truth for emptiness)
 * @param {object} extracted partial fields from the scraper
 * @returns {object} a patch suitable for `updateApplication` (may be empty)
 */
export function buildScrapePatch(app = {}, extracted = {}) {
  const patch = {};

  // --- Pane 2 text fields (overview, description, notes) -------------------
  if (isBlank(app.org_description) && !isBlank(extracted.org_description)) {
    patch.org_description = extracted.org_description;
  }
  if (isBlank(app.description) && !isBlank(extracted.description)) {
    patch.description = extracted.description;
  }
  // Never overwrite user-entered notes; only fill when empty.
  if (isBlank(app.notes) && !isBlank(extracted.notes)) {
    patch.notes = extracted.notes;
  }
  if (isBlank(app.title) && !isBlank(extracted.title)) {
    patch.title = extracted.title;
  }
  if (
    (isBlank(app.organization_name) ||
      app.organization_name === 'Untitled organization' ||
      app.organization_name === 'Unknown') &&
    !isBlank(extracted.organization_name)
  ) {
    patch.organization_name = extracted.organization_name;
  }

  // --- Pane 3 fields (location, deadlines) --------------------------------
  if (isBlank(app.location) && !isBlank(extracted.location)) {
    patch.location = normalizeLocation(extracted.location);
  }
  if (isBlank(app.application_deadline) && !isBlank(extracted.application_deadline)) {
    patch.application_deadline = extracted.application_deadline;
    if (isBlank(app.personal_completion_deadline)) {
      patch.personal_completion_deadline = extracted.application_deadline;
    }
  }

  // --- Skills board (AI-extracted technical skills) -----------------------
  if (Array.isArray(extracted.skills) && extracted.skills.length) {
    const existing = Array.isArray(app?.requirements?.technical_skills)
      ? app.requirements.technical_skills
      : [];
    const merged = Array.from(new Set([...existing, ...extracted.skills]));
    if (merged.length !== existing.length) {
      patch.requirements = {
        ...(app.requirements || {}),
        technical_skills: merged,
      };
    }
  }

  return patch;
}
