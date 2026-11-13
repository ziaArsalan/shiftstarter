import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card, CardTitle } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Spinner } from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import { WORKER_ROLE_LABELS, type Credential } from "../../lib/types";

export function WorkerDashboard() {
  const { me } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["worker-credentials"],
    queryFn: () => api<{ credentials: Credential[] }>("/workers/me/credentials"),
  });

  const credentials = data?.credentials ?? [];
  const approved = credentials.filter((c) => c.status === "APPROVED").length;
  const pending = credentials.filter((c) => c.status === "PENDING").length;
  const name = me?.profile?.fullName;
  const role = me?.worker?.workerRole;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          Welcome{name ? `, ${name}` : ""}
        </h1>
        <p className="mt-1 text-slate-600">
          {role ? WORKER_ROLE_LABELS[role] : "Keep your profile and credentials up to date."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Credentials</p>
          <p className="mt-1 text-3xl font-bold text-brand-navy">
            {isLoading ? <Spinner /> : credentials.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Approved</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{approved}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Pending review</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{pending}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardTitle>Your profile</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            Add your role, rate expectations, and location.
          </p>
          <Link to="/worker/profile" className="text-sm font-semibold text-brand-blue hover:underline">
            Edit profile →
          </Link>
        </Card>
        <Card>
          <CardTitle>Credentials</CardTitle>
          <p className="mb-4 text-sm text-slate-600">
            Upload your license and documents for verification.
          </p>
          {credentials.slice(0, 3).map((c) => (
            <div key={c.id} className="mb-1 flex items-center justify-between text-sm">
              <span className="text-slate-700">{c.type.replace(/_/g, " ")}</span>
              <Badge status={c.status} />
            </div>
          ))}
          <Link
            to="/worker/credentials"
            className="mt-2 inline-block text-sm font-semibold text-brand-blue hover:underline"
          >
            Manage credentials →
          </Link>
        </Card>
      </div>
    </div>
  );
}
