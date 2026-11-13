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
import { resetPasswordSchema, type ResetPasswordForm } from "./auth.schemas";

export function ResetPasswordPage() {
  const { session, updatePassword, refreshMe } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordForm) {
    setFormError(null);
    try {
      await updatePassword(values.password);
      const me = await refreshMe();
      navigate(dashboardPathFor(me?.capabilities), { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to update your password.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-10 w-auto" />
        </Link>
        <Card>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Choose a new password</h1>
          {!session && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Open this page from the password-reset link in your email.
            </p>
          )}
          {formError && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {formError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              label="New password"
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
            <Button type="submit" className="w-full" loading={isSubmitting} disabled={!session}>
              Update password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
