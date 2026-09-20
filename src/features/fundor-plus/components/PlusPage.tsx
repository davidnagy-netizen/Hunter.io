import { useIsSubscriber } from "@/features/authentication/hooks/useAuth";
import { PlusLockScreen } from "./PlusLockScreen";
import { PlusWorkspace } from "./PlusWorkspace";

/**
 * Fundor Plus is a labelled demo, but who may open it is decided by the
 * account's real entitlements (the same the server enforces on the catalog),
 * not by a flag the visitor can set in their own browser.
 */
export function PlusPage() {
  return useIsSubscriber() ? <PlusWorkspace /> : <PlusLockScreen />;
}
