'use client';

// Shared column-resize drag logic. Reports the incremental horizontal movement
// (deltaX in px) on every mousemove until the mouse is released. The same
// helper powers both the <VerticalDivider /> components and the sidebar's
// directly-draggable right edge so the behaviour stays identical.
export function startColumnDrag(event, onResize, onEnd) {
  event.preventDefault();
  let lastX = event.clientX;

  const handleMove = (e) => {
    const delta = e.clientX - lastX;
    lastX = e.clientX;
    if (delta !== 0) onResize(delta);
  };

  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (onEnd) onEnd();
  };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
  // Keep a resize cursor and suppress text selection for the whole drag.
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

// A ~4px draggable vertical divider that highlights on hover/drag. `onResize`
// receives the incremental deltaX (positive = dragged right).
export default function VerticalDivider({
  onResize,
  onResizeStart,
  onResizeEnd,
  ariaLabel = 'Resize panes',
}) {
  const handleMouseDown = (e) => {
    if (onResizeStart) onResizeStart();
    startColumnDrag(e, onResize, onResizeEnd);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onMouseDown={handleMouseDown}
      className="group relative w-1.5 shrink-0 cursor-col-resize self-stretch"
    >
      {/* The thin visible line, centred in the wider hit area. */}
      <div className="absolute inset-y-2 left-1/2 -translate-x-1/2 w-px rounded-full bg-teal-900/40 transition-colors group-hover:bg-teal-400/60 group-active:bg-teal-400/80" />
    </div>
  );
}
