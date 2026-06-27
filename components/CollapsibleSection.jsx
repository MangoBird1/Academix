'use client';

import { useState } from 'react';

// A teal-glass card with a clickable header that collapses/expands its body.
export default function CollapsibleSection({
  title,
  defaultOpen = true,
  highlight = false,
  right = null,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`rounded-2xl border p-4 backdrop-blur-xl transition-colors ${
        highlight
          ? 'bg-teal-500/10 border-teal-400/40 shadow-lg shadow-teal-500/10'
          : 'bg-teal-950/10 border-teal-500/10'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2"
      >
        <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {right}
          <span className="text-teal-500/80 text-xs">{open ? '▾' : '▸'}</span>
        </span>
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
