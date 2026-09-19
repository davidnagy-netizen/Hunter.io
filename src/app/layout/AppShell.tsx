import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router";
import { ExitIcon, LanguageToggle, Logo } from "@/shared/components";
import { useLogoutMutation } from "@/features/authentication/api/auth.queries";
import { useCurrentUser, useIsAdmin, useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import type { NavItem } from "@/shared/types/navigation.types";
import "../i18n";

export type Workspace = "app" | "admin";

function AccountBlock() {
  const { t } = useTranslation("app");
  const navigate = useNavigate();
  const user = useCurrentUser();
  const isAdmin = useIsAdmin();
  const isSubscriber = useIsSubscriber();
  const logout = useLogoutMutation();
  const { profile } = useCompanyProfile();

  const initials = profile?.initials ?? (user?.username ?? "H").slice(0, 2).toUpperCase();

  if (!user) {
    return (
      <div className="flex items-center gap-3 border-t border-white/10 pt-4">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">{initials}</span>
        <div className="min-w-0 flex-1 text-sm">
          <b className="block truncate">{profile?.company}</b>
          <button type="button" className="text-xs text-white/60 hover:text-white" onClick={() => navigate("/login")}>
            {t("shell.signIn")}
          </button>
        </div>
      </div>
    );
  }

  const tier = isAdmin ? t("shell.admin") : isSubscriber ? t("shell.subscriber") : t("shell.free");
  return (
    <div className="flex items-center gap-3 border-t border-white/10 pt-4">
      <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">{initials}</span>
      <div className="min-w-0 flex-1 text-sm">
        <b className="block truncate">{user.username}</b>
        <span className="block truncate text-xs text-white/60">
          {user.company ?? profile?.company} · {tier}
        </span>
      </div>
      <button
        type="button"
        title={t("shell.signOut")}
        aria-label={t("shell.signOut")}
        className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
        onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
      >
        <ExitIcon />
      </button>
    </div>
  );
}

/**
 * An administrator has two jobs — see what a client sees, and run the
 * service — and they are separate workspaces, each with its own nav. Rendered
 * for admins only; the workspace is the URL prefix, so this is plain links.
 */
function WorkspaceSwitch({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation("app");
  const isAdmin = useIsAdmin();
  if (!isAdmin) return null;

  const item = (to: string, label: string, active: boolean) => (
    <NavLink
      to={to}
      className={[
        "flex-1 rounded px-2 py-1.5 text-center text-xs font-medium",
        active ? "bg-white text-ink" : "text-white/70 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </NavLink>
  );

  return (
    <div>
      <div role="group" aria-label={t("shell.workspace.label")} className="flex gap-1 rounded-md border border-white/20 p-1">
        {item("/app", t("shell.workspace.client"), workspace === "app")}
        {item("/admin", t("shell.workspace.admin"), workspace === "admin")}
      </div>
      <p className="mt-2 text-xs text-white/50">
        {workspace === "admin" ? t("shell.workspace.adminNote") : t("shell.workspace.clientNote")}
      </p>
    </div>
  );
}

/** The narrow-screen counterpart: the sidebar (and its switch) is hidden there, so offer the other workspace as one link. */
function MobileWorkspaceLink({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation("app");
  if (!useIsAdmin()) return null;
  const toAdmin = workspace === "app";
  return (
    <NavLink to={toAdmin ? "/admin" : "/app"} className="rounded-md border border-white/30 px-2.5 py-1 text-xs font-medium text-white/80">
      {toAdmin ? t("shell.workspace.admin") : t("shell.workspace.client")}
    </NavLink>
  );
}

export interface AppShellProps {
  /** This workspace's navigation entries, in display order. */
  nav: NavItem[];
  workspace: Workspace;
}

/**
 * The signed-in application frame: a fixed sidebar on desktop, a bottom bar
 * on narrow screens. Knows nothing about any feature's screens — it renders
 * the nav entries it is given and an `<Outlet />`.
 */
export function AppShell({ nav, workspace }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-6 bg-ink p-5 text-white md:flex">
        <Logo dark />
        <WorkspaceSwitch workspace={workspace} />
        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <item.icon />
              {t(`${item.namespace}:${item.labelKey}`)}
            </NavLink>
          ))}
        </nav>
        <LanguageToggle className="self-start" tone="dark" />
        <AccountBlock />
      </aside>

      <div className="flex items-center justify-between bg-ink px-4 py-3 md:hidden">
        <Logo dark />
        <div className="flex items-center gap-2">
          <MobileWorkspaceLink workspace={workspace} />
          <LanguageToggle tone="dark" />
        </div>
      </div>

      <main className="px-4 pb-24 pt-6 md:ml-60 md:px-10 md:py-10">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-surface py-2 md:hidden">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              ["flex flex-col items-center gap-0.5 px-4 py-1 text-xs", isActive ? "text-gold-deep" : "text-muted"].join(" ")
            }
          >
            <item.icon />
            {t(`${item.namespace}:${item.labelKey}`)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
