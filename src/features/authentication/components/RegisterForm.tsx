import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/shared/components";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { useRegisterMutation } from "../api/auth.queries";
import { registerSchema, type RegisterFormValues } from "../schemas/auth.schemas";
import "../i18n";

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { t } = useTranslation(["authentication", "errors"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const registerAccount = useRegisterMutation();
  const apiErrorMessage = useTranslatedApiError(registerAccount.error);

  const onSubmit = (values: RegisterFormValues) => {
    registerAccount.mutate(values, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <TextField
        label={t("authentication:fields.username")}
        autoComplete="username"
        error={errors.username && t(errors.username.message as string)}
        {...register("username")}
      />
      <TextField
        label={t("authentication:fields.company")}
        autoComplete="organization"
        {...register("company")}
      />
      <TextField
        label={t("authentication:fields.email")}
        labelHint={t("authentication:fields.optional")}
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
      {apiErrorMessage ? (
        <p role="alert" className="text-sm text-red">
          {apiErrorMessage}
        </p>
      ) : null}
      <Button type="submit" variant="gold" block disabled={registerAccount.isPending}>
        {registerAccount.isPending
          ? t("authentication:actions.submitting")
          : t("authentication:actions.submitRegister")}
      </Button>
    </form>
  );
}
