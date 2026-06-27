'use client';

import { useState } from 'react';

const identity = (v) => v;

// A pill-style dropdown selector with an inline input. When `predictive` is on,
// typing fuzzily filters the options (case-insensitive substring) so partial
// text predicts existing entries; otherwise the input only adds a custom label.
// `format` controls how stored values are displayed (e.g. Title Case), while
// `normalize` controls the canonical stored form (e.g. lowercase).
function MetadataSelector({
  icon,
  value,
  options,
  onSelect,
  onAddOption,
  predictive = false,
  format = identity,
  normalize = identity,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  // Always allow the current value to be selectable.
  const allOptions =
    value && !options.some((o) => normalize(o) === normalize(value))
      ? [value, ...options]
      : options;

  const query = normalize(text.trim());
  const filtered =
    predictive && query
      ? allOptions.filter((o) => normalize(o).includes(query))
      : allOptions;

  const commit = () => {
    const raw = text.trim();
    if (!raw) return;

    // Prefer predicting an existing option: exact normalized match first, then
    // the top fuzzy suggestion.
    if (predictive && filtered.length) {
      const exact = filtered.find((o) => normalize(o) === query);
      onSelect(exact || filtered[0]);
    } else {
      const norm = normalize(raw);
      onAddOption(norm);
      onSelect(norm);
    }
    setText('');
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full bg-teal-950/40 border border-teal-500/20 px-3 py-1 text-[11px] font-semibold text-teal-200 hover:bg-teal-900/40 transition"
      >
        {icon ? <span className="text-[10px] leading-none">{icon}</span> : null}
        <span>{value ? format(value) : 'Set'}</span>
        <span className="text-[8px] text-teal-500/80">▼</span>
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-52 rounded-xl border border-teal-500/20 bg-[#0a141d]/95 backdrop-blur-md shadow-xl shadow-black/40 p-1.5">
            <div className="flex items-center gap-1 mb-1 pb-1.5 border-b border-teal-900/40">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                }}
                placeholder={predictive ? 'Search or add...' : 'Add custom label...'}
                className="flex-1 min-w-0 px-2 py-1 rounded-md bg-[#060c12] border border-teal-900/40 text-[11px] text-teal-100 placeholder-teal-800/50 focus:outline-none focus:border-teal-500/50"
              />
              <button
                type="button"
                onClick={commit}
                className="px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold hover:bg-teal-500/20 transition"
                aria-label="Add or select"
              >
                +
              </button>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-0.5">
              {filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setText('');
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                    normalize(opt) === normalize(value)
                      ? 'bg-teal-500/15 text-teal-200'
                      : 'text-slate-300 hover:bg-teal-900/40'
                  }`}
                >
                  {format(opt)}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-2.5 py-1.5 text-[11px] text-slate-500 italic">
                  Press + to add “{text.trim()}”
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Plain-text label header with its standalone control stacked underneath.
export function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
        {label}:
      </span>
      {children}
    </div>
  );
}

// Title Case helper used for category display (stored lowercase).
const titleCase = (s) =>
  (s || '')
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
const lower = (s) => (s || '').trim().toLowerCase();

export const StatusSelector = (props) => (
  <MetadataSelector icon="🔖" {...props} />
);
export const PrioritySelector = (props) => (
  <MetadataSelector icon="⚡" {...props} />
);
export const ApplicationMethodSelector = (props) => (
  <MetadataSelector icon="🌐" {...props} />
);
// Category: stored lowercase, shown Title Case, fuzzy/predictive matching.
export const CategorySelector = (props) => (
  <MetadataSelector
    icon="🏷️"
    predictive
    format={titleCase}
    normalize={lower}
    {...props}
  />
);

export { titleCase };
