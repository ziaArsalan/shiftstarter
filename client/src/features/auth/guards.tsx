import { useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Button } from "../../components/Button";
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

/** Shown when /auth/me failed (server/network) so we never mistake it for "not provisioned". */
function MeErrorScreen() {
  const { refreshMe, signOut } = useAuth();
  const [retrying, setRetrying] = useState(false);

  async function retry() {
    setRetrying(true);
    await refreshMe();
    setRetrying(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div role="alert" className="max-w-sm text-center">
        <h1 className="text-xl font-bold text-brand-navy">We couldn&apos;t load your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Something went wrong reaching the server. Your account is fine. Please try again.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button onClick={retry} loading={retrying}>
            Retry
          </Button>
          <Button variant="secondary" onClick={() => void signOut()}>
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, me, meError, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <FullScreenSpinner />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (meError && !me) return <MeErrorScreen />;
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
