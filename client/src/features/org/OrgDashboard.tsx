import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card, CardTitle } from "../../components/Card";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import type { Organization, PharmacyLocation } from "../../lib/types";

export function OrgDashboard() {
  const { me } = useAuth();
  const isOwner = me?.capabilities.isOrgOwner;

  const orgQuery = useQuery({
    queryKey: ["org"],
    queryFn: () => api<{ organization: Organization }>("/orgs/me"),
  });
  const locationsQuery = useQuery({
    queryKey: ["org-locations"],
    queryFn: () => api<{ locations: PharmacyLocation[] }>("/orgs/me/locations"),
  });

  const org = orgQuery.data?.organization;
  const locations = locationsQuery.data?.locations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {org?.chain?.logoUrl && (
          <img src={org.chain.logoUrl} alt={org.chain.name} className="h-10 w-10 rounded object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{org?.name ?? "Pharmacy dashboard"}</h1>
          <p className="mt-1 text-slate-600">
            {org?.chain?.name ? `${org.chain.name} · ` : ""}Manage your organization and locations.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Locations</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy">
            {locationsQuery.isLoading ? <Spinner /> : locations.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Members</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy">
            {org?._count?.memberships ?? "—"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Your role</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy">{isOwner ? "Owner" : "Manager"}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Organization profile</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            Business details and pharmacy-chain branding.
          </p>
          {isOwner ? (
            <Link to="/org/profile" className="text-sm font-semibold text-brand-blue hover:underline">
              Edit profile →
            </Link>
          ) : (
            <span className="text-sm text-slate-400">Owners manage the profile.</span>
          )}
        </Card>
        <Card>
          <CardTitle>Locations</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            Sites where you&apos;ll post shifts (shifts arrive in a later milestone).
          </p>
          <Link to="/org/locations" className="text-sm font-semibold text-brand-blue hover:underline">
            Manage locations →
          </Link>
        </Card>
      </div>
    </div>
  );
}
