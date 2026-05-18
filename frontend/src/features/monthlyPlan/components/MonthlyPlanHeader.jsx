import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { formatMonthLabel } from "../lib/monthlyPlan";

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="rtl:rotate-180"
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="rtl:rotate-180"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MonthlyPlanHeader({
  monthDate,
  onPrev,
  onNext,
  onToday,
  isFetching,
  locale,
}) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between md:p-5">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onToday} type="button">
          {t("monthlyPlan.actions.today", { ns: "pages" })}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrev}
            type="button"
            aria-label={t("monthlyPlan.actions.previousMonth", { ns: "pages" })}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            type="button"
            aria-label={t("monthlyPlan.actions.nextMonth", { ns: "pages" })}
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl leading-none text-ink">
          {formatMonthLabel(monthDate, locale)}
        </h2>
        {isFetching && (
          <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-muted">
            <Spinner size="sm" />
            {t("refreshing", { ns: "common" })}
          </span>
        )}
      </div>
    </div>
  );
}
