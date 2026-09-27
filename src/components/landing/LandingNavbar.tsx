import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Menu, X } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { LandingCopy } from '../../data/landingContent';

/**
 * Provides primary navigational anchors and authentication entrypoints for visitors.
 * Adapts minimal neobank navigation into an accessible in-flow disclosure without hidden traps.
 */
export function LandingNavbar({ copy, hasProfile }: { copy: LandingCopy['nav']; hasProfile: boolean }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);


  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E4DF] bg-[#FFFFFF]/95 backdrop-blur-md">
      <nav aria-label={copy.label} className="landing-wrap flex flex-wrap items-center justify-between min-h-[72px] py-2">
        <a href="https://fundor.hu" className="flex items-center gap-3 py-1 font-semibold text-[#161616] no-underline focus-visible:rounded-lg">
          <img src={`${import.meta.env.BASE_URL}fundor.svg`} alt="" className="h-8 w-8" />
          <span className="flex flex-col leading-none">
            <span className="text-2xl tracking-tight font-extrabold text-[#161616]">{copy.brand}</span>
            <span className="text-sm font-medium text-[#687984] mt-0.5">{copy.domain}</span>
          </span>
        </a>

        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {copy.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[17px] font-semibold text-[#273F4F] transition-colors hover:text-[#FE7743] focus-visible:rounded-md"
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
            <Link to="/login" className="landing-link font-semibold text-[17px]">
              {copy.login}
            </Link>
          )}
          <Link to="/register" className="landing-cta text-[17px]">
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
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#D9D8D5] p-2 text-[#273F4F] hover:bg-[#F7F6F4] focus-visible:ring-2 focus-visible:ring-[#FE7743]"
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
            <span className="ml-1 text-base font-medium">{copy.menu}</span>
          </button>
        </div>

        {open && (
          <div id={menuId} className="mt-2 flex w-full flex-col gap-3 border-t border-[#E6E4DF] pt-4 pb-3 lg:hidden">
            {copy.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center text-lg font-medium text-[#273F4F] hover:text-[#FE7743]"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-[#E6E4DF] pt-3">
              {hasProfile ? (
                <Link to="/app" onClick={() => setOpen(false)} className="landing-cta landing-cta-secondary w-full">
                  {copy.app}
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="landing-cta landing-cta-secondary w-full">
                  {copy.login}
                </Link>
              )}
              <Link to="/register" onClick={() => setOpen(false)} className="landing-cta w-full">
                {copy.register}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
