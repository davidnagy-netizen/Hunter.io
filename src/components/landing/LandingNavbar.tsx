import { LanguageToggle } from "@/components/LanguageToggle";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router";
import type { LandingCopy } from "../../data/landingContent";
import { ScrollTrigger } from "./lib/gsap";
import { scrollToHash } from "./hooks/useLenisScroll";

function handleAnchorClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith("#")) return;
  e.preventDefault();
  scrollToHash(href);
}

export function LandingNavbar({
  copy,
  hasProfile,
}: {
  copy: LandingCopy["nav"];
  hasProfile: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: "top -24",
      end: 99999,
      onToggle: (self) => setScrolled(self.isActive),
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header
      className={[
        "sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300",
        scrolled
          ? "border-brand-line bg-surface/50 shadow-sm"
          : "border-transparent bg-surface/50",
      ].join(" ")}
    >
      <nav
        aria-label={copy.label}
        className="landing-wrap flex flex-wrap items-center justify-between min-h-18 py-2"
      >
        <a
          href="https://fundor.hu"
          className="flex items-center gap-3 py-1 font-semibold text-brand-ink no-underline focus-visible:rounded-lg"
        >
          <img
            src={`${import.meta.env.BASE_URL}fundor.svg`}
            alt=""
            className="size-10"
          />
          <span className="flex flex-col leading-none">
            <span className="text-2xl tracking-tight font-extrabold text-brand-ink">
              {copy.brand}
            </span>
            <span className="text-sm font-medium text-brand-muted mt-0.5">
              {copy.domain}
            </span>
          </span>
        </a>

        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {copy.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="landing-nav-link text-[17px] font-semibold text-brand-slate transition-colors hover:text-brand-orange focus-visible:rounded-md"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <LanguageToggle className="landing-language" />
          {hasProfile ? (
            <Link to="/app" className="landing-link font-semibold text-[17px]">
              {copy.app}
            </Link>
          ) : (
            <Link
              to="/login"
              className="landing-link font-semibold text-[17px]"
            >
              {copy.login}
            </Link>
          )}
          <Link
            to="/register"
            className="landing-cta landing-cta-highlight text-[17px]"
          >
            {copy.register}
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageToggle className="landing-language" />
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-brand-line-strong p-2 text-brand-slate hover:bg-brand-surface-muted focus-visible:ring-2 focus-visible:ring-brand-orange"
          >
            {open ? (
              <X size={20} aria-hidden />
            ) : (
              <Menu size={20} aria-hidden />
            )}
            <span className="ml-1 text-base font-medium">{copy.menu}</span>
          </button>
        </div>

        {open && (
          <div
            id={menuId}
            className="mt-2 flex w-full flex-col gap-3 border-t border-brand-line pt-4 pb-3 lg:hidden"
          >
            {copy.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  setOpen(false);
                  handleAnchorClick(e, link.href);
                }}
                className="flex min-h-11 items-center text-lg font-medium text-brand-slate hover:text-brand-orange"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-brand-line pt-3">
              {hasProfile ? (
                <Link
                  to="/app"
                  onClick={() => setOpen(false)}
                  className="landing-cta landing-cta-secondary w-full"
                >
                  {copy.app}
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="landing-cta landing-cta-secondary w-full"
                >
                  {copy.login}
                </Link>
              )}
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="landing-cta w-full"
              >
                {copy.register}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
