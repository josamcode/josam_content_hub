import { useEffect, useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
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

const CATEGORY_OPTIONS = [
  { value: "", label: "Pick a category" },
  ...CONTENT_CATEGORIES.map((value) => ({ value, label: formatCategory(value) })),
];

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
          "flex w-full items-start justify-between gap-3 px-5 py-4 text-left transition",
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
  return hasValue(value) ? (
    <p className="text-sm leading-relaxed text-ink">{value}</p>
  ) : (
    <p className="text-sm text-muted">Not set</p>
  );
}

function GuidanceBadges({ values, formatValue = (value) => value }) {
  if (!Array.isArray(values) || values.length === 0) {
    return <p className="text-sm text-muted">Not set</p>;
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
  if (!categoryDefault) return null;

  return (
    <Card padding={compact ? "md" : "lg"}>
      <div className="mb-3 flex flex-col gap-1">
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Category guidance
        </span>
        <h2 className="font-display text-base leading-tight text-ink">
          {formatCategory(categoryDefault.category)}
        </h2>
        <p className="text-xs text-muted">
          Defaults you can lean on while drafting.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <GuidanceItem label="Goal">
          <GuidanceText value={categoryDefault.defaultGoal} />
        </GuidanceItem>
        <GuidanceItem label="Hook style">
          <GuidanceText value={categoryDefault.defaultHookStyle} />
        </GuidanceItem>
        <GuidanceItem label="Caption style">
          <GuidanceText value={categoryDefault.defaultCaptionStyle} />
        </GuidanceItem>
        <GuidanceItem label="Default hashtags">
          <GuidanceBadges values={categoryDefault.defaultHashtags} />
        </GuidanceItem>
        <GuidanceItem label="Default platforms">
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
  return (
    <Card padding="md" className="bg-canvas/40">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        What happens next
      </p>
      <ul className="mt-3 flex flex-col gap-2 text-sm text-ink">
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>A new <span className="font-medium">Content Item</span> is created in your library.</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>For each selected platform, a draft <span className="font-medium">Platform Post</span> is spun up.</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
          <span>From the details page you can upload media, refine captions, and schedule.</span>
        </li>
      </ul>
    </Card>
  );
}

export function CreateContentPage() {
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
        extractErrorMessage(error, "We couldn't create this item just now.")
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
        eyebrow="New"
        title="Create Content"
        subtitle="Capture a new idea — title and category are all you need to start."
        actions={
          <Button as={Link} to="/content" variant="outline" size="sm" type="button">
            <ArrowLeftIcon />
            Back to library
          </Button>
        }
      />

      {submitError && (
        <Card padding="md" className="border-danger/30 bg-danger/5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't save
          </p>
          <p className="mt-1 text-sm text-ink">{submitError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card padding="lg">
            <SectionHeading
              eyebrow="Quick idea"
              title="What is this piece?"
              description="A title and a category are all you need. Everything else can grow with the idea."
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr]">
              <Input
                label="Title"
                placeholder="e.g. How I'd architect a side-SaaS in a weekend"
                error={errors.title?.message}
                {...register("title")}
              />
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select
                    label="Category"
                    placeholder="Pick a category"
                    options={CATEGORY_OPTIONS}
                    error={errors.category?.message}
                    {...field}
                  />
                )}
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Hook"
                placeholder="The one-line idea that grabs attention."
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
            title="Script & notes"
            description="Optional — outline, full script, references, links."
            defaultOpen={hasValue(watchedScript) || hasValue(watchedNotes)}
            meta={
              scriptNotesCount > 0 ? (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {scriptNotesCount === 2 ? "Both filled" : "Filled"}
                </span>
              ) : null
            }
          >
            <div className="flex flex-col gap-4">
              <Textarea
                label="Script"
                placeholder="The full script or outline."
                rows={8}
                error={errors.script?.message}
                {...register("script")}
              />
              <Textarea
                label="Notes"
                placeholder="Research links, references, talking points, anything sticky."
                rows={5}
                error={errors.notes?.message}
                {...register("notes")}
              />
            </div>
          </CollapsibleCard>

          <CollapsibleCard
            title="Target platforms"
            description="Pick where this will live. Each platform gets its own draft."
            open={platformsOpen}
            onOpenChange={setPlatformsOpen}
            meta={
              platformsCount > 0 ? (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  {platformsCount} selected
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md border border-border bg-canvas px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted">
                  Optional
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
                  hint="Optional — you can add platforms later."
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
                  Apply category defaults
                </Button>
                <p className="text-xs text-muted">
                  Updates target platforms only. Title, hook, script, notes, and hashtags stay as written.
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
                Category guidance
              </p>
              <p className="mt-2 text-sm text-muted">
                Pick a category to see saved goal, hook style, caption style, and default platforms.
              </p>
            </Card>
          )}

          <WhatHappensNextCard />
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-2 border-t border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            New item will be saved as an idea
          </p>
          <div className="flex items-center gap-2">
            <Button
              as={Link}
              to="/content"
              variant="ghost"
              size="md"
              type="button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
            >
              {submitting ? "Saving" : "Save content"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
