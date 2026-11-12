import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { useAuth } from "./AuthContext";
import { dashboardPathFor } from "./guards";
import { registerSchema, type RegisterForm } from "./auth.schemas";

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "PHARMACY" ? "PHARMACY" : "WORKER";
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: initialRole },
  });

  const role = watch("role");

  async function onSubmit(values: RegisterForm) {
    setFormError(null);
    try {
      const user = await registerUser({
        email: values.email,
        password: values.password,
        role: values.role,
        firstName: values.firstName,
        lastName: values.lastName,
        businessName: values.businessName,
      });
      navigate(dashboardPathFor(user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setFormError("An account with this email already exists. Try logging in.");
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("Unable to create your account. Please try again.");
      }
    }
  }

  const roleButton = (value: "WORKER" | "PHARMACY", label: string) => (
    <button
      type="button"
      onClick={() => setValue("role", value, { shouldValidate: true })}
      className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
        role === value
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="I am a" error={errors.role?.message}>
              <div className="flex gap-3">
                {roleButton("WORKER", "Worker")}
                {roleButton("PHARMACY", "Pharmacy")}
              </div>
            </FormField>

            {role === "WORKER" ? (
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name" htmlFor="firstName" error={errors.firstName?.message}>
                  <Input id="firstName" {...register("firstName")} />
                </FormField>
                <FormField label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
                  <Input id="lastName" {...register("lastName")} />
                </FormField>
              </div>
            ) : (
              <FormField
                label="Business name"
                htmlFor="businessName"
                error={errors.businessName?.message}
              >
                <Input id="businessName" {...register("businessName")} />
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
