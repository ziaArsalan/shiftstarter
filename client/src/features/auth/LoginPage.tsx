import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { useAuth } from "./AuthContext";
import { dashboardPathFor } from "./guards";
import { loginSchema, type LoginForm } from "./auth.schemas";

export function LoginPage() {
  const { signIn, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      const me = await refreshMe();
      navigate(dashboardPathFor(me?.capabilities), { replace: true });
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Unable to log in. Please check your details.",
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-10 w-auto" />
        </Link>
        <Card>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Welcome back</h1>
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </FormField>
            <FormField label="Password" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
            </FormField>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs font-semibold text-brand-blue hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Log in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            No account?{" "}
            <Link to="/register" className="font-semibold text-brand-blue hover:underline">
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
