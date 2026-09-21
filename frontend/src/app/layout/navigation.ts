import { adminNav } from "@/features/admin/nav";
import { crmNav } from "@/features/crm/nav";
import { plusNav } from "@/features/fundor-plus/nav";
import { opportunitiesNav } from "@/features/opportunities/nav";
import type { NavItem } from "@/shared/types/navigation.types";

/** Each workspace's nav is the concatenation of the lists its features contribute, in display order. New features add theirs here. */
export const APP_NAV: NavItem[] = [...opportunitiesNav, ...plusNav];
// The CRM sits second, between the overview and the account screens, as it did in the legacy console.
const [adminOverviewNav, ...adminOtherNav] = adminNav;
export const ADMIN_NAV: NavItem[] = [adminOverviewNav, ...crmNav, ...adminOtherNav];
