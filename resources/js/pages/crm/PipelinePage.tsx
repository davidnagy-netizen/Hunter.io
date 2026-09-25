import { useTranslation } from "react-i18next";
import { Panel, QueryStatus } from "@/components/index";
import { useFormat, useLang } from "@/composables/useFormat";
import { useTranslatedApiError } from "@/api/useTranslatedApiError";
import { useCrmBoardQuery } from "@/features/crm/api/crm.queries";
import { partitionOpenTasks, todayKey } from "@/features/crm/domain/tasks";
import { useStageMove } from "@/features/crm/hooks/useStageMove";
import { useVocabLabels } from "@/features/crm/hooks/useVocabLabels";
import { BoardColumn } from "@/features/crm/components/BoardColumn";
import { ContactLink } from "@/features/crm/components/ContactLink";
import { KpiTile } from "@/features/crm/components/KpiTile";
import { LostReasonDialog } from "@/features/crm/components/LostReasonDialog";
import "@/features/crm/i18n/index";

/** The sales pipeline: the numbers that matter today, what is late, and every open deal by stage. */
export function PipelinePage() {
  const { t } = useTranslation("crm");
  const { moneyOrDash, date } = useFormat();
  const lang = useLang();
  const board = useCrmBoardQuery();
  const stageMove = useStageMove();
  const moveError = useTranslatedApiError(stageMove.error);
  const data = board.data;
  const labels = useVocabLabels(data?.vocabulary);

  if (!data) return <QueryStatus isLoading={board.isLoading} error={board.error} />;

  const { metrics: m, vocabulary } = data;
  const { overdue, dueToday } = partitionOpenTasks(data.tasks, todayKey());

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiTile
          tone="green"
          value={moneyOrDash(m.mrrHuf)}
          label={t("pipeline.kpi.mrr.label")}
          sub={
            m.mrrHuf == null
              ? t("pipeline.kpi.mrr.unknown")
              : t("pipeline.kpi.mrr.sub", { count: m.subscribers, arr: moneyOrDash(m.arrHuf) })
          }
        />
        <KpiTile
          tone="amber"
          value={m.trials}
          label={t("pipeline.kpi.trials.label")}
          sub={
            m.trialConversionPct != null
              ? t("pipeline.kpi.trials.converted", { pct: m.trialConversionPct, done: m.trialConverted, started: m.trialStarted })
              : t("pipeline.kpi.trials.none")
          }
        />
        <KpiTile value={m.openDeals} label={t("pipeline.kpi.openDeals.label")} sub={t("pipeline.kpi.openDeals.value", { value: moneyOrDash(m.pipelineValueHuf) })} />
        <KpiTile tone="gold" value={overdue.length} label={t("pipeline.kpi.overdue.label")} sub={t("pipeline.kpi.overdue.today", { count: dueToday.length })} />
        <KpiTile
          value={m.expired}
          label={t("pipeline.kpi.lapsed.label")}
          sub={m.churnPct != null ? t("pipeline.kpi.lapsed.detail", { recent: m.lapsed30d, pct: m.churnPct }) : t("pipeline.kpi.lapsed.none")}
        />
      </div>

      {moveError ? (
        <p role="alert" className="rounded-md bg-red-bg p-3 text-sm text-red">
          {moveError}
        </p>
      ) : null}

      {overdue.length ? (
        <Panel title={t("pipeline.overdueTitle")} className="border-red">
          <ul className="divide-y divide-line">
            {overdue.slice(0, 6).map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <b className="block truncate text-sm">{task.title}</b>
                  <span className="block truncate text-xs text-red">
                    {date(task.dueAt!)} · {task.company || task.username || "—"}
                  </span>
                </div>
                <ContactLink id={task.subjectId} className="shrink-0 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium hover:bg-paper">
                  {t("pipeline.open")}
                </ContactLink>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {vocabulary.stages.map((stage) => (
          <BoardColumn
            key={stage.id}
            stage={stage}
            stageLabel={lang === "en" ? stage.label_en : stage.label_hu}
            contacts={data.board[stage.id] ?? []}
            stages={vocabulary.stages}
            lifecycleLabel={labels.lifecycle}
            onMove={stageMove.move}
          />
        ))}
      </div>

      <p className="text-xs text-muted">{t("pipeline.note")}</p>

      {stageMove.pendingLossId ? <LostReasonDialog onConfirm={stageMove.confirmLoss} onCancel={stageMove.cancelLoss} /> : null}
    </div>
  );
}

