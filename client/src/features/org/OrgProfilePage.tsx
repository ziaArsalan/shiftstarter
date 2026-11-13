import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { applyApiError } from "../../lib/formErrors";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input, Select, Textarea } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { Organization, PharmacyChain } from "../../lib/types";

type OrgForm = {
  name: string;
  description: string;
  contactPhone: string;
  website: string;
  chainId: string;
};

const FIELDS: Array<keyof OrgForm> = ["name", "description", "contactPhone", "website", "chainId"];

export function OrgProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { refreshMe } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org"],
    queryFn: () => api<{ organization: Organization }>("/orgs/me"),
  });
  const chainsQuery = useQuery({
    queryKey: ["chains"],
    queryFn: () => api<{ chains: PharmacyChain[] }>("/chains"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<OrgForm>();

  useEffect(() => {
    if (data?.organization) {
      const o = data.organization;
      reset({
        name: o.name ?? "",
        description: o.description ?? "",
        contactPhone: o.contactPhone ?? "",
        website: o.website ?? "",
        chainId: o.chainId ?? "",
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (v: OrgForm) =>
      api<{ organization: Organization }>("/orgs/me", {
        method: "PUT",
        body: {
          name: v.name.trim() || undefined,
          description: v.description.trim() || undefined,
          contactPhone: v.contactPhone.trim() || undefined,
          website: v.website.trim() || undefined,
          chainId: v.chainId ? v.chainId : null,
        },
      }),
    onSuccess: async (res) => {
      queryClient.setQueryData(["org"], res);
      notify("Organization saved", "success");
      await refreshMe();
    },
  });

  async function onSubmit(values: OrgForm) {
    setFormError(null);
    try {
      await mutation.mutateAsync(values);
    } catch (err) {
      setFormError(applyApiError(err, setError, FIELDS));
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const chains = chainsQuery.data?.chains ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Organization profile</h1>
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardTitle>Details</CardTitle>
          <div className="mt-4 space-y-4">
            <FormField label="Organization name" htmlFor="name" error={errors.name?.message}>
              <Input id="name" {...register("name")} />
            </FormField>
            <FormField label="Pharmacy chain" htmlFor="chainId" error={errors.chainId?.message} hint="Leave as Independent if not part of a chain.">
              <Select id="chainId" {...register("chainId")}>
                <option value="">Independent (no chain)</option>
                {chains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Description" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" rows={3} {...register("description")} />
            </FormField>
            <FormField label="Contact phone" htmlFor="contactPhone" error={errors.contactPhone?.message}>
              <Input id="contactPhone" {...register("contactPhone")} />
            </FormField>
            <FormField
              label="Website"
              htmlFor="website"
              error={errors.website?.message}
              hint="Include https://"
            >
              <Input id="website" {...register("website")} />
            </FormField>
          </div>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting || mutation.isPending}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
