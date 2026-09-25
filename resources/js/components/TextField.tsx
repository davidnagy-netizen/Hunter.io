import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Rendered under the label — e.g. "(optional)". Purely presentational. */
  labelHint?: string;
  /** A validation error message, already translated. Sets aria-invalid. */
  error?: string;
}

/**
 * Generic labeled input, `ref`-forwarding so it plugs directly into React
 * Hook Form's `register()`. Knows nothing about which form or which schema
 * it belongs to — that's the feature's job.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, labelHint, error, id, className = "", ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
        {labelHint ? <span className="ml-1 font-normal text-muted">({labelHint})</span> : null}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={[
          "rounded-md border px-3 py-2 text-sm text-text",
          "focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-gold",
          error ? "border-red" : "border-line-strong",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-red">
          {error}
        </p>
      ) : null}
    </div>
  );
});
