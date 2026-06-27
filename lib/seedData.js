// Initial fake database payload.
//
// Three sample jobs + two sample universities, all stored side-by-side in the
// SAME unified schema. This array boots the local UI instantly and is also used
// to seed Firestore via the `/api/scrape` route.
//
// Unified schema reference (one document = one tracked application):
//   id                            -> string, stable identifier
//   title                         -> string, role or programme name
//   organization_name            -> string, company or university
//   category                      -> 'career' | 'education'
//   location                      -> string
//   source_url                    -> string, where it was scraped from
//   application_deadline          -> 'YYYY-MM-DD' (hard external close date)
//   personal_completion_deadline  -> 'YYYY-MM-DD' (self-imposed goal, <= above)
//   notes                         -> string, free-form scraping notes
//   requirements                  -> object, shape depends on category:
//       career     -> { technical_skills: string[] }
//       education  -> { gpa_threshold: string, standardized_tests: string }

export const seedApplications = [
  {
    id: 'job-frontend-aurora',
    title: 'Senior Frontend Engineer',
    organization_name: 'Aurora Labs',
    category: 'career',
    location: 'Remote (EU)',
    source_url: 'https://careers.auroralabs.io/jobs/senior-frontend-engineer',
    application_deadline: '2026-08-15',
    personal_completion_deadline: '2026-08-01',
    notes: 'Strong design-system culture. Tailor portfolio toward accessible, animation-heavy dashboards.',
    requirements: {
      technical_skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'WebGL'],
    },
  },
  {
    id: 'job-ml-quantix',
    title: 'Machine Learning Engineer',
    organization_name: 'Quantix AI',
    category: 'career',
    location: 'Berlin, DE',
    source_url: 'https://quantix.ai/careers/ml-engineer',
    application_deadline: '2026-09-30',
    personal_completion_deadline: '2026-09-10',
    notes: 'Mentions production MLOps. Highlight model serving + feature store experience.',
    requirements: {
      technical_skills: ['Python', 'PyTorch', 'Kubernetes', 'MLOps', 'SQL'],
    },
  },
  {
    id: 'job-pm-northwind',
    title: 'Product Manager, Growth',
    organization_name: 'Northwind Software',
    category: 'career',
    location: 'London, UK',
    source_url: 'https://northwind.dev/careers/pm-growth',
    application_deadline: '2026-07-20',
    personal_completion_deadline: '2026-07-05',
    notes: 'Wants quantified impact. Prepare 2-3 funnel/retention case studies.',
    requirements: {
      technical_skills: ['Roadmapping', 'A/B Testing', 'SQL', 'Analytics', 'Stakeholder Mgmt'],
    },
  },
  {
    id: 'uni-mit-eecs',
    title: 'MSc Electrical Engineering & Computer Science',
    organization_name: 'Massachusetts Institute of Technology',
    category: 'education',
    location: 'Cambridge, MA, USA',
    source_url: 'https://gradadmissions.mit.edu/programs/eecs',
    application_deadline: '2026-12-15',
    personal_completion_deadline: '2026-11-20',
    notes: 'Research statement is decisive. Reach out to 2 faculty before submitting.',
    requirements: {
      gpa_threshold: '3.7 / 4.0',
      standardized_tests: 'GRE (optional), TOEFL 100+',
    },
  },
  {
    id: 'uni-eth-datasci',
    title: 'MSc Data Science',
    organization_name: 'ETH Zürich',
    category: 'education',
    location: 'Zürich, CH',
    source_url: 'https://ethz.ch/en/studies/master/data-science',
    application_deadline: '2026-11-30',
    personal_completion_deadline: '2026-11-01',
    notes: 'Strong math prerequisites. Document linear algebra + probability coursework explicitly.',
    requirements: {
      gpa_threshold: '5.0 / 6.0 (Swiss scale)',
      standardized_tests: 'IELTS 7.0 / TOEFL 100+',
    },
  },
];

export default seedApplications;
