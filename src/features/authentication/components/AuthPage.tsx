import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { LanguageToggle, Panel } from "@/shared/components";
import { useMeQuery } from "../api/auth.queries";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import "../i18n";

export type AuthMode = "login" | "register";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation("authentication");
  const navigate = useNavigate();
  const { data } = useMeQuery();
  const isRegister = mode === "register";

  // `/app` sends a visitor without a profile on to the onboarding wizard.
  const handleSuccess = () => navigate("/app");

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-display text-lg font-semibold text-ink">HUNTER</span>
          <LanguageToggle />
        </div>

        <Panel>
          <h1 className="font-display text-xl font-semibold text-text">
            {isRegister ? t("register.title") : t("login.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{isRegister ? t("register.subtitle") : t("login.subtitle")}</p>

          <div className="mt-4 flex rounded-md border border-line-strong p-1">
            <Link
              to="/login"
              className={`flex-1 rounded px-3 py-1.5 text-center text-sm font-medium ${
                !isRegister ? "bg-ink text-white" : "text-muted"
              }`}
            >
              {t("tabs.login")}
            </Link>
            <Link
              to="/register"
              className={`flex-1 rounded px-3 py-1.5 text-center text-sm font-medium ${
                isRegister ? "bg-ink text-white" : "text-muted"
              }`}
            >
              {t("tabs.register")}
            </Link>
          </div>

          <div className="mt-5">
            {isRegister ? (
              <RegisterForm onSuccess={handleSuccess} />
            ) : (
              <LoginForm onSuccess={handleSuccess} />
            )}
          </div>

          {!isRegister && data?.adminSeed.usingDefaultPassword ? (
            <div
              className="mt-4 rounded-md bg-gold-bg p-3 text-xs text-gold-deep"
              // Safe: a fixed translation string we author, not user input.
              dangerouslySetInnerHTML={{ __html: t("adminHint") }}
            />
          ) : null}

          <Link to="/" className="mt-4 block text-center text-sm text-muted hover:text-text">
            {t("backToHome")}
          </Link>
        </Panel>
      </div>
    </div>
  );
}
