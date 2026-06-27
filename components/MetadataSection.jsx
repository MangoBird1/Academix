'use client';

import { useState } from 'react';

// A single pill-style dropdown selector. The label now lives OUTSIDE the pill
// (rendered by <FieldGroup />), so the pill only shows the current value plus an
// inline input to add a custom option.
function MetadataSelector({ icon, value, options, onSelect, onAddOption }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');

  // Ensure the current value is always selectable even if it's not (yet) in the
  // option list (e.g. legacy/imported data).
  const allOptions =
    value && !options.includes(value) ? [value, ...options] : options;

  const commitCustom = () => {
    const next = custom.trim();
    if (!next) return;
    onAddOption(next);
    onSelect(next);
    setCustom('');
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
        <span>{value || 'Set'}</span>
        <span className="text-[8px] text-teal-500/80">▼</span>
      </button>

      {open && (
        <>
          {/* click-outside catcher */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 mt-1 w-52 rounded-xl border border-teal-500/20 bg-[#0a141d]/95 backdrop-blur-md shadow-xl shadow-black/40 p-1.5">
            <div className="max-h-44 overflow-y-auto space-y-0.5">
              {allOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                    opt === value
                      ? 'bg-teal-500/15 text-teal-200'
                      : 'text-slate-300 hover:bg-teal-900/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 mt-1 pt-1.5 border-t border-teal-900/40">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitCustom();
                }}
                placeholder="Add custom label..."
                className="flex-1 min-w-0 px-2 py-1 rounded-md bg-[#060c12] border border-teal-900/40 text-[11px] text-teal-100 placeholder-teal-800/50 focus:outline-none focus:border-teal-500/50"
              />
              <button
                type="button"
                onClick={commitCustom}
                className="px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-bold hover:bg-teal-500/20 transition"
                aria-label="Add custom option"
              >
                +
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Plain-text label header with its standalone selector stacked underneath.
function FieldGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
        {label}:
      </span>
      {children}
    </div>
  );
}

export const StatusSelector = (props) => (
  <MetadataSelector icon="🔖" {...props} />
);
export const PrioritySelector = (props) => (
  <MetadataSelector icon="⚡" {...props} />
);
export const ApplicationMethodSelector = (props) => (
  <MetadataSelector icon="🌐" {...props} />
);

// Vertically stacked metadata section rendered under the company name. Each
// field is a plain-text header followed by its standalone selector.
export default function MetadataSection({
  status,
  priority,
  applicationMethod,
  statusOptions,
  priorityOptions,
  applicationMethodOptions,
  onChange,
  onAddOption,
}) {
  return (
    <div className="flex flex-col gap-3">
      <FieldGroup label="Status">
        <StatusSelector
          value={status}
          options={statusOptions}
          onSelect={(v) => onChange('status', v)}
          onAddOption={(v) => onAddOption('status', v)}
        />
      </FieldGroup>

      <FieldGroup label="Priority">
        <PrioritySelector
          value={priority}
          options={priorityOptions}
          onSelect={(v) => onChange('priority', v)}
          onAddOption={(v) => onAddOption('priority', v)}
        />
      </FieldGroup>

      <FieldGroup label="Application Method">
        <ApplicationMethodSelector
          value={applicationMethod}
          options={applicationMethodOptions}
          onSelect={(v) => onChange('applicationMethod', v)}
          onAddOption={(v) => onAddOption('applicationMethod', v)}
        />
      </FieldGroup>
    </div>
  );
}
