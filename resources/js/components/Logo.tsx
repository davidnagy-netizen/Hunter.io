import { BRAND } from "../brand";

const LOGO_URL = `${import.meta.env.BASE_URL}fundor.svg`;

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
      <img src={LOGO_URL} alt="" className="size-8" />
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
