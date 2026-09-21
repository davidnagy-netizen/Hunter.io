import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";

/** A link to a contact's page that remembers which tab (and filters) it was clicked from, so "back" returns there. */
export function ContactLink({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  const { pathname, search } = useLocation();
  return (
    <Link to={`/admin/crm/contact/${id}`} state={{ from: `${pathname}${search}` }} className={className}>
      {children}
    </Link>
  );
}
