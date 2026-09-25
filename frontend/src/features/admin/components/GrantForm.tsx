import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, SelectField, TextField } from "@/shared/components";
import { useLang } from "@/shared/hooks/useFormat";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import type { Plan } from "@/shared/types/auth.types";
import { useGrantSubscriptionMutation, useRevokeSubscriptionMutation } from "../api/admin.queries";
import { grantSchema, type GrantFormValues } from "../schemas/grant.schema";
import "../i18n";

export interface GrantFormProps {
  userId: string;
  plans: Plan[];
  /** Only an active subscription can be revoked. */
  canRevoke: boolean;
  /** Called after a grant or revoke succeeds, for a host screen that caches the account elsewhere (the CRM contact page). */
  onChanged?: () => void;
}

/** Give one account access (any plan, optionally for a custom number of days) or take it away. */
export function GrantForm({ userId, plans, canRevoke, onChanged }: GrantFormProps) {
  const { t } = useTranslation("admin");
  const lang = useLang();
  const grant = useGrantSubscriptionMutation();
  const revoke = useRevokeSubscriptionMutation();
  const error = useTranslatedApiError(grant.error ?? revoke.error);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GrantFormValues>({
    resolver: zodResolver(grantSchema),
    defaultValues: { planId: plans[0]?.id ?? "" },
  });

  const onSubmit = (values: GrantFormValues) => {
    revoke.reset();
    grant.mutate(
      { userId, planId: values.planId, days: values.days, note: values.note || undefined },
      {
        onSuccess: () => {
          reset({ planId: values.planId, days: undefined, note: "" });
          onChanged?.();
        },
      },
    );
  };

  const busy = grant.isPending || revoke.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem_1fr]">
        <SelectField label={t("users.grant.plan")} error={errors.planId && t(errors.planId.message as string)} {...register("planId")}>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {lang === "en" ? plan.label_en : plan.label_hu}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t("users.grant.days")}
          type="number"
          min={1}
          error={errors.days && t(errors.days.message as string)}
          {...register("days", { setValueAs: (v) => (v === "" || v == null ? undefined : Number(v)) })}
        />
        <TextField label={t("users.grant.note")} error={errors.note && t(errors.note.message as string)} {...register("note")} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          {grant.isPending ? t("users.grant.submitting") : t("users.grant.submit")}
        </Button>
        {canRevoke ? (
          <Button type="button" size="sm" variant="danger" disabled={busy} onClick={() => {
              grant.reset();
              revoke.mutate(userId, { onSuccess: () => onChanged?.() });
            }}>
            {t("users.grant.revoke")}
          </Button>
        ) : null}
        {grant.isSuccess ? <span role="status" className="text-xs text-green">{t("users.grant.done")}</span> : null}
        {revoke.isSuccess ? <span role="status" className="text-xs text-green">{t("users.grant.revoked")}</span> : null}
        {error ? <span role="alert" className="text-xs text-red">{error}</span> : null}
      </div>
    </form>
  );
}
