import { GridIcon, ShieldIcon, UserIcon } from "@/shared/components";
import type { NavItem } from "@/shared/types/navigation.types";

export const adminNav: NavItem[] = [
  { to: "/admin", labelKey: "nav.overview", namespace: "admin", icon: GridIcon, end: true },
  { to: "/admin/users", labelKey: "nav.users", namespace: "admin", icon: UserIcon },
  { to: "/admin/system", labelKey: "nav.system", namespace: "admin", icon: ShieldIcon },
];
