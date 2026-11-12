import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { dashboardPathFor } from "../features/auth/guards";
import { Button } from "../components/Button";

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-10 w-auto" />
        <nav className="flex items-center gap-3">
          {user ? (
            <Link to={dashboardPathFor(user.role)}>
              <Button>Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-brand-navy hover:text-brand-blue">
                Log in
              </Link>
              <Link to="/register">
                <Button>Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <span className="inline-block rounded-full bg-surface-muted px-4 py-1 text-sm font-semibold text-brand-blue">
          Pharmacy staffing, started fast
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-brand-navy sm:text-5xl">
          Get your shift started.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          ShiftStarter connects pharmacists and pharmacy workers with pharmacies and employers —
          find shifts, fill shifts, and manage credentials in one place.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/register?role=WORKER">
            <Button className="w-full sm:w-auto">I&apos;m looking for shifts</Button>
          </Link>
          <Link to="/register?role=PHARMACY">
            <Button variant="secondary" className="w-full sm:w-auto">
              I&apos;m hiring
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
