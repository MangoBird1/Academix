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
//   org_description               -> string, optional org/company blurb
//   category                      -> string, e.g. 'career' | 'education' | custom
//   location                      -> string
//   status                        -> string, e.g. 'Saved' | 'Applied' | custom
//   priority                      -> string, e.g. 'Medium Priority' | custom
//   applicationMethod             -> string, e.g. 'Company Website' | custom
//   description                   -> string, short summary
//   source_url                    -> string, where it was scraped from
//   application_deadline          -> 'YYYY-MM-DD' (hard external close date)
//   personal_completion_deadline  -> 'YYYY-MM-DD' (self-imposed goal, <= above)
//   notes                         -> string, AI/scraping notes
//   my_notes                      -> string, the user's own free-form notes
//   tasks                         -> Array<{ id, text, done }>
//   requirements                  -> object, shape depends on category:
//       career     -> { technical_skills: string[] }
//       education  -> { gpa_threshold: string, standardized_tests: string }

export const seedApplications = [
  {
    id: 'job-frontend-aurora',
    updated_at: new Date('2026-06-20T15:30:00').getTime(),
    outcome: 'Interviewing',
    follow_up_date: '2026-07-10',
    follow_up_method: 'Recruiter',
    follow_up_reminder: true,
    contacts: {
      recruiter_name: 'Jordan Lee',
      recruiter_email: 'jordan@auroralabs.io',
    },
    custom_skills: ['Figma'],
    skill_labels: {
      React: 'Strong',
      WebGL: 'Needs Improvement',
      Figma: 'Add to Portfolio',
    },
    timeline: [
      { id: 'tl-aurora-saved', label: 'Saved', date: '2026-06-01' },
      { id: 'tl-aurora-researched', label: 'Researched', date: '2026-06-10' },
    ],
    title: 'Senior Frontend Engineer',
    organization_name: 'Aurora Labs',
    org_description:
      'Series-B developer-tools company building a collaborative analytics platform.',
    category: 'career',
    location: 'remote (eu)',
    status: 'Applied',
    priority: 'High Priority',
    applicationMethod: 'Company Website',
    description:
      'Own the design system and build accessible, animation-heavy dashboards used by thousands of teams.',
    source_url: 'https://careers.auroralabs.io/jobs/senior-frontend-engineer',
    application_deadline: '2026-08-15',
    personal_completion_deadline: '2026-08-01',
    notes: 'Strong design-system culture. Tailor portfolio toward accessible, animation-heavy dashboards.',
    my_notes: '',
    tasks: [
      { id: 't-aurora-1', text: 'Refresh portfolio case studies', done: true },
      { id: 't-aurora-2', text: 'Tailor resume to design systems', done: false },
      { id: 't-aurora-3', text: 'Prepare accessibility talking points', done: false },
      { id: 't-aurora-4', text: 'Submit application', done: false },
    ],
    requirements: {
      technical_skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'WebGL'],
    },
  },
  {
    id: 'job-ml-quantix',
    title: 'Machine Learning Engineer',
    organization_name: 'Quantix AI',
    category: 'career',
    location: 'berlin, germany',
    status: 'Saved',
    priority: 'Medium Priority',
    applicationMethod: 'LinkedIn',
    description:
      'Build and operate production ML pipelines, from feature stores to low-latency model serving.',
    source_url: 'https://quantix.ai/careers/ml-engineer',
    application_deadline: '2026-09-30',
    personal_completion_deadline: '2026-09-10',
    notes: 'Mentions production MLOps. Highlight model serving + feature store experience.',
    my_notes: '',
    tasks: [
      { id: 't-quantix-1', text: 'Write MLOps project summary', done: false },
      { id: 't-quantix-2', text: 'Brush up on Kubernetes', done: false },
      { id: 't-quantix-3', text: 'Reach out to a referral', done: false },
    ],
    requirements: {
      technical_skills: ['Python', 'PyTorch', 'Kubernetes', 'MLOps', 'SQL'],
    },
  },
  {
    id: 'job-pm-northwind',
    title: 'Product Manager, Growth',
    organization_name: 'Northwind Software',
    category: 'career',
    location: 'london, uk',
    status: 'Interviewing',
    priority: 'High Priority',
    applicationMethod: 'Referral',
    description:
      'Drive activation and retention experiments across the growth funnel for a B2B SaaS platform.',
    source_url: 'https://northwind.dev/careers/pm-growth',
    application_deadline: '2026-07-20',
    personal_completion_deadline: '2026-07-05',
    notes: 'Wants quantified impact. Prepare 2-3 funnel/retention case studies.',
    my_notes: '',
    tasks: [
      { id: 't-northwind-1', text: 'Draft funnel case study', done: true },
      { id: 't-northwind-2', text: 'Quantify retention wins', done: true },
      { id: 't-northwind-3', text: 'Submit application', done: false },
    ],
    requirements: {
      technical_skills: ['Roadmapping', 'A/B Testing', 'SQL', 'Analytics', 'Stakeholder Mgmt'],
    },
  },
  {
    id: 'uni-mit-eecs',
    title: 'MSc Electrical Engineering & Computer Science',
    organization_name: 'Massachusetts Institute of Technology',
    category: 'education',
    location: 'cambridge, ma',
    status: 'Saved',
    priority: 'High Priority',
    applicationMethod: 'Company Website',
    description:
      'Research-driven masters with a decisive research statement and faculty-matched admissions.',
    source_url: 'https://gradadmissions.mit.edu/programs/eecs',
    application_deadline: '2026-12-15',
    personal_completion_deadline: '2026-11-20',
    notes: 'Research statement is decisive. Reach out to 2 faculty before submitting.',
    my_notes: '',
    tasks: [
      { id: 't-mit-1', text: 'Email 2 faculty members', done: false },
      { id: 't-mit-2', text: 'Draft research statement', done: false },
      { id: 't-mit-3', text: 'Request recommendation letters', done: false },
      { id: 't-mit-4', text: 'Finalize transcripts', done: false },
    ],
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
    location: 'zürich, switzerland',
    status: 'Saved',
    priority: 'Medium Priority',
    applicationMethod: 'Company Website',
    description:
      'Quantitative data science masters with strong math prerequisites and a competitive intake.',
    source_url: 'https://ethz.ch/en/studies/master/data-science',
    application_deadline: '2026-11-30',
    personal_completion_deadline: '2026-11-01',
    notes: 'Strong math prerequisites. Document linear algebra + probability coursework explicitly.',
    my_notes: '',
    tasks: [
      { id: 't-eth-1', text: 'List math coursework', done: true },
      { id: 't-eth-2', text: 'Book IELTS test', done: false },
      { id: 't-eth-3', text: 'Write motivation letter', done: false },
    ],
    requirements: {
      gpa_threshold: '5.0 / 6.0 (Swiss scale)',
      standardized_tests: 'IELTS 7.0 / TOEFL 100+',
    },
  },
];

export default seedApplications;
