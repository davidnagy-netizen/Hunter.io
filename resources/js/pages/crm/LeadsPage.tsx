import { useTranslation } from "react-i18next";
import { Badge, QueryStatus } from "@/components/index";
import { useFormat } from "@/composables/useFormat";
import { useLeadsQuery } from "@/features/crm/api/crm.queries";
import { useVocabLabels } from "@/features/crm/hooks/useVocabLabels";
import { ContactLink } from "@/features/crm/components/ContactLink";
import "@/features/crm/i18n/index";

/** People who finished the free assessment and asked to be contacted — with what they actually submitted, so the first call isn't cold. */
export function LeadsPage() {
  const { t } = useTranslation("crm");
  const { date, huf } = useFormat();
  const query = useLeadsQuery();
  const data = query.data;
  const labels = useVocabLabels(data?.vocabulary);

  return (
    <>
      <p className="mb-4 text-sm text-muted">{t("leads.intro")}</p>
      <QueryStatus isLoading={query.isLoading} error={query.error} />

      {data ? (
        data.leads.length ? (
          <div className="overflow-x-auto rounded-lg border border-line bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                <tr>
                  {(["company", "assessment", "stage", "arrived"] as const).map((col) => (
                    <th key={col} scope="col" className="px-3 py-2 font-medium">
                      {t(`leads.col.${col}`)}
                    </th>
                  ))}
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.leads.map((lead) => {
                  const summary = [
                    lead.profile?.employees ? t("leads.staff", { count: lead.profile.employees }) : "",
                    lead.profile?.county ?? "",
                    lead.profile?.investment_value ? huf(lead.profile.investment_value) : "",
                  ].filter(Boolean);
                  return (
                    <tr key={lead.id} className="align-top">
                      <td className="px-3 py-2">
                        <b className="block font-medium">{lead.company || "—"}</b>
                        <span className="block text-xs text-muted">
                          {[lead.contactName || "—", lead.email, lead.phone].filter(Boolean).join(" · ")}
                        </span>
                        {lead.convertedUserId ? <Badge tone="gold" className="mt-1">{t("leads.converted")}</Badge> : null}
                      </td>
                      <td className="px-3 py-2">
                        {lead.readiness != null ? (
                          <>
                            <b>{lead.readiness}</b> / 100
                          </>
                        ) : (
                          "—"
                        )}
                        {summary.length ? <span className="block text-xs text-muted">{summary.join(" · ")}</span> : null}
                      </td>
                      <td className="px-3 py-2">{labels.stage(lead.stage)}</td>
                      <td className="px-3 py-2">{date(lead.createdAt)}</td>
                      <td className="px-3 py-2">
                        <ContactLink id={lead.id} className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-paper">
                          {t("contacts.open")}
                        </ContactLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface p-6 text-center">
            <b className="text-sm">{t("leads.empty")}</b>
            <p className="mt-1 text-sm text-muted">{t("leads.emptyHint")}</p>
          </div>
        )
      ) : null}
    </>
  );
}
