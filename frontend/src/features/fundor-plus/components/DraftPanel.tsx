import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Panel } from "@/shared/components";
import type { CompanyProfile } from "@/features/profile/types/profile.types";
import type { ScoredOpportunity } from "@/features/scoring/types/scoring.types";
import { draftToText } from "../domain/draft";
import { useDraftChapters } from "../hooks/useDraftChapters";
import "../i18n";

/**
 * The draft area for one call. Nothing is stored: `generated` only says the
 * user has asked for the text, and the text itself is derived from the
 * profile and the call. Remounted (via `key`) when the call changes, so a
 * draft never lingers under a different grant's title.
 */
export function DraftPanel({ profile, opp }: { profile: CompanyProfile; opp: ScoredOpportunity }) {
  const { t } = useTranslation("plus");
  const chapters = useDraftChapters(profile, opp);
  const [generated, setGenerated] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const notice = t("notice");

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftToText(notice, chapters));
      setCopy("copied");
    } catch {
      setCopy("failed");
    }
  };

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone="blue">{opp.program}</Badge>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">{opp.title}</h2>
        </div>
        <Button size="sm" onClick={() => setGenerated(true)} className="print:hidden">
          {t("workspace.generate")}
        </Button>
      </div>

      {generated ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{notice}</p>
          {chapters.map((chapter) => (
            <section key={chapter.title} className="rounded-lg border border-line bg-paper p-4">
              <h3 className="mb-2 text-sm font-semibold text-gold-deep">
                {chapter.title} {t("workspace.demoTag")}
              </h3>
              <p className="text-sm leading-relaxed">{chapter.body}</p>
            </section>
          ))}
          <div className="flex flex-wrap items-center justify-end gap-3 print:hidden">
            {copy === "copied" ? (
              <span role="status" className="text-xs text-green">
                {t("workspace.copied")}
              </span>
            ) : null}
            {copy === "failed" ? (
              <span role="alert" className="text-xs text-red">
                {t("workspace.copyFailed")}
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={copyDraft}>
              {t("workspace.copy")}
            </Button>
            <Button variant="dark" size="sm" onClick={() => window.print()}>
              {t("workspace.print")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="px-4 py-10 text-center">
          <h3 className="font-display text-lg font-semibold">{t("workspace.readyTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{notice}</p>
        </div>
      )}
    </Panel>
  );
}
