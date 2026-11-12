import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card } from "../../components/Card";
import { Spinner } from "../../components/Spinner";
import type { AdminCredentialRow, AdminUserRow, Paged } from "../../lib/types";

export function AdminDashboard() {
  const usersQuery = useQuery({
    queryKey: ["admin-users", { page: 1 }],
    queryFn: () => api<Paged<AdminUserRow>>("/admin/users?pageSize=1"),
  });
  const pendingQuery = useQuery({
    queryKey: ["admin-credentials", { status: "PENDING", page: 1 }],
    queryFn: () => api<Paged<AdminCredentialRow>>("/admin/credentials?status=PENDING&pageSize=1"),
  });

  const tiles = [
    { label: "Total users", value: usersQuery.data?.total, loading: usersQuery.isLoading },
    {
      label: "Pending credentials",
      value: pendingQuery.data?.total,
      loading: pendingQuery.isLoading,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <p className="text-sm text-slate-500">{t.label}</p>
            <p className="mt-1 text-3xl font-bold text-brand-navy">
              {t.loading ? <Spinner /> : (t.value ?? 0)}
            </p>
          </Card>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Use the sidebar to manage users and review credential submissions.
      </p>
    </div>
  );
}
