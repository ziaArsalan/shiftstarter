import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import type { AdminOrgRow, Paged } from "../../lib/types";

export function OrgsPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (q.trim()) params.set("q", q.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orgs", { q, page }],
    queryFn: () => api<Paged<AdminOrgRow>>(`/admin/orgs?${params.toString()}`),
  });

  const orgs = data?.orgs ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Organizations</h1>

      <Card>
        <div className="w-64">
          <label className="mb-1 block text-xs font-medium text-slate-500">Search</label>
          <Input
            placeholder="Organization name"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : orgs.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No organizations found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Chain</th>
                  <th className="py-2 pr-4">Members</th>
                  <th className="py-2 pr-4">Locations</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-brand-navy">{o.name}</td>
                    <td className="py-3 pr-4 text-slate-600">
                      <span className="flex items-center gap-2">
                        {o.chain?.logoUrl && (
                          <img
                            src={o.chain.logoUrl}
                            alt={o.chain.name}
                            className="h-5 w-5 rounded object-contain"
                          />
                        )}
                        {o.chain?.name ?? "Independent"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{o.memberCount}</td>
                    <td className="py-3 pr-4 text-slate-600">{o.locationCount}</td>
                    <td className="py-3 pr-4">
                      <Badge status={o.status} />
                    </td>
                  </tr>
                ))}
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
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
