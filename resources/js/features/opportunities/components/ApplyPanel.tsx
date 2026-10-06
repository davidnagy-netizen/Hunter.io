import { useTranslation } from "react-i18next";
import { ExternalIcon, Panel, StepList, type Step } from "@/components";
import { useFormat } from "@/composables/useFormat";
import type { Opportunity } from "@/features/scoring/types/scoring.types";
import { applyLinks, isCuratedReference } from "../domain/applyLinks";
import "../i18n";

function LinkRow({ href, title, sub, primary = false }: { href: string; title: string; sub: string; primary?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        "flex items-center gap-3 rounded-md border p-3 hover:bg-paper",
        primary ? "border-gold bg-gold-bg" : "border-line",
      ].join(" ")}
    >
      <ExternalIcon />
      <span className="flex flex-col">
        <b className="text-sm text-text">{title}</b>
        <small className="text-xs text-muted">{sub}</small>
      </span>
    </a>
  );
}

function LinksTitle() {
  const { t } = useTranslation("opportunities");
  return <h3 className="mb-2 mt-6 text-sm font-semibold text-text">{t("detail.apply.linksTitle")}</h3>;
}

/**
 * The application process step by step, then where to go and by when. A curated reference entry says so instead of
 * showing a made-up deep link.
 */
export function ApplyPanel({ opp, daysLeft }: { opp: Opportunity; daysLeft: number }) {
  const { t } = useTranslation("opportunities");
  const { date } = useFormat();
  const links = applyLinks(opp);
  const steps = t("detail.apply.steps", { returnObjects: true }) as Step[];

  if (isCuratedReference(links)) {
    return (
      <Panel title={t("detail.apply.title")}>
        <p className="mb-5 rounded-md bg-gold-bg p-3 text-sm text-gold-deep">{t("detail.apply.curatedNote")}</p>
        <StepList steps={steps} />
        <LinksTitle />
        <LinkRow href={links.portal} title={t("detail.apply.curatedPortal")} sub={t("detail.apply.curatedPortalSub")} />
      </Panel>
    );
  }

  return (
    <Panel title={t("detail.apply.title")} subtitle={t("detail.apply.body")}>
      <StepList steps={steps} />
      <LinksTitle />
      <div className="flex flex-col gap-2">
        {links.official ? (
          <LinkRow
            href={links.official}
            title={t("detail.apply.officialPage")}
            sub={t("detail.apply.officialSub", { ref: opp.sourceRef ?? "" })}
          />
        ) : null}
        {links.submit ? (
          <LinkRow href={links.submit} title={t("detail.apply.submission")} sub={t("detail.apply.submissionSub")} primary />
        ) : null}
        <LinkRow href={links.portal} title={t("detail.apply.portal")} sub={t("detail.apply.portalSub")} />
      </div>
      <p className="mt-3 text-xs text-muted">
        {daysLeft > 0 ? t("detail.apply.daysLeft", { date: date(opp.deadline), n: daysLeft }) : t("detail.apply.passed")}
      </p>
    </Panel>
  );
}
