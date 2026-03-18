import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  AlertTriangle,
  MapPin,
  Users,
  BarChart3,
  Activity,
  ChevronRight,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Equipment', href: '/equipment', icon: <Package className="w-5 h-5" /> },
  { label: 'Maintenance', href: '/maintenance', icon: <Wrench className="w-5 h-5" /> },
  { label: 'Breakdowns', href: '/breakdowns', icon: <AlertTriangle className="w-5 h-5" /> },
  { label: 'Locations', href: '/locations', icon: <MapPin className="w-5 h-5" /> },
  { label: 'Users', href: '/users', icon: <Users className="w-5 h-5" />, adminOnly: true },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || user?.role === UserRole.ADMIN
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-30 w-64 shrink-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white overflow-hidden transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">MedEquip</span>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Equipment Management</p>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hidden">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Navigation
          </p>
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-600/90 text-white shadow-sm shadow-primary-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/8'
                )}
              >
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-primary-200' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-primary-300 opacity-70" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 pt-2 border-t border-white/10">
          <button
            onClick={() => { onClose(); logout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
