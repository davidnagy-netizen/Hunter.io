import { LanguageToggle, Logo, Panel } from "@/shared/components";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";
import { useMeQuery } from "@/shared/api/auth.queries";
import "../i18n";
import { homePathFor } from "@/shared/lib/homePath";
import type { AuthUser } from "@/shared/types/auth.types";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export type AuthMode = "login" | "register";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { t } = useTranslation("authentication");
  const navigate = useNavigate();
  const { data } = useMeQuery();
  const isRegister = mode === "register";

  // The confirmed company carries over to the onboarding wizard, which asks only for what NAV cannot tell us.
  // `/app` sends a visitor without a profile on to the wizard.
  const handleRegistered = () => navigate("/verify-email");
  const handleSignedIn = (user: AuthUser) => navigate(homePathFor(user));

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Logo onClick={() => navigate("/", { replace: true })} />
          <LanguageToggle />
        </div>

        <Panel>
          <h1 className="font-display text-xl font-semibold text-text">
            {isRegister ? t("register.title") : t("login.title")}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister ? t("register.subtitle") : t("login.subtitle")}
          </p>

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
              <RegisterForm onSuccess={handleRegistered} />
            ) : (
              <LoginForm onSuccess={handleSignedIn} />
            )}
          </div>

          {!isRegister && data?.adminSeed?.usingDefaultPassword ? (
            <div
              className="mt-4 rounded-md bg-gold-bg p-3 text-xs text-gold-deep"
              // Safe: a fixed translation string we author, not user input.
              dangerouslySetInnerHTML={{ __html: t("adminHint") }}
            />
          ) : null}

          <Link
            to="/"
            className="mt-4 block text-center text-sm text-muted hover:text-text"
          >
            {t("backToHome")}
          </Link>
        </Panel>
      </div>
    </div>
  );
}
