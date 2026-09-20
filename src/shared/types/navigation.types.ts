import type { ComponentType } from "react";

/**
 * A feature's contribution to the app's navigation. Features describe their
 * own entries; `app/layout` assembles them — so the shell never has to
 * import a feature's internals to know what to show.
 */
export interface NavItem {
  to: string;
  /** i18n key, resolved in `namespace`. */
  labelKey: string;
  namespace: string;
  /** A shorter label for the narrow-screen bottom bar, where six entries share 375px. Falls back to `labelKey`. */
  shortLabelKey?: string;
  icon: ComponentType<{ size?: number }>;
  /** Optional decoration after the label (a "PRO" tag, a lock). It is a component so it can read state; the shell knows nothing about what it shows. */
  badge?: ComponentType;
  /** Match only the exact path (needed for an index route like the dashboard). */
  end?: boolean;
}
