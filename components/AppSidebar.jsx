'use client';

import Link from 'next/link';

const NAV = [
  { href: '/', label: 'All Applications', icon: '📁' },
  { href: '/profile', label: 'My Profile', icon: '🎓' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/analytics', label: 'Analytics', icon: '📊' },
];

// Sidebar navigation — styling matches the existing Academix sidebar.
export default function AppSidebar({
  activePath,
  sidebarOpen,
  onClose,
  sidebarWidth,
  isResizing,
  onResizeStart,
  footer = null,
}) {
  const linkClass = (href) => {
    const active = activePath === href;
    return `w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition transition-all ${
      active
        ? 'font-semibold bg-[#a3c9c7] text-[#3f6f6b] border border-[#7aa7a3]/40 shadow-sm'
        : 'font-medium text-[#7a7a7a] hover:text-[#3f6f6b] hover:bg-[#cddcc7]/40'
    }`;
  };

  return (
    <aside
      style={{ width: sidebarOpen ? sidebarWidth : 0 }}
      className={`relative shrink-0 bg-[#f7f4ef] border-r border-[#e9e4dd] flex flex-col ${
        sidebarOpen ? 'p-6 opacity-100' : 'p-0 opacity-0 overflow-hidden border-r-0'
      } ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}`}
    >
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-[#3f6f6b] font-black tracking-wide">
          Academix
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#a3c9c7] text-[#3a3a3a] border border-[#7aa7a3]/40 hover:bg-[#7aa7a3] transition"
          title="Collapse navigation"
          aria-label="Collapse navigation"
        >
          ◀
        </button>
      </div>
      <nav className="flex-1 space-y-1.5">
        {NAV.map(({ href, label, icon }) => (
          <Link key={href} href={href} className={linkClass(href)}>
            {icon} {label}
          </Link>
        ))}
      </nav>
      {footer ? (
        <div className="pt-4 mt-4 border-t border-teal-900/20 text-[11px] font-medium">
          {footer}
        </div>
      ) : null}

      {sidebarOpen && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={(e) => onResizeStart(e)}
          className="group absolute top-0 right-0 h-full w-1.5 cursor-col-resize"
        >
          <div className="absolute inset-y-0 right-0 w-px bg-transparent group-hover:bg-[#7aa7a3]/60 group-active:bg-[#5f8f8b]/80 transition-colors" />
        </div>
      )}
    </aside>
  );
}
