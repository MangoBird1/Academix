'use client';

import { useState } from 'react';

// Inline month calendar for picking the personal completion deadline.
//
// - `value`  : currently selected date as 'YYYY-MM-DD' (or empty).
// - `max`    : hard cap (the application deadline) as 'YYYY-MM-DD'. Days after
//              this are disabled, and the cap day itself is marked distinctly.
// - `onSelect(iso)` : fired with the chosen 'YYYY-MM-DD' string.
//
// Weeks start on Monday to match the reference layout.

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = (s) => (s ? new Date(`${s}T00:00:00`) : null);

const sameDay = (date, y, m, d) =>
  !!date &&
  date.getFullYear() === y &&
  date.getMonth() === m &&
  date.getDate() === d;

export default function Calendar({ value, max, onSelect }) {
  const selected = parseISO(value);
  const maxDate = parseISO(max);
  const anchor = selected || maxDate || new Date();

  const [view, setView] = useState({
    year: anchor.getFullYear(),
    month: anchor.getMonth(),
  });

  const firstOfMonth = new Date(view.year, view.month, 1);
  // Convert JS Sunday-first (0) index into a Monday-first offset.
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();

  const goPrev = () =>
    setView((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }
    );
  const goNext = () =>
    setView((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }
    );

  const cells = [];
  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  const handlePick = (day) => {
    const iso = toISO(view.year, view.month, day);
    if (onSelect) onSelect(iso);
  };

  return (
    <div className="rounded-2xl border border-teal-500/20 bg-[#060c12]/90 p-3 shadow-lg shadow-teal-500/5">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          onClick={goPrev}
          className="h-6 w-6 rounded-md text-teal-400 hover:bg-teal-900/40 transition flex items-center justify-center"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-xs font-bold tracking-wide text-teal-200">
          {MONTH_NAMES[view.month]} {view.year}
        </span>
        <button
          type="button"
          onClick={goNext}
          className="h-6 w-6 rounded-md text-teal-400 hover:bg-teal-900/40 transition flex items-center justify-center"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-0.5 pb-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-[10px] font-semibold text-teal-700/80"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`blank-${idx}`} />;

          const thisDate = new Date(view.year, view.month, day);
          const isSelected = sameDay(selected, view.year, view.month, day);
          const isDeadline = sameDay(maxDate, view.year, view.month, day);
          const isDisabled = maxDate && thisDate > maxDate;

          let cls =
            'h-7 w-full rounded-md text-[11px] font-semibold flex items-center justify-center transition ';
          if (isDisabled) {
            cls += 'text-slate-700 cursor-not-allowed';
          } else if (isSelected) {
            cls +=
              'bg-gradient-to-br from-teal-500 to-cyan-500 text-[#04121a] shadow-md shadow-teal-500/30';
          } else if (isDeadline) {
            cls +=
              'bg-rose-500/15 text-rose-300 border border-rose-500/40 cursor-pointer hover:bg-rose-500/25';
          } else {
            cls +=
              'text-slate-300 cursor-pointer hover:bg-teal-900/40 hover:text-teal-200';
          }

          return (
            <button
              key={`d-${day}`}
              type="button"
              disabled={isDisabled}
              onClick={() => handlePick(day)}
              title={isDeadline ? 'Application deadline (latest allowed)' : undefined}
              className={cls}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-3 px-1 pt-2 border-t border-teal-900/30 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500" />
          Goal
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500/60" />
          Deadline cap
        </span>
      </div>
    </div>
  );
}
