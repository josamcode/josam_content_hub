import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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
  PLATFORMS,
  formatCategory,
  formatPlatform,
} from "../../../lib/format";
import { useCategoryDefaults } from "../../categoryDefaults/hooks/useCategoryDefaults";
import { PlatformPicker } from "../components/PlatformPicker";
import { useCreateContentItem } from "../hooks/useCreateContentItem";

const platformEnum = z.enum(PLATFORMS);

const createContentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Give it a working title — you can change it later"),
  category: z.enum(CONTENT_CATEGORIES, {
    errorMap: () => ({ message: "Pick a category" }),
  }),
  hook: z.string().trim().max(500, "Keep the hook under 500 characters").optional(),
  script: z.string().max(20000, "Script is too long").optional(),
  notes: z.string().max(20000, "Notes are too long").optional(),
  targetPlatforms: z.array(platformEnum).optional(),
});

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

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn(
        "shrink-0 text-muted transition-transform duration-150",
        open ? "rotate-180" : "rotate-0"
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CollapsibleCard({
  title,
  description,
  meta,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const reactId = useId();
  const contentId = `${reactId}-content`;

  const toggle = () => {
    const next = !isOpen;
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className={cn(
          "flex w-full items-start justify-between gap-3 px-5 py-4 text-start transition",
          "hover:bg-canvas/40",
          isOpen ? "border-b border-border bg-canvas/30" : ""
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-sm text-ink">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {meta}
          <ChevronIcon open={isOpen} />
        </div>
      </button>
      {isOpen && (
        <div id={contentId} className="px-5 py-5">
          {children}
        </div>
      )}
    </Card>
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
      {description && (
        <p className="text-sm text-muted">{description}</p>
      )}
    </div>
  );
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === "string" && value.trim().length > 0;
}

function GuidanceText({ value }) {
  const { t } = useTranslation("common");

  return hasValue(value) ? (
    <p className="text-sm leading-relaxed text-ink">{value}</p>
  ) : (
    <p className="text-sm text-muted">{t("notSet")}</p>
  );
}

function GuidanceBadges({ values, formatValue = (value) => value }) {
  const { t } = useTranslation("common");

  if (!Array.isArray(values) || values.length === 0) {
    return <p className="text-sm text-muted">{t("notSet")}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} tone="neutral">
          {formatValue(value)}
        </Badge>
      ))}
    </div>
  );
}

function GuidanceItem({ label, children }) {
  return (
    <div className="border-t border-border pt-3 first:border-t-0 first:pt-0">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      {children}
    </div>
  );
}

function CategoryGuidancePanel({ categoryDefault, compact = false }) {
  const { t } = useTranslation(["pages", "status"]);

  if (!categoryDefault) return null;

  return (
    <Card padding={compact ? "md" : "lg"}>
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          {t("createContent.categoryGuidance.title", { ns: "pages" })}
        </span>
        <h2 className="font-display text-base leading-tight text-ink">
          {formatCategory(categoryDefault.category, t)}
        </h2>
        <p className="text-xs text-muted">
          {t("createContent.categoryGuidance.description", { ns: "pages" })}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GuidanceItem label={t("createContent.categoryGuidance.goal", { ns: "pages" })}>
          <GuidanceText value={categoryDefault.defaultGoal} />
        </GuidanceItem>
        <GuidanceItem label={t("createContent.categoryGuidance.hookStyle", { ns: "pages" })}>
          <GuidanceText value={categoryDefault.defaultHookStyle} />
        </GuidanceItem>
        <GuidanceItem label={t("createContent.categoryGuidance.captionStyle", { ns: "pages" })}>
          <GuidanceText value={categoryDefault.defaultCaptionStyle} />
        </GuidanceItem>
        <GuidanceItem label={t("createContent.categoryGuidance.defaultHashtags", { ns: "pages" })}>
          <GuidanceBadges values={categoryDefault.defaultHashtags} />
        </GuidanceItem>
        <GuidanceItem label={t("createContent.categoryGuidance.defaultPlatforms", { ns: "pages" })}>
          <GuidanceBadges
            values={categoryDefault.defaultPlatforms}
            formatValue={formatPlatform}
          />
        </GuidanceItem>
      </div>
    </Card>
  );
}

function WhatHappensNextCard() {
  const { t } = useTranslation("pages");

  return (
    <Card padding="md" className="bg-canvas/40">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        {t("createContent.whatNext.title")}
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-ink">
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>{t("createContent.whatNext.items.contentItem")}</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>{t("createContent.whatNext.items.platformPosts")}</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>{t("createContent.whatNext.items.details")}</span>
        </li>
      </ul>
    </Card>
  );
}

export function CreateContentPage() {
  const { t } = useTranslation(["common", "pages", "status"]);
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);
  const [targetPlatformsTouched, setTargetPlatformsTouched] = useState(false);
  const [platformsOpen, setPlatformsOpen] = useState(false);
  const categoryDefaultsQuery = useCategoryDefaults();

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createContentSchema),
    defaultValues: {
      title: "",
      category: "",
      hook: "",
      script: "",
      notes: "",
      targetPlatforms: [],
    },
  });

  const hookValue = watch("hook") || "";
  const selectedCategory = watch("category");
  const watchedPlatforms = watch("targetPlatforms") || [];
  const watchedScript = watch("script") || "";
  const watchedNotes = watch("notes") || "";

  const categoryDefaults = Array.isArray(categoryDefaultsQuery.data)
    ? categoryDefaultsQuery.data
    : [];
  const categoryOptions = useMemo(
    () => [
      {
        value: "",
        label: t("createContent.quickIdea.categoryPlaceholder", { ns: "pages" }),
      },
      ...CONTENT_CATEGORIES.map((value) => ({
        value,
        label: formatCategory(value, t),
      })),
    ],
    [t]
  );
  const selectedCategoryDefault = useMemo(
    () =>
      categoryDefaults.find(
        (categoryDefault) => categoryDefault.category === selectedCategory
      ) || null,
    [categoryDefaults, selectedCategory]
  );
  const hasDefaultPlatforms =
    Array.isArray(selectedCategoryDefault?.defaultPlatforms) &&
    selectedCategoryDefault.defaultPlatforms.length > 0;

  useEffect(() => {
    if (!selectedCategoryDefault || targetPlatformsTouched) return;

    const currentPlatforms = getValues("targetPlatforms") || [];
    if (currentPlatforms.length > 0 || !hasDefaultPlatforms) return;

    setValue("targetPlatforms", selectedCategoryDefault.defaultPlatforms, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setPlatformsOpen(true);
  }, [
    getValues,
    hasDefaultPlatforms,
    selectedCategoryDefault,
    setValue,
    targetPlatformsTouched,
  ]);

  const applyCategoryDefaultPlatforms = () => {
    if (!hasDefaultPlatforms) return;

    setTargetPlatformsTouched(true);
    setValue("targetPlatforms", selectedCategoryDefault.defaultPlatforms, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const mutation = useCreateContentItem({
    onSuccess: (data) => {
      if (data?.id) {
        navigate(`/content/${data.id}`, { replace: true });
      } else {
        navigate("/content", { replace: true });
      }
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(
          error,
          t("createContent.error.fallback", { ns: "pages" })
        )
      );
    },
  });

  const onSubmit = async (values) => {
    setSubmitError(null);
    await mutation.mutateAsync(values);
  };

  const submitting = isSubmitting || mutation.isPending;
  const platformsCount = watchedPlatforms.length;
  const scriptNotesCount =
    (hasValue(watchedScript) ? 1 : 0) + (hasValue(watchedNotes) ? 1 : 0);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      <PageHeader
        eyebrow={t("createContent.eyebrow", { ns: "pages" })}
        title={t("createContent.title", { ns: "pages" })}
        subtitle={t("createContent.subtitle", { ns: "pages" })}
        actions={
          <Button as={Link} to="/content" variant="outline" size="sm" type="button">
            <ArrowLeftIcon />
            {t("backToLibrary", { ns: "common" })}
          </Button>
        }
      />

      {submitError && (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("createContent.error.title", { ns: "pages" })}
          </p>
          <p className="mt-1 text-sm text-ink">{submitError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card padding="lg">
            <SectionHeading
              eyebrow={t("createContent.quickIdea.eyebrow", { ns: "pages" })}
              title={t("createContent.quickIdea.title", { ns: "pages" })}
              description={t("createContent.quickIdea.description", { ns: "pages" })}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
              <Input
                label={t("createContent.quickIdea.titleLabel", { ns: "pages" })}
                placeholder={t("createContent.quickIdea.titlePlaceholder", { ns: "pages" })}
                error={errors.title?.message}
                {...register("title")}
              />
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    label={t("createContent.quickIdea.categoryLabel", { ns: "pages" })}
                    placeholder={t("createContent.quickIdea.categoryPlaceholder", { ns: "pages" })}
                    options={categoryOptions}
                    error={errors.category?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label={t("createContent.quickIdea.hookLabel", { ns: "pages" })}
                placeholder={t("createContent.quickIdea.hookPlaceholder", { ns: "pages" })}
                rows={3}
                counter={500}
                value={hookValue}
                error={errors.hook?.message}
                {...register("hook")}
              />
            </div>
          </Card>

          {selectedCategoryDefault && (
            <div className="lg:hidden">
              <CategoryGuidancePanel
                categoryDefault={selectedCategoryDefault}
                compact
              />
            </div>
          )}

          <CollapsibleCard
            title={t("createContent.scriptNotes.title", { ns: "pages" })}
            description={t("createContent.scriptNotes.description", { ns: "pages" })}
            defaultOpen={hasValue(watchedScript) || hasValue(watchedNotes)}
            meta={
              scriptNotesCount > 0 ? (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {scriptNotesCount === 2
                    ? t("bothFilled", { ns: "common" })
                    : t("filled", { ns: "common" })}
                </span>
              ) : null
            }
          >
            <div className="flex flex-col gap-4">
              <Textarea
                label={t("createContent.scriptNotes.scriptLabel", { ns: "pages" })}
                placeholder={t("createContent.scriptNotes.scriptPlaceholder", { ns: "pages" })}
                rows={8}
                error={errors.script?.message}
                {...register("script")}
              />
              <Textarea
                label={t("createContent.scriptNotes.notesLabel", { ns: "pages" })}
                placeholder={t("createContent.scriptNotes.notesPlaceholder", { ns: "pages" })}
                rows={5}
                error={errors.notes?.message}
                {...register("notes")}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            title={t("createContent.targetPlatforms.title", { ns: "pages" })}
            description={t("createContent.targetPlatforms.description", { ns: "pages" })}
            open={platformsOpen}
            onOpenChange={setPlatformsOpen}
            meta={
              platformsCount > 0 ? (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("createContent.targetPlatforms.selectedCount", {
                    ns: "pages",
                    count: platformsCount,
                  })}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {t("optional", { ns: "common" })}
                </span>
              )
            }
          >
            <Controller
              control={control}
              name="targetPlatforms"
              render={({ field }) => (
                <PlatformPicker
                  value={field.value || []}
                  onChange={(nextValue) => {
                    setTargetPlatformsTouched(true);
                    field.onChange(nextValue);
                  }}
                  error={errors.targetPlatforms?.message}
                  hint={t("createContent.targetPlatforms.hint", { ns: "pages" })}
                />
              )}
            />
            {selectedCategoryDefault && (
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={applyCategoryDefaultPlatforms}
                  disabled={!hasDefaultPlatforms}
                  className="self-start"
                >
                  {t("applyCategoryDefaults", { ns: "common" })}
                </Button>
                <p className="text-xs text-muted">
                  {t("createContent.targetPlatforms.applyNote", { ns: "pages" })}
                </p>
              </div>
            )}
          </CollapsibleCard>
        </div>

        <div className="flex flex-col gap-4">
          {selectedCategoryDefault ? (
            <div className="hidden lg:block">
              <CategoryGuidancePanel categoryDefault={selectedCategoryDefault} />
            </div>
          ) : (
            <Card padding="md" className="hidden bg-canvas/40 lg:block">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
                {t("createContent.categoryGuidance.title", { ns: "pages" })}
              </p>
              <p className="mt-2 text-sm text-muted">
                {t("createContent.categoryGuidance.emptyDescription", { ns: "pages" })}
              </p>
            </Card>
          )}

          <WhatHappensNextCard />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-2 border-t border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {t("createContent.footer.ideaStatus", { ns: "pages" })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/content"
              variant="ghost"
              size="md"
              type="button"
            >
              {t("cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              {submitting
                ? t("saving", { ns: "common" })
                : t("saveContent", { ns: "common" })}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
