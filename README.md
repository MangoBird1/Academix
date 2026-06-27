# Academix

A fluid, teal-glass **career & education application tracker**. Academix keeps
job/internship cards and university requirement entries side-by-side in a single
unified store, with a shifting three-pane workspace, instant client-side
sorting, and a calendar that refuses to let your personal goal date slip past
the real application deadline.

Built with **Next.js (App Router)**, **Firebase Firestore**, and **Tailwind CSS**.

## Features

- **Unified storage** — jobs and universities share one Firestore collection
  (`applications`) and one schema.
- **Shifting 3-pane layout** — toggling the sidebar fluidly shifts the index,
  detail, and metadata panes to the right instead of overlapping them.
- **Zero-latency sorting & search** — client-side `.sort()` by
  `application_deadline`, `personal_completion_deadline`, or `category`, plus a
  live text filter.
- **Calendar guardrails** — the personal-goal `<input type="date">` is capped
  with `max={application_deadline}` and an explicit alert blocks any later date.
- **Real-time sync** — `onSnapshot` keeps cards fresh without a refresh; edits
  persist with `updateDoc`.
- **Graceful demo mode** — with no Firebase credentials the app runs entirely on
  local seed data (3 jobs + 2 universities) so you can boot it instantly.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no env configured you'll see the seed data and
a "Local demo data" indicator in the sidebar. Everything (sorting, search,
notes, the date guardrail) works in this mode.

## Connecting Firebase (optional, enables live sync)

1. Create a Firebase project and a Firestore database.
2. Copy the web app config into a local env file:

   ```bash
   cp .env.local.example .env.local
   ```

   Then fill in the `NEXT_PUBLIC_FIREBASE_*` values.
3. Restart `npm run dev`. The sidebar indicator switches to "Firestore live
   sync", reads stream in via `onSnapshot`, and edits write back via `updateDoc`.

## The scraping ingestion route

`POST /api/scrape` models where a third-party scraper (Firecrawl, Jina, Apify,
etc.) hands its payload off to the database. It normalises the provider's
structured output into the unified schema and writes it with `addDoc`.

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  -d '{
    "source_url": "https://careers.example.com/jobs/swe",
    "category": "career",
    "extracted": {
      "title": "Software Engineer",
      "company": "Example Inc",
      "location": "Remote",
      "deadline": "2026-10-01",
      "skills": ["Go", "Postgres"],
      "summary": "Backend role focused on payments."
    }
  }'
```

When Firebase is configured the new document is persisted (and appears live via
`onSnapshot`); otherwise the route echoes the normalised document so the
contract stays demonstrable locally.

## Data model

One document per tracked application, in the `applications` collection:

| Field                           | Type     | Notes                                              |
| ------------------------------- | -------- | -------------------------------------------------- |
| `title`                         | string   | Role or programme name                             |
| `organization_name`            | string   | Company or university                              |
| `category`                      | string   | `'career'` or `'education'`                         |
| `location`                      | string   |                                                    |
| `source_url`                    | string   | Where it was scraped from                          |
| `application_deadline`          | string   | `YYYY-MM-DD`, the hard external close date         |
| `personal_completion_deadline`  | string   | `YYYY-MM-DD`, self-imposed goal (≤ deadline)       |
| `notes`                         | string   | Free-form scraping notes                           |
| `requirements`                  | object   | `career`: `{ technical_skills }`; `education`: `{ gpa_threshold, standardized_tests }` |

## Project structure

```
app/
  api/scrape/route.js   # scraper -> normalise -> addDoc ingestion route
  layout.js             # root layout + font
  page.js               # passes seed data into the dashboard
  globals.css           # Tailwind + theme scrollbars
components/
  Dashboard.jsx         # the three-pane teal-glass UI
lib/
  firebase.js           # client init + isFirebaseConfigured flag
  applicationsService.js# onSnapshot / updateDoc / addDoc helpers
  useApplications.js    # client hook: live sync + optimistic updates
  seedData.js           # 3 jobs + 2 universities (unified schema)
```
