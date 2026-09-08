import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { hydrateFromToken } = useAuthStore();

  // Re-validate token on mount
  useEffect(() => {
    hydrateFromToken();
  }, [hydrateFromToken]);

  return (
    <div className="flex h-full bg-surface-950">
      {/* Sidebar — always rendered, visibility via CSS transforms */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
