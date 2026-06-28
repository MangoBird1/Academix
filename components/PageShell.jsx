'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AppSidebar from '@/components/AppSidebar';
import { startColumnDrag } from '@/components/VerticalDivider';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 420;
const LS_SIDEBAR = 'academix:sidebarWidth';

const SidebarContext = createContext({ collapsed: false });

export function useSidebarCollapsed() {
  return useContext(SidebarContext).collapsed;
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

// Shared app chrome: gradient background, collapsible sidebar, main content area.
export default function PageShell({ activePath, children, footer = null }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_SIDEBAR);
      if (raw !== null && !Number.isNaN(+raw)) {
        setSidebarWidth(clamp(+raw, SIDEBAR_MIN, SIDEBAR_MAX));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SIDEBAR, String(sidebarWidth));
    } catch {
      /* ignore */
    }
  }, [sidebarWidth]);

  const resizeSidebar = useCallback(
    (delta) =>
      setSidebarWidth((w) => clamp(w + delta, SIDEBAR_MIN, SIDEBAR_MAX)),
    []
  );

  return (
    <SidebarContext.Provider value={{ collapsed: !sidebarOpen }}>
      <div className="flex h-screen w-screen bg-gradient-to-br from-[#e8dff5] to-[#3d1f6e] font-sans overflow-hidden select-none">
        <AppSidebar
          activePath={activePath}
          sidebarOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sidebarWidth={sidebarWidth}
          isResizing={isResizing}
          onResizeStart={(e) => {
            setIsResizing(true);
            startColumnDrag(e, resizeSidebar, () => setIsResizing(false));
          }}
          footer={footer}
        />

        <div className="flex flex-1 h-full overflow-hidden relative">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="absolute top-6 left-6 z-50 px-3 py-2 rounded-lg bg-[#a3c9c7] text-[#3a3a3a] border border-[#7aa7a3]/40 hover:bg-[#7aa7a3] transition text-xs font-semibold shadow-lg"
              title="Open navigation panel"
            >
              ▶ Menu
            </button>
          )}
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}
