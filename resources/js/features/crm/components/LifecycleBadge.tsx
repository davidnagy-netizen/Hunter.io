import { Badge } from "@/components";
import type { BadgeTone } from "@/components";
import type { Lifecycle } from "../types/crm.types";

const TONE: Record<Lifecycle, BadgeTone> = { lead: "slate", registered: "blue", trial: "amber", subscriber: "green", expired: "red" };

/** Where an account is in its life with us — observed from its subscription, never chosen. `label` is already translated. */
export function LifecycleBadge({ lifecycle, label }: { lifecycle: Lifecycle; label: string }) {
  return <Badge tone={TONE[lifecycle] ?? "slate"}>{label}</Badge>;
}
