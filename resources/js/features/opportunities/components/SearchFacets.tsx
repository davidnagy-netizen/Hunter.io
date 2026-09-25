import { useTranslation } from "react-i18next";
import { useFacetLabel, type FacetKey } from "../hooks/useFacetLabel";
import type { SearchState } from "../domain/searchState";
import type { FacetValue } from "../types/opportunities.types";
import "../i18n";

const FACETS: { key: FacetKey; max: number }[] = [
  { key: "program", max: 8 },
  { key: "goals", max: 12 },
  { key: "actionCode", max: 8 },
  { key: "consortium", max: 8 },
];

const isSelected = (state: SearchState, facet: FacetKey, value: string) =>
  facet === "consortium" ? state.filters.consortium === value : state.filters[facet].includes(value);

/**
 * Filter buttons with counts. The server computes the counts over the
 * *already filtered* result set, so picking a filter can never lead to an
 * empty page.
 */
export function SearchFacets({
  facets,
  state,
  onToggle,
}: {
  facets: Record<string, FacetValue[]>;
  state: SearchState;
  onToggle: (facet: FacetKey, value: string) => void;
}) {
  const { t } = useTranslation("opportunities");
  const label = useFacetLabel();

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2">
      {FACETS.map(({ key, max }) => {
        const values = (facets[key] ?? []).slice(0, max);
        if (!values.length) return null;
        return (
          <section key={key} className="rounded-lg border border-line bg-surface p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(`search.facet.${key}`)}</h4>
            <div className="flex flex-wrap gap-1.5">
              {values.map((v) => {
                const on = isSelected(state, key, v.value);
                return (
                  <button
                    key={v.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggle(key, v.value)}
                    className={[
                      "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      on ? "border-gold bg-gold-bg text-gold-deep" : "border-line-strong bg-white text-text hover:bg-paper",
                    ].join(" ")}
                  >
                    {label(key, v.value)} <span className="text-muted">{v.count}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
