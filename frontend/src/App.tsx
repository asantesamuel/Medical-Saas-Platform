import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import HistoryPage from "@/features/history/HistoryPage";
import PredictionDetailPage from "@/features/predictions/PredictionDetailPage";
import AdminPage from "@/features/admin/AdminPage";
import ProfilePage from "@/features/profile/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<PredictionDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
