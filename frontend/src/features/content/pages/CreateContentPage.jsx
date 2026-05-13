import { useState } from "react";
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
import {
  CONTENT_CATEGORIES,
  PLATFORMS,
  formatCategory,
} from "../../../lib/format";
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

export function CreateContentPage() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    control,
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

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-8"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-6">
          <Card padding="lg">
            <SectionHeading
              eyebrow="Basics"
              title="What is this piece?"
              description="A title and a category are required. Everything else can grow with the idea."
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

          <Card padding="lg">
            <SectionHeading
              eyebrow="Body"
              title="Script & notes"
              description="Rough drafts welcome — both fields are optional and you can refine them later."
            />

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
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card padding="lg">
            <SectionHeading
              eyebrow="Platforms"
              title="Where will this live?"
              description="Pick the platforms you plan to publish on. Each selected platform creates a draft you can refine later."
            />
            <Controller
              control={control}
              name="targetPlatforms"
              render={({ field }) => (
                <PlatformPicker
                  value={field.value || []}
                  onChange={field.onChange}
                  error={errors.targetPlatforms?.message}
                  hint="Optional — you can add platforms later."
                />
              )}
            />
          </Card>

          <Card padding="lg" className="bg-ink text-canvas">
            <div className="flex items-center gap-2">
              <Badge tone="accent">Tip</Badge>
              <span className="font-display text-base text-canvas">Stay loose</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-canvas/70">
              You don't need a polished script to save this. Capture the spark, set a category, and pick platforms when you're ready. Status starts as <span className="text-canvas">Idea</span> — promote it as the piece matures.
            </p>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 -mx-6 mt-4 border-t border-border bg-canvas/95 px-6 py-4 backdrop-blur md:-mx-10 md:px-10">
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
