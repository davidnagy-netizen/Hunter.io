import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, TextField } from "@/components";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useLoginMutation } from "../api/auth.queries";
import { loginSchema, type LoginFormValues } from "../schemas/auth.schemas";
import type { AuthUser } from "../types/auth.types";
import "../i18n";

export interface LoginFormProps {
  onSuccess?: (user: AuthUser) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation(["authentication", "errors"]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const login = useLoginMutation();
  const apiErrorMessage = useTranslatedApiError(login.error);

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, { onSuccess: (response) => onSuccess?.(response.user) });
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
        label={t("authentication:fields.password")}
        type="password"
        autoComplete="current-password"
        error={errors.password && t(errors.password.message as string)}
        {...register("password")}
      />
      {apiErrorMessage ? (
        <p role="alert" className="text-sm text-red">
          {apiErrorMessage}
        </p>
      ) : null}
      <Button type="submit" variant="gold" block disabled={login.isPending}>
        {login.isPending ? t("authentication:actions.submitting") : t("authentication:actions.submitLogin")}
      </Button>
    </form>
  );
}
