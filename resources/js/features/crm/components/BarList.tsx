import type { ReactNode } from "react";
import type { BarRow } from "../domain/insights";

/** Labelled horizontal bars. `label` and `value` are already translated / formatted by the caller. */
export function BarList({ rows, label, value }: { rows: BarRow[]; label: (row: BarRow) => ReactNode; value?: (row: BarRow) => ReactNode }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate text-muted">{label(row)}</span>
          <span className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <i className="block h-full rounded-full bg-gold" style={{ width: `${row.widthPct}%` }} />
          </span>
          <b className="text-right font-medium">{value ? value(row) : row.count}</b>
        </li>
      ))}
    </ul>
  );
}
