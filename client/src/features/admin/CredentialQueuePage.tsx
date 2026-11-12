import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Select, Textarea } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import type { AdminCredentialRow, Paged, VerificationStatus } from "../../lib/types";

export function CredentialQueuePage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [status, setStatus] = useState<VerificationStatus>("PENDING");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-credentials", { status }],
    queryFn: () =>
      api<Paged<AdminCredentialRow>>(`/admin/credentials?status=${status}&pageSize=50`),
  });

  const mutation = useMutation({
    mutationFn: (vars: { id: string; action: "approve" | "reject"; notes?: string }) =>
      api(`/admin/credentials/${vars.id}`, {
        method: "PATCH",
        body: { action: vars.action, notes: vars.notes },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-credentials"] });
      notify("Credential reviewed", "success");
    },
    onError: (err) => {
      notify(err instanceof ApiError ? err.message : "Review failed", "error");
    },
  });

  async function handleView(id: string) {
    setViewingId(id);
    try {
      const blob = await apiBlob(`/workers/me/credentials/${id}/file`);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Unable to open file", "error");
    } finally {
      setViewingId(null);
    }
  }

  const credentials = data?.credentials ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Credential queue</h1>
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value as VerificationStatus)}>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : credentials.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-slate-500">
            No {status.toLowerCase()} credentials.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-navy">
                    {c.type.replace("_", " ")} · {c.worker.name}
                  </p>
                  <p className="text-sm text-slate-600">{c.worker.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.fileName} · uploaded {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  {c.status === "REJECTED" && c.notes && (
                    <p className="mt-1 text-xs text-red-600">Reason: {c.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={c.status} />
                  <Button variant="ghost" onClick={() => handleView(c.id)} loading={viewingId === c.id}>
                    View file
                  </Button>
                </div>
              </div>

              {c.status === "PENDING" && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <Textarea
                    rows={2}
                    placeholder="Review note (required to reject)"
                    value={notes[c.id] ?? ""}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  />
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="danger"
                      onClick={() =>
                        mutation.mutate({ id: c.id, action: "reject", notes: notes[c.id] })
                      }
                      loading={
                        mutation.isPending &&
                        mutation.variables?.id === c.id &&
                        mutation.variables.action === "reject"
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() =>
                        mutation.mutate({ id: c.id, action: "approve", notes: notes[c.id] })
                      }
                      loading={
                        mutation.isPending &&
                        mutation.variables?.id === c.id &&
                        mutation.variables.action === "approve"
                      }
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
