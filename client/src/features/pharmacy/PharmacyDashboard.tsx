import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card, CardTitle } from "../../components/Card";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import type { PharmacyLocation } from "../../lib/types";

export function PharmacyDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["pharmacy-locations"],
    queryFn: () => api<{ locations: PharmacyLocation[] }>("/pharmacies/me/locations"),
  });

  const locations = data?.locations ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          {user?.profile?.displayName ?? "Pharmacy dashboard"}
        </h1>
        <p className="mt-1 text-slate-600">Manage your business profile and locations.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm text-slate-500">Locations</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy">
            {isLoading ? <Spinner /> : locations.length}
          </p>
        </Card>
        <Card>
          <CardTitle>Business profile</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            Keep your business details current for workers.
          </p>
          <Link
            to="/pharmacy/profile"
            className="text-sm font-semibold text-brand-blue hover:underline"
          >
            Edit business profile →
          </Link>
        </Card>
      </div>

      <Card>
        <CardTitle>Locations</CardTitle>
        <p className="mb-4 text-sm text-slate-600">
          Add the sites where you&apos;ll post shifts (shifts arrive in a later milestone).
        </p>
        <Link
          to="/pharmacy/locations"
          className="text-sm font-semibold text-brand-blue hover:underline"
        >
          Manage locations →
        </Link>
      </Card>
    </div>
  );
}
