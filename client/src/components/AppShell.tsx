import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { dashboardPathFor } from "../features/auth/guards";
import { Button } from "./Button";

export interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

function linkClass({ isActive }: { isActive: boolean }) {
  return `block rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-brand-blue text-white" : "text-brand-navy hover:bg-surface-muted"
  }`;
}

export function AppShell({ items, badge }: { items: NavItem[]; badge?: string }) {
  const { me, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  const home = dashboardPathFor(me?.capabilities);

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to={home} className="flex items-center gap-2">
            <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-9 w-auto" />
            {badge && (
              <span className="rounded bg-brand-navy px-2 py-0.5 text-xs font-bold text-white">
                {badge}
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <span className="max-w-[16rem] truncate text-sm text-slate-500">
              {me?.profile?.email}
            </span>
            <Button variant="secondary" onClick={handleLogout}>
              Log out
            </Button>
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-brand-navy md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        {open && (
          <nav className="space-y-1 border-t border-slate-200 px-4 py-3 md:hidden">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2">
              <Button variant="secondary" className="w-full" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
