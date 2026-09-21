import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/shared/components";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { useRegisterMutation, useTaxpayerLookupMutation } from "../api/auth.queries";
import { formatTaxNumber } from "../lib/taxNumber";
import {
  registerSchema,
  suggestUsername,
  usernameSchema,
  type RegisterFormValues,
  type UsernameFormValues,
} from "../schemas/auth.schemas";
import type { Taxpayer } from "../types/auth.types";
import "../i18n";

export interface RegisterFormProps {
  /** Called once the account exists and the visitor is signed in, with the company they confirmed. */
  onSuccess?: (taxpayer: Taxpayer) => void;
}

function Checkbox({ label, error, ...rest }: { label: React.ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0" aria-invalid={error ? true : undefined} {...rest} />
        <span>{label}</span>
      </label>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Registration in two short steps (CR-03). Step 1 asks for email, password and
 * tax number, and looks the company up at NAV. Step 2 shows what NAV returned
 * read-only — the visitor confirms their company, they never type its name —
 * and creates the account. The company profile is completed afterwards in the
 * onboarding wizard.
 */
export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation(["authentication", "errors"]);
  const [step1, setStep1] = useState<RegisterFormValues | null>(null);
  const [taxpayer, setTaxpayer] = useState<Taxpayer | null>(null);

  const details = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", taxNumber: "", acceptTerms: false, marketingOptIn: false },
  });
  const usernameForm = useForm<UsernameFormValues>({ resolver: zodResolver(usernameSchema), defaultValues: { username: "" } });

  const lookup = useTaxpayerLookupMutation();
  const registerAccount = useRegisterMutation();
  const lookupError = useTranslatedApiError(lookup.error);
  const registerError = useTranslatedApiError(registerAccount.error);

  const findCompany = (values: RegisterFormValues) => {
    lookup.mutate(values.taxNumber.trim(), {
      onSuccess: (found) => {
        setStep1(values);
        setTaxpayer(found);
        usernameForm.reset({ username: suggestUsername(values.email) });
      },
    });
  };

  const createAccount = ({ username }: UsernameFormValues) => {
    if (!step1 || !taxpayer) return;
    registerAccount.mutate(
      { username, password: step1.password, company: taxpayer.companyName, email: step1.email },
      { onSuccess: () => onSuccess?.(taxpayer) },
    );
  };

  if (step1 && taxpayer) {
    const active = taxpayer.status === "VALID";
    return (
      <form onSubmit={usernameForm.handleSubmit(createAccount)} className="flex flex-col gap-4" noValidate>
        <section aria-labelledby="taxpayer-heading" className="rounded-md border border-line bg-paper p-4">
          <h2 id="taxpayer-heading" className="text-sm font-semibold text-text">
            {t("authentication:confirm.title")}
          </h2>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted">{t("authentication:confirm.name")}</dt>
            <dd className="font-medium text-text">{taxpayer.companyName}</dd>
            <dt className="text-muted">{t("authentication:confirm.taxNumber")}</dt>
            <dd className="text-text">{formatTaxNumber(taxpayer.taxNumber)}</dd>
            <dt className="text-muted">{t("authentication:confirm.address")}</dt>
            <dd className="text-text">{taxpayer.fullAddress}</dd>
          </dl>
          {!active ? (
            <p role="alert" className="mt-3 text-sm text-red">
              {t("authentication:confirm.notActive", { status: taxpayer.status })}
            </p>
          ) : null}
        </section>

        <TextField
          label={t("authentication:fields.username")}
          autoComplete="username"
          error={usernameForm.formState.errors.username && t(usernameForm.formState.errors.username.message as string)}
          {...usernameForm.register("username")}
        />

        {registerError ? (
          <p role="alert" className="text-sm text-red">
            {registerError}
          </p>
        ) : null}
        <Button type="submit" variant="gold" block disabled={!active || registerAccount.isPending}>
          {registerAccount.isPending ? t("authentication:actions.submitting") : t("authentication:actions.confirmCompany")}
        </Button>
        <button
          type="button"
          className="text-sm font-medium text-gold-deep"
          onClick={() => {
            setStep1(null);
            setTaxpayer(null);
            registerAccount.reset();
          }}
        >
          {t("authentication:actions.changeTaxNumber")}
        </button>
      </form>
    );
  }

  const { register, handleSubmit, formState } = details;
  const errors = formState.errors;
  return (
    <form onSubmit={handleSubmit(findCompany)} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t("authentication:fields.email")}
        type="email"
        autoComplete="email"
        error={errors.email && t(errors.email.message as string)}
        {...register("email")}
      />
      <TextField
        label={t("authentication:fields.password")}
        type="password"
        autoComplete="new-password"
        error={errors.password && t(errors.password.message as string)}
        {...register("password")}
      />
      <TextField
        label={t("authentication:fields.taxNumber")}
        labelHint={t("authentication:fields.taxNumberHint")}
        inputMode="numeric"
        autoComplete="off"
        error={errors.taxNumber && t(errors.taxNumber.message as string)}
        {...register("taxNumber")}
      />
      <p className="-mt-2 text-xs text-muted">{t("authentication:fields.taxNumberHelp")}</p>

      <div className="flex flex-col gap-2">
        <Checkbox
          label={t("authentication:consent.terms")}
          error={errors.acceptTerms && t(errors.acceptTerms.message as string)}
          {...register("acceptTerms")}
        />
        <Checkbox label={t("authentication:consent.marketing")} {...register("marketingOptIn")} />
      </div>

      {lookupError ? (
        <p role="alert" className="text-sm text-red">
          {lookupError}
        </p>
      ) : null}
      <Button type="submit" variant="gold" block disabled={lookup.isPending}>
        {lookup.isPending ? t("authentication:actions.looking") : t("authentication:actions.findCompany")}
      </Button>
    </form>
  );
}
