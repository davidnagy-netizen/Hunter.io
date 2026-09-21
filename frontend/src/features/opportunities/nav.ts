import { CalendarIcon, GridIcon, ListIcon, SearchIcon, StarIcon } from "@/shared/components";
import type { NavItem } from "@/shared/types/navigation.types";

export const opportunitiesNav: NavItem[] = [
  { to: "/app", labelKey: "nav.dashboard", namespace: "opportunities", icon: GridIcon, end: true },
  { to: "/app/search", labelKey: "nav.search", namespace: "opportunities", icon: SearchIcon },
  { to: "/app/opportunities", labelKey: "nav.opportunities", namespace: "opportunities", icon: ListIcon },
  { to: "/app/calendar", labelKey: "nav.calendar", namespace: "opportunities", icon: CalendarIcon },
  { to: "/app/saved", labelKey: "nav.saved", namespace: "opportunities", icon: StarIcon },
];
