import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { Textarea } from "../../../components/ui/Textarea";
import { PageHeader } from "../../../components/shared/PageHeader";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import {
  CONTENT_CATEGORIES,
  CONTENT_STATUSES,
  formatCategory,
  formatDate,
  formatDateTime,
  formatPlatform,
  formatStatus,
  statusTone,
} from "../../../lib/format";
import { ContentDetailSkeleton } from "../components/ContentDetailSkeleton";
import { MediaUploadSection } from "../../media/components/MediaUploadSection";
import { PlatformTabs } from "../components/PlatformTabs";
import { PublishHistorySummary } from "../components/PublishHistorySummary";
import { AiMetadataPanel } from "../components/ai-metadata/AiMetadataPanel";
import { useContentItem } from "../hooks/useContentItem";
import { useUpdateContentItem } from "../hooks/useUpdateContentItem";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

const updateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  category: z.enum(CONTENT_CATEGORIES, {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  status: z.enum(CONTENT_STATUSES, {
    errorMap: () => ({ message: "Pick a status" }),
  }),
  hook: z.string().max(500, "Keep the hook under 500 characters").optional(),
  script: z.string().max(20000, "Script is too long").optional(),
  notes: z.string().max(20000, "Notes are too long").optional(),
});

function toDefaultValues(item) {
  return {
    title: item?.title || "",
    category: item?.category || "",
    status: item?.status || "idea",
    hook: item?.hook || "",
    script: item?.script || "",
    notes: item?.notes || "",
  };
}

function diffPayload(values, original) {
  const patch = {};
  for (const key of Object.keys(values)) {
    const next = values[key];
    const prev = original[key];
    if (next !== prev) {
      patch[key] = next;
    }
  }
  return patch;
}

function ArrowLeftIcon() {
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
      <path d="M19 12H5" />
      <path d="m11 19-7-7 7-7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      {eyebrow && (
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-xl leading-tight text-ink">{title}</h2>
      {description && <p className="text-sm text-muted">{description}</p>}
    </div>
  );
}

function HeaderMeta({ item }) {
  const { t, i18n } = useTranslation(["common", "pages", "status"]);
  const locale = i18n.resolvedLanguage || i18n.language;
  const platforms = Array.isArray(item.platformPosts)
    ? Array.from(new Set(item.platformPosts.map((p) => p.platform)))
    : [];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <Badge tone={statusTone(item.status)}>{formatStatus(item.status, t)}</Badge>
      <span className="rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
        {formatCategory(item.category, t)}
      </span>
      {platforms.map((platform) => (
        <span
          key={platform}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] text-ink"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              PLATFORM_DOT[platform] || "bg-muted"
            )}
          />
          {formatPlatform(platform)}
        </span>
      ))}
      <span aria-hidden="true" className="text-muted/40">·</span>
      <span>
        {t("contentDetail.meta.created", {
          ns: "pages",
          date: formatDate(item.createdAt, locale),
        })}
      </span>
      {item.updatedAt && item.updatedAt !== item.createdAt ? (
        <>
          <span aria-hidden="true" className="text-muted/40">·</span>
          <span>
            {t("contentDetail.meta.updated", {
              ns: "pages",
              date: formatDateTime(item.updatedAt, locale),
            })}
          </span>
        </>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

const PLATFORM_POST_STATUS_TONE = {
  draft: "bg-canvas text-muted border border-border",
  ready: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  scheduled: "bg-sky-50 text-sky-700 border border-sky-200",
  manual_pending: "bg-amber-50 text-amber-800 border border-amber-200",
  processing: "bg-amber-50 text-amber-800 border border-amber-200",
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  manual_done: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border border-rose-200",
};

function SummaryRail({
  item,
  watchedStatus,
  watchedCategory,
  isDirty,
  submitting,
  onSave,
  onRevert,
}) {
  const { t } = useTranslation(["common", "pages", "status"]);
  const platformPosts = Array.isArray(item.platformPosts)
    ? item.platformPosts
    : [];
  const uniquePlatforms = Array.from(
    new Set(platformPosts.map((p) => p.platform))
  );

  return (
    <div className="flex flex-col gap-3">
      <Card padding="md">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("contentDetail.summary.title", { ns: "pages" })}
        </p>
        <div className="mt-3 flex flex-col gap-4">
          <SummaryRow label={t("contentDetail.summary.status", { ns: "pages" })}>
            <Badge tone={statusTone(watchedStatus || item.status)}>
              {formatStatus(watchedStatus || item.status, t)}
            </Badge>
          </SummaryRow>
          <SummaryRow label={t("contentDetail.summary.category", { ns: "pages" })}>
            <span className="text-sm text-ink">
              {formatCategory(watchedCategory || item.category, t)}
            </span>
          </SummaryRow>
          <SummaryRow label={t("contentDetail.summary.platforms", { ns: "pages" })}>
            {uniquePlatforms.length === 0 ? (
              <span className="text-sm text-muted">
                {t("contentDetail.summary.noneYet", { ns: "pages" })}
              </span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {uniquePlatforms.map((platform) => {
                  const post = platformPosts.find(
                    (p) => p.platform === platform
                  );
                  return (
                    <span
                      key={platform}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2 py-0.5 text-[11px] text-ink"
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          PLATFORM_DOT[platform] || "bg-muted"
                        )}
                      />
                      <span>{formatPlatform(platform)}</span>
                      {post?.status && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-[1px] text-[10px] uppercase tracking-[0.14em]",
                            PLATFORM_POST_STATUS_TONE[post.status] ||
                              "bg-canvas text-muted border border-border"
                          )}
                        >
                          {formatStatus(post.status, t)}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </SummaryRow>
          <SummaryRow label={t("contentDetail.summary.quickLinks", { ns: "pages" })}>
            <div className="flex flex-col gap-1">
              <Link
                to="/calendar"
                className="text-sm text-accent hover:underline"
              >
                {t("contentDetail.summary.openCalendar", { ns: "pages" })} →
              </Link>
              <Link
                to="/workflow"
                className="text-sm text-accent hover:underline"
              >
                {t("contentDetail.summary.openWorkflow", { ns: "pages" })} →
              </Link>
              <Link
                to="/content"
                className="text-sm text-accent hover:underline"
              >
                {t("contentDetail.summary.backToLibrary", { ns: "pages" })} →
              </Link>
            </div>
          </SummaryRow>
        </div>
      </Card>

      <Card
        padding="md"
        className={cn(
          "transition-opacity",
          !isDirty && "opacity-70"
        )}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {isDirty
            ? t("unsavedChanges", { ns: "common" })
            : t("allChangesSaved", { ns: "common" })}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onSave}
            loading={submitting}
            disabled={!isDirty || submitting}
          >
            {submitting
              ? t("saving", { ns: "common" })
              : t("saveChanges", { ns: "common" })}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onRevert}
            disabled={!isDirty || submitting}
          >
            {t("revert", { ns: "common" })}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function NotFoundState() {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("contentDetail.notFound.eyebrow", { ns: "pages" })}
        title={t("contentDetail.notFound.title", { ns: "pages" })}
        subtitle={t("contentDetail.notFound.subtitle", { ns: "pages" })}
        actions={
          <Button as={Link} to="/content" variant="outline" size="sm">
            <ArrowLeftIcon />
            {t("backToLibrary", { ns: "common" })}
          </Button>
        }
      />
      <Card padding="lg">
        <p className="text-sm text-muted">
          {t("contentDetail.notFound.description", { ns: "pages" })}
        </p>
      </Card>
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  const { t } = useTranslation(["common", "pages"]);

  return (
    <Card padding="lg" className="border-danger/30 bg-danger/5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
        {t("contentDetail.error.title", { ns: "pages" })}
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

export function ContentDetailPage() {
  const { t } = useTranslation(["common", "pages", "status"]);
  const { id } = useParams();
  const { data, isLoading, isError, error, isFetching, refetch } =
    useContentItem(id);

  const [submitError, setSubmitError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const original = useMemo(() => toDefaultValues(data), [data]);
  const categoryOptions = useMemo(
    () =>
      CONTENT_CATEGORIES.map((value) => ({
        value,
        label: formatCategory(value, t),
      })),
    [t]
  );
  const statusOptions = useMemo(
    () =>
      CONTENT_STATUSES.map((value) => ({
        value,
        label: formatStatus(value, t),
      })),
    [t]
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: original,
  });

  useEffect(() => {
    if (data) reset(toDefaultValues(data));
  }, [data, reset]);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(null), 3000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const mutation = useUpdateContentItem(id, {
    onSuccess: () => {
      setSavedAt(Date.now());
    },
    onError: (err) => {
      setSubmitError(
        extractErrorMessage(
          err,
          t("contentDetail.saveError.fallback", { ns: "pages" })
        )
      );
    },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    const patch = diffPayload(values, original);
    if (Object.keys(patch).length === 0) return;
    await mutation.mutateAsync(patch);
  };

  const onRevert = () => {
    setSubmitError(null);
    reset(original);
  };

  const hookValue = watch("hook") || "";
  const watchedStatus = watch("status");
  const watchedCategory = watch("category");

  if (isLoading) return <ContentDetailSkeleton />;

  if (isError && error?.response?.status === 404) {
    return <NotFoundState />;
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          eyebrow={t("contentDetail.error.eyebrow", { ns: "pages" })}
          title={t("contentDetail.pageTitleFallback", { ns: "pages" })}
          subtitle={t("contentDetail.error.subtitle", { ns: "pages" })}
          actions={
            <Button as={Link} to="/content" variant="outline" size="sm">
              <ArrowLeftIcon />
              {t("backToLibrary", { ns: "common" })}
            </Button>
          }
        />
        <ErrorBlock
          message={extractErrorMessage(
            error,
            t("contentDetail.error.fallback", { ns: "pages" })
          )}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!data) return <NotFoundState />;

  const submitting = mutation.isPending;
  const hasHistory =
    Array.isArray(data.publishAttempts) && data.publishAttempts.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={t("contentDetail.eyebrow", { ns: "pages" })}
        title={data.title || t("contentDetail.titleFallback", { ns: "pages" })}
        actions={
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/content"
              variant="outline"
              size="sm"
              type="button"
            >
              <ArrowLeftIcon />
              {t("back", { ns: "common" })}
            </Button>
            {isFetching && (
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted">
                {t("refreshing", { ns: "common" })}
              </span>
            )}
          </div>
        }
      />
      <div className="-mt-2">
        <HeaderMeta item={data} />
      </div>

      {savedAt && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <CheckIcon />
          </span>
          {t("changesSaved", { ns: "common" })}
        </div>
      )}

      {submitError && (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("contentDetail.saveError.title", { ns: "pages" })}
          </p>
          <p className="mt-1 text-sm text-ink">{submitError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card padding="lg">
            <SectionHeading
              eyebrow={t("contentDetail.sections.basics.eyebrow", { ns: "pages" })}
              title={t("contentDetail.sections.basics.title", { ns: "pages" })}
              description={t("contentDetail.sections.basics.description", { ns: "pages" })}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
              <Input
                label={t("contentDetail.sections.basics.titleLabel", { ns: "pages" })}
                placeholder={t("contentDetail.sections.basics.titlePlaceholder", { ns: "pages" })}
                error={errors.title?.message}
                {...register("title")}
              />
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    label={t("category", { ns: "common" })}
                    options={categoryOptions}
                    error={errors.category?.message}
                    {...field}
                  />
                )}
              />
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    label={t("status", { ns: "common" })}
                    options={statusOptions}
                    error={errors.status?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label={t("contentDetail.sections.basics.hookLabel", { ns: "pages" })}
                placeholder={t("contentDetail.sections.basics.hookPlaceholder", { ns: "pages" })}
                rows={3}
                counter={500}
                value={hookValue}
                error={errors.hook?.message}
                {...register("hook")}
              />
            </div>
          </Card>

          <Card padding="lg">
            <SectionHeading
              eyebrow={t("contentDetail.sections.scriptNotes.eyebrow", { ns: "pages" })}
              title={t("contentDetail.sections.scriptNotes.title", { ns: "pages" })}
              description={t("contentDetail.sections.scriptNotes.description", { ns: "pages" })}
            />
            <div className="flex flex-col gap-4">
              <Textarea
                label={t("contentDetail.sections.scriptNotes.scriptLabel", { ns: "pages" })}
                placeholder={t("contentDetail.sections.scriptNotes.scriptPlaceholder", { ns: "pages" })}
                rows={10}
                error={errors.script?.message}
                {...register("script")}
              />
              <Textarea
                label={t("contentDetail.sections.scriptNotes.notesLabel", { ns: "pages" })}
                placeholder={t("contentDetail.sections.scriptNotes.notesPlaceholder", { ns: "pages" })}
                rows={5}
                error={errors.notes?.message}
                {...register("notes")}
              />
            </div>
          </Card>

          <MediaUploadSection contentItemId={data.id} />

          <AiMetadataPanel
            contentItemId={data.id}
            category={data.category}
            platformPosts={data.platformPosts}
            isParentDirty={isDirty}
          />

          <section>
            <div className="mb-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                {t("contentDetail.sections.platforms.eyebrow", { ns: "pages" })}
              </span>
              <h2 className="font-display text-xl leading-tight text-ink">
                Platform composer
              </h2>
              <p className="text-sm text-muted">
                Tailor copy per platform. Save changes, validate against platform rules,
                and mark a version as ready when it's set.
              </p>
            </div>
            <PlatformTabs contentItemId={data.id} category={data.category} />
          </section>

          {hasHistory && (
            <Card padding="lg">
            <SectionHeading
                eyebrow={t("contentDetail.sections.history.eyebrow", { ns: "pages" })}
                title={t("contentDetail.sections.history.title", { ns: "pages" })}
                description={t("contentDetail.sections.history.description", { ns: "pages" })}
              />
              <PublishHistorySummary attempts={data.publishAttempts} />
            </Card>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6">
            <SummaryRail
              item={data}
              watchedStatus={watchedStatus}
              watchedCategory={watchedCategory}
              isDirty={isDirty}
              submitting={submitting}
              onSave={handleSubmit(onSubmit)}
              onRevert={onRevert}
            />
          </div>
        </aside>
      </div>

      <div
        className={cn(
          "sticky bottom-0 -mx-6 mt-4 border-t bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10 transition-opacity lg:hidden",
          isDirty ? "border-border opacity-100" : "border-transparent opacity-0 pointer-events-none"
        )}
        aria-hidden={!isDirty}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {t("contentDetail.mobile.unsaved", { ns: "pages" })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onRevert}
              disabled={submitting}
            >
              {t("revert", { ns: "common" })}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              loading={submitting}
              onClick={handleSubmit(onSubmit)}
            >
              {submitting
                ? t("saving", { ns: "common" })
                : t("saveChanges", { ns: "common" })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
