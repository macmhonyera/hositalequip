import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

export function Layout() {
  const { user } = useAuth();
  const isGuest = user?.role === UserRole.GUEST;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        {isGuest && (
          <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-sm">
            <Eye className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-800">Read-Only Mode</span>
            <span className="text-amber-700 hidden sm:inline">
              — Your guest account can view data but cannot create, edit, or delete records.
              Contact an administrator to upgrade your access.
            </span>
          </div>
        )}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
