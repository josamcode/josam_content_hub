import { useTranslation } from "react-i18next";

import { Card } from "../../../components/ui/Card";

function StatValue({ label, value, helper, tone = "neutral" }) {
  const tones = {
    neutral: "text-ink",
    warning: "text-amber-600",
    danger: "text-rose-600",
    success: "text-emerald-600",
    accent: "text-accent",
  };

  return (
    <Card padding="md" className="flex flex-col gap-1.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className={`font-display text-2xl leading-none ${tones[tone] || tones.neutral}`}>
        {value}
      </p>
      {helper && (
        <p className="text-[11px] leading-relaxed text-muted">{helper}</p>
      )}
    </Card>
  );
}

export function MonthlyPlanStats({ stats }) {
  const { t } = useTranslation("pages");

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatValue
        label={t("monthlyPlan.stats.total", "Total")}
        value={stats.total}
        helper={t("monthlyPlan.stats.totalHelper", "Items loaded")}
      />
      <StatValue
        label={t("monthlyPlan.stats.unscheduled", "Unscheduled")}
        value={stats.unscheduled}
        tone={stats.unscheduled > 0 ? "warning" : "neutral"}
        helper={
          stats.unscheduled > 0
            ? t("monthlyPlan.stats.unscheduledHelper", "Need a slot")
            : t("monthlyPlan.stats.unscheduledHelperEmpty", "All placed")
        }
      />
      <StatValue
        label={t("monthlyPlan.stats.scheduled", "Scheduled")}
        value={stats.scheduled}
        tone={stats.scheduled > 0 ? "accent" : "neutral"}
        helper={
          stats.scheduled > 0
            ? t("monthlyPlan.stats.scheduledHelper", "This month")
            : t("monthlyPlan.stats.scheduledHelperEmpty", "Nothing queued")
        }
      />
      <StatValue
        label={t("monthlyPlan.stats.attention", "Needs attention")}
        value={stats.attention}
        tone={stats.attention > 0 ? "danger" : "success"}
        helper={
          stats.attention > 0
            ? t("monthlyPlan.stats.attentionHelper", "Requires action")
            : t("monthlyPlan.stats.attentionHelperEmpty", "All clear")
        }
      />
    </div>
  );
}
