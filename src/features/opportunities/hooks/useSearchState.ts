import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import { parseSearchParams, toSearchParams, type SearchState } from "../domain/searchState";

/** The search, kept in the URL: shareable, survives a reload, and the back button steps through it. */
export function useSearchState() {
  const [params, setParams] = useSearchParams();
  const state = useMemo(() => parseSearchParams(params), [params]);
  const update = useCallback((next: SearchState) => setParams(toSearchParams(next)), [setParams]);
  return { state, update };
}
