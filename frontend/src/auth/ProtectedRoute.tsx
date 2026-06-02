import { Navigate, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "./AuthProvider";

import { PageLoader } from "../components/SkeletonLoader";

type ProtectedRouteProps = {
  children: ReactElement;
  allowedRoles?: ("user" | "admin")[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  // non autenticato
  if (!user) {
    return (
      <Navigate to="/login" replace
        state={{ from: location.pathname }}
      />
    );
  }

  // autenticato ma ruolo non autorizzato
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/" replace />;
  }

  return children;
}