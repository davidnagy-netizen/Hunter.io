import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { Button, LanguageToggle, Logo, Panel, TextField, buttonClasses } from "@/components/index";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useForgotPasswordMutation, useResetPasswordMutation } from "@/features/authentication/api/auth.queries";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordFormValues,
  type ResetPasswordFormValues,
} from "@/features/authentication/schemas/auth.schemas";
import "@/features/authentication/i18n/index";

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const { t } = useTranslation(["authentication", "errors"]);
  const forgot = useForgotPasswordMutation();
  const apiError = useTranslatedApiError(forgot.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = ({ email }: ForgotPasswordFormValues) => forgot.mutate(email, { onSuccess: () => onSent(email) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t("authentication:fields.email")}
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email && t(errors.email.message as string)}
        {...register("email")}
      />
      {apiError ? (
        <p role="alert" className="text-sm text-red">
          {apiError}
        </p>
      ) : null}
      <Button type="submit" variant="gold" block disabled={forgot.isPending}>
        {forgot.isPending ? t("authentication:actions.submitting") : t("authentication:forgot.send")}
      </Button>
    </form>
  );
}

function CodeStep({ email, onDone }: { email: string; onDone: () => void }) {
  const { t } = useTranslation(["authentication", "errors"]);
  const reset = useResetPasswordMutation();
  const resend = useForgotPasswordMutation();
  const apiError = useTranslatedApiError(reset.error ?? resend.error);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = (values: ResetPasswordFormValues) => reset.mutate({ email, ...values }, { onSuccess: onDone });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t("authentication:forgot.code")}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={errors.code && t(errors.code.message as string)}
        {...register("code")}
      />
      <TextField
        label={t("authentication:forgot.newPassword")}
        type="password"
        autoComplete="new-password"
        error={errors.password && t(errors.password.message as string)}
        {...register("password")}
      />
      <TextField
        label={t("authentication:forgot.confirmPassword")}
        type="password"
        autoComplete="new-password"
        error={errors.password_confirmation && t(errors.password_confirmation.message as string)}
        {...register("password_confirmation")}
      />
      {apiError ? (
        <p role="alert" className="text-sm text-red">
          {apiError}
        </p>
      ) : null}
      <Button type="submit" variant="gold" block disabled={reset.isPending}>
        {reset.isPending ? t("authentication:actions.submitting") : t("authentication:forgot.submit")}
      </Button>
      <Button type="button" variant="ghost" block disabled={resend.isPending} onClick={() => resend.mutate(email)}>
        {t("authentication:forgot.resend")}
      </Button>
    </form>
  );
}

/** "Forgot password?": an e-mail address, then the 6-digit code it received with the new password, then back to sign in. */
export function ForgotPasswordPage() {
  const { t } = useTranslation("authentication");
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Logo onClick={() => navigate("/", { replace: true })} />
          <LanguageToggle />
        </div>

        <Panel>
          {done ? (
            <>
              <h1 className="font-display text-xl font-semibold text-text">{t("forgot.doneTitle")}</h1>
              <p className="mt-1 text-sm text-muted">{t("forgot.doneBody")}</p>
              <Link to="/login" className={buttonClasses({ variant: "gold", block: true, className: "mt-5" })}>
                {t("forgot.toLogin")}
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-text">{t("forgot.title")}</h1>
              <p role={email ? "status" : undefined} className="mt-1 text-sm text-muted">
                {email ? t("forgot.sent") : t("forgot.subtitle")}
              </p>
              <div className="mt-5">{email ? <CodeStep email={email} onDone={() => setDone(true)} /> : <EmailStep onSent={setEmail} />}</div>
              <Link to="/login" className="mt-4 block text-center text-sm text-muted hover:text-text">
                {t("forgot.backToLogin")}
              </Link>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
