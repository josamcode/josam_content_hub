import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { CategoryDefaultCard } from "../components/CategoryDefaultCard";
import { CategoryDefaultSkeleton } from "../components/CategoryDefaultSkeleton";
import { useCategoryDefaults } from "../hooks/useCategoryDefaults";
import { sortCategoryDefaults } from "../lib/categoryDefaults";

function InfoIcon() {
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
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v5h1" />
    </svg>
  );
}

function ErrorBlock({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("categoryDefaults.error.title", { ns: "pages" })}
      </p>
      <p className="mt-2 text-sm text-ink">{message}</p>
      <div className="mt-4">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {t("tryAgain", { ns: "common" })}
        </Button>
      </div>
    </Card>
  );
}

export function CategoryDefaultsPage() {
  const { t } = useTranslation(["common", "pages"]);
  const { data, isLoading, isError, error, refetch } = useCategoryDefaults();

  const sorted = useMemo(() => sortCategoryDefaults(data || []), [data]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("categoryDefaults.eyebrow", { ns: "pages" })}
        title={t("categoryDefaults.title", { ns: "pages" })}
        subtitle={t("categoryDefaults.subtitle", { ns: "pages" })}
      />

      <Card padding="md" className="border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3 text-amber-900">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
          >
            <InfoIcon />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em]">
              {t("categoryDefaults.notice.eyebrow", { ns: "pages" })}
            </p>
            <p className="mt-1 text-sm">
              {t("categoryDefaults.notice.body", { ns: "pages" })}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <CategoryDefaultSkeleton count={4} />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            t("categoryDefaults.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetch()}
        />
      ) : sorted.length === 0 ? (
        <EmptyState
          title={t("categoryDefaults.empty.title", { ns: "pages" })}
          description={t("categoryDefaults.empty.description", { ns: "pages" })}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              {t("refresh", { ns: "common" })}
            </Button>
          }
        />
      ) : (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {sorted.map((entry) => (
            <CategoryDefaultCard key={entry.category} entry={entry} />
          ))}
        </section>
      )}
    </div>
  );
}
