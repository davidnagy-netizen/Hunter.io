export type ButtonVariant = "gold" | "dark" | "ghost" | "ghost-light" | "danger";
export type ButtonSize = "md" | "sm";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  gold: "bg-gold text-white hover:bg-gold-deep focus-visible:outline-gold-deep",
  dark: "bg-ink text-white hover:bg-ink-2 focus-visible:outline-ink-2",
  ghost: "bg-transparent text-text border border-line-strong hover:bg-paper focus-visible:outline-line-strong",
  "ghost-light": "bg-white/10 text-white border border-white/30 hover:bg-white/20 focus-visible:outline-white",
  danger: "bg-red text-white hover:opacity-90 focus-visible:outline-red",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}

/** The button look as a class string, for the rare element that must be an `<a>` (e.g. an external link) rather than a `<button>`. */
export function buttonClasses({ variant = "gold", size = "md", block = false, className = "" }: ButtonStyleOptions = {}) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium",
    "transition-colors duration-150",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    block ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}
