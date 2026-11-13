import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { Select } from "../../components/Input";
import { WORKER_ROLE_LABELS, type WorkerRole } from "../../lib/types";
import { useAuth } from "./AuthContext";
import { dashboardPathFor } from "./guards";
import { registerSchema, type RegisterForm } from "./auth.schemas";

const WORKER_ROLES = Object.keys(WORKER_ROLE_LABELS) as WorkerRole[];

export function RegisterPage() {
  const { signUp, bootstrap } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialIntent = searchParams.get("intent") === "pharmacy" ? "pharmacy" : "worker";
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { intent: initialIntent },
  });

  const intent = watch("intent");

  async function onSubmit(values: RegisterForm) {
    setFormError(null);
    setConfirmMsg(null);
    try {
      const { needsEmailConfirmation } = await signUp(values.email, values.password);
      if (needsEmailConfirmation) {
        setConfirmMsg(
          "Check your email to confirm your account, then log in to finish setting up.",
        );
        return;
      }
      const me = await bootstrap({
        intent: values.intent,
        fullName: values.fullName,
        workerRole: values.workerRole,
        organizationName: values.organizationName,
      });
      navigate(dashboardPathFor(me.capabilities), { replace: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to create your account. Please try again.",
      );
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
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-10 w-auto" />
        </Link>
        <Card>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Create your account</h1>
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {formError}
            </div>
          )}
          {confirmMsg && (
            <div
              role="status"
              className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
            >
              {confirmMsg}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="I am a" error={errors.intent?.message}>
              <div className="flex gap-3">
                {intentButton("worker", "Worker")}
                {intentButton("pharmacy", "Pharmacy")}
              </div>
            </FormField>

            {intent === "worker" ? (
              <>
                <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
                  <Input id="fullName" {...register("fullName")} />
                </FormField>
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
              </>
            ) : (
              <FormField
                label="Organization name"
                htmlFor="organizationName"
                error={errors.organizationName?.message}
              >
                <Input id="organizationName" {...register("organizationName")} />
              </FormField>
            )}

            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="At least 8 characters."
            >
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </FormField>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-blue hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
