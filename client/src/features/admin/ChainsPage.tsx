import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import type { PharmacyChain } from "../../lib/types";

type ChainForm = { name: string; slug: string; website: string };

export function ChainsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const logoRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["chains"],
    queryFn: () => api<{ chains: PharmacyChain[] }>("/chains"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChainForm>();

  const createMutation = useMutation({
    mutationFn: (body: { name: string; slug?: string; website?: string }) =>
      api("/admin/chains", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      notify("Chain created", "success");
      reset({ name: "", slug: "", website: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/admin/chains/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      notify("Chain deleted", "info");
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : "Delete failed", "error"),
  });

  const logoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("logo", file);
      return api(`/admin/chains/${id}/logo`, { method: "POST", body: form, formData: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chains"] });
      notify("Logo updated", "success");
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : "Logo upload failed", "error"),
  });

  async function onCreate(values: ChainForm) {
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        name: values.name.trim(),
        slug: values.slug.trim() || undefined,
        website: values.website.trim() || undefined,
      });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to create chain.");
    }
  }

  const chains = data?.chains ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Pharmacy chains</h1>

      <Card>
        <CardTitle>Add a chain</CardTitle>
        <p className="mb-4 text-sm text-slate-600">
          Chains appear in the catalog for organizations to select. Upload a logo after creating.
        </p>
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit(onCreate)}
          className="grid gap-4 sm:grid-cols-[2fr_1fr_2fr_auto] sm:items-end"
          noValidate
        >
          <FormField label="Name" htmlFor="name" error={errors.name?.message}>
            <Input id="name" {...register("name", { required: "Name is required" })} />
          </FormField>
          <FormField label="Slug" htmlFor="slug" hint="optional">
            <Input id="slug" placeholder="auto" {...register("slug")} />
          </FormField>
          <FormField label="Website" htmlFor="website">
            <Input id="website" placeholder="https://" {...register("website")} />
          </FormField>
          <Button type="submit" loading={isSubmitting || createMutation.isPending}>
            Add
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Catalog</CardTitle>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : chains.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No chains yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200">
            {chains.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {c.logoUrl ? (
                    <img
                      src={c.logoUrl}
                      alt={c.name}
                      className="h-10 w-10 rounded border border-slate-200 object-contain"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-slate-300 text-xs text-slate-400">
                      logo
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-brand-navy">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={(el) => {
                      logoRefs.current[c.id] = el;
                    }}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) logoMutation.mutate({ id: c.id, file });
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="secondary"
                    onClick={() => logoRefs.current[c.id]?.click()}
                    loading={logoMutation.isPending && logoMutation.variables?.id === c.id}
                  >
                    {c.logoUrl ? "Replace logo" : "Upload logo"}
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
