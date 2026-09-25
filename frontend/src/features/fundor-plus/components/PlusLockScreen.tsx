import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LockIcon, PageHead, Panel, buttonClasses } from "@/shared/components";
import { useIsAuthenticated } from "@/shared/hooks/useAuth";
import "../i18n";

interface Feature {
  title: string;
  text: string;
}

/** What Fundor Plus is, honestly, for someone without access. There is no switch to flip: access is the account's real subscription. */
export function PlusLockScreen() {
  const { t } = useTranslation("plus");
  const isAuthenticated = useIsAuthenticated();
  const features = t("lock.features", { returnObjects: true }) as Feature[];

  return (
    <>
      <PageHead title={t("title")}>{t("subtitle")}</PageHead>
      <Panel className="py-10 text-center">
        <span className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-full bg-gold-bg px-3 py-1 text-xs font-medium text-gold-deep">
          <LockIcon size={14} /> {t("title")}
        </span>
        <h2 className="font-display text-2xl font-semibold text-ink">{t("lock.headline")}</h2>
        <p className="mx-auto mt-2 max-w-prose text-sm text-muted">{t("lock.body")}</p>
        <ul className="mx-auto mt-6 grid max-w-2xl gap-4 text-left sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title} className="text-sm">
              <b className="block font-medium">{feature.title}</b>
              <span className="text-muted">{feature.text}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-6 max-w-prose rounded-md bg-paper p-3 text-sm text-muted">{t("lock.access")}</p>
        {!isAuthenticated ? (
          <Link to="/register" className={buttonClasses({ variant: "dark", className: "mt-5" })}>
            {t("lock.cta")}
          </Link>
        ) : null}
      </Panel>
    </>
  );
}
