import { adminNav } from "@/features/admin/nav";
import { opportunitiesNav } from "@/features/opportunities/nav";
import type { NavItem } from "@/shared/types/navigation.types";

/** Each workspace's nav is the concatenation of the lists its features contribute, in display order. New features add theirs here. */
export const APP_NAV: NavItem[] = [...opportunitiesNav];
export const ADMIN_NAV: NavItem[] = [...adminNav];
