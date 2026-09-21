import { useTranslation } from "react-i18next";
import { Panel } from "@/shared/components";
import { docKey } from "../domain/documents";
import { useDocChecksStore } from "../store/docChecksStore";
import "../i18n";

/** The documents the call asks for, as tick-boxes. Ticks are kept in this browser, per document. */
export function DocumentChecklist({ oppId, docs }: { oppId: string; docs: string[] }) {
  const { t } = useTranslation("plus");
  const checks = useDocChecksStore((state) => state.checks);
  const toggle = useDocChecksStore((state) => state.toggle);

  return (
    <Panel title={t("workspace.docs")} className="print:hidden">
      {docs.length ? (
        <ul className="flex flex-col gap-2 text-sm">
          {docs.map((doc) => {
            const key = docKey(oppId, doc);
            return (
              <li key={key}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input type="checkbox" checked={Boolean(checks[key])} onChange={() => toggle(key)} className="mt-0.5 size-4" />
                  <span>{doc}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted">{t("workspace.noDocs")}</p>
      )}
    </Panel>
  );
}
