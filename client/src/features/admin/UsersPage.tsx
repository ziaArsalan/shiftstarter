import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Select } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { AdminUserRow, Paged, Role, UserStatus } from "../../lib/types";

export function UsersPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { user: currentUser } = useAuth();
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (role) params.set("role", role);
  if (status) params.set("status", status);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", { role, status, page }],
    queryFn: () => api<Paged<AdminUserRow>>(`/admin/users?${params.toString()}`),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: UserStatus }) =>
      api(`/admin/users/${vars.id}`, { method: "PATCH", body: { status: vars.status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      notify("User status updated", "success");
    },
    onError: (err) => {
      notify(err instanceof ApiError ? err.message : "Update failed", "error");
    },
  });

  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Users</h1>

      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
            <Select
              value={role}
              onChange={(e) => {
                setPage(1);
                setRole(e.target.value as Role | "");
              }}
            >
              <option value="">All roles</option>
              <option value="WORKER">Worker</option>
              <option value="PHARMACY">Pharmacy</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <div className="w-40">
            <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
            <Select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as UserStatus | "");
              }}
            >
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isAdmin = u.role === "ADMIN";
                  return (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-brand-navy">
                        {u.displayName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{u.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{u.role}</td>
                      <td className="py-3 pr-4">
                        <Badge status={u.status} />
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {isSelf || isAdmin ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : u.status === "SUSPENDED" ? (
                          <Button
                            variant="secondary"
                            onClick={() => mutation.mutate({ id: u.id, status: "ACTIVE" })}
                            loading={mutation.isPending && mutation.variables?.id === u.id}
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            onClick={() => mutation.mutate({ id: u.id, status: "SUSPENDED" })}
                            loading={mutation.isPending && mutation.variables?.id === u.id}
                          >
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
