import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CompanyProfile } from "../types/profile.types";

interface LocalProfileState {
  profile: CompanyProfile | null;
  setProfile: (profile: CompanyProfile) => void;
  clear: () => void;
}

/**
 * The company profile for a visitor who isn't signed in — kept entirely in
 * the browser, on purpose. This is what makes the documented behavior "two
 * anonymous visitors on the same hosted instance never see each other's
 * company" true on the client, mirroring the server's own
 * `storage.persistProfile: false` guarantee (see the root README §6.4). Once
 * a visitor signs in, `useCompanyProfile` switches to the server-backed
 * profile entirely and this store stops being read.
 *
 * Persisted under its own key — distinct from both the legacy app's
 * `hunter_state` and this rewrite's own `hunter-rewrite-ui` — so each piece
 * of state can be inspected/cleared independently.
 */
export const useLocalProfileStore = create<LocalProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clear: () => set({ profile: null }),
    }),
    { name: "hunter-rewrite-profile" },
  ),
);
