import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: IconProps) {
  return { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, ...rest } as const;
}

export const TargetIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" /></svg>
);
export const GridIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const ListIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
);
export const ExternalIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}><path d="M14 5h5v5M19 5l-8 8M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" /></svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...base({ size: 16, ...p })}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 018 0v2.5" /></svg>
);
export const BackIcon = (p: IconProps) => (
  <svg {...base({ size: 17, ...p })}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const ExitIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M15 12H4M11 7l-5 5 5 5" /><path d="M10 4h7a2 2 0 012 2v12a2 2 0 01-2 2h-7" /></svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="M15.8 15.8L20 20" /></svg>
);
export const CalendarIcon = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></svg>
);
export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5z" /></svg>
);
export const ArrowIcon = (p: IconProps) => (
  <svg {...base({ size: 15, strokeWidth: 2, ...p })}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
