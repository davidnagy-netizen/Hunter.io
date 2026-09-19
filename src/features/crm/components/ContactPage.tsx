import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { BackIcon, QueryStatus } from "@/shared/components";
import { useTranslatedApiError } from "@/shared/api/useTranslatedApiError";
import { useContactQuery } from "../api/crm.queries";
import { useBackTarget } from "../hooks/useBackTarget";
import { useStageMove } from "../hooks/useStageMove";
import { useVocabLabels } from "../hooks/useVocabLabels";
import { AccessPanel } from "./AccessPanel";
import { ClassificationPanel } from "./ClassificationPanel";
import { ContactHeader } from "./ContactHeader";
import { EngagementPanel } from "./EngagementPanel";
import { LostReasonDialog } from "./LostReasonDialog";
import { NotesPanel } from "./NotesPanel";
import { ProfilePanel } from "./ProfilePanel";
import { SavedCallsPanel } from "./SavedCallsPanel";
import { TasksPanel } from "./TasksPanel";
import { TimelinePanel } from "./TimelinePanel";
import "../i18n";

/** Everything about one account or lead on one page: who they are, what was said, what happened, and what to do next. */
export function ContactPage() {
  const { t } = useTranslation("crm");
  const { id = "" } = useParams();
  const backTarget = useBackTarget();
  const query = useContactQuery(id);
  const stageMove = useStageMove();
  const errorMessage = useTranslatedApiError(query.error);
  const moveError = useTranslatedApiError(stageMove.error);
  const detail = query.data;
  const labels = useVocabLabels(detail?.vocabulary);

  return (
    <>
      <Link to={backTarget} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
        <BackIcon /> {t("back")}
      </Link>

      {errorMessage ? (
        <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
          {errorMessage}
        </p>
      ) : (
        <QueryStatus isLoading={query.isLoading} error={null} />
      )}

      {detail ? (
        <>
          <ContactHeader backTarget={backTarget} contact={detail.contact} vocabulary={detail.vocabulary} labels={labels} onMove={(stage) => stageMove.move(id, stage)} />
          {moveError ? (
            <p role="alert" className="mb-4 rounded-md bg-red-bg p-3 text-sm text-red">
              {moveError}
            </p>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-6">
              <NotesPanel contactId={id} notes={detail.notes} />
              <TimelinePanel entries={detail.timeline} />
            </div>
            <div className="flex flex-col gap-6">
              {detail.contact.kind === "account" ? <AccessPanel contact={detail.contact} plans={detail.plans} /> : null}
              <TasksPanel contactId={id} tasks={detail.tasks} />
              {detail.contact.kind === "account" ? <EngagementPanel engagement={detail.contact.engagement} /> : null}
              <ProfilePanel profile={detail.profile} profileVersions={detail.contact.profileVersions} readiness={detail.contact.readiness} />
              <SavedCallsPanel calls={detail.savedCalls} />
              <ClassificationPanel contact={detail.contact} />
            </div>
          </div>
        </>
      ) : null}

      {stageMove.pendingLossId ? <LostReasonDialog onConfirm={stageMove.confirmLoss} onCancel={stageMove.cancelLoss} /> : null}
    </>
  );
}
