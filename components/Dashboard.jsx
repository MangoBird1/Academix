'use client';

import { useState } from 'react';
import { useApplications } from '@/lib/useApplications';
import Calendar from '@/components/Calendar';

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

export default function AcademixTealDashboard({ initialApplications = [] }) {
  // The hook owns the list: it subscribes to Firestore (onSnapshot) when
  // configured and otherwise keeps the seed data in local state. Either way
  // `updateApplication` patches the UI instantly and persists when connected.
  const { applications, updateApplication, addApplication, isLive } =
    useApplications(initialApplications);

  const [activeId, setActiveId] = useState(initialApplications[0]?.id || null);
  const [sortBy, setSortBy] = useState('application_deadline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState('');

  // Keep a valid active selection even as the live list changes.
  const resolvedActiveId =
    applications.find((app) => app.id === activeId)?.id ||
    applications[0]?.id ||
    null;
  const selectedApp = applications.find((app) => app.id === resolvedActiveId);

  // Client-side search + quick sorting for zero-latency feedback.
  const visibleApplications = applications
    .filter((app) => {
      if (!search.trim()) return true;
      const haystack =
        `${app.title} ${app.organization_name} ${app.location || ''}`.toLowerCase();
      return haystack.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return new Date(a[sortBy]) - new Date(b[sortBy]);
    });

  // Safe handler to update and restrict dates: a personal goal date may never
  // sit past the official, externally-imposed application deadline.
  const handleDateChange = (chosenDate) => {
    if (!selectedApp) return;

    if (new Date(chosenDate) > new Date(selectedApp.application_deadline)) {
      alert(
        'Validation Error: Personal goal date cannot sit past the official application deadline!'
      );
      return;
    }

    updateApplication(selectedApp.id, {
      personal_completion_deadline: chosenDate,
    });
  };

  const handleNotesChange = (value) => {
    if (!selectedApp) return;
    updateApplication(selectedApp.id, { notes: value });
  };

  const handleNewApplication = () => {
    const deadline = todayISO();
    const id = addApplication({
      title: 'New Application',
      organization_name: 'Untitled organization',
      category: 'career',
      location: 'Remote',
      source_url: '',
      application_deadline: deadline,
      personal_completion_deadline: deadline,
      notes: '',
      requirements: { technical_skills: [] },
    });
    setActiveId(id);
    setSearch('');
  };

  const paneCard =
    'flex flex-col h-full rounded-2xl border border-teal-500/15 bg-[#0a141d]/50 shadow-xl shadow-black/30 ring-1 ring-inset ring-white/[0.02] overflow-hidden';

  return (
    <div className="flex h-screen w-screen bg-[#070e14] text-cyan-50 font-sans overflow-hidden select-none">
      {/* 0. SIDEBAR PANEL (SHIFTS SPLIT PANES DYNAMICALLY WHEN TOGGLED) */}
      <aside
        className={`bg-[#0a141d]/90 border-r border-teal-900/30 flex flex-col p-6 backdrop-blur-md transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? 'w-64 opacity-100'
            : 'w-0 p-0 opacity-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400 tracking-wider">
            Academix
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-teal-950/60 border border-teal-500/20 text-teal-400 hover:bg-teal-900 text-xs transition"
            title="Collapse navigation"
            aria-label="Collapse navigation"
          >
            ◀
          </button>
        </div>
        <nav className="flex-1 space-y-1.5">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold bg-teal-950/40 border border-teal-500/20 text-teal-300 shadow-lg shadow-teal-500/5">
            📁 All Applications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-teal-400 hover:bg-teal-950/20 transition-all">
            🎓 My Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-teal-400 hover:bg-teal-950/20 transition-all">
            ⚙️ Settings
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-teal-400 hover:bg-teal-950/20 transition-all">
            📊 Analytics
          </button>
        </nav>
        <div className="pt-4 mt-4 border-t border-teal-900/20 text-[11px] font-medium flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isLive ? 'bg-teal-400 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <span className="text-slate-500">
            {isLive ? 'Firestore live sync' : 'Local demo data'}
          </span>
        </div>
      </aside>

      {/* THREE PANES WRAPPER CONTAINER (gap + padding makes panes float as cards) */}
      <div className="flex flex-1 h-full overflow-hidden transition-all duration-300 ease-in-out relative gap-4 p-4">
        {/* SIDEBAR EXPANSION FLOATING ICON (only when collapsed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-6 left-6 z-50 px-3 py-2 rounded-lg bg-teal-950/80 border border-teal-500/30 text-teal-400 hover:bg-teal-900 text-xs font-semibold transition shadow-lg"
            title="Open navigation panel"
          >
            ▶ Menu
          </button>
        )}

        {/* PANE 1: SEARCH AND INDEX TREE */}
        <section
          className={`w-80 ${paneCard} ${!sidebarOpen ? 'pt-12' : ''}`}
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
              placeholder="Search applications..."
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
                <option value="category" className="bg-[#0a141d]">
                  Category
                </option>
              </select>
            </div>
          </div>

          {/* Dynamic Card Scroll Loop */}
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
                        className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md ${
                          app.category === 'career'
                            ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/20'
                            : 'bg-purple-950/60 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {app.category === 'career' ? 'Job' : 'Uni'}
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
                No applications match your search.
              </div>
            )}
          </div>
        </section>

        {/* PANE 2: MAIN DATA & NOTE DESCRIPTION CANVAS */}
        <section className={`flex-1 ${paneCard}`}>
          <div className="flex-1 overflow-y-auto p-8 bg-[#0a1520]/20">
            {selectedApp ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-white">
                    {selectedApp.title}
                  </h2>
                  <p className="text-md text-teal-400/80 font-medium mt-0.5">
                    {selectedApp.organization_name}
                  </p>
                </div>

                {/* URL Context Field */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    Source URL
                  </span>
                  <a
                    href={selectedApp.source_url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-[#060c12]/80 border border-teal-900/30 rounded-xl text-xs text-cyan-300/70 truncate hover:text-cyan-200 hover:border-teal-500/40 transition"
                  >
                    {selectedApp.source_url || 'No source URL yet'}
                  </a>
                </div>

                {/* AI Dynamic Extractors */}
                <div className="space-y-3 bg-[#0a141d]/30 border border-teal-950/40 p-5 rounded-2xl">
                  <h3 className="text-xs font-bold text-teal-500 uppercase tracking-widest">
                    🛠️ AI Extracted Targets
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    {selectedApp.category === 'career' ? (
                      selectedApp.requirements?.technical_skills?.map((skill) => (
                        <li key={skill} className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span> {skill}
                        </li>
                      ))
                    ) : (
                      <>
                        <li className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span> Minimum
                          Academic GPA Target:{' '}
                          {selectedApp.requirements?.gpa_threshold}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-xs text-teal-500">▪</span>{' '}
                          Secondary Prerequisites:{' '}
                          {selectedApp.requirements?.standardized_tests}
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* User Editable Notes Section */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-teal-500 uppercase tracking-widest block pl-1">
                    📝 Core Scraping Notes
                  </label>
                  <textarea
                    value={selectedApp.notes || ''}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add notes about this application..."
                    className="w-full h-32 p-4 rounded-2xl border border-teal-900/30 bg-[#060c12]/80 text-slate-300 text-sm focus:outline-none focus:border-teal-500/50 resize-none"
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

        {/* PANE 3: RIGHT ALIGNED METADATA PANEL */}
        <section className={`w-80 ${paneCard}`}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedApp ? (
              <>
                <div className="flex flex-col space-y-4 bg-teal-950/10 border border-teal-500/10 p-5 rounded-2xl backdrop-blur-xl">
                  {/* LOCATION */}
                  <div className="flex items-center gap-3.5 border-b border-teal-900/20 pb-3">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                        Location
                      </p>
                      <p className="text-sm text-slate-200 font-medium">
                        {selectedApp.location || 'Remote'}
                      </p>
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div className="flex items-center gap-3.5 border-b border-teal-900/20 pb-3">
                    <span className="text-lg">🏷️</span>
                    <div>
                      <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                        Category Type
                      </p>
                      <p className="text-sm text-slate-200 font-medium capitalize">
                        {selectedApp.category}
                      </p>
                    </div>
                  </div>

                  {/* APPLICATION DEADLINE */}
                  <div className="flex items-center gap-3.5">
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
                </div>

                {/* PERSONAL COMPLETION DEADLINE + INLINE CALENDAR */}
                <div className="flex flex-col gap-2 bg-teal-950/10 border border-teal-500/10 p-5 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-3.5">
                    <span className="text-lg">⏱️</span>
                    <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
                      Personal Completion Deadline
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-0.5">
                    When I want to complete this by
                  </p>

                  {/* Selected value display */}
                  <div className="px-3 py-2 rounded-xl bg-[#060c12] border border-teal-900/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
                    <span>
                      {selectedApp.personal_completion_deadline
                        ? formatLong(selectedApp.personal_completion_deadline)
                        : 'Pick a date'}
                    </span>
                    <span className="text-teal-600">📆</span>
                  </div>

                  {/* Inline calendar — capped at the application deadline */}
                  <Calendar
                    value={selectedApp.personal_completion_deadline}
                    max={selectedApp.application_deadline}
                    onSelect={handleDateChange}
                  />

                  <p className="text-[10px] text-teal-700/70 pl-1">
                    Goal date is capped at the official closing date.
                  </p>
                </div>
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
