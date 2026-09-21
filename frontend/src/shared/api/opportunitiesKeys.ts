/**
 * Query keys for everything the server scores for the current company (the
 * catalog, search and a call's detail). They live in `shared` because the
 * features that *change* what a score depends on — the profile, an answered
 * question, an admin refresh — must invalidate them without importing the
 * opportunities feature (which itself reads the profile).
 *
 * Every key carries the language: the server words check labels, factor
 * details and conditions itself, so a language switch is a different response.
 */
export const opportunitiesKeys = {
  all: ["opportunities"] as const,
  catalog: (lang: string, scope: unknown) => [...opportunitiesKeys.all, "catalog", lang, scope] as const,
  search: (request: string, scope: unknown) => [...opportunitiesKeys.all, "search", request, scope] as const,
  detail: (oppId: string, lang: string) => [...opportunitiesKeys.all, "detail", oppId, lang] as const,
};
