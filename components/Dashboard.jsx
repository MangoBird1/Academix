'use client';

import { useState, useEffect, useCallback } from 'react';
import { useApplications } from '@/lib/useApplications';
import Calendar from '@/components/Calendar';
import VerticalDivider, { startColumnDrag } from '@/components/VerticalDivider';
import CollapsibleSection from '@/components/CollapsibleSection';
import {
  FieldGroup,
  StatusSelector,
  PrioritySelector,
  ApplicationMethodSelector,
  CategorySelector,
  LocationSelector,
  Selector,
  titleCase,
} from '@/components/MetadataSection';
import { normalizeLocation } from '@/lib/locationFormat';

const formatLong = (iso) => {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Canonicalize any user-typed category to lowercase for storage/comparison.
const normalizeCategory = (cat) => (cat || '').trim().toLowerCase();

const categoryTagStyles = (cat) => {
  const c = normalizeCategory(cat);
  if (c === 'career')
    return 'bg-[#a3c9c7] text-[#3f6f6b] border border-[#7aa7a3]/40'; // pastel mint + espresso teal
  if (c === 'education')
    return 'bg-[#cddcc7] text-[#5f8f8b] border border-[#b7c9b0]/40'; // eucalyptus + deep teal
  return 'bg-[#e9e4dd] text-[#5a5a5a] border border-[#d7b89c]/40'; // parchment + warm gray
};


// Categories are stored lowercase but shown in Title Case.
const categoryTagLabel = (cat) => titleCase(normalizeCategory(cat)) || 'Other';

// Default user-customizable option lists (persisted to localStorage).
const DEFAULT_STATUS_OPTIONS = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
const DEFAULT_PRIORITY_OPTIONS = ['Low Priority', 'Medium Priority', 'High Priority'];
const DEFAULT_METHOD_OPTIONS = ['Company Website', 'LinkedIn', 'Referral', 'Email', 'Job Board'];
const PRESET_CATEGORIES = ['career', 'education', 'other'];
const PRESET_LOCATIONS = [
  'remote',
  'remote (us)',
  'remote (eu)',
  'hybrid',
  'on-site',
  'new york, ny',
  'san francisco, ca',
  'london, uk',
  'berlin, de',
  'toronto, ca',
];

const FOLLOWUP_METHODS = ['Email', 'Portal', 'Recruiter', 'Other'];
const OUTCOME_OPTIONS = ['Submitted', 'Interviewing', 'Offer', 'Rejected', 'Withdrew'];
const SKILL_LABELS = ['Strong', 'Needs Improvement', 'Add to Resume', 'Add to Portfolio'];

const skillLabelStyle = (label) => {
  switch (label) {
    case 'Strong':
      return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30';
    case 'Needs Improvement':
      return 'bg-amber-950/60 text-amber-300 border-amber-500/30';
    case 'Add to Resume':
      return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30';
    case 'Add to Portfolio':
      return 'bg-purple-950/60 text-purple-300 border-purple-500/30';
    default:
      return 'bg-teal-950/40 text-teal-300 border-teal-500/20';
  }
};

// Contact field definitions per application type.
const CAREER_CONTACTS = [
  { key: 'recruiter_name', label: 'Recruiter name' },
  { key: 'recruiter_email', label: 'Recruiter email' },
  { key: 'hiring_manager', label: 'Hiring manager' },
  { key: 'referral_source', label: 'Referral source' },
];
const EDUCATION_CONTACTS = [
  { key: 'admissions_officer', label: 'Region admissions officer' },
  { key: 'admissions_officer_email', label: 'Admissions officer email' },
  { key: 'university_contacts', label: 'Potential contacts at university' },
  { key: 'recommenders', label: 'Recommender(s)' },
];

const formatDateTime = (ms) => {
  if (!ms) return '—';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Layout sizing constraints (px).
const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;
const PANE1_MIN = 240;
const PANE1_MAX = 560;
const PANE3_MIN = 260;
const PANE3_MAX = 560;

const LS = {
  sidebar: 'academix:sidebarWidth',
  pane1: 'academix:pane1Width',
  pane3: 'academix:pane3Width',
  status: 'academix:userDefinedStatusOptions',
  priority: 'academix:userDefinedPriorityOptions',
  methods: 'academix:userDefinedApplicationMethods',
  categories: 'academix:userDefinedCategories',
  locations: 'academix:userDefinedLocations',
};

export default function AcademixTealDashboard({ initialApplications = [] }) {
  const {
    applications,
    updateApplication,
    addApplication,
    addTask,
    toggleTask,
    removeTask,
    isLive,
  } = useApplications(initialApplications);

  const [activeId, setActiveId] = useState(initialApplications[0]?.id || null);
  const [sortBy, setSortBy] = useState('application_deadline');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [openCalendar, setOpenCalendar] = useState(null); // 'goal' | 'deadline' | null
  const [newTaskText, setNewTaskText] = useState('');
  const [newSkillText, setNewSkillText] = useState('');
  const [newTimelineLabel, setNewTimelineLabel] = useState('');
  const [newTimelineDate, setNewTimelineDate] = useState(todayISO());

  // --- Resizable layout state (persisted) ---------------------------------
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [pane1Width, setPane1Width] = useState(320);
  const [pane3Width, setPane3Width] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // --- User-defined option lists (persisted) ------------------------------
  const [userDefinedStatusOptions, setUserDefinedStatusOptions] =
    useState(DEFAULT_STATUS_OPTIONS);
  const [userDefinedPriorityOptions, setUserDefinedPriorityOptions] =
    useState(DEFAULT_PRIORITY_OPTIONS);
  const [userDefinedApplicationMethods, setUserDefinedApplicationMethods] =
    useState(DEFAULT_METHOD_OPTIONS);
  const [userDefinedCategories, setUserDefinedCategories] =
    useState(PRESET_CATEGORIES);
  const [userDefinedLocations, setUserDefinedLocations] =
    useState(PRESET_LOCATIONS);

  // Hydrate persisted layout + option lists once on the client.
  useEffect(() => {
    try {
      const num = (key, setter, min, max) => {
        const raw = localStorage.getItem(key);
        if (raw !== null && !Number.isNaN(+raw)) setter(clamp(+raw, min, max));
      };
      num(LS.sidebar, setSidebarWidth, SIDEBAR_MIN, SIDEBAR_MAX);
      num(LS.pane1, setPane1Width, PANE1_MIN, PANE1_MAX);
      num(LS.pane3, setPane3Width, PANE3_MIN, PANE3_MAX);

      const arr = (key, setter) => {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) setter(parsed);
      };
      arr(LS.status, setUserDefinedStatusOptions);
      arr(LS.priority, setUserDefinedPriorityOptions);
      arr(LS.methods, setUserDefinedApplicationMethods);
      arr(LS.categories, setUserDefinedCategories);
      arr(LS.locations, setUserDefinedLocations);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const persist = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* ignore storage errors */
    }
  };
  useEffect(() => persist(LS.sidebar, String(sidebarWidth)), [sidebarWidth]);
  useEffect(() => persist(LS.pane1, String(pane1Width)), [pane1Width]);
  useEffect(() => persist(LS.pane3, String(pane3Width)), [pane3Width]);
  useEffect(
    () => persist(LS.status, JSON.stringify(userDefinedStatusOptions)),
    [userDefinedStatusOptions]
  );
  useEffect(
    () => persist(LS.priority, JSON.stringify(userDefinedPriorityOptions)),
    [userDefinedPriorityOptions]
  );
  useEffect(
    () => persist(LS.methods, JSON.stringify(userDefinedApplicationMethods)),
    [userDefinedApplicationMethods]
  );
  useEffect(
    () => persist(LS.categories, JSON.stringify(userDefinedCategories)),
    [userDefinedCategories]
  );
  useEffect(
    () => persist(LS.locations, JSON.stringify(userDefinedLocations)),
    [userDefinedLocations]
  );

  // --- Resize handlers (mirror the same incremental-delta logic) ----------
  const resizeSidebar = useCallback(
    (delta) => setSidebarWidth((w) => clamp(w + delta, SIDEBAR_MIN, SIDEBAR_MAX)),
    []
  );
  const resizePane1 = useCallback(
    (delta) => setPane1Width((w) => clamp(w + delta, PANE1_MIN, PANE1_MAX)),
    []
  );
  const resizePane3 = useCallback(
    // Pane 3 sits to the RIGHT of its divider, so dragging right shrinks it.
    (delta) => setPane3Width((w) => clamp(w - delta, PANE3_MIN, PANE3_MAX)),
    []
  );

  const resolvedActiveId =
    applications.find((app) => app.id === activeId)?.id ||
    applications[0]?.id ||
    null;
  const selectedApp = applications.find((app) => app.id === resolvedActiveId);

  // Categories present in the data (lowercase, duplicate-proof) for the filter.
  const existingCategories = Array.from(
    new Set(applications.map((a) => normalizeCategory(a.category)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  // Selectable category options = presets + custom + anything already in data.
  const categoryOptions = Array.from(
    new Set([
      ...userDefinedCategories.map((c) => normalizeCategory(c)),
      ...existingCategories,
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  // Selectable location options = presets + custom + anything already in data,
  // all normalized to the canonical "city, country" form and alphabetized.
  const locationOptions = Array.from(
    new Set([
      ...userDefinedLocations.map((l) => normalizeLocation(l)),
      ...applications.map((a) => normalizeLocation(a.location)).filter(Boolean),
    ])
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const visibleApplications = applications
    .filter((app) => {
      if (
        categoryFilter !== 'all' &&
        normalizeCategory(app.category) !== categoryFilter
      ) {
        return false;
      }
      if (!search.trim()) return true;
      const haystack = `${app.title} ${app.organization_name} ${
        app.location || ''
      } ${app.category || ''} ${app.description || ''}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'category') {
        return normalizeCategory(a.category).localeCompare(
          normalizeCategory(b.category)
        );
      }
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    });

  // ---- field editors -------------------------------------------------------
  const patch = (partial) => {
    if (!selectedApp) return;
    updateApplication(selectedApp.id, partial);
  };

  const handleMetaChange = (field, value) => patch({ [field]: value });

  const handleAddOption = (kind, value) => {
    const v = (value || '').trim();
    if (!v) return;
    const addCI = (list) =>
      list.some((x) => x.toLowerCase() === v.toLowerCase()) ? list : [...list, v];
    const addLower = (list) => {
      const lv = v.toLowerCase();
      return list.includes(lv) ? list : [...list, lv];
    };
    if (kind === 'status') setUserDefinedStatusOptions(addCI);
    else if (kind === 'priority') setUserDefinedPriorityOptions(addCI);
    else if (kind === 'applicationMethod') setUserDefinedApplicationMethods(addCI);
    else if (kind === 'category') setUserDefinedCategories(addLower);
    else if (kind === 'location') setUserDefinedLocations(addLower);
  };

  const handleGoalChange = (chosenDate) => {
    if (!selectedApp) return;
    if (new Date(chosenDate) > new Date(selectedApp.application_deadline)) {
      alert(
        'Validation Error: Personal goal date cannot sit past the official application deadline!'
      );
      return;
    }
    patch({ personal_completion_deadline: chosenDate });
  };

  const handleDeadlineChange = (chosenDate) => {
    if (!selectedApp) return;
    const partial = { application_deadline: chosenDate };
    if (
      selectedApp.personal_completion_deadline &&
      new Date(selectedApp.personal_completion_deadline) > new Date(chosenDate)
    ) {
      partial.personal_completion_deadline = chosenDate;
    }
    patch(partial);
  };

  const handleNewApplication = () => {
    const deadline = todayISO();
    const id = addApplication({
      title: 'New Application',
      organization_name: 'Untitled organization',
      category: 'career',
      location: 'remote',
      status: 'Saved',
      priority: 'Medium Priority',
      applicationMethod: 'Company Website',
      org_description: '',
      description: '',
      source_url: '',
      application_deadline: deadline,
      personal_completion_deadline: deadline,
      notes: '',
      my_notes: '',
      tasks: [],
      requirements: { technical_skills: [] },
      updated_at: Date.now(),
      follow_up_date: '',
      follow_up_method: 'Email',
      follow_up_reminder: false,
      contacts: {},
      custom_skills: [],
      skill_labels: {},
      timeline: [{ id: `tl-${Date.now()}`, label: 'Saved', date: todayISO() }],
      outcome: '',
    });
    setActiveId(id);
    setSearch('');
    setCategoryFilter('all');
  };

  const handleAddTask = () => {
    if (!selectedApp) return;
    addTask(selectedApp.id, newTaskText);
    setNewTaskText('');
  };

  const tasks = selectedApp?.tasks || [];
  const doneCount = tasks.filter((t) => t.done).length;

  // ---- contacts ------------------------------------------------------------
  const isEducation =
    normalizeCategory(selectedApp?.category) === 'education';
  const isCareer = normalizeCategory(selectedApp?.category) === 'career';
  const descriptionLabel = isEducation
    ? 'Program Description'
    : isCareer
    ? 'Job Description'
    : 'Description';
  const overviewLabel = isEducation
    ? 'Program Overview'
    : isCareer
    ? 'Company Overview'
    : 'Overview';
  const contactFields = isEducation ? EDUCATION_CONTACTS : CAREER_CONTACTS;
  const patchContact = (key, value) =>
    patch({ contacts: { ...(selectedApp?.contacts || {}), [key]: value } });

  // ---- skills board --------------------------------------------------------
  const skillsList = Array.from(
    new Set([
      ...((selectedApp?.requirements?.technical_skills) || []),
      ...((selectedApp?.custom_skills) || []),
    ])
  );
  const skillLabels = selectedApp?.skill_labels || {};
  // Click a skill to cycle through label states.
  const cycleSkillLabel = (skill) => {
    const current = skillLabels[skill];
    const idx = SKILL_LABELS.indexOf(current);
    const next = idx === SKILL_LABELS.length - 1 ? undefined : SKILL_LABELS[idx + 1];
    const nextLabels = { ...skillLabels };
    if (next) nextLabels[skill] = next;
    else delete nextLabels[skill];
    patch({ skill_labels: nextLabels });
  };
  const addCustomSkill = () => {
    const v = newSkillText.trim();
    if (!v || skillsList.includes(v)) {
      setNewSkillText('');
      return;
    }
    patch({ custom_skills: [...((selectedApp?.custom_skills) || []), v] });
    setNewSkillText('');
  };
  const removeCustomSkill = (skill) => {
    const nextLabels = { ...skillLabels };
    delete nextLabels[skill];
    patch({
      custom_skills: ((selectedApp?.custom_skills) || []).filter(
        (s) => s !== skill
      ),
      skill_labels: nextLabels,
    });
  };
  const isCustomSkill = (skill) =>
    ((selectedApp?.custom_skills) || []).includes(skill);

  // ---- timeline ------------------------------------------------------------
  const timeline = [...((selectedApp?.timeline) || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const addTimelineEvent = () => {
    const label = newTimelineLabel.trim();
    if (!label || !newTimelineDate) return;
    patch({
      timeline: [
        ...((selectedApp?.timeline) || []),
        { id: `tl-${Date.now()}`, label, date: newTimelineDate },
      ],
    });
    setNewTimelineLabel('');
    setNewTimelineDate(todayISO());
  };
  const removeTimelineEvent = (eventId) =>
    patch({
      timeline: ((selectedApp?.timeline) || []).filter((e) => e.id !== eventId),
    });

  const paneCard =
    'flex flex-col h-full rounded-2xl border border-teal-500/15 bg-[#0a141d]/50 shadow-xl shadow-black/30 ring-1 ring-inset ring-white/[0.02] overflow-hidden';
  // Resizable content textareas (drag the bottom-right corner: resize:both).
  const resizableArea =
    'w-full max-w-full p-4 rounded-2xl border border-teal-900/30 bg-[#060c12]/80 text-slate-300 text-sm focus:outline-none focus:border-teal-500/50 resize overflow-auto';
  const calBtn = (active) =>
    `h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border text-sm transition ${
      active
        ? 'bg-teal-500/20 border-teal-400/50 text-teal-200'
        : 'bg-teal-950/50 border-teal-500/20 text-teal-400 hover:bg-teal-900'
    }`;
  const glassCard =
    'bg-teal-950/10 border border-teal-500/10 p-5 rounded-2xl backdrop-blur-xl';

  return (
    <div className="flex h-screen w-screen bg-[#070e14] text-cyan-50 font-sans overflow-hidden select-none">
      {/* 0. SIDEBAR PANEL (resizable width; shifts panes; collapses left) */}
      <aside
        style={{ width: sidebarOpen ? sidebarWidth : 0 }}
        className={`relative shrink-0 bg-[#f7f4ef] border-r border-[#e9e4dd] flex flex-col ${
          sidebarOpen ? 'p-6 opacity-100' : 'p-0 opacity-0 overflow-hidden border-r-0'
        } ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-[#3f6f6b] font-black tracking-wide">
            Academix
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#a3c9c7] text-[#3a3a3a] border border-[#7aa7a3]/40 hover:bg-[#7aa7a3] transition"
            title="Collapse navigation"
            aria-label="Collapse navigation"
          >
            ◀
          </button>
        </div>
        <nav className="flex-1 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#a3c9c7] text-[#3f6f6b] border border-[#7aa7a3]/40 shadow-sm
">
            📁 All Applications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#7a7a7a] hover:text-[#3f6f6b] hover:bg-[#cddcc7]/40 transition transition-all">
            🎓 My Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#7a7a7a] hover:text-[#3f6f6b] hover:bg-[#cddcc7]/40 transition transition-all">
            ⚙️ Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#7a7a7a] hover:text-[#3f6f6b] hover:bg-[#cddcc7]/40 transition transition-all">
            📊 Analytics
          </button>
        </nav>
        <div className="pt-4 mt-4 border-t border-teal-900/20 text-[11px] font-medium flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? 'bg-[#9fb89a] animate-pulse' : 'bg-[#b7c9b0]'
            }`}
          />
          <span className="text-[#5a5a5a]">
            {isLive ? 'Firestore live sync' : 'Local demo data'}
          </span>
        </div>

        {/* DRAGGABLE RIGHT EDGE — resize the sidebar by grabbing its boundary */}
        {sidebarOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            onMouseDown={(e) => {
              setIsResizing(true);
              startColumnDrag(e, resizeSidebar, () => setIsResizing(false));
            }}
            className="group absolute top-0 right-0 h-full w-1.5 cursor-col-resize"
          >
            <div className="absolute inset-y-0 right-0 w-px bg-transparent group-hover:bg-[#7aa7a3]/60 group-active:bg-[#5f8f8b]/80 transition-colors" />
          </div>
        )}
      </aside>

      {/* THREE PANES WRAPPER CONTAINER */}
      <div className="flex flex-1 h-full overflow-hidden relative gap-2 p-4">
        {/* SIDEBAR EXPANSION FLOATING ICON (only when collapsed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-6 left-6 z-50 px-3 py-2 rounded-lg bg-[#a3c9c7] text-[#3a3a3a] border border-[#7aa7a3]/40 hover:bg-[#7aa7a3] transition text-xs font-semibold transition shadow-lg"
            title="Open navigation panel"
          >
            ▶ Menu
          </button>
        )}

        {/* PANE 1: SEARCH AND INDEX TREE */}
        <section
          style={{ width: pane1Width }}
          className={`shrink-0 ${paneCard} ${!sidebarOpen ? 'pt-12' : ''}`}
        >
          <div className="p-4 border-b border-teal-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200">
                Applications{' '}
                <span className="text-teal-500/80">({applications.length})</span>
              </h3>
              <button
                onClick={handleNewApplication}
                className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition"
              >
                + New
              </button>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, company, category..."
              className="w-full px-4 py-2 border border-teal-900/30 rounded-xl text-sm bg-[#060c12] text-teal-100 placeholder-teal-800/40 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30"
            />
            <div className="flex items-center justify-between text-xs text-teal-600/80 font-medium px-1">
              <span>Sort Strategy:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-teal-400 cursor-pointer focus:outline-none hover:text-teal-300 transition"
              >
                <option value="application_deadline" className="bg-[#0a141d]">
                  Deadline of Application
                </option>
                <option
                  value="personal_completion_deadline"
                  className="bg-[#0a141d]"
                >
                  Personal Goal Deadline
                </option>
              </select>
            </div>
            <div className="flex items-center justify-between text-xs text-teal-600/80 font-medium px-1">
              <span>Filter:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-bold text-teal-400 cursor-pointer focus:outline-none hover:text-teal-300 transition"
              >
                <option value="all" className="bg-[#0a141d]">
                  All
                </option>
                {existingCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0a141d]">
                    {titleCase(cat)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {visibleApplications.map((app) => {
              const isActive = resolvedActiveId === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setActiveId(app.id)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-teal-950/40 to-cyan-950/20 border-teal-500/50 shadow-lg shadow-teal-500/10'
                      : 'bg-[#0b141d]/40 border-teal-950/40 hover:bg-teal-950/10 hover:border-teal-900/50'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-slate-200 truncate">
                      {app.title}
                    </h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md max-w-[90px] truncate ${categoryTagStyles(
                          app.category
                        )}`}
                      >
                        {categoryTagLabel(app.category)}
                      </span>
                      {isActive && (
                        <span className="h-4 w-4 flex items-center justify-center rounded-full bg-teal-500 text-[9px] text-[#04121a] font-black">
                          ✓
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-1">
                    {app.organization_name}
                  </p>
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>📅</span>
                      <span>Deadline:</span>
                      <span className="text-rose-400/90 font-medium">
                        {formatLong(app.application_deadline)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span>⏱️</span>
                      <span>Goal:</span>
                      <span className="text-teal-400/90 font-medium">
                        {formatLong(app.personal_completion_deadline)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleApplications.length === 0 && (
              <div className="px-3 py-8 text-center text-xs text-teal-800/70 font-medium">
                No applications match your filters.
              </div>
            )}
          </div>
        </section>

        {/* DIVIDER: index ↔ main */}
        <VerticalDivider
          onResize={resizePane1}
          onResizeStart={() => setIsResizing(true)}
          onResizeEnd={() => setIsResizing(false)}
          ariaLabel="Resize index list"
        />

        {/* PANE 2: MAIN DATA & NOTE DESCRIPTION CANVAS */}
        <section className={`flex-1 min-w-0 ${paneCard}`}>
          <div className="flex-1 overflow-y-auto p-8 bg-[#f7f4ef]/20">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Editable title + company */}
                <div className="space-y-2.5">
                  <input
                    value={selectedApp.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Job / programme title"
                    className="w-full bg-transparent text-2xl font-black tracking-tight text-white focus:outline-none focus:bg-[#060c12]/60 rounded-lg px-1 -ml-1 transition"
                  />
                  <input
                    value={selectedApp.organization_name}
                    onChange={(e) => patch({ organization_name: e.target.value })}
                    placeholder="Organization / company"
                    className="w-full bg-transparent text-lg font-semibold text-teal-300 focus:outline-none focus:bg-[#060c12]/60 rounded-lg px-1 -ml-1 transition"
                  />
                  {/* Optional organization/program overview, under the org name */}
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    {overviewLabel}
                  </span>
                  <textarea
                    value={selectedApp.org_description || ''}
                    onChange={(e) => patch({ org_description: e.target.value })}
                    placeholder="Organization description (optional)"
                    className={`${resizableArea} h-12 min-h-[2.5rem] !rounded-xl text-xs text-slate-400`}
                  />
                </div>

                {/* Status / Priority / Application Method — inline label + button */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest w-40 shrink-0">
                      Status:
                    </span>
                    <StatusSelector
                      value={selectedApp.status}
                      options={userDefinedStatusOptions}
                      onSelect={(v) => handleMetaChange('status', v)}
                      onAddOption={(v) => handleAddOption('status', v)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest w-40 shrink-0">
                      Priority:
                    </span>
                    <PrioritySelector
                      value={selectedApp.priority}
                      options={userDefinedPriorityOptions}
                      onSelect={(v) => handleMetaChange('priority', v)}
                      onAddOption={(v) => handleAddOption('priority', v)}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest w-40 shrink-0">
                      Application Method:
                    </span>
                    <ApplicationMethodSelector
                      value={selectedApp.applicationMethod}
                      options={userDefinedApplicationMethods}
                      onSelect={(v) => handleMetaChange('applicationMethod', v)}
                      onAddOption={(v) =>
                        handleAddOption('applicationMethod', v)
                      }
                    />
                  </div>
                </div>

                {/* Description (resizable) — label adapts to category */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    {descriptionLabel}
                  </span>
                  <textarea
                    value={selectedApp.description || ''}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="Short summary of this opportunity..."
                    className={`${resizableArea} h-16 min-h-[3rem]`}
                  />
                </div>

                {/* Editable, resizable Source URL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1 pr-0.5">
                    <span className="text-xs font-bold text-teal-500 uppercase tracking-widest">
                      Source URL
                    </span>
                    {selectedApp.source_url ? (
                      <a
                        href={selectedApp.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:text-cyan-200 transition"
                      >
                        Open ↗
                      </a>
                    ) : null}
                  </div>
                  <textarea
                    value={selectedApp.source_url || ''}
                    onChange={(e) =>
                      patch({ source_url: e.target.value.replace(/\n/g, '') })
                    }
                    rows={1}
                    placeholder="https://..."
                    className={`${resizableArea} h-12 min-h-[3rem] !rounded-xl text-cyan-300/80`}
                  />
                </div>

                {/* AI Extracted Skills */}
                <div className="space-y-3 bg-[#0a141d]/30 border border-teal-950/40 p-5 rounded-2xl">
                  <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">
                    🛠️ AI Extracted Skills
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    {selectedApp.category === 'education' ? (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span> Minimum
                          Academic GPA Target:{' '}
                          {selectedApp.requirements?.gpa_threshold || '—'}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span>{' '}
                          Secondary Prerequisites:{' '}
                          {selectedApp.requirements?.standardized_tests || '—'}
                        </li>
                      </>
                    ) : selectedApp.requirements?.technical_skills?.length ? (
                      selectedApp.requirements.technical_skills.map((skill) => (
                        <li key={skill} className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span> {skill}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-slate-500 italic">
                        No extracted skills yet.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Core Scraping Notes (resizable) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    📝 Core Scraping Notes
                  </label>
                  <textarea
                    value={selectedApp.notes || ''}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder="AI / scraping notes..."
                    className={`${resizableArea} h-20 min-h-[3.5rem]`}
                  />
                </div>

                {/* My Notes (resizable) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    🗒️ My Notes
                  </label>
                  <textarea
                    value={selectedApp.my_notes || ''}
                    onChange={(e) => patch({ my_notes: e.target.value })}
                    placeholder="Your personal notes, reminders and thoughts..."
                    className={`${resizableArea} h-20 min-h-[3.5rem]`}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-teal-800 text-sm font-medium tracking-wide">
                Select an active entry to verify structural tracking information.
              </div>
            )}
          </div>
        </section>

        {/* DIVIDER: main ↔ right pane */}
        <VerticalDivider
          onResize={resizePane3}
          onResizeStart={() => setIsResizing(true)}
          onResizeEnd={() => setIsResizing(false)}
          ariaLabel="Resize metadata pane"
        />

        {/* PANE 3: RIGHT SIDEBAR — Status, Priority, Method, Location,
            Category, Deadlines, Tasks (in this order) */}
        <section style={{ width: pane3Width }} className={`shrink-0 ${paneCard}`}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedApp ? (
              <>
                {/* LOCATION / CATEGORY */}
                <div className={`flex flex-col gap-3 ${glassCard}`}>
                  <FieldGroup label="Location">
                    <LocationSelector
                      value={selectedApp.location}
                      options={locationOptions}
                      onSelect={(v) => handleMetaChange('location', v)}
                      onAddOption={(v) => handleAddOption('location', v)}
                    />
                  </FieldGroup>

                  <FieldGroup label="Category">
                    <CategorySelector
                      value={selectedApp.category}
                      options={categoryOptions}
                      onSelect={(v) => handleMetaChange('category', v)}
                      onAddOption={(v) => handleAddOption('category', v)}
                    />
                  </FieldGroup>
                </div>

                {/* DEADLINES */}
                <div className={`flex flex-col gap-4 ${glassCard}`}>
                  <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                    Deadlines:
                  </span>

                  {/* Application deadline (editable via toggle calendar) */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📅</span>
                        <div>
                          <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                            Deadline of Application
                          </p>
                          <p className="text-sm text-rose-400 font-bold">
                            {formatLong(selectedApp.application_deadline)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setOpenCalendar((c) =>
                            c === 'deadline' ? null : 'deadline'
                          )
                        }
                        className={calBtn(openCalendar === 'deadline')}
                        title="Toggle deadline calendar"
                        aria-label="Toggle deadline calendar"
                      >
                        📆
                      </button>
                    </div>
                    {openCalendar === 'deadline' && (
                      <div className="mt-3">
                        <Calendar
                          value={selectedApp.application_deadline}
                          onSelect={handleDeadlineChange}
                        />
                      </div>
                    )}
                  </div>

                  {/* Personal completion deadline (editable via toggle calendar) */}
                  <div className="border-t border-teal-900/20 pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">⏱️</span>
                        <div>
                          <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                            Personal Completion Deadline
                          </p>
                          <p className="text-sm text-teal-200 font-bold">
                            {selectedApp.personal_completion_deadline
                              ? formatLong(
                                  selectedApp.personal_completion_deadline
                                )
                              : 'Pick a date'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setOpenCalendar((c) => (c === 'goal' ? null : 'goal'))
                        }
                        className={calBtn(openCalendar === 'goal')}
                        title="Toggle goal calendar"
                        aria-label="Toggle goal calendar"
                      >
                        📆
                      </button>
                    </div>
                    {openCalendar === 'goal' && (
                      <div className="mt-3">
                        <Calendar
                          value={selectedApp.personal_completion_deadline}
                          max={selectedApp.application_deadline}
                          onSelect={handleGoalChange}
                        />
                      </div>
                    )}
                    <p className="text-[10px] text-teal-700/70 pl-1 mt-2">
                      Goal date is capped at the official closing date.
                    </p>
                  </div>
                </div>

                {/* TASKS */}
                <div className={`flex flex-col gap-3 ${glassCard}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                      Tasks:
                    </span>
                    <span className="text-xs font-bold text-teal-300">
                      {doneCount}/{tasks.length} completed
                    </span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-[#060c12] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all"
                      style={{
                        width: `${
                          tasks.length
                            ? Math.round((doneCount / tasks.length) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <ul className="space-y-1.5">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="group flex items-center gap-2.5 text-sm"
                      >
                        <button
                          onClick={() => toggleTask(selectedApp.id, task.id)}
                          className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[9px] font-black transition ${
                            task.done
                              ? 'bg-teal-500 border-teal-400 text-[#04121a]'
                              : 'border-teal-700/50 text-transparent hover:border-teal-400'
                          }`}
                          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          ✓
                        </button>
                        <span
                          className={`flex-1 ${
                            task.done
                              ? 'line-through text-slate-600'
                              : 'text-slate-300'
                          }`}
                        >
                          {task.text}
                        </span>
                        <button
                          onClick={() => removeTask(selectedApp.id, task.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 text-xs transition"
                          aria-label="Delete task"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                    {tasks.length === 0 && (
                      <li className="text-xs text-slate-600 italic">
                        No tasks yet — add one below.
                      </li>
                    )}
                  </ul>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask();
                      }}
                      placeholder="Add a task..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#060c12] border border-teal-900/40 text-teal-100 text-xs focus:outline-none focus:border-teal-500/50"
                    />
                    <button
                      onClick={handleAddTask}
                      className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* A. LAST UPDATED */}
                <CollapsibleSection title="Last Updated" defaultOpen={false}>
                  <p className="text-sm text-slate-300">
                    {formatDateTime(selectedApp.updated_at)}
                  </p>
                </CollapsibleSection>

                {/* B. FOLLOW-UP */}
                <CollapsibleSection title="Follow-up" defaultOpen={false}>
                  <div className="flex flex-col gap-3">
                    <FieldGroup label="Follow-up date">
                      <div>
                        <button
                          onClick={() =>
                            setOpenCalendar((c) =>
                              c === 'followup' ? null : 'followup'
                            )
                          }
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#060c12] text-teal-200 text-xs transition ${
                            selectedApp.follow_up_reminder
                              ? 'border border-teal-400/60 ring-1 ring-teal-400/40'
                              : 'border border-teal-900/40 hover:border-teal-500/50'
                          }`}
                        >
                          <span>📆</span>
                          {selectedApp.follow_up_date
                            ? formatLong(selectedApp.follow_up_date)
                            : 'Pick a date'}
                        </button>
                        {openCalendar === 'followup' && (
                          <div className="mt-2">
                            <Calendar
                              value={selectedApp.follow_up_date}
                              onSelect={(d) => {
                                patch({ follow_up_date: d });
                                setOpenCalendar(null);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </FieldGroup>
                    <FieldGroup label="Follow-up method">
                      <Selector
                        value={selectedApp.follow_up_method}
                        options={FOLLOWUP_METHODS}
                        onSelect={(v) => patch({ follow_up_method: v })}
                        onAddOption={() => {}}
                      />
                    </FieldGroup>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                        Reminder:
                      </span>
                      <button
                        onClick={() =>
                          patch({
                            follow_up_reminder: !selectedApp.follow_up_reminder,
                          })
                        }
                        className={`relative h-5 w-9 rounded-full transition ${
                          selectedApp.follow_up_reminder
                            ? 'bg-teal-500'
                            : 'bg-slate-700'
                        }`}
                        aria-label="Toggle reminder"
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                            selectedApp.follow_up_reminder ? 'left-4' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </CollapsibleSection>

                {/* C. CONTACTS (dynamic by category) */}
                <CollapsibleSection title="Contacts" defaultOpen={false}>
                  <div className="flex flex-col gap-3">
                    {contactFields.map((f) => (
                      <FieldGroup key={f.key} label={f.label}>
                        <input
                          value={selectedApp.contacts?.[f.key] || ''}
                          onChange={(e) => patchContact(f.key, e.target.value)}
                          placeholder={f.label}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#060c12]/80 border border-teal-900/40 text-slate-200 text-xs focus:outline-none focus:border-teal-500/50 transition"
                        />
                      </FieldGroup>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* D. SKILLS BOARD */}
                <CollapsibleSection title="Skills Board" defaultOpen={false}>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {skillsList.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1"
                        >
                          <button
                            onClick={() => cycleSkillLabel(skill)}
                            title={
                              skillLabels[skill]
                                ? `Label: ${skillLabels[skill]} (click to change)`
                                : 'Click to label'
                            }
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${skillLabelStyle(
                              skillLabels[skill]
                            )}`}
                          >
                            {skill}
                            {skillLabels[skill] ? (
                              <span className="opacity-70">
                                · {skillLabels[skill]}
                              </span>
                            ) : null}
                          </button>
                          {isCustomSkill(skill) && (
                            <button
                              onClick={() => removeCustomSkill(skill)}
                              className="text-slate-600 hover:text-rose-400 text-[10px]"
                              aria-label="Remove skill"
                            >
                              ✕
                            </button>
                          )}
                        </span>
                      ))}
                      {skillsList.length === 0 && (
                        <span className="text-xs text-slate-600 italic">
                          No skills yet.
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addCustomSkill();
                        }}
                        placeholder="Add a skill..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#060c12] border border-teal-900/40 text-teal-100 text-xs focus:outline-none focus:border-teal-500/50"
                      />
                      <button
                        onClick={addCustomSkill}
                        className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition"
                      >
                        Add
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      Aggregated from AI-extracted skills + your manual additions.
                      Click a tag to cycle: Strong → Needs Improvement → Add to
                      Resume → Add to Portfolio.
                    </p>
                  </div>
                </CollapsibleSection>

                {/* E. TIMELINE */}
                <CollapsibleSection title="Timeline" defaultOpen={false}>
                  <div className="flex flex-col gap-3">
                    <ul className="pl-1">
                      {timeline.map((ev, i) => (
                        <li
                          key={ev.id}
                          className="group relative flex gap-3 pb-3 last:pb-0"
                        >
                          <div className="flex flex-col items-center">
                            <span className="h-2.5 w-2.5 rounded-full bg-teal-400 ring-2 ring-teal-400/20 mt-1" />
                            {i < timeline.length - 1 && (
                              <span className="w-px flex-1 bg-teal-900/50 mt-1" />
                            )}
                          </div>
                          <div className="flex-1 -mt-0.5">
                            <p className="text-sm text-slate-200 font-medium">
                              {ev.label}
                            </p>
                            <p className="text-[11px] text-teal-500/80">
                              {formatLong(ev.date)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeTimelineEvent(ev.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 text-xs self-start"
                            aria-label="Remove event"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                      {timeline.length === 0 && (
                        <li className="text-xs text-slate-600 italic">
                          No events yet.
                        </li>
                      )}
                    </ul>
                    <div className="flex flex-wrap gap-1.5">
                      {['Saved', 'Researched', 'Applied', 'Follow-up', 'Interview'].map(
                        (s) => (
                          <button
                            key={s}
                            onClick={() => setNewTimelineLabel(s)}
                            className="px-2 py-0.5 rounded-full bg-teal-950/40 border border-teal-500/20 text-teal-300 text-[10px] hover:bg-teal-900/40 transition"
                          >
                            {s}
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          value={newTimelineLabel}
                          onChange={(e) => setNewTimelineLabel(e.target.value)}
                          placeholder="Event"
                          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg bg-[#060c12] border border-teal-900/40 text-teal-100 text-xs focus:outline-none focus:border-teal-500/50"
                        />
                        <button
                          onClick={() =>
                            setOpenCalendar((c) =>
                              c === 'timeline' ? null : 'timeline'
                            )
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#060c12] border border-teal-900/40 text-teal-200 text-xs hover:border-teal-500/50 transition"
                        >
                          <span>📆</span>
                          {formatLong(newTimelineDate)}
                        </button>
                        <button
                          onClick={addTimelineEvent}
                          className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold hover:bg-teal-500/20 transition"
                        >
                          Add
                        </button>
                      </div>
                      {openCalendar === 'timeline' && (
                        <Calendar
                          value={newTimelineDate}
                          onSelect={(d) => {
                            setNewTimelineDate(d);
                            setOpenCalendar(null);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* F. OUTCOME */}
                <CollapsibleSection
                  title="Outcome"
                  defaultOpen={false}
                  highlight={selectedApp.outcome === 'Offer'}
                  right={
                    selectedApp.outcome ? (
                      <span className="text-[10px] text-teal-300 font-semibold">
                        {selectedApp.outcome}
                      </span>
                    ) : null
                  }
                >
                  <Selector
                    value={selectedApp.outcome}
                    options={OUTCOME_OPTIONS}
                    onSelect={(v) => patch({ outcome: v })}
                    onAddOption={() => {}}
                  />
                </CollapsibleSection>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-teal-800 text-xs font-medium tracking-wide text-center">
                Metadata appears here once an entry is selected.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
