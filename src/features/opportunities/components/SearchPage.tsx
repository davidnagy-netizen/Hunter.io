import { useTranslation } from "react-i18next";
import { Button, SearchIcon, PageHead, Pager } from "@/shared/components";
import { useMetaQuery } from "@/shared/api/meta.queries";
import { useLang } from "@/shared/hooks/useFormat";
import { useSearchQuery } from "../api/opportunities.queries";
import {
  PAGE_SIZE,
  SEARCH_SORTS,
  hasActiveFilters,
  toggleFacetValue,
  type ListFacet,
} from "../domain/searchState";
import { useFacetLabel } from "../hooks/useFacetLabel";
import { useSearchState } from "../hooks/useSearchState";
import { SearchFacets } from "./SearchFacets";
import { SearchResultCard } from "./SearchResultCard";
import { TeaserCard } from "./TeaserCard";
import { UpsellBlock } from "./UpsellBlock";
import { isLockedRow } from "../types/opportunities.types";
import "../i18n";

/**
 * Full-text search over the whole catalog (open *and* forthcoming calls), run
 * and scored by the server. The search lives in the URL (`useSearchState`).
 */
export function SearchPage() {
  const { t } = useTranslation("opportunities");
  const lang = useLang();
  const { state, update } = useSearchState();
  const search = useSearchQuery(state, lang);
  const meta = useMetaQuery();
  const facetLabel = useFacetLabel();
  const result = search.data;

  const chips: { facet: ListFacet | "consortium"; value: string }[] = [
    ...state.filters.program.map((value) => ({ facet: "program" as const, value })),
    ...state.filters.goals.map((value) => ({ facet: "goals" as const, value })),
    ...state.filters.actionCode.map((value) => ({ facet: "actionCode" as const, value })),
    ...(state.filters.consortium ? [{ facet: "consortium" as const, value: state.filters.consortium }] : []),
  ];
  const toggle = (facet: ListFacet | "consortium", value: string) => update(toggleFacetValue(state, facet, value));
  const pages = result ? Math.max(1, Math.ceil(result.total / (result.pageSize || PAGE_SIZE))) : 1;
  const catalog = meta.data?.catalog;

  return (
    <>
      <PageHead title={t("search.title")}>{t("search.subtitle")}</PageHead>

      {/* Uncontrolled and keyed on the URL's `q`, so the box follows back/forward navigation without effects. */}
      <form
        key={state.q}
        role="search"
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
          update({ ...state, q, page: 1 });
        }}
      >
        <label className="relative flex-1">
          <span className="sr-only">{t("search.title")}</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={state.q}
            autoComplete="off"
            placeholder={t("search.placeholder")}
            className="w-full rounded-md border border-line-strong bg-white py-2.5 pl-10 pr-3 text-sm focus:outline focus:outline-2 focus:outline-gold"
          />
        </label>
        <Button type="submit">{t("search.go")}</Button>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted" aria-live="polite">
          {result ? (
            <>
              <b className="text-text">{t("search.results", { count: result.total })}</b>
              {state.q ? ` ${t("search.resultsFor", { q: state.q })}` : ""}
            </>
          ) : search.isLoading ? (
            t("search.loading")
          ) : null}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={state.filters.eligibleOnly}
            onClick={() =>
              update({ ...state, page: 1, filters: { ...state.filters, eligibleOnly: !state.filters.eligibleOnly } })
            }
            className={[
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              state.filters.eligibleOnly ? "border-gold bg-gold-bg text-gold-deep" : "border-line-strong bg-white text-text",
            ].join(" ")}
          >
            {t("search.onlyEligible")}
          </button>
          {SEARCH_SORTS.map((sort) => (
            <button
              key={sort || "relevance"}
              type="button"
              aria-pressed={state.sort === sort}
              onClick={() => update({ ...state, sort, page: 1 })}
              className={[
                "rounded-md border px-2.5 py-1 text-xs font-medium",
                state.sort === sort ? "border-ink bg-ink text-white" : "border-line-strong bg-white text-text",
              ].join(" ")}
            >
              {t(`search.sort.${sort}`)}
            </button>
          ))}
        </div>
      </div>

      {chips.length || state.filters.eligibleOnly ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {chips.map(({ facet, value }) => (
            <span key={facet + value} className="inline-flex items-center gap-1 rounded-full bg-gold-bg px-2.5 py-1 text-xs font-medium text-gold-deep">
              {facetLabel(facet, value)}
              <button type="button" aria-label={`${t("search.remove")}: ${facetLabel(facet, value)}`} onClick={() => toggle(facet, value)}>
                ×
              </button>
            </span>
          ))}
          {hasActiveFilters(state) ? (
            <button
              type="button"
              className="text-xs font-medium text-muted underline"
              onClick={() => update({ ...state, page: 1, filters: { program: [], goals: [], actionCode: [], eligibleOnly: false } })}
            >
              {t("search.clearAll")}
            </button>
          ) : null}
        </div>
      ) : null}

      {result ? <SearchFacets facets={result.facets} state={state} onToggle={toggle} /> : null}

      {search.error ? (
        <div role="alert" className="rounded-md bg-red-bg p-4 text-sm text-red">
          <b className="block">{t("search.unavailable")}</b>
          {search.error instanceof Error ? search.error.message : String(search.error)}
        </div>
      ) : result && result.results.length === 0 ? (
        <div className="rounded-md border border-line bg-surface p-6 text-center text-sm text-muted">
          <b className="block text-text">{t("search.empty.title")}</b>
          {t("search.empty.body")}
        </div>
      ) : result ? (
        <>
          <div className="flex flex-col gap-3">
            {result.results.map((row, i) =>
              isLockedRow(row) ? <TeaserCard key={row.ref} teaser={row} /> : <SearchResultCard key={row.id ?? i} row={row} />,
            )}
          </div>
          <div className="mt-4">
            <UpsellBlock lockedCount={result.lockedCount} />
          </div>
          <Pager page={result.page} pages={pages} onPage={(page) => update({ ...state, page })} />
        </>
      ) : null}

      {catalog ? (
        <p className="mt-8 flex flex-wrap gap-x-2 text-xs text-muted">
          <span>
            {t("search.source")}:{" "}
            <a
              className="text-gold-deep"
              href="https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home"
              target="_blank"
              rel="noopener noreferrer"
            >
              EU Funding &amp; Tenders Portal
            </a>
          </span>
          {catalog.counts ? <span>· {t("search.inCatalog", { n: catalog.counts.total })}</span> : null}
          {catalog.eurHuf ? <span>· {t("search.rate", { rate: catalog.eurHuf })}</span> : null}
        </p>
      ) : null}
    </>
  );
}
