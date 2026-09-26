import { useSyncExternalStore } from "react";

/**
 * Whether the viewport is at least `px` wide — for deciding what actually *mounts*, not just
 * what's visually hidden. A `hidden md:block` pair still runs both subtrees; a live WebGL canvas
 * behind `display: none` keeps its render loop going, so the desktop/mobile coin scenes need to
 * pick one to mount, not just one to show.
 */
export function useMinWidth(px: number): boolean {
  const query = `(min-width: ${px}px)`;
  function subscribe(onChange: () => void) {
    if (typeof window.matchMedia !== "function") return () => {};
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }
  const snapshot = () => typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
