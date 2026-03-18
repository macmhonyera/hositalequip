import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  Settings,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, getInitials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { breakdownsApi, equipmentApi } from '@/lib/api';
import { BreakdownSeverity } from '@/types';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/equipment': 'Equipment',
  '/maintenance': 'Maintenance',
  '/breakdowns': 'Breakdowns',
  '/locations': 'Locations',
  '/users': 'Users',
  '/reports': 'Reports',
  '/profile': 'My Profile',
};

function getPageTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname];
  const match = Object.keys(pageTitles).find((k) => k !== '/dashboard' && pathname.startsWith(k));
  return match ? pageTitles[match] : 'MedEquip';
}

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const title = getPageTitle(location.pathname);

  // ─── Notification data ─────────────────────────────────────────────────────

  const { data: criticalBreakdowns } = useQuery({
    queryKey: ['notifications-critical'],
    queryFn: () =>
      breakdownsApi.list({ severity: BreakdownSeverity.CRITICAL, limit: 5 }),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const { data: equipmentStats } = useQuery({
    queryKey: ['equipment-stats-header'],
    queryFn: equipmentApi.getStats,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const criticalItems = criticalBreakdowns?.data ?? [];
  const criticalCount = criticalBreakdowns?.total ?? 0;
  const overdueCount = equipmentStats?.maintenanceOverdue ?? 0;
  const totalNotifications = Math.min(criticalCount + (overdueCount > 0 ? 1 : 0), 99);

  function closeBoth() {
    setBellOpen(false);
    setDropdownOpen(false);
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-3 sticky top-0 z-30">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 truncate">{title}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all placeholder-slate-400"
        />
      </div>

      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => { setBellOpen((v) => !v); setDropdownOpen(false); }}
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {totalNotifications > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-0.5 leading-none">
              {totalNotifications > 9 ? '9+' : totalNotifications}
            </span>
          )}
        </button>

        {bellOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setBellOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 animate-fade-in">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {totalNotifications > 0 ? (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                    {totalNotifications} alert{totalNotifications !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">All clear</span>
                )}
              </div>

              {/* Items */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {/* Overdue maintenance */}
                {overdueCount > 0 && (
                  <button
                    onClick={() => { closeBoth(); navigate('/equipment'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">Overdue Maintenance</p>
                      <p className="text-xs text-slate-500">
                        {overdueCount} equipment item{overdueCount !== 1 ? 's' : ''} past scheduled service date
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                )}

                {/* Critical breakdowns */}
                {criticalItems.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => { closeBoth(); navigate('/breakdowns'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        Critical — {b.equipment?.name ?? 'Unknown Equipment'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{b.issueDescription}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}

                {/* More critical badge */}
                {criticalCount > criticalItems.length && (
                  <div className="px-4 py-2 bg-red-50 text-center">
                    <p className="text-xs text-red-600 font-medium">
                      +{criticalCount - criticalItems.length} more critical breakdown{criticalCount - criticalItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Empty state */}
                {totalNotifications === 0 && (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">No active alerts</p>
                    <p className="text-xs text-slate-400 mt-0.5">All systems operational</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <button
                  onClick={() => { closeBoth(); navigate('/breakdowns'); }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all breakdowns →
                </button>
                <button
                  onClick={() => { closeBoth(); navigate('/equipment'); }}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Equipment →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Dropdown */}
      <div className="relative">
        <button
          onClick={() => { setDropdownOpen((v) => !v); setBellOpen(false); }}
          className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-slate-900 leading-none">
              {user?.firstName}
            </p>
            <p className="text-[11px] text-slate-400 capitalize mt-0.5">
              {user?.role}
            </p>
          </div>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              dropdownOpen && 'rotate-180'
            )}
          />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </button>
              <button
                onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Settings
              </button>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => { setDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
