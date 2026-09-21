import { useTranslation } from "react-i18next";
import { Button, Pager, QueryStatus, SearchIcon, buttonClasses } from "@/shared/components";
import { useFormat, useLang } from "@/shared/hooks/useFormat";
import { contactsCsvUrl } from "../api/crm.api";
import { useContactsQuery } from "../api/crm.queries";
import { CONTACT_SORTS, pageCount, withFilter, type ContactFilterKey } from "../domain/contactsState";
import { useContactsState } from "../hooks/useContactsState";
import { useVocabLabels } from "../hooks/useVocabLabels";
import { ContactLink } from "./ContactLink";
import { EngagementBar } from "./EngagementBar";
import { LifecycleBadge } from "./LifecycleBadge";
import type { VocabEntry } from "../types/crm.types";
import "../i18n";

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: VocabEntry[]; onChange: (value: string) => void }) {
  const lang = useLang();
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-line-strong bg-surface px-2 py-2 text-sm"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {lang === "en" ? option.label_en || option.label_hu : option.label_hu || option.label_en}
        </option>
      ))}
    </select>
  );
}

/** Every account and lead, filterable and sortable. The whole view is the URL, and the CSV export follows the same filter. */
export function ContactsPage() {
  const { t } = useTranslation("crm");
  const { money, date } = useFormat();
  const { state, update } = useContactsState();
  const query = useContactsQuery(state);
  const data = query.data;
  const labels = useVocabLabels(data?.vocabulary);
  const set = (key: ContactFilterKey) => (value: string) => update(withFilter(state, key, value));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="flex min-w-56 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            set("q")(String(new FormData(event.currentTarget).get("q") ?? "").trim());
          }}
        >
          <label className="relative flex-1">
            <span className="sr-only">{t("contacts.searchLabel")}</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              key={state.q}
              type="search"
              name="q"
              defaultValue={state.q}
              autoComplete="off"
              placeholder={t("contacts.searchPlaceholder")}
              className="w-full rounded-md border border-line-strong bg-white py-2 pl-10 pr-3 text-sm focus:outline focus:outline-2 focus:outline-gold"
            />
          </label>
          <Button type="submit" size="sm">
            {t("contacts.search")}
          </Button>
        </form>
        <FilterSelect label={t("contacts.allStages")} value={state.stage} options={data?.vocabulary.stages ?? []} onChange={set("stage")} />
        <FilterSelect label={t("contacts.allLifecycles")} value={state.lifecycle} options={data?.vocabulary.lifecycles ?? []} onChange={set("lifecycle")} />
        <FilterSelect label={t("contacts.allSources")} value={state.source} options={data?.vocabulary.sources ?? []} onChange={set("source")} />
        <select
          aria-label={t("contacts.sortLabel")}
          value={state.sort}
          onChange={(event) => set("sort")(event.target.value)}
          className="rounded-md border border-line-strong bg-surface px-2 py-2 text-sm"
        >
          {CONTACT_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(`contacts.sorts.${sort}`)}
            </option>
          ))}
        </select>
        <a href={contactsCsvUrl(state)} className={buttonClasses({ variant: "ghost", size: "sm" })}>
          {t("contacts.csv")}
        </a>
      </div>

      <QueryStatus isLoading={query.isLoading} error={query.error} />

      {data ? (
        <>
          <p className="mb-3 text-sm text-muted">{t("contacts.count", { count: data.total })}</p>
          {data.contacts.length ? (
            <div className="overflow-x-auto rounded-lg border border-line bg-surface">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="border-b border-line bg-paper text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {(["company", "lifecycle", "stage", "engagement", "value", "task"] as const).map((col) => (
                      <th key={col} scope="col" className="px-3 py-2 font-medium">
                        {t(`contacts.col.${col}`)}
                      </th>
                    ))}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.contacts.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="px-3 py-2">
                        <b className="block font-medium">{c.company || c.username || c.email || "—"}</b>
                        <span className="block text-xs text-muted">
                          {c.username || c.contactName || "—"}
                          {c.email ? ` · ${c.email}` : ""}
                        </span>
                        <span className="block text-xs text-muted">
                          {labels.source(c.source)} · {date(c.createdAt)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <LifecycleBadge lifecycle={c.lifecycle} label={labels.lifecycle(c.lifecycle)} />
                        {c.subscription.daysLeft != null ? (
                          <span className="mt-1 block text-xs text-muted">{t("contacts.daysLeft", { count: c.subscription.daysLeft })}</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        {labels.stage(c.stage)}
                        {c.daysInStage != null ? <span className="block text-xs text-muted">{t("contacts.daysInStage", { count: c.daysInStage })}</span> : null}
                      </td>
                      <td className="px-3 py-2">
                        {c.kind === "account" ? (
                          <EngagementBar engagement={c.engagement} />
                        ) : (
                          <span className="text-xs text-muted">{c.readiness != null ? t("contacts.assessment", { score: c.readiness }) : "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{c.monthlyValueHuf ? money(c.monthlyValueHuf) : "—"}</td>
                      <td className="px-3 py-2">
                        {c.openTasks ? (
                          <>
                            {c.openTasks}
                            {c.overdueTasks ? <span className="ml-1 rounded-full bg-red-bg px-2 py-0.5 text-xs text-red">{t("contacts.overdue")}</span> : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <ContactLink id={c.id} className="rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-paper">
                          {t("contacts.open")}
                        </ContactLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-lg border border-line bg-surface p-6 text-center text-sm font-medium">{t("contacts.empty")}</p>
          )}
          <Pager page={data.page} pages={pageCount(data.total, data.pageSize)} onPage={(page) => update({ ...state, page })} />
        </>
      ) : null}
    </>
  );
}
