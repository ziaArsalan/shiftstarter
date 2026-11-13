import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input, Select } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { WORKER_ROLE_LABELS, type WorkerRole } from "../../lib/types";
import { useAuth } from "./AuthContext";
import { dashboardPathFor } from "./guards";

const WORKER_ROLES = Object.keys(WORKER_ROLE_LABELS) as WorkerRole[];

const onboardingSchema = z
  .object({
    intent: z.enum(["worker", "pharmacy"]),
    fullName: z.string().trim().optional(),
    workerRole: z
      .enum(["PHARMACIST", "PHARMACY_TECHNICIAN", "PHARMACY_ASSISTANT", "PHARMACY_STUDENT"])
      .optional(),
    organizationName: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "worker" && !data.workerRole) {
      ctx.addIssue({ code: "custom", path: ["workerRole"], message: "Select your role" });
    }
    if (data.intent === "pharmacy" && !data.organizationName) {
      ctx.addIssue({
        code: "custom",
        path: ["organizationName"],
        message: "Organization name is required",
      });
    }
  });
type OnboardingForm = z.infer<typeof onboardingSchema>;

export function OnboardingPage() {
  const { session, me, initializing, bootstrap } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { intent: "worker" },
  });

  const intent = watch("intent");

  // Already provisioned? Skip onboarding.
  useEffect(() => {
    if (!initializing && me?.capabilities.provisioned) {
      navigate(dashboardPathFor(me.capabilities), { replace: true });
    }
  }, [initializing, me, navigate]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!session) {
    navigate("/login", { replace: true });
    return null;
  }

  async function onSubmit(values: OnboardingForm) {
    setFormError(null);
    try {
      const updated = await bootstrap({
        intent: values.intent,
        fullName: values.fullName,
        workerRole: values.workerRole,
        organizationName: values.organizationName,
      });
      navigate(dashboardPathFor(updated.capabilities), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to finish setup. Please try again.");
    }
  }

  const intentButton = (value: "worker" | "pharmacy", label: string) => (
    <button
      type="button"
      onClick={() => setValue("intent", value, { shouldValidate: true })}
      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
        intent === value
          ? "border-brand-blue bg-brand-blue/5 text-brand-navy"
          : "border-slate-300 text-slate-600 hover:border-brand-azure"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="mx-auto mb-6 h-10 w-auto" />
        <Card>
          <h1 className="mb-1 text-center text-2xl font-bold text-brand-navy">Finish setting up</h1>
          <p className="mb-6 text-center text-sm text-slate-600">Tell us how you&apos;ll use ShiftStarter.</p>
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="I am a" error={errors.intent?.message}>
              <div className="flex gap-3">
                {intentButton("worker", "Worker")}
                {intentButton("pharmacy", "Pharmacy")}
              </div>
            </FormField>

            <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
              <Input id="fullName" {...register("fullName")} />
            </FormField>

            {intent === "worker" ? (
              <FormField label="Your role" htmlFor="workerRole" error={errors.workerRole?.message}>
                <Select id="workerRole" defaultValue="" {...register("workerRole")}>
                  <option value="" disabled>
                    Select a role
                  </option>
                  {WORKER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {WORKER_ROLE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              </FormField>
            ) : (
              <FormField
                label="Organization name"
                htmlFor="organizationName"
                error={errors.organizationName?.message}
              >
                <Input id="organizationName" {...register("organizationName")} />
              </FormField>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
