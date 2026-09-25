import type { ButtonHTMLAttributes } from "react";

export interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

/**
 * A single toggle chip. Knows nothing about single-vs-multi selection or
 * what it represents — the caller wires `selected`/`onClick` to whatever
 * selection logic (a single value, an array membership check, ...) it needs,
 * typically from a React Hook Form `Controller`.
 */
export function ChipButton({ selected, className = "", ...rest }: ChipButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-gold bg-gold-bg text-gold-deep"
          : "border-line-strong bg-white text-text hover:bg-paper",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}
