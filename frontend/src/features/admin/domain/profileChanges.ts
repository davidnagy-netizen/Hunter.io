export interface ChangeFormatters {
  huf: (amount: number) => string;
  goalLabel: (id: string) => string;
  yes: string;
  no: string;
}

const EMPTY = "—";

/**
 * A profile field's value as a person would read it in a change list:
 * yes/no for flags, a money format for the project value, goal names for the
 * goal ids. Empty values collapse to a dash, so "nothing → 12" reads plainly.
 */
export function describeValue(field: string, value: unknown, fmt: ChangeFormatters): string {
  if (value === null || value === undefined || value === "") return EMPTY;
  if (Array.isArray(value)) {
    const items = field === "goals" ? value.map((id) => fmt.goalLabel(String(id))) : value.map(String);
    return items.length > 0 ? items.join(", ") : EMPTY;
  }
  if (typeof value === "boolean") return value ? fmt.yes : fmt.no;
  if (field === "investment_value" && typeof value === "number") return fmt.huf(value);
  return String(value);
}
