import { StarIcon } from "@/components";
import type { NavItem } from "@/types/navigation.types";
import { PlusNavBadge } from "./components/PlusNavBadge";

export const plusNav: NavItem[] = [{ to: "/app/plus", labelKey: "nav.plus", shortLabelKey: "nav.plusShort", namespace: "plus", icon: StarIcon, badge: PlusNavBadge }];
