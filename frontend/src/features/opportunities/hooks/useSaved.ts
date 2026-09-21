import { useCallback } from "react";
import { useIsAuthenticated } from "@/features/authentication/hooks/useAuth";
import { useServerProfileQuery } from "@/features/profile/api/profile.queries";
import { useToggleSavedMutation } from "../api/saved.queries";
import { useLocalSavedStore } from "../store/localSavedStore";

const NONE: string[] = [];

/** Saved opportunity ids: the server's list for a signed-in account, the browser's otherwise (same fork as the profile and answers). */
export function useSaved() {
  const isAuthenticated = useIsAuthenticated();
  const server = useServerProfileQuery(isAuthenticated);
  const localIds = useLocalSavedStore((s) => s.ids);
  const toggleLocal = useLocalSavedStore((s) => s.toggle);
  const toggleServer = useToggleSavedMutation();

  const ids = isAuthenticated ? (server.data?.saved ?? NONE) : localIds;

  const toggle = useCallback(
    async (oppId: string) => {
      if (isAuthenticated) await toggleServer.mutateAsync(oppId);
      else toggleLocal(oppId);
    },
    [isAuthenticated, toggleServer, toggleLocal],
  );

  return { ids, isSaved: (oppId: string) => ids.includes(oppId), toggle, isToggling: toggleServer.isPending };
}
