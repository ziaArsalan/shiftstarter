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
import type { WorkerProfile } from "../../lib/types";

type ProfileForm = {
  firstName: string;
  lastName: string;
  phone: string;
  professionalTitle: string;
  licenseNumber: string;
  yearsExperience: string;
  hourlyRateExpectation: string;
  bio: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

const FIELDS: Array<keyof ProfileForm> = [
  "firstName",
  "lastName",
  "phone",
  "professionalTitle",
  "licenseNumber",
  "yearsExperience",
  "hourlyRateExpectation",
  "bio",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
];

function toForm(p: WorkerProfile): ProfileForm {
  return {
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    phone: p.phone ?? "",
    professionalTitle: p.professionalTitle ?? "",
    licenseNumber: p.licenseNumber ?? "",
    yearsExperience: p.yearsExperience == null ? "" : String(p.yearsExperience),
    hourlyRateExpectation: p.hourlyRateExpectation == null ? "" : String(p.hourlyRateExpectation),
    bio: p.bio ?? "",
    addressLine1: p.addressLine1 ?? "",
    city: p.city ?? "",
    state: p.state ?? "",
    postalCode: p.postalCode ?? "",
    country: p.country ?? "",
  };
}

function toPayload(v: ProfileForm) {
  const str = (s: string) => (s.trim() === "" ? undefined : s.trim());
  const num = (s: string) => (s.trim() === "" ? null : Number(s));
  return {
    firstName: str(v.firstName),
    lastName: str(v.lastName),
    phone: str(v.phone),
    professionalTitle: str(v.professionalTitle),
    licenseNumber: str(v.licenseNumber),
    yearsExperience: num(v.yearsExperience),
    hourlyRateExpectation: num(v.hourlyRateExpectation),
    bio: str(v.bio),
    addressLine1: str(v.addressLine1),
    city: str(v.city),
    state: str(v.state),
    postalCode: str(v.postalCode),
    country: str(v.country),
  };
}

export function WorkerProfilePage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["worker-profile"],
    queryFn: () => api<{ profile: WorkerProfile }>("/workers/me/profile"),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>();

  useEffect(() => {
    if (data?.profile) reset(toForm(data.profile));
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (payload: ReturnType<typeof toPayload>) =>
      api<{ profile: WorkerProfile }>("/workers/me/profile", { method: "PUT", body: payload }),
    onSuccess: (res) => {
      queryClient.setQueryData(["worker-profile"], res);
      notify("Profile saved", "success");
    },
  });

  async function onSubmit(values: ProfileForm) {
    setFormError(null);
    try {
      await mutation.mutateAsync(toPayload(values));
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
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Worker profile</h1>
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
          <CardTitle>Basics</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message}>
              <Input id="firstName" {...register("firstName")} />
            </FormField>
            <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
              <Input id="lastName" {...register("lastName")} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} />
            </FormField>
            <FormField
              label="Professional title"
              htmlFor="professionalTitle"
              error={errors.professionalTitle?.message}
            >
              <Input id="professionalTitle" {...register("professionalTitle")} />
            </FormField>
            <FormField
              label="License number"
              htmlFor="licenseNumber"
              error={errors.licenseNumber?.message}
            >
              <Input id="licenseNumber" {...register("licenseNumber")} />
            </FormField>
            <FormField
              label="Years of experience"
              htmlFor="yearsExperience"
              error={errors.yearsExperience?.message}
            >
              <Input
                id="yearsExperience"
                type="number"
                min={0}
                {...register("yearsExperience")}
              />
            </FormField>
            <FormField
              label="Hourly rate expectation"
              htmlFor="hourlyRateExpectation"
              error={errors.hourlyRateExpectation?.message}
            >
              <Input
                id="hourlyRateExpectation"
                type="number"
                min={0}
                step="0.01"
                {...register("hourlyRateExpectation")}
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Bio" htmlFor="bio" error={errors.bio?.message}>
              <Textarea id="bio" rows={3} {...register("bio")} />
            </FormField>
          </div>
        </Card>

        <Card>
          <CardTitle>Location</CardTitle>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label="Address" htmlFor="addressLine1" error={errors.addressLine1?.message}>
              <Input id="addressLine1" {...register("addressLine1")} />
            </FormField>
            <FormField label="City" htmlFor="city" error={errors.city?.message}>
              <Input id="city" {...register("city")} />
            </FormField>
            <FormField label="State / Province" htmlFor="state" error={errors.state?.message}>
              <Input id="state" {...register("state")} />
            </FormField>
            <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message}>
              <Input id="postalCode" {...register("postalCode")} />
            </FormField>
            <FormField label="Country" htmlFor="country" error={errors.country?.message}>
              <Input id="country" {...register("country")} />
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
