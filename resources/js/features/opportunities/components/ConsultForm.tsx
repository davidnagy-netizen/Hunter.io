import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useSubmitLeadMutation } from "@/features/assessment/api/leads.queries";
import { leadSchema, type LeadFormValues } from "@/features/assessment/schemas/lead.schema";
import { useCurrentUser } from "@/features/authentication/hooks/useAuth";
import "../i18n";

/**
 * The "fill in a contact form" half of `ConsultPanel`. It goes to the same lead endpoint as the assessment's
 * follow-up request, so it lands in the CRM's leads, and nothing is sent without the ticked consent box.
 */
export function ConsultForm() {
  const { t } = useTranslation(["opportunities", "errors"]);
  const messageId = useId();
  const user = useCurrentUser();
  const submit = useSubmitLeadMutation();
  const apiError = useTranslatedApiError(submit.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema), defaultValues: { email: user?.email ?? "", consent: false } });

  if (submit.isSuccess) {
    return (
      <p role="status" className="mt-4 rounded-md bg-green-bg p-4 text-sm text-green">
        {t("opportunities:detail.consult.done")}
      </p>
    );
  }

  const onSubmit = (values: LeadFormValues) =>
    submit.mutate({
      email: values.email,
      company: user?.company ?? undefined,
      contactName: values.contactName,
      phone: values.phone,
      note: values.note,
      consent: true,
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
      <TextField label={t("opportunities:detail.consult.name")} autoComplete="name" {...register("contactName")} />
      <TextField
        label={t("opportunities:detail.consult.email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        {...register("email")}
        error={errors.email && t(errors.email.message as string)}
      />
      <TextField label={t("opportunities:detail.consult.phone")} type="tel" autoComplete="tel" maxLength={40} {...register("phone")} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={messageId} className="text-sm font-medium text-text">
          {t("opportunities:detail.consult.message")}
        </label>
        {/* Same visual contract as TextField's input; the server keeps up to 500 characters. */}
        <textarea
          id={messageId}
          rows={4}
          maxLength={500}
          className="rounded-md border border-line-strong px-3 py-2 text-sm text-text focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-gold"
          {...register("note")}
        />
      </div>
      <div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" {...register("consent")} />
          <span>{t("opportunities:detail.consult.consent")}</span>
        </label>
        {errors.consent ? (
          <p role="alert" className="mt-1 text-xs text-red">
            {t(errors.consent.message as string)}
          </p>
        ) : null}
      </div>
      {apiError ? (
        <p role="alert" className="text-sm text-red">
          {apiError}
        </p>
      ) : null}
      <Button type="submit" className="self-start" disabled={submit.isPending}>
        {submit.isPending ? t("opportunities:detail.consult.sending") : t("opportunities:detail.consult.submit")}
      </Button>
    </form>
  );
}
