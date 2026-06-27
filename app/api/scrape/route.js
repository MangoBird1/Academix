import { NextResponse } from 'next/server';

import { addApplication } from '@/lib/applicationsService';
import { isFirebaseConfigured } from '@/lib/firebase';

// POST /api/scrape
//
// This route models where a third-party scraping provider (Firecrawl, Jina,
// Apify, a custom crawler, ...) would hand its structured payload off to the
// database. The provider gives us messy page data; here we normalise it into
// our unified `applications` schema and push it into Firestore via `addDoc`.
//
// Example request body (what a scraper would realistically return):
// {
//   "source_url": "https://careers.example.com/jobs/swe",
//   "category": "career",
//   "extracted": {
//     "title": "Software Engineer",
//     "company": "Example Inc",
//     "location": "Remote",
//     "deadline": "2026-10-01",
//     "skills": ["Go", "Postgres"],
//     "summary": "Backend role focused on payments."
//   }
// }

function normalizePayload(body) {
  const { source_url, category = 'career', extracted = {} } = body || {};

  const base = {
    title: extracted.title || 'Untitled application',
    organization_name: extracted.company || extracted.organization || 'Unknown',
    category: (category || 'career').trim().toLowerCase(),
    location: (extracted.location || 'Remote').trim().toLowerCase(),
    status: extracted.status || 'Saved',
    priority: extracted.priority || 'Medium Priority',
    applicationMethod: extracted.application_method || 'Company Website',
    org_description: extracted.org_description || extracted.organization_description || '',
    description: extracted.description || extracted.summary || '',
    source_url: source_url || '',
    application_deadline: extracted.deadline || '',
    // Default the personal goal to the hard deadline; the user tightens it later.
    personal_completion_deadline: extracted.deadline || '',
    notes: extracted.summary || '',
    my_notes: '',
    tasks: [],
    updated_at: Date.now(),
    follow_up_date: '',
    follow_up_method: 'Email',
    follow_up_reminder: false,
    contacts: {},
    custom_skills: [],
    skill_labels: {},
    timeline: [],
    outcome: '',
  };

  if (base.category === 'career') {
    base.requirements = {
      technical_skills: Array.isArray(extracted.skills) ? extracted.skills : [],
    };
  } else {
    base.requirements = {
      gpa_threshold: extracted.gpa_threshold || 'N/A',
      standardized_tests: extracted.standardized_tests || 'N/A',
    };
  }

  return base;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  if (!body?.source_url) {
    return NextResponse.json(
      { ok: false, error: 'A `source_url` is required.' },
      { status: 400 }
    );
  }

  const application = normalizePayload(body);

  // Hand the normalised record to Firestore. When credentials are missing we
  // still echo the document back so the contract is demonstrable locally.
  const id = await addApplication(application);

  return NextResponse.json({
    ok: true,
    persisted: isFirebaseConfigured && Boolean(id),
    id,
    application,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      'POST a scraping payload here to normalise it into the unified schema and write it to Firestore.',
    expects: {
      source_url: 'string (required)',
      category: "'career' | 'education'",
      extracted: 'provider-specific object (title, company, deadline, ...)',
    },
  });
}
