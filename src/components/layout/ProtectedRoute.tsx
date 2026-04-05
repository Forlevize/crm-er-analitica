import { Navigate, Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ allowedRoles, redirectTo = "/login" }: ProtectedRouteProps) {
  const { role, isLoading, defaultRoute } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-appBg">
        <div className="rounded-2xl bg-white px-6 py-4 shadow-panel">Carregando...</div>
      </div>
    );
  }

  if (!role) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-appBg">
      <div className="pointer-events-none absolute right-[-120px] top-[-120px] h-96 w-96 rounded-full bg-turquoise/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[260px] h-[420px] w-[420px] rounded-full bg-veoliaRed/6 blur-3xl" />
      <Sidebar />
      <div className="relative ml-[272px] px-10 pb-12 pt-5">
        <div className="mx-auto max-w-[1440px]">
          <Header />
          <main className="mt-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
