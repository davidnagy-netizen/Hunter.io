import { useTranslation } from "react-i18next";
import "@/features/admin/i18n";

/** Turns an activity type (`"opportunity.saved"`) into its readable name; a type this build doesn't know is shown as-is. */
export function useActivityLabel(): (type: string) => string {
  const { t } = useTranslation("admin");
  return (type) => t(`activity.${type}`, { defaultValue: type });
}
