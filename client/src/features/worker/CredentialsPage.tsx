import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiBlob, ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { FormField } from "../../components/FormField";
import { Select } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import type { Credential, CredentialType } from "../../lib/types";

const TYPES: CredentialType[] = [
  "LICENSE",
  "GOVERNMENT_ID",
  "CERTIFICATION",
  "INSURANCE",
  "OTHER",
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CredentialsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<CredentialType>("LICENSE");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["worker-credentials"],
    queryFn: () => api<{ credentials: Credential[] }>("/workers/me/credentials"),
  });

  const uploadMutation = useMutation({
    mutationFn: (form: FormData) =>
      api<{ credential: Credential }>("/workers/me/credentials", {
        method: "POST",
        body: form,
        formData: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-credentials"] });
      notify("Credential uploaded", "success");
      if (fileRef.current) fileRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/workers/me/credentials/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["worker-credentials"] });
      notify("Credential deleted", "info");
    },
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a file to upload.");
      return;
    }
    const form = new FormData();
    form.append("type", type);
    form.append("file", file);
    try {
      await uploadMutation.mutateAsync(form);
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "Upload failed. Please try again.",
      );
    }
  }

  async function handleView(c: Credential) {
    setViewingId(c.id);
    try {
      const blob = await apiBlob(`/workers/me/credentials/${c.id}/file`);
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Credentials</h1>

      <Card>
        <CardTitle>Upload a document</CardTitle>
        <p className="mb-4 text-sm text-slate-600">
          PDF, JPEG, or PNG up to 10 MB. Documents are reviewed by an admin.
        </p>
        {uploadError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {uploadError}
          </div>
        )}
        <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
          <FormField label="Type" htmlFor="credType">
            <Select
              id="credType"
              value={type}
              onChange={(e) => setType(e.target.value as CredentialType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="File" htmlFor="credFile">
            <input
              id="credFile"
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-navy"
            />
          </FormField>
          <Button type="submit" loading={uploadMutation.isPending}>
            Upload
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Your documents</CardTitle>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : credentials.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No credentials uploaded yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200">
            {credentials.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-brand-navy">{c.type.replace("_", " ")}</p>
                  <p className="text-xs text-slate-500">
                    {c.fileName} · {formatSize(c.sizeBytes)}
                  </p>
                  {c.status === "REJECTED" && c.notes && (
                    <p className="mt-1 text-xs text-red-600">Reason: {c.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={c.status} />
                  <Button
                    variant="ghost"
                    onClick={() => handleView(c)}
                    loading={viewingId === c.id}
                  >
                    View
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteMutation.mutate(c.id)}
                    loading={deleteMutation.isPending && deleteMutation.variables === c.id}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
