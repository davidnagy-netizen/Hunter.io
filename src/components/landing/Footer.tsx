import { Link } from "react-router";
import type { LandingCopy } from "../../data/landingContent";

/**
 * Concludes the public interface with navigational anchors, legal-document dispatch channels, and mandatory disclosures.
 * Adapts dark neobank footer architectures into honest document request mailtos and an unpaywalled regulatory disclaimer.
 */
export function Footer({
  copy,
  disclaimer,
}: {
  copy: LandingCopy["footer"];
  disclaimer: string;
}) {
  return (
    <footer className="landing-footer-surface border-t border-[#EFEEEA]/10 bg-[#161616] text-[#939FA7]">
      <div className="landing-wrap py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand & Disclaimer Column (5 cols) */}
          <div className="sm:col-span-2 lg:col-span-5">
            <div className="flex items-center gap-3">
              <img
                src={`${import.meta.env.BASE_URL}fundor.svg`}
                alt=""
                className="size-10"
              />
              <div className="flex flex-col leading-none">
                <span className="text-xl font-extrabold tracking-tight text-[#EFEEEA]">
                  {copy.brand}
                </span>
                <span className="text-xs font-medium text-[#939FA7] mt-1">
                  {copy.domain}
                </span>
              </div>
            </div>
            <p className="mt-5 max-w-md text-xs sm:text-[13px] leading-relaxed text-[#939FA7] font-medium">
              {disclaimer}
            </p>
          </div>

          {/* Product Anchors (2 cols) */}
          <div className="lg:col-span-2 lg:col-start-7">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#EFEEEA]">
              {copy.productTitle}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              {copy.links.map((link) => (
                <li key={link.href}>
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      className="inline-block py-1 text-[#BEC5CA] transition-colors hover:text-[#FE7743] focus-visible:text-[#EFEEEA] focus-visible:outline-none focus-visible:underline"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="inline-block py-1 text-[#BEC5CA] transition-colors hover:text-[#FE7743] focus-visible:text-[#EFEEEA] focus-visible:outline-none focus-visible:underline"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Document Requests (2 cols) */}
          <div className="lg:col-span-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#EFEEEA]">
              {copy.legalTitle}
            </div>
            <ul className="mt-4 space-y-2.5 text-sm font-medium">
              <li>
                <a
                  href={copy.termsHref}
                  className="inline-block py-1 text-[#BEC5CA] transition-colors hover:text-[#FE7743] focus-visible:text-[#EFEEEA] focus-visible:outline-none focus-visible:underline"
                >
                  {copy.terms}
                </a>
              </li>
              <li>
                <a
                  href={copy.privacyHref}
                  className="inline-block py-1 text-[#BEC5CA] transition-colors hover:text-[#FE7743] focus-visible:text-[#EFEEEA] focus-visible:outline-none focus-visible:underline"
                >
                  {copy.privacy}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Document Contact (2 cols) */}
          <div className="lg:col-span-2">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#EFEEEA]">
              {copy.contactTitle}
            </div>
            <div className="mt-4 text-sm">
              <a
                href={`mailto:${copy.email}`}
                className="font-semibold text-[#BEC5CA] underline underline-offset-4 hover:text-[#FE7743] focus-visible:text-[#EFEEEA]"
              >
                {copy.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-[#EFEEEA]/10 pt-8 text-xs font-medium text-[#687984] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p>{copy.copyright}</p>
          <p className="text-[#687984]">
            Fundor Intelligence Systems • Budapest
          </p>
        </div>
      </div>
    </footer>
  );
}
