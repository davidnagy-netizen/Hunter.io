import { useTranslation } from "react-i18next";
import { toApiError } from "./apiError";

/**
 * Turns a caught mutation/query error into a message ready to show the user,
 * translating the server's `code` through the shared `errors` namespace when
 * one is present and falling back to the server's raw (Hungarian) message
 * otherwise. Every feature that surfaces API errors should use this rather
 * than re-deriving the message inline.
 */
export function useTranslatedApiError(error: unknown): string | null {
  const { t } = useTranslation("errors");
  if (!error) return null;
  const apiError = toApiError(error);
  return apiError.code ? t(apiError.code, { defaultValue: apiError.message }) : apiError.message;
}
