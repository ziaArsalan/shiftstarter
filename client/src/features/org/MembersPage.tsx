import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/api";
import { Button } from "../../components/Button";
import { Card, CardTitle } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { FormField } from "../../components/FormField";
import { Input, Select } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { useToast } from "../../components/Toast";
import { useAuth } from "../auth/AuthContext";
import type { OrgMember, OrgRole } from "../../lib/types";

type InviteForm = { email: string; role: OrgRole };

export function MembersPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const { me } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["org-members"],
    queryFn: () => api<{ members: OrgMember[] }>("/orgs/me/members"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({ defaultValues: { role: "MANAGER" } });

  const inviteMutation = useMutation({
    mutationFn: (body: InviteForm) =>
      api("/orgs/me/members", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      notify("Member added", "success");
      reset({ email: "", role: "MANAGER" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api(`/orgs/me/members/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members"] });
      notify("Member removed", "info");
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : "Remove failed", "error"),
  });

  async function onInvite(values: InviteForm) {
    setFormError(null);
    try {
      await inviteMutation.mutateAsync(values);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to add member.");
    }
  }

  const members = data?.members ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Team members</h1>

      <Card>
        <CardTitle>Add a member</CardTitle>
        <p className="mb-4 text-sm text-slate-600">
          They must already have a ShiftStarter account. Owners manage everything; managers manage
          locations and shifts.
        </p>
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {formError}
          </div>
        )}
        <form
          onSubmit={handleSubmit(onInvite)}
          className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
          noValidate
        >
          <FormField label="Email" htmlFor="inviteEmail" error={errors.email?.message}>
            <Input
              id="inviteEmail"
              type="email"
              {...register("email", { required: "Email is required" })}
            />
          </FormField>
          <FormField label="Role" htmlFor="inviteRole">
            <Select id="inviteRole" {...register("role")}>
              <option value="MANAGER">Manager</option>
              <option value="OWNER">Owner</option>
            </Select>
          </FormField>
          <Button type="submit" loading={isSubmitting || inviteMutation.isPending}>
            Add
          </Button>
        </form>
      </Card>

      <Card>
        <CardTitle>Members</CardTitle>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No members yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200">
            {members.map((m) => {
              const isSelf = m.profile.id === me?.profile?.id;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-brand-navy">
                      {m.profile.fullName ?? m.profile.email}
                    </p>
                    <p className="text-xs text-slate-500">{m.profile.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge status={m.role} />
                    {isSelf ? (
                      <span className="text-xs text-slate-400">You</span>
                    ) : (
                      <Button
                        variant="danger"
                        onClick={() => removeMutation.mutate(m.id)}
                        loading={removeMutation.isPending && removeMutation.variables === m.id}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
