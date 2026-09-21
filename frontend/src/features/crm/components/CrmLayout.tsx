import { useTranslation } from "react-i18next";
import { NavLink, Outlet } from "react-router";
import { PageHead } from "@/shared/components";
import { useCrmBoardQuery } from "../api/crm.queries";
import "../i18n";

type CountKey = "openDeals" | "contacts" | "leads";
const TABS: { to: string; key: string; end?: boolean; count?: CountKey }[] = [
  { to: "/admin/crm", key: "tabs.pipeline", end: true, count: "openDeals" },
  { to: "/admin/crm/contacts", key: "tabs.contacts", count: "contacts" },
  { to: "/admin/crm/leads", key: "tabs.leads", count: "leads" },
  { to: "/admin/crm/insights", key: "tabs.insights" },
];

/** The CRM's frame: its heading and, once there is more than one, its tab strip. Each tab is a route, so it can be linked. */
export function CrmLayout() {
  const { t } = useTranslation("crm");
  const metrics = useCrmBoardQuery().data?.metrics;

  return (
    <>
      <PageHead title={t("title")}>{t("subtitle")}</PageHead>
      {TABS.length > 1 ? (
        <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                ["-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium", isActive ? "border-gold text-text" : "border-transparent text-muted hover:text-text"].join(" ")
              }
            >
              {t(tab.key)}
              {tab.count && metrics ? <span className="ml-2 rounded-full bg-line px-2 py-0.5 text-xs text-muted">{metrics[tab.count]}</span> : null}
            </NavLink>
          ))}
        </nav>
      ) : null}
      <Outlet />
    </>
  );
}
