import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { Spinner } from "../components/ui/Spinner";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { ContentLibraryPage } from "../features/content/pages/ContentLibraryPage";
import { CreateContentPage } from "../features/content/pages/CreateContentPage";
import { ContentDetailPage } from "../features/content/pages/ContentDetailPage";
import { useAuth } from "../features/auth/hooks/useAuth";

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Spinner size="lg" />
    </div>
  );
}

function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function RedirectIfAuthenticated({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </RedirectIfAuthenticated>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/content" element={<ContentLibraryPage />} />
        <Route path="/content/new" element={<CreateContentPage />} />
        <Route path="/content/:id" element={<ContentDetailPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
