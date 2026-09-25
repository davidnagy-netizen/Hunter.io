import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import { useSubmitLeadMutation } from "../api/leads.queries";
import type { AssessmentAnswers } from "../domain/questions";
import { leadSchema, type LeadFormValues } from "../schemas/lead.schema";
import "../i18n";

/**
 * "Ask us to get in touch". Nothing leaves the browser without the ticked
 * consent box — the schema refuses it and so does the server. What is stored
 * is what the visitor actually submitted: their answers, the readiness score
 * those answers produced, and the profile built from them.
 */
export function LeadCaptureForm({
  readiness,
  answers,
  profile,
}: {
  readiness: number;
  answers: AssessmentAnswers;
  profile: CompanyProfile;
}) {
  const { t } = useTranslation(["assessment", "errors"]);
  const submit = useSubmitLeadMutation();
  const apiError = useTranslatedApiError(submit.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormValues>({ resolver: zodResolver(leadSchema), defaultValues: { consent: false } });

  if (submit.isSuccess) {
    return (
      <p role="status" className="rounded-md bg-green-bg p-4 text-sm text-green">
        {t("assessment:lead.done")}
      </p>
    );
  }

  const onSubmit = (values: LeadFormValues) =>
    submit.mutate({
      email: values.email,
      company: values.company,
      contactName: values.contactName,
      consent: true,
      readiness,
      answers,
      profile,
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-lg border border-line bg-surface p-5">
      <h3 className="font-display text-lg font-semibold">{t("assessment:lead.title")}</h3>
      <p className="mt-1 text-sm text-muted">{t("assessment:lead.body")}</p>
      <div className="mt-4 flex flex-col gap-3">
        <TextField
          label={t("assessment:lead.email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          {...register("email")}
          error={errors.email && t(errors.email.message as string)}
        />
        <TextField label={t("assessment:lead.company")} autoComplete="organization" {...register("company")} />
        <TextField label={t("assessment:lead.contactName")} autoComplete="name" {...register("contactName")} />
        <div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" {...register("consent")} />
            <span>{t("assessment:lead.consent")}</span>
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
        <Button type="submit" variant="ghost" block disabled={submit.isPending}>
          {submit.isPending ? t("assessment:lead.sending") : t("assessment:lead.submit")}
        </Button>
      </div>
    </form>
  );
}
