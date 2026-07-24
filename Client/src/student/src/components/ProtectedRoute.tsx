import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/misc";
import type { Role } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allow?: Role[];
}

// Usage: wrap a route element - <ProtectedRoute allow={["coordinator"]}><DashboardLayout /></ProtectedRoute>
export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) return <Navigate to="/student/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/student/login" replace />;

  return <>{children}</>;
}
