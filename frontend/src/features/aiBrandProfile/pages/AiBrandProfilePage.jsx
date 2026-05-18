import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Spinner } from "../../../components/ui/Spinner";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { AiBrandProfileForm } from "../components/AiBrandProfileForm";
import { AiBrandProfilePreview } from "../components/AiBrandProfilePreview";
import { useAiBrandProfile } from "../hooks/useAiBrandProfile";

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

function LoadingState() {
  const { t } = useTranslation("pages");

  return (
    <Card padding="lg" className="flex items-center justify-center gap-3">
      <Spinner size="md" />
      <p className="text-sm text-muted">
        {t("aiBrandProfile.loading", { defaultValue: "Loading AI brand profile..." })}
      </p>
    </Card>
  );
}

function ErrorBlock({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("aiBrandProfile.error.title", { ns: "pages", defaultValue: "Couldn't load AI brand profile" })}
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

export function AiBrandProfilePage() {
  const { t } = useTranslation(["common", "pages"]);
  const { data, isLoading, isError, error, refetch } = useAiBrandProfile();

  const handleProfileUpdated = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("aiBrandProfile.eyebrow", { ns: "pages", defaultValue: "AI Settings" })}
        title={t("aiBrandProfile.title", { ns: "pages", defaultValue: "AI Brand Profile" })}
        subtitle={t("aiBrandProfile.subtitle", {
          ns: "pages",
          defaultValue: "Controls how future AI-generated metadata should sound.",
        })}
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
              {t("aiBrandProfile.notice.eyebrow", { ns: "pages", defaultValue: "No AI calls yet" })}
            </p>
            <p className="mt-1 text-sm">
              {t("aiBrandProfile.notice.body", {
                ns: "pages",
                defaultValue: "This page does not call any AI model. It only stores writing instructions that future AI metadata generation will read.",
              })}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorBlock
          message={extractErrorMessage(
            error,
            t("aiBrandProfile.error.fallback", { ns: "pages", defaultValue: "We couldn't reach the API just now." })
          )}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_340px]">
          <AiBrandProfileForm
            profile={data}
            onProfileUpdated={handleProfileUpdated}
          />
          <aside className="hidden xl:block">
            <div className="sticky top-8">
              <AiBrandProfilePreview profile={data} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
