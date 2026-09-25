import { useTranslation } from "react-i18next";
import { PageHead, QueryStatus } from "@/components/index";
import { useAdminUsersQuery } from "@/features/admin/api/admin.queries";
import { StatRow, StatTile } from "@/features/admin/components/StatTile";
import { UserCard } from "@/features/admin/components/UserCard";
import "@/features/admin/i18n/index";

export function UsersPage() {
  const { t } = useTranslation("admin");
  const users = useAdminUsersQuery();
  const data = users.data;

  return (
    <>
      <PageHead title={t("users.title")}>{t("users.subtitle")}</PageHead>
      <QueryStatus isLoading={users.isLoading} error={users.error} />
      {data ? (
        <>
          <StatRow>
            <StatTile value={data.stats.users} label={t("users.stats.users")} />
            <StatTile value={data.stats.activeSubscriptions} label={t("users.stats.activeSubscriptions")} tone="green" />
            <StatTile value={data.stats.admins} label={t("users.stats.admins")} />
            <StatTile value={data.stats.sessions} label={t("users.stats.sessions")} />
          </StatRow>
          <div className="flex flex-col gap-4">
            {data.users.map((user) => (
              <UserCard key={user.id} user={user} plans={data.plans} />
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
