import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { PlatformToggleButton } from "../../../components/ui/PlatformToggleButton";
import { Textarea } from "../../../components/ui/Textarea";
import { Toggle } from "../../../components/ui/Toggle";
import { extractErrorMessage } from "../../../lib/axios";
import { useUpdateCategoryDefault } from "../hooks/useUpdateCategoryDefault";
import {
  CATEGORY_TRANSLATION_KEYS,
  PLATFORM_OPTIONS,
  categoryLabel,
  hashtagsArrayToText,
  parseHashtagsText,
} from "../lib/categoryDefaults";

function arraysEqualUnordered(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  for (let i = 0; i < sortedA.length; i += 1) {
    if (sortedA[i] !== sortedB[i]) return false;
  }
  return true;
}

function arraysEqualOrdered(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function buildInitialForm(entry) {
  return {
    defaultGoal: entry.defaultGoal || "",
    defaultHookStyle: entry.defaultHookStyle || "",
    defaultCaptionStyle: entry.defaultCaptionStyle || "",
    defaultHashtagsText: hashtagsArrayToText(entry.defaultHashtags),
    defaultPlatforms: Array.isArray(entry.defaultPlatforms)
      ? entry.defaultPlatforms
      : [],
    notes: entry.notes || "",
    isActive: !!entry.isActive,
  };
}

function formsEqual(a, b) {
  return (
    a.defaultGoal === b.defaultGoal &&
    a.defaultHookStyle === b.defaultHookStyle &&
    a.defaultCaptionStyle === b.defaultCaptionStyle &&
    arraysEqualOrdered(
      parseHashtagsText(a.defaultHashtagsText),
      parseHashtagsText(b.defaultHashtagsText)
    ) &&
    arraysEqualUnordered(a.defaultPlatforms, b.defaultPlatforms) &&
    a.notes === b.notes &&
    a.isActive === b.isActive
  );
}

function buildPayload(form) {
  return {
    defaultGoal: form.defaultGoal.trim() ? form.defaultGoal.trim() : "",
    defaultHookStyle: form.defaultHookStyle.trim()
      ? form.defaultHookStyle.trim()
      : "",
    defaultCaptionStyle: form.defaultCaptionStyle.trim()
      ? form.defaultCaptionStyle.trim()
      : "",
    defaultHashtags: parseHashtagsText(form.defaultHashtagsText),
    defaultPlatforms: form.defaultPlatforms,
    notes: form.notes.trim() ? form.notes.trim() : "",
    isActive: form.isActive,
  };
}

export function CategoryDefaultCard({ entry }) {
  const { t } = useTranslation(["common", "pages"]);
  const [form, setForm] = useState(() => buildInitialForm(entry));
  const [savedAt, setSavedAt] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setForm(buildInitialForm(entry));
  }, [entry]);

  const initial = useMemo(() => buildInitialForm(entry), [entry]);
  const isDirty = useMemo(() => !formsEqual(form, initial), [form, initial]);

  const mutation = useUpdateCategoryDefault(entry.category, {
    onSuccess: () => {
      setSavedAt(Date.now());
      setSubmitError(null);
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(
          error,
          t("categoryDefaults.card.saveErrorFallback", { ns: "pages" })
        )
      );
    },
  });

  const submitting = mutation.isPending;

  function handleField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (savedAt) setSavedAt(null);
    if (submitError) setSubmitError(null);
  }

  function togglePlatform(platform) {
    setForm((prev) => {
      const has = prev.defaultPlatforms.includes(platform);
      return {
        ...prev,
        defaultPlatforms: has
          ? prev.defaultPlatforms.filter((p) => p !== platform)
          : [...prev.defaultPlatforms, platform],
      };
    });
    if (savedAt) setSavedAt(null);
    if (submitError) setSubmitError(null);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!isDirty || submitting) return;
    setSubmitError(null);
    mutation.mutate(buildPayload(form));
  }

  function handleReset() {
    setForm(buildInitialForm(entry));
    setSavedAt(null);
    setSubmitError(null);
  }

  const categoryKey = CATEGORY_TRANSLATION_KEYS[entry.category];
  const description = categoryKey
    ? t(`categoryDefaults.categories.${categoryKey}.description`, {
        ns: "pages",
      })
    : null;

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl leading-tight text-ink">
              {categoryLabel(entry.category, t)}
            </h2>
            <Badge tone={form.isActive ? "success" : "neutral"}>
              {form.isActive
                ? t("categoryDefaults.card.active", { ns: "pages" })
                : t("categoryDefaults.card.inactive", { ns: "pages" })}
            </Badge>
          </div>
          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-canvas/40 px-4 py-3">
          <Toggle
            label={t("categoryDefaults.card.active", { ns: "pages" })}
            description={t("categoryDefaults.card.activeDescription", {
              ns: "pages",
            })}
            checked={form.isActive}
            onChange={(event) => handleField("isActive", event.target.checked)}
            onLabel={t("categoryDefaults.card.active", { ns: "pages" })}
            offLabel={t("categoryDefaults.card.inactive", { ns: "pages" })}
            showStateLabel
          />
        </div>

        <Input
          label={t("categoryDefaults.form.defaultGoal", { ns: "pages" })}
          placeholder={t("categoryDefaults.form.defaultGoalPlaceholder", {
            ns: "pages",
          })}
          value={form.defaultGoal}
          onChange={(event) => handleField("defaultGoal", event.target.value)}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label={t("categoryDefaults.form.defaultHookStyle", {
              ns: "pages",
            })}
            placeholder={t("categoryDefaults.form.defaultHookPlaceholder", {
              ns: "pages",
            })}
            value={form.defaultHookStyle}
            onChange={(event) =>
              handleField("defaultHookStyle", event.target.value)
            }
          />
          <Input
            label={t("categoryDefaults.form.defaultCaptionStyle", {
              ns: "pages",
            })}
            placeholder={t("categoryDefaults.form.defaultCaptionPlaceholder", {
              ns: "pages",
            })}
            value={form.defaultCaptionStyle}
            onChange={(event) =>
              handleField("defaultCaptionStyle", event.target.value)
            }
          />
        </div>

        <Textarea
          label={t("categoryDefaults.form.defaultHashtags", { ns: "pages" })}
          rows={2}
          placeholder={t("categoryDefaults.form.hashtagsPlaceholder", {
            ns: "pages",
          })}
          hint={t("categoryDefaults.form.hashtagsHint", { ns: "pages" })}
          value={form.defaultHashtagsText}
          onChange={(event) =>
            handleField("defaultHashtagsText", event.target.value)
          }
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("categoryDefaults.form.defaultPlatforms", { ns: "pages" })}
            </span>
            <span className="text-[11px] tabular-nums text-muted">
              {t("categoryDefaults.form.selectedCount", {
                ns: "pages",
                count: form.defaultPlatforms.length,
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PLATFORM_OPTIONS.map((option) => (
              <PlatformToggleButton
                key={option.value}
                platform={option.value}
                label={option.label}
                selected={form.defaultPlatforms.includes(option.value)}
                onClick={() => togglePlatform(option.value)}
              />
            ))}
          </div>
        </div>

        <Textarea
          label={t("categoryDefaults.form.notes", { ns: "pages" })}
          rows={2}
          placeholder={t("categoryDefaults.form.notesPlaceholder", {
            ns: "pages",
          })}
          value={form.notes}
          onChange={(event) => handleField("notes", event.target.value)}
        />

        {submitError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("categoryDefaults.card.saveErrorTitle", { ns: "pages" })}
            </p>
            <p className="mt-1">{submitError}</p>
          </div>
        )}

        {!submitError && savedAt && !isDirty && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t("categoryDefaults.card.saved", { ns: "pages" })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {t("categoryDefaults.card.footerNote", { ns: "pages" })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || submitting}
            >
              {t("categoryDefaults.actions.reset", { ns: "pages" })}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!isDirty || submitting}
            >
              {submitting
                ? t("saving", { ns: "common" })
                : t("saveChanges", { ns: "common" })}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
