import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "../../components/Spinner";
import type { Capabilities } from "../../lib/types";
import { useAuth } from "./AuthContext";

/** Landing route after login, derived from resolved capabilities. */
export function dashboardPathFor(capabilities?: Capabilities | null): string {
  if (!capabilities) return "/login";
  if (!capabilities.provisioned) return "/onboarding";
  if (capabilities.isSuperAdmin) return "/admin";
  if (capabilities.isOrgOwner || capabilities.isOrgManager) return "/org";
  if (capabilities.isWorker) return "/worker";
  return "/onboarding";
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/** Require a provisioned Profile; otherwise send to onboarding. */
export function RequireProvisioned({ children }: { children: ReactNode }) {
  const { session, me, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me?.capabilities.provisioned) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function RequireSuperAdmin({ children }: { children: ReactNode }) {
  const { session, me, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me?.capabilities.isSuperAdmin) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}

export function RequireWorker({ children }: { children: ReactNode }) {
  const { session, me, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me?.capabilities.isWorker) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}

export function RequireOrg({ children }: { children: ReactNode }) {
  const { session, me, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me?.capabilities.isOrgOwner && !me?.capabilities.isOrgManager) {
    return <Navigate to="/forbidden" replace />;
  }
  return <>{children}</>;
}

/** Owner-only pages (members, billing). */
export function RequireOrgOwner({ children }: { children: ReactNode }) {
  const { session, me, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (!me?.capabilities.isOrgOwner) return <Navigate to="/forbidden" replace />;
  return <>{children}</>;
}
