import { NextResponse } from 'next/server';

import { parsePosting } from '@/lib/scrapeParser';

// POST /api/scrape/extract
//
// Fetches the HTML at a user-supplied `url`, parses it with the lightweight
// Cheerio-based extractor, and returns a partial application payload. The client
// then fills only empty fields, never overwriting user-entered data.
//
// Request:  { "url": "https://careers.example.com/jobs/swe" }
// Response: { ok: true, url, extracted: { ...partial fields } }

export const runtime = 'nodejs';

function isValidHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
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

  const url = (body?.url || '').trim();
  if (!url || !isValidHttpUrl(url)) {
    return NextResponse.json(
      { ok: false, error: 'A valid http(s) `url` is required.' },
      { status: 400 }
    );
  }

  let html = '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AcademixBot/1.0; +https://academix.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `Fetch failed with status ${res.status}.` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err?.name === 'AbortError'
            ? 'Fetch timed out.'
            : 'Could not reach the source URL.',
      },
      { status: 502 }
    );
  }

  // Parsing is defensive and never throws on missing fields, but guard anyway.
  let extracted = {};
  try {
    extracted = parsePosting(html, url);
  } catch {
    extracted = {};
  }

  return NextResponse.json({ ok: true, url, extracted });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      'POST { url } here to fetch and extract posting fields (deadline, skills, location, overview, description, notes).',
  });
}
