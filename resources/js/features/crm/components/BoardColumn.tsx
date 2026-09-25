import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CrmContact, VocabEntry } from "../types/crm.types";
import { ContactCard } from "./ContactCard";
import "../i18n";

export interface BoardColumnProps {
  stage: VocabEntry;
  stageLabel: string;
  contacts: CrmContact[];
  stages: VocabEntry[];
  lifecycleLabel: (id: string) => string;
  onMove: (contactId: string, stage: string) => void;
}

/** One pipeline stage. Accepts a card dropped on it — unless the card is already here, which would only reset its "days in stage". */
export function BoardColumn({ stage, stageLabel, contacts, stages, lifecycleLabel, onMove }: BoardColumnProps) {
  const { t } = useTranslation("crm");
  const [over, setOver] = useState(false);

  return (
    <section
      aria-label={stageLabel}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const id = event.dataTransfer.getData("text/plain");
        if (id && !contacts.some((c) => c.id === id)) onMove(id, stage.id);
      }}
      className={["flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-2", over ? "border-gold bg-gold-bg" : "border-line bg-paper"].join(" ")}
    >
      <header className="flex items-center justify-between px-1 py-1">
        <b className="text-sm">{stageLabel}</b>
        <span className="rounded-full bg-line px-2 text-xs text-muted">{contacts.length}</span>
      </header>
      {contacts.length ? (
        contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            stages={stages}
            lifecycleLabel={lifecycleLabel(contact.lifecycle)}
            onMove={(next) => onMove(contact.id, next)}
          />
        ))
      ) : (
        <p className="px-1 py-3 text-center text-xs text-muted">{t("pipeline.empty")}</p>
      )}
    </section>
  );
}
