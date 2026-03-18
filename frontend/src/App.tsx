import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Spinner } from '@/components/ui/Spinner';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import EquipmentPage from '@/pages/equipment/EquipmentPage';
import EquipmentDetailPage from '@/pages/equipment/EquipmentDetailPage';
import MaintenancePage from '@/pages/maintenance/MaintenancePage';
import BreakdownsPage from '@/pages/breakdowns/BreakdownsPage';
import LocationsPage from '@/pages/locations/LocationsPage';
import UsersPage from '@/pages/users/UsersPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import { UserRole } from '@/types';

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="xl" className="text-primary-600" />
          <p className="text-sm text-slate-500">Loading MedEquip…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ─── Admin Guard ──────────────────────────────────────────────────────────────

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

// ─── Public-Only Guard ────────────────────────────────────────────────────────

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="xl" className="text-primary-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ─── 404 Page ─────────────────────────────────────────────────────────────────

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <p className="text-8xl font-black text-slate-200 select-none">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Page not found</h1>
        <p className="text-slate-500 mt-1 text-sm">The page you are looking for doesn't exist.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      {/* Protected routes */}
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/breakdowns" element={<BreakdownsPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route
          path="/users"
          element={
            <RequireAdmin>
              <UsersPage />
            </RequireAdmin>
          }
        />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
