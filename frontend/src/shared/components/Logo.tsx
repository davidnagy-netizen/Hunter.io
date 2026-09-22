import { BRAND } from "../brand";
import { TargetIcon } from "./icons";

interface Logo {
  dark?: boolean;
  onClick?: () => void;
}
export function Logo({ dark = false, onClick }: Logo) {
  return (
    <div
      onClick={onClick}
      role="button"
      className={[
        "flex items-center gap-2.5 hover:cursor-pointer",
        dark ? "text-white" : "text-ink",
      ].join(" ")}
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-ink-2 text-gold">
        <TargetIcon size={20} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-semibold tracking-wide">
          {BRAND.wordmark}
        </span>
        <small
          className={[
            "text-[10px]",
            dark ? "text-white/60" : "text-muted",
          ].join(" ")}
        >
          funding intelligence
        </small>
      </span>
    </div>
  );
}
