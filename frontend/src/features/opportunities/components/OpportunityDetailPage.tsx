import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { BackIcon, Badge, Button, ExternalIcon, Panel, buttonClasses } from "@/shared/components";
import { useFormat } from "@/shared/hooks/useFormat";
import { useCompanyProfile } from "@/features/profile/hooks/useCompanyProfile";
import { EligibilityBadge } from "@/features/scoring/components/EligibilityBadge";
import { FundorScoreRing } from "@/features/scoring/components/FundorScoreRing";
import { ScoreBreakdown } from "@/features/scoring/components/ScoreBreakdown";
import { ruleLabel } from "@/features/scoring/domain/engine";
import { useFundorScore } from "@/features/scoring/hooks/useScoring";
import type { Opportunity } from "@/features/scoring/types/scoring.types";
import { applyLinks, isCuratedReference } from "../domain/applyLinks";
import { useOpportunity } from "../hooks/useOpportunity";
import { useRuleValueFormatter } from "../hooks/useRuleValueFormatter";
import { useSaved } from "../hooks/useSaved";
import { ApplyPanel } from "./ApplyPanel";
import { CatalogStatus } from "./CatalogStatus";
import { CheckLine } from "./CheckLine";
import { ConsortiumPanel } from "./ConsortiumPanel";
import { FundingCalculator } from "./FundingCalculator";
import { WhyBlocks } from "./WhyBlocks";
import "../i18n";

function BackLink() {
  const { t } = useTranslation("opportunities");
  return (
    <Link to="/app/opportunities" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-text">
      <BackIcon /> {t("detail.back")}
    </Link>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper px-3 py-2">
      <div className="text-xs text-muted">{label}</div>
      <div className="text-sm font-semibold text-text">{value}</div>
    </div>
  );
}

function SourceNote({ opp }: { opp: Opportunity }) {
  const { t } = useTranslation("opportunities");
  const origin =
    opp.sourceSystem === "EU_FUNDING_TENDERS"
      ? t("detail.source.ecPortal")
      : opp.curated
        ? t("detail.source.curated")
        : t("detail.source.national");
  const url = opp.sourceUrl || opp.submissionUrl;
  return (
    <p className="mt-6 flex flex-wrap items-center gap-1 text-xs text-muted">
      {t("detail.source.label")}: {origin} — <b>{opp.sourceRef || ""}</b>. {t("detail.source.disclaimer")}
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 text-gold-deep">
          {t("detail.source.officialCall")} <ExternalIcon />
        </a>
      ) : null}
    </p>
  );
}

export function OpportunityDetailPage() {
  const { id = "" } = useParams();
  const { t } = useTranslation("opportunities");
  const { huf, date, lang } = useFormat();
  const formatValue = useRuleValueFormatter();
  const { profile } = useCompanyProfile();
  const data = useOpportunity(id);
  const opp = data.opp;
  const result = useFundorScore(opp);
  const saved = useSaved();

  if (data.isLoading || data.error) {
    return (
      <>
        <BackLink />
        <CatalogStatus isLoading={data.isLoading} error={data.error} />
      </>
    );
  }

  if (data.gated) {
    return (
      <>
        <BackLink />
        <Panel title={t("detail.gated.title")}>
          <p className="text-sm text-muted">{t("detail.gated.body")}</p>
        </Panel>
      </>
    );
  }

  if (!opp || !result || !profile) {
    return (
      <>
        <BackLink />
        <Panel title={t("detail.notFound.title")}>
          <p className="text-sm text-muted">{t("detail.notFound.body")}</p>
        </Panel>
      </>
    );
  }

  const days = result.elig.days;
  const links = applyLinks(opp);
  const applyHref = links.submit || links.official;
  const hasRange = opp.fundingMin || opp.fundingMax;
  const funding = !hasRange
    ? t("detail.facts.notPublished")
    : opp.fundingMin && opp.fundingMax && opp.fundingMin !== opp.fundingMax
      ? `${huf(opp.fundingMin)}–${huf(opp.fundingMax)}`
      : huf((opp.fundingMax || opp.fundingMin) as number);
  const applicant = opp.consortium?.required
    ? t("detail.facts.consortium", { partners: opp.consortium.minPartners, countries: opp.consortium.minCountries })
    : t("detail.facts.single");
  const isSaved = saved.isSaved(opp.id);

  return (
    <>
      <BackLink />
      <Panel className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-64 flex-1">
            <p className="text-xs font-medium text-muted">{opp.program}</p>
            <h1 className="font-display text-xl font-semibold text-ink">{opp.title}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <EligibilityBadge status={result.elig.status} />
              {days <= 14 ? <Badge tone="amber">{t("detail.closingIn", { n: days })}</Badge> : <Badge tone="slate">{t("card.open")}</Badge>}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <Fact label={opp.partnerShare ? t("detail.facts.fundingWhole") : t("detail.facts.funding")} value={funding} />
              <Fact label={t("detail.facts.intensity")} value={`${Math.round(opp.intensity * 100)}%`} />
              <Fact label={t("detail.facts.deadline")} value={date(opp.deadline)} />
              <Fact label={t("detail.facts.applicant")} value={applicant} />
            </div>
          </div>
          <FundorScoreRing score={result.score} estimated={result.estimated} />
        </div>
      </Panel>

      {result.blocked ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-lg bg-red-bg p-5">
            <h2 className="font-display text-lg font-semibold text-red">{t("detail.blocked.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("detail.blocked.body")}</p>
          </div>
          <Panel title={t("detail.blocked.criteria")}>
            <ul className="flex flex-col gap-2">
              {result.elig.checks
                .filter((c) => c.status !== "unknown")
                .sort((a, b) => Number(b.status === "fail") - Number(a.status === "fail"))
                .map((c) => (
                  <CheckLine
                    key={c.rule.field + c.rule.op}
                    status={c.status === "fail" ? "fail" : "pass"}
                    yours={t("detail.why.yours", { value: formatValue(c.rule.field, c.value) })}
                  >
                    {ruleLabel(c.rule, lang)}
                  </CheckLine>
                ))}
            </ul>
          </Panel>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Panel title={t("detail.breakdown.title")} subtitle={t("detail.breakdown.subtitle")}>
            <ScoreBreakdown opp={opp} profile={profile} result={result} />
          </Panel>
          <Panel title={t("detail.why.title")} subtitle={t("detail.why.subtitle")}>
            <WhyBlocks opp={opp} elig={result.elig} projectValueHuf={profile.investment_value} />
          </Panel>
          <ConsortiumPanel opp={opp} />
          <Panel title={t("detail.calculator.title")} subtitle={t("detail.calculator.subtitle")}>
            <FundingCalculator key={opp.id} opp={opp} initialValueHuf={profile.investment_value} />
          </Panel>
          {opp.docs?.length ? (
            <Panel title={t("detail.documents")}>
              <ul className="flex flex-col gap-2">
                {opp.docs.map((doc) => (
                  <CheckLine key={doc} status="pass">
                    {doc}
                  </CheckLine>
                ))}
              </ul>
            </Panel>
          ) : null}
          <ApplyPanel opp={opp} daysLeft={days} />
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={() => void saved.toggle(opp.id)} disabled={saved.isToggling} aria-pressed={isSaved}>
              {isSaved ? t("detail.actions.saved") : t("detail.actions.save")}
            </Button>
            {applyHref ? (
              <a
                href={applyHref}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "gold", className: "flex-1" })}
              >
                {links.submit ? t("detail.apply.start") : t("detail.apply.openOfficial")} <ExternalIcon />
              </a>
            ) : isCuratedReference(links) ? null : (
              <span className="flex-1 self-center text-center text-sm text-muted">{t("detail.apply.noLink")}</span>
            )}
          </div>
        </div>
      )}
      <SourceNote opp={opp} />
    </>
  );
}
