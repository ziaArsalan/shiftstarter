import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { applyApiError } from "../../lib/formErrors";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input, Textarea } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import type { PharmacyProfile } from "../../lib/types";

type ProfileForm = {
  businessName: string;
  description: string;
  contactPhone: string;
  website: string;
};

const FIELDS: Array<keyof ProfileForm> = [
  "businessName",
  "description",
  "contactPhone",
  "website",
];

export function BusinessProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["pharmacy-profile"],
    queryFn: () => api<{ profile: PharmacyProfile }>("/pharmacies/me/profile"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (data?.profile) {
      reset({
        businessName: data.profile.businessName ?? "",
        description: data.profile.description ?? "",
        contactPhone: data.profile.contactPhone ?? "",
        website: data.profile.website ?? "",
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: ProfileForm) =>
      api<{ profile: PharmacyProfile }>("/pharmacies/me/profile", {
        method: "PUT",
        body: {
          businessName: payload.businessName.trim() || undefined,
          description: payload.description.trim() || undefined,
          contactPhone: payload.contactPhone.trim() || undefined,
          website: payload.website.trim() || undefined,
        },
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(["pharmacy-profile"], res);
      notify("Business profile saved", "success");
    },
  });

  async function onSubmit(values: ProfileForm) {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Business profile</h1>
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
            <FormField
              label="Business name"
              htmlFor="businessName"
              error={errors.businessName?.message}
            >
              <Input id="businessName" {...register("businessName")} />
            </FormField>
            <FormField label="Description" htmlFor="description" error={errors.description?.message}>
              <Textarea id="description" rows={3} {...register("description")} />
            </FormField>
            <FormField
              label="Contact phone"
              htmlFor="contactPhone"
              error={errors.contactPhone?.message}
            >
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
