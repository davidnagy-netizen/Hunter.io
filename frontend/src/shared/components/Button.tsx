import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses } from "./buttonStyles";
import type { ButtonSize, ButtonVariant } from "./buttonStyles";

export type { ButtonSize, ButtonVariant } from "./buttonStyles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches the button to fill its container's width. */
  block?: boolean;
  children: ReactNode;
}

/**
 * Generic action button. Feature-specific meaning (e.g. "Save opportunity",
 * "Grant subscription") lives in the calling feature, not here.
 */
export function Button({
  variant = "gold",
  size = "md",
  block = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  );
}
