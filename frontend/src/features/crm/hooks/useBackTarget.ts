import { useLocation } from "react-router";

const FALLBACK = "/admin/crm";

/**
 * Where "back to the CRM" goes: the tab (with its filters) the contact was
 * opened from, which `ContactLink` records in the navigation state — or the
 * pipeline when the page was opened directly.
 */
export function useBackTarget(): string {
  const from = (useLocation().state as { from?: unknown } | null)?.from;
  return typeof from === "string" && from.startsWith(FALLBACK) ? from : FALLBACK;
}
