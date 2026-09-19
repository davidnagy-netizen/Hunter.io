import type { ReactNode } from "react";

export function PageHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      {children ? <p className="mt-1 text-sm text-muted">{children}</p> : null}
    </header>
  );
}
