import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export interface DialogProps {
  title: string;
  /** Called on Escape and on a click outside the panel. */
  onClose: () => void;
  children: ReactNode;
}

/**
 * A modal panel over a dimmed page — for the questions that used to be
 * `prompt()` / `confirm()`. Focus moves into it on open and back to whatever
 * had it on close; Escape and the backdrop close it. It renders only while
 * mounted, so a caller shows it with `{open ? <Dialog … /> : null}`.
 */
export function Dialog({ title, onClose, children }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = panelRef.current?.querySelector<HTMLElement>("textarea, input, select, button");
    (focusable ?? panelRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-md rounded-lg bg-surface p-5 shadow-card outline-none"
      >
        <h2 id={titleId} className="font-display text-lg font-semibold text-text">
          {title}
        </h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
