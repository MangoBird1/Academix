'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { standardizeLocation, normalizeLocation } from '@/lib/locationFormat';

const identity = (v) => v;

// A pill-style dropdown selector with an inline input. When `predictive` is on,
// typing fuzzily filters the options (case-insensitive substring) so partial
// text predicts existing entries; otherwise the input only adds a custom label.
// `format` controls how stored values are displayed; `normalize` controls the
// canonical stored form. `sorted` alphabetizes the option list.
//
// The dropdown renders in a portal anchored to the trigger. It auto-positions
// above or below based on available viewport space, follows the input while the
// pane scrolls, never falls off-screen, and overlays sidebar content (z-[1000]).
function MetadataSelector({
  icon,
  value,
  options,
  onSelect,
  onAddOption,
  predictive = false,
  sorted = false,
  format = identity,
  normalize = identity,
  textClassName,
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const allOptions =
    value && !options.some((o) => normalize(o) === normalize(value))
      ? [value, ...options]
      : options;

  const query = normalize(text.trim());
  let filtered =
    predictive && query
      ? allOptions.filter((o) => normalize(o).includes(query))
      : allOptions;
  if (sorted) {
    filtered = [...filtered].sort((a, b) => format(a).localeCompare(format(b)));
  }

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const minWidth = Math.max(r.width, 208);
    const left = Math.max(8, Math.min(r.left, vw - minWidth - 8));
    const estimate = 300;
    const spaceBelow = vh - r.bottom - 8;
    const spaceAbove = r.top - 8;
    const placeAbove = spaceBelow < estimate && spaceAbove > spaceBelow;
    const maxHeight = Math.max(160, Math.floor(placeAbove ? spaceAbove : spaceBelow));
    setPos(
      placeAbove
        ? { left, minWidth, bottom: vh - r.top + 4, maxHeight }
        : { left, minWidth, top: r.bottom + 4, maxHeight }
    );
  };

  const openMenu = () => {
    computePos();
    setOpen(true);
  };
  const toggle = () => (open ? setOpen(false) : openMenu());

  // While open: reposition on scroll/resize (so it follows the input and the
  // pane can still scroll), and close on outside mousedown.
  useEffect(() => {
    if (!open) return undefined;
    const reflow = () => computePos();
    const onDown = (e) => {
      if (menuRef.current?.contains(e.target)) return;
      if (btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', reflow, true);
    window.addEventListener('resize', reflow);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', reflow, true);
      window.removeEventListener('resize', reflow);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  const commit = () => {
    const raw = text.trim();
    if (!raw) return;
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

  const menu =
    open && pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              left: pos.left,
              minWidth: pos.minWidth,
              maxHeight: pos.maxHeight,
              ...(pos.top !== undefined ? { top: pos.top } : { bottom: pos.bottom }),
            }}
            className="z-[1000] flex flex-col rounded-xl border border-[#e9e4dd] bg-[#faf7f3] shadow-md p-1.5 overflow-hidden"
          >
            <div className="flex items-center gap-1 mb-1 pb-1.5 border-b border-teal-900/40 shrink-0">
              <input
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                }}
                placeholder={predictive ? 'Search or add...' : 'Add custom label...'}
                className="flex-1 min-w-0 px-2 py-1 rounded-md bg-[#faf7f3] border border-[#e9e4dd] text-[11px] text-[#5a5a5a] placeholder-[#7a7a7a] focus:outline-none focus:border-[#7aa7a3]"
              />
              <button
                type="button"
                onClick={commit}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#a3c9c7] border border-[#7aa7a3]/40 px-3 py-1 text-[11px] font-semibold text-[#3a3a3a] hover:bg-[#7aa7a3] transition"
                aria-label="Add or select"
              >
                +
              </button>
            </div>
            <div className="overflow-y-auto space-y-0.5">
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
                      ? 'bg-[#7aa7a3] text-white'
                      : 'text-[#5a5a5a] hover:bg-[#cddcc7]/40'
                  }`}
                >
                  {format(opt)}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-2 py-1 rounded-md bg-[#a3c9c7] border border-[#7aa7a3]/40 text-[#3a3a3a] text-[11px] font-bold hover:bg-[#7aa7a3] transition">
                  Press + to add “{text.trim()}”
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-full bg-teal-950/40 border border-teal-500/20 px-3 py-1 text-[11px] font-semibold text-teal-200 hover:bg-teal-900/40 transition"
      >
        {icon ? <span className="text-[10px] leading-none">{icon}</span> : null}
        <span className={textClassName || 'text-[#2f2f2f]'}>
          {value ? format(value) : 'Set'}
        </span>
        <span className="text-[8px] text-teal-500/80">▼</span>
      </button>
      {menu}
    </div>
  );
}

// Plain-text label header with its standalone control stacked underneath.
export function FieldGroup({ label, children, labelClassName }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={
          labelClassName ||
          'text-[10px] font-bold text-[#7aa7a3] uppercase tracking-wide leading-snug'
        }
      >
        {label}:
      </span>
      {children}
    </div>
  );
}

// Title Case helper (stored values are lowercase).
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
// Category: stored lowercase, shown Title Case, fuzzy + alphabetized.
export const CategorySelector = (props) => (
  <MetadataSelector
    icon="🏷️"
    predictive
    sorted
    format={titleCase}
    normalize={lower}
    {...props}
  />
);
// Location: freeform autocomplete — stored normalized, shown as friendly
// "City, Country", fuzzy + alphabetized.
export const LocationSelector = (props) => (
  <MetadataSelector
    icon="📍"
    predictive
    sorted
    format={standardizeLocation}
    normalize={normalizeLocation}
    {...props}
  />
);
// Generic selector (fixed option lists, e.g. follow-up method, outcome).
export const Selector = (props) => <MetadataSelector {...props} />;

export { titleCase };
