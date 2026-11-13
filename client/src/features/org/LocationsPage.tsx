import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { applyApiError } from "../../lib/formErrors";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import type { PharmacyLocation } from "../../lib/types";

type LocationForm = {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const FIELDS: Array<keyof LocationForm> = [
  "name",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
];

const EMPTY: LocationForm = {
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

function toForm(l: PharmacyLocation): LocationForm {
  return {
    name: l.name,
    addressLine1: l.addressLine1,
    addressLine2: l.addressLine2 ?? "",
    city: l.city,
    state: l.state,
    postalCode: l.postalCode,
    country: l.country,
  };
}

function LocationEditor({
  initial,
  onClose,
  editingId,
}: {
  initial: LocationForm;
  editingId: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LocationForm>({ defaultValues: initial });

  async function onSubmit(values: LocationForm) {
    setFormError(null);
    const payload = {
      name: values.name.trim(),
      addressLine1: values.addressLine1.trim(),
      addressLine2: values.addressLine2.trim() || undefined,
      city: values.city.trim(),
      state: values.state.trim(),
      postalCode: values.postalCode.trim(),
      country: values.country.trim(),
    };
    try {
      if (editingId) {
        await api(`/orgs/me/locations/${editingId}`, { method: "PUT", body: payload });
      } else {
        await api("/orgs/me/locations", { method: "POST", body: payload });
      }
      queryClient.invalidateQueries({ queryKey: ["org-locations"] });
      notify(editingId ? "Location updated" : "Location added", "success");
      onClose();
    } catch (err) {
      setFormError(applyApiError(err, setError, FIELDS));
    }
  }

  return (
    <Card>
      <CardTitle>{editingId ? "Edit location" : "Add location"}</CardTitle>
      {formError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {formError}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <FormField label="Location name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" {...register("name", { required: "Name is required" })} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Address line 1" htmlFor="addressLine1" error={errors.addressLine1?.message}>
            <Input
              id="addressLine1"
              {...register("addressLine1", { required: "Address is required" })}
            />
          </FormField>
          <FormField label="Address line 2" htmlFor="addressLine2" error={errors.addressLine2?.message}>
            <Input id="addressLine2" {...register("addressLine2")} />
          </FormField>
          <FormField label="City" htmlFor="city" error={errors.city?.message}>
            <Input id="city" {...register("city", { required: "City is required" })} />
          </FormField>
          <FormField label="State / Province" htmlFor="state" error={errors.state?.message}>
            <Input id="state" {...register("state", { required: "State is required" })} />
          </FormField>
          <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message}>
            <Input
              id="postalCode"
              {...register("postalCode", { required: "Postal code is required" })}
            />
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message}>
            <Input id="country" {...register("country", { required: "Country is required" })} />
          </FormField>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editingId ? "Save changes" : "Add location"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function LocationsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [editor, setEditor] = useState<{ id: string | null; initial: LocationForm } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org-locations"],
    queryFn: () => api<{ locations: PharmacyLocation[] }>("/orgs/me/locations"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/orgs/me/locations/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-locations"] });
      notify("Location deleted", "info");
    },
  });

  const locations = data?.locations ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-navy">Locations</h1>
        {!editor && (
          <Button onClick={() => setEditor({ id: null, initial: EMPTY })}>Add location</Button>
        )}
      </div>

      {editor && (
        <LocationEditor
          editingId={editor.id}
          initial={editor.initial}
          onClose={() => setEditor(null)}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : locations.length === 0 && !editor ? (
        <Card>
          <p className="py-6 text-center text-sm text-slate-500">No locations yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {locations.map((l) => (
            <Card key={l.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-brand-navy">{l.name}</p>
                  <p className="text-sm text-slate-600">
                    {l.addressLine1}
                    {l.addressLine2 ? `, ${l.addressLine2}` : ""}, {l.city}, {l.state}{" "}
                    {l.postalCode}, {l.country}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setEditor({ id: l.id, initial: toForm(l) })}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteMutation.mutate(l.id)}
                    loading={deleteMutation.isPending && deleteMutation.variables === l.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
