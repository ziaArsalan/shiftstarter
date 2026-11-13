import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { dashboardPathFor } from "../features/auth/guards";
import { Button } from "../components/Button";

export function Forbidden() {
  const { session, me } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 text-center">
      <p className="text-sm font-semibold text-brand-blue">403</p>
      <h1 className="mt-2 text-3xl font-bold text-brand-navy">Access denied</h1>
      <p className="mt-2 text-slate-600">
        Your account doesn&apos;t have permission to view this page.
      </p>
      <Link to={session ? dashboardPathFor(me?.capabilities) : "/login"} className="mt-6">
        <Button>{session ? "Back to dashboard" : "Log in"}</Button>
      </Link>
    </div>
  );
}
