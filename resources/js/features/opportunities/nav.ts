import { CalendarIcon, GridIcon, ListIcon, SearchIcon, StarIcon } from "@/components";
import type { NavItem } from "@/types/navigation.types";

export const opportunitiesNav: NavItem[] = [
  { to: "/app", labelKey: "nav.dashboard", shortLabelKey: "nav.dashboardShort", namespace: "opportunities", icon: GridIcon, end: true },
  { to: "/app/search", labelKey: "nav.search", namespace: "opportunities", icon: SearchIcon },
  { to: "/app/opportunities", labelKey: "nav.opportunities", shortLabelKey: "nav.opportunitiesShort", namespace: "opportunities", icon: ListIcon },
  { to: "/app/calendar", labelKey: "nav.calendar", namespace: "opportunities", icon: CalendarIcon },
  { to: "/app/saved", labelKey: "nav.saved", shortLabelKey: "nav.savedShort", namespace: "opportunities", icon: StarIcon },
];
