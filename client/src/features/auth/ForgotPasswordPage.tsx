import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { FormField } from "../../components/FormField";
import { Input } from "../../components/Input";
import { useAuth } from "./AuthContext";
import { forgotPasswordSchema, type ForgotPasswordForm } from "./auth.schemas";

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordForm) {
    setFormError(null);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to send the reset email.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <img src="/shiftstarter-logo.png" alt="ShiftStarter" className="h-10 w-auto" />
        </Link>
        <Card>
          <h1 className="mb-6 text-center text-2xl font-bold text-brand-navy">Reset your password</h1>
          {sent ? (
            <p
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-800"
            >
              If an account exists for that email, a reset link is on its way.
            </p>
          ) : (
            <>
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
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Send reset link
                </Button>
              </form>
            </>
          )}
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link to="/login" className="font-semibold text-brand-blue hover:underline">
              Back to log in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
