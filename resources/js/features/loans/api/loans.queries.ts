import { useQuery } from "@tanstack/react-query";
import { useMeQuery } from "@/features/authentication/api/auth.queries";
import { useLang } from "@/composables/useFormat";
import { loansApi } from "./loans.api";

export const loansKeys = {
  all: ["loans"] as const,
  list: (lang: string, tier: string | undefined) => [...loansKeys.all, "list", lang, tier] as const,
};

/**
 * The loan catalog for whoever is looking. The response depends on the caller's access, so the access tier is part of
 * the key: a logout only refetches the session, and a Fundor Plus response must never be shown to whoever comes next.
 * The server words the disclaimer and the category labels, so the language is part of it too.
 */
export function useLoansQuery() {
  const me = useMeQuery();
  const lang = useLang();

  return useQuery({
    queryKey: loansKeys.list(lang, me.data?.entitlements.tier),
    queryFn: () => loansApi.list(lang),
    // Asking before the session has loaded would request twice (once without the tier, once with).
    enabled: me.isSuccess,
    staleTime: 5 * 60_000,
  });
}
