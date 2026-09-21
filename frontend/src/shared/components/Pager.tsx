import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export interface PagerProps {
  /** 1-based current page. */
  page: number;
  pages: number;
  onPage: (page: number) => void;
}

/** Previous / "2 / 7" / Next. Renders nothing when there is only one page. */
export function Pager({ page, pages, onPage }: PagerProps) {
  const { t } = useTranslation("common");
  if (pages <= 1) return null;

  return (
    <nav aria-label="pagination" className="mt-6 flex items-center justify-center gap-4 text-sm">
      <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t("pager.prev")}
      </Button>
      <span className="text-muted">{t("pager.pageOf", { page, pages })}</span>
      <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        {t("pager.next")}
      </Button>
    </nav>
  );
}
