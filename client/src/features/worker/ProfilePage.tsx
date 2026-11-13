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
import { WORKER_ROLE_LABELS, type WorkerProfile, type WorkerRole } from "../../lib/types";

const WORKER_ROLES = Object.keys(WORKER_ROLE_LABELS) as WorkerRole[];

type ProfileForm = {
  fullName: string;
  phone: string;
  workerRole: WorkerRole;
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
  "fullName",
  "phone",
  "workerRole",
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
    fullName: p.fullName ?? "",
    phone: p.phone ?? "",
    workerRole: p.workerRole,
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
    fullName: str(v.fullName),
    phone: str(v.phone),
    workerRole: v.workerRole,
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
  const { refreshMe } = useAuth();
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
    onSuccess: async (res) => {
      queryClient.setQueryData(["worker-profile"], res);
      notify("Profile saved", "success");
      await refreshMe();
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
            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} />
            </FormField>
            <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
              <Input id="phone" {...register("phone")} />
            </FormField>
            <FormField label="Role" htmlFor="workerRole" error={errors.workerRole?.message}>
              <Select id="workerRole" {...register("workerRole")}>
                {WORKER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {WORKER_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
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
              <Input id="yearsExperience" type="number" min={0} {...register("yearsExperience")} />
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
