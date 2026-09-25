import { forwardRef, useId } from "react";
import type { ReactNode, SelectHTMLAttributes } from "react";

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  labelHint?: string;
  error?: string;
  children: ReactNode;
}

/** The `<select>` counterpart to `TextField` — same label/error/ref contract. */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, labelHint, error, id, className = "", children, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-medium text-text">
        {label}
        {labelHint ? <span className="ml-1 font-normal text-muted">({labelHint})</span> : null}
      </label>
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "rounded-md border bg-white px-3 py-2 text-sm text-text",
          "focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-gold",
          error ? "border-red" : "border-line-strong",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
});
