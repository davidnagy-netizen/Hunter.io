import { TargetIcon } from "./icons";

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={["flex items-center gap-2.5", dark ? "text-white" : "text-ink"].join(" ")}>
      <span className="flex size-8 items-center justify-center rounded-md bg-ink-2 text-gold">
        <TargetIcon size={20} />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-semibold tracking-wide">HUNTER</span>
        <small className={["text-[10px]", dark ? "text-white/60" : "text-muted"].join(" ")}>funding intelligence</small>
      </span>
    </div>
  );
}
