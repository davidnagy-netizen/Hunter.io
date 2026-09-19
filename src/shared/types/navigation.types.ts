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
  icon: ComponentType<{ size?: number }>;
  /** Match only the exact path (needed for an index route like the dashboard). */
  end?: boolean;
}
