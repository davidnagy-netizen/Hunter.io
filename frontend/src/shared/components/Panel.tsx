import type { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
}

/**
 * The generic card surface used throughout the app (opportunity detail's
 * factor/why/calculator sections, admin cards, CRM panels, ...).
 */
export function Panel({ title, subtitle, children, className = "", ...rest }: PanelProps) {
  return (
    <div
      className={[
        "rounded-lg border border-line bg-surface p-5 shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {title ? <h2 className="font-display text-lg font-semibold text-text">{title}</h2> : null}
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      <div className={title || subtitle ? "mt-4" : ""}>{children}</div>
    </div>
  );
}
