import { useState } from "react";
import { useUpdateContactMutation } from "../api/crm.queries";

/**
 * Moving a contact between stages, shared by the board (drag, dropdown) and
 * the contact page. Moving to "lost" first asks why — `pendingLossId` is the
 * contact waiting on that answer, which the screen shows a dialog for.
 */
export function useStageMove() {
  const update = useUpdateContactMutation();
  const [pendingLossId, setPendingLossId] = useState<string | null>(null);

  return {
    move: (id: string, stage: string) => {
      if (stage === "lost") setPendingLossId(id);
      else update.mutate({ id, stage });
    },
    pendingLossId,
    confirmLoss: (reason: string) => {
      if (!pendingLossId) return;
      update.mutate({ id: pendingLossId, stage: "lost", lostReason: reason.trim() || undefined });
      setPendingLossId(null);
    },
    cancelLoss: () => setPendingLossId(null),
    error: update.error,
    isPending: update.isPending,
  };
}
