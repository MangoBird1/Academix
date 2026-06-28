'use client';

import { useMemo } from 'react';
import { useApplications } from '@/lib/useApplications';
import { seedApplications } from '@/lib/seedData';
import { computeAnalytics } from '@/lib/analytics';

const card =
  'bg-[#faf7f3] border border-[#e9e4dd] rounded-2xl p-6 shadow-sm';
const label =
  'text-[10px] font-bold uppercase tracking-wide text-[#7aa7a3] leading-snug';
const sectionTitle = 'text-[#2f2f2f] font-semibold text-lg leading-relaxed';
const statValue = 'text-3xl font-bold text-[#3f6f6b]';
const statLabel = 'text-[#3a3a3a] text-sm';

const BAR_COLORS = [
  '#7aa7a3',
  '#a3c9c7',
  '#5f8f8b',
  '#b08968',
  '#cddcc7',
  '#c75c5c',
  '#6fa87a',
];

function BarChart({ rows, max }) {
  const peak = max || Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-3">
      {rows.map(({ label: lbl, value, color }, i) => (
        <div key={lbl}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#2f2f2f] font-medium">{lbl}</span>
            <span className="text-[#3a3a3a]">{value}</span>
          </div>
          <div className="h-2.5 bg-[#e9e4dd] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((value / peak) * 100)}%`,
                backgroundColor: color || BAR_COLORS[i % BAR_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { applications } = useApplications(seedApplications);

  // Always derived from the live application data — recomputes whenever an
  // application (or its skills / timeline) is added, edited, patched or removed.
  const stats = useMemo(() => computeAnalytics(applications), [applications]);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className={`${sectionTitle} text-2xl`}>Analytics</h1>
          <p className="text-[#3a3a3a] text-sm mt-1 leading-relaxed">
            Overview of your applications, skills, and activity.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className={`${card} text-center`}>
            <p className={statValue}>{stats.total}</p>
            <p className={statLabel}>Total applications</p>
          </div>
          <div className={`${card} text-center`}>
            <p className={statValue}>{stats.categoriesTracked}</p>
            <p className={statLabel}>Categories tracked</p>
          </div>
          <div className={`${card} text-center`}>
            <p className={statValue}>{stats.timelineEventCount}</p>
            <p className={statLabel}>Timeline events</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className={card}>
            <p className={`${label} mb-1`}>Breakdown</p>
            <h2 className={`${sectionTitle} mb-4`}>By category</h2>
            {stats.categoryRows.length ? (
              <BarChart rows={stats.categoryRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No data yet.</p>
            )}
          </section>

          <section className={card}>
            <p className={`${label} mb-1`}>Pipeline</p>
            <h2 className={`${sectionTitle} mb-4`}>Status breakdown</h2>
            {stats.statusRows.length ? (
              <BarChart rows={stats.statusRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No data yet.</p>
            )}
          </section>

          <section className={card}>
            <p className={`${label} mb-1`}>Outcomes</p>
            <h2 className={`${sectionTitle} mb-4`}>Results</h2>
            {stats.outcomeRows.length ? (
              <BarChart rows={stats.outcomeRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No outcomes recorded.</p>
            )}
          </section>

          <section className={card}>
            <p className={`${label} mb-1`}>Skills</p>
            <h2 className={`${sectionTitle} mb-4`}>Top skills frequency</h2>
            {stats.skillRows.length ? (
              <BarChart rows={stats.skillRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No skills tracked.</p>
            )}
          </section>

          <section className={card}>
            <p className={`${label} mb-1`}>Activity</p>
            <h2 className={`${sectionTitle} mb-4`}>Timeline events / month</h2>
            {stats.timelineRows.length ? (
              <BarChart rows={stats.timelineRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No timeline events.</p>
            )}
          </section>

          <section className={card}>
            <p className={`${label} mb-1`}>Deadlines</p>
            <h2 className={`${sectionTitle} mb-4`}>Deadline distribution</h2>
            {stats.deadlineRows.length ? (
              <BarChart rows={stats.deadlineRows} />
            ) : (
              <p className="text-[#3a3a3a] text-sm italic">No deadlines set.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
