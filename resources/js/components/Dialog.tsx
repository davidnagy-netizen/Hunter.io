import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

export interface DialogProps {
  title: string;
  icon?: "warning" | "question" | "info" | "error" | "success";
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
export function Dialog({ title, icon, onClose, children }: DialogProps) {
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
      className="swal2-container swal2-center swal2-backdrop-show fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      style={{ display: "grid", zIndex: 99999 }}
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
        style={{ display: "grid", placeSelf: "center" }}
        className="swal2-popup swal2-modal swal2-show w-full max-w-md rounded-lg bg-surface p-6 shadow-card-lg outline-none"
      >
        {icon === "warning" ? (
          <div className="swal2-icon swal2-warning swal2-icon-show" style={{ display: "flex" }}>
            <div className="swal2-icon-content">!</div>
          </div>
        ) : null}
        {icon === "question" ? (
          <div className="swal2-icon swal2-question swal2-icon-show" style={{ display: "flex" }}>
            <div className="swal2-icon-content">?</div>
          </div>
        ) : null}
        {icon === "error" ? (
          <div className="swal2-icon swal2-error swal2-icon-show" style={{ display: "flex" }}>
            <span className="swal2-x-mark">
              <span className="swal2-x-mark-line-left" />
              <span className="swal2-x-mark-line-right" />
            </span>
          </div>
        ) : null}
        {icon === "info" ? (
          <div className="swal2-icon swal2-info swal2-icon-show" style={{ display: "flex" }}>
            <div className="swal2-icon-content">i</div>
          </div>
        ) : null}
        {icon === "success" ? (
          <div className="swal2-icon swal2-success swal2-icon-show" style={{ display: "flex" }}>
            <div className="swal2-success-circular-line-left" />
            <span className="swal2-success-line-tip" />
            <span className="swal2-success-line-long" />
            <div className="swal2-success-ring" />
            <div className="swal2-success-fix" />
            <div className="swal2-success-circular-line-right" />
          </div>
        ) : null}
        <h2 id={titleId} className="swal2-title font-display text-lg font-semibold text-text">
          {title}
        </h2>
        <div className="swal2-html-container mt-3">{children}</div>
      </div>
    </div>
  );
}
