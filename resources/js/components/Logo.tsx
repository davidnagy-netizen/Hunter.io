import { BRAND } from "../brand";

const asset = (name: string) => `${import.meta.env.BASE_URL}${name}.svg`;

interface Logo {
  dark?: boolean;
  /** Just the symbol — for the phone top bar, where the wordmark doesn't fit next to the controls. */
  iconOnly?: boolean;
  onClick?: () => void;
}

/**
 * The supplied Fundor lockup, never retyped (brand guidelines v2.0): navy on light surfaces, reversed on navy, and the
 * two-halves symbol alone where the name is already present or space is tight.
 */
export function Logo({ dark = false, iconOnly = false, onClick }: Logo) {
  const file = iconOnly ? (dark ? "fundor-symbol-white" : "fundor-symbol") : dark ? "fundor-logo-white" : "fundor-logo";
  return (
    <div onClick={onClick} role="button" className="flex items-center hover:cursor-pointer">
      <img src={asset(file)} alt={BRAND.name} className="h-8 w-auto" />
    </div>
  );
}
