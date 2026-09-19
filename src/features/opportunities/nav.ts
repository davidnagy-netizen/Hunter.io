import { GridIcon, ListIcon } from "@/shared/components";
import type { NavItem } from "@/shared/types/navigation.types";

export const opportunitiesNav: NavItem[] = [
  { to: "/app", labelKey: "nav.dashboard", namespace: "opportunities", icon: GridIcon, end: true },
  { to: "/app/opportunities", labelKey: "nav.opportunities", namespace: "opportunities", icon: ListIcon },
];
