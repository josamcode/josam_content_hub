import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { PlatformIcon } from "../../../components/ui/PlatformIcon";
import { Select } from "../../../components/ui/Select";
import { TagInput } from "../../../components/ui/TagInput";
import { Textarea } from "../../../components/ui/Textarea";
import { Toggle } from "../../../components/ui/Toggle";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { useUpdatePlatformSetting } from "../hooks/useUpdatePlatformSetting";
import {
  PLATFORM_STRATEGY,
  PUBLISH_MODE_OPTIONS,
} from "../lib/platformSettings";
import { YouTubeConnectionPanel } from "./YouTubeConnectionPanel";

const PLATFORM_ACCENT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function settingsEqual(a, b) {
  return (
    a.isEnabled === b.isEnabled &&
    a.defaultPublishMode === b.defaultPublishMode &&
    arraysEqual(a.defaultHashtags, b.defaultHashtags) &&
    arraysEqual(a.defaultTags, b.defaultTags) &&
    (a.captionTemplate || "") === (b.captionTemplate || "") &&
    (a.titleTemplate || "") === (b.titleTemplate || "") &&
    (a.descriptionTemplate || "") === (b.descriptionTemplate || "") &&
    (a.notes || "") === (b.notes || "")
  );
}

function buildInitialForm(setting) {
  return {
    isEnabled: !!setting.isEnabled,
    defaultPublishMode: setting.defaultPublishMode || "manual",
    defaultHashtags: Array.isArray(setting.defaultHashtags)
      ? setting.defaultHashtags
      : [],
    defaultTags: Array.isArray(setting.defaultTags) ? setting.defaultTags : [],
    captionTemplate: setting.captionTemplate || "",
    titleTemplate: setting.titleTemplate || "",
    descriptionTemplate: setting.descriptionTemplate || "",
    notes: setting.notes || "",
  };
}

function buildPayload(form) {
  return {
    isEnabled: form.isEnabled,
    defaultPublishMode: form.defaultPublishMode,
    defaultHashtags: form.defaultHashtags,
    defaultTags: form.defaultTags,
    captionTemplate: form.captionTemplate.trim() ? form.captionTemplate : null,
    titleTemplate: form.titleTemplate.trim() ? form.titleTemplate : null,
    descriptionTemplate: form.descriptionTemplate.trim()
      ? form.descriptionTemplate
      : null,
    notes: form.notes.trim() ? form.notes : null,
  };
}

export function PlatformSettingsCard({ setting }) {
  const { t } = useTranslation(["common", "pages"]);
  const strategy = PLATFORM_STRATEGY[setting.platform] || {
    name: setting.platform,
    summaryKey: null,
    statusKey: null,
    statusTone: "neutral",
    futurePlanKey: null,
  };

  const accent = PLATFORM_ACCENT[setting.platform] || "bg-muted";

  const [form, setForm] = useState(() => buildInitialForm(setting));
  const [savedAt, setSavedAt] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setForm(buildInitialForm(setting));
  }, [setting]);

  const initial = useMemo(() => buildInitialForm(setting), [setting]);
  const isDirty = useMemo(() => !settingsEqual(form, initial), [form, initial]);
  const publishModeOptions = useMemo(
    () =>
      PUBLISH_MODE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(`platformSettings.publishModes.${option.value}`, {
          ns: "pages",
        }),
      })),
    [t]
  );

  const mutation = useUpdatePlatformSetting(setting.platform, {
    onSuccess: () => {
      setSavedAt(Date.now());
      setSubmitError(null);
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(
          error,
          t("platformSettings.card.saveErrorFallback", { ns: "pages" })
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

  function handleSubmit(event) {
    event.preventDefault();
    if (!isDirty || submitting) return;
    setSubmitError(null);
    mutation.mutate(buildPayload(form));
  }

  function handleReset() {
    setForm(buildInitialForm(setting));
    setSavedAt(null);
    setSubmitError(null);
  }

  const showAutoWarning = form.defaultPublishMode === "auto";

  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white",
            accent
          )}
        >
          <PlatformIcon platform={setting.platform} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl leading-tight text-ink">
              {strategy.name}
            </h2>
            {strategy.statusKey && (
              <Badge tone={strategy.statusTone || "neutral"}>
                {t(`platformSettings.platforms.${strategy.statusKey}`, {
                  ns: "pages",
                })}
              </Badge>
            )}
            <Badge tone={form.isEnabled ? "success" : "neutral"}>
              {form.isEnabled
                ? t("platformSettings.card.enabled", { ns: "pages" })
                : t("platformSettings.card.disabled", { ns: "pages" })}
            </Badge>
          </div>
          {strategy.summaryKey && (
            <p className="mt-1 text-sm text-muted">
              {t(`platformSettings.platforms.${strategy.summaryKey}`, {
                ns: "pages",
              })}
            </p>
          )}
        </div>
      </header>

      {setting.platform === "youtube" && <YouTubeConnectionPanel />}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="rounded-xl border border-border bg-canvas/40 px-4 py-3">
          <Toggle
            label={t("platformSettings.card.enabled", { ns: "pages" })}
            description={t("platformSettings.card.enabledDescription", {
              ns: "pages",
            })}
            checked={form.isEnabled}
            onChange={(event) =>
              handleField("isEnabled", event.target.checked)
            }
            onLabel={t("platformSettings.card.enabled", { ns: "pages" })}
            offLabel={t("platformSettings.card.disabled", { ns: "pages" })}
            showStateLabel
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            label={t("platformSettings.form.defaultPublishMode", {
              ns: "pages",
            })}
            options={publishModeOptions}
            value={form.defaultPublishMode}
            onChange={(event) =>
              handleField("defaultPublishMode", event.target.value)
            }
            hint={t("platformSettings.form.publishModeHint", { ns: "pages" })}
          />
          <Input
            label={t("platformSettings.form.titleTemplate", { ns: "pages" })}
            placeholder={t("platformSettings.form.titlePlaceholder", {
              ns: "pages",
            })}
            value={form.titleTemplate}
            onChange={(event) =>
              handleField("titleTemplate", event.target.value)
            }
          />
        </div>

        {showAutoWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("platformSettings.form.autoWarning", { ns: "pages" })}
          </div>
        )}

        <TagInput
          label={t("platformSettings.form.defaultHashtags", { ns: "pages" })}
          value={form.defaultHashtags}
          onChange={(next) => handleField("defaultHashtags", next)}
          prefix="#"
          placeholder={t("platformSettings.form.hashtagPlaceholder", {
            ns: "pages",
          })}
          maxTags={30}
        />

        <TagInput
          label={t("platformSettings.form.defaultTags", { ns: "pages" })}
          value={form.defaultTags}
          onChange={(next) => handleField("defaultTags", next)}
          placeholder={t("platformSettings.form.tagPlaceholder", {
            ns: "pages",
          })}
          maxTags={30}
        />

        <Textarea
          label={t("platformSettings.form.captionTemplate", { ns: "pages" })}
          rows={3}
          placeholder={t("platformSettings.form.captionPlaceholder", {
            ns: "pages",
          })}
          value={form.captionTemplate}
          onChange={(event) =>
            handleField("captionTemplate", event.target.value)
          }
        />

        <Textarea
          label={t("platformSettings.form.descriptionTemplate", {
            ns: "pages",
          })}
          rows={3}
          placeholder={t("platformSettings.form.descriptionPlaceholder", {
            ns: "pages",
          })}
          value={form.descriptionTemplate}
          onChange={(event) =>
            handleField("descriptionTemplate", event.target.value)
          }
        />

        <Textarea
          label={t("platformSettings.form.notes", { ns: "pages" })}
          rows={2}
          placeholder={t("platformSettings.form.notesPlaceholder", {
            ns: "pages",
          })}
          value={form.notes}
          onChange={(event) => handleField("notes", event.target.value)}
        />

        {strategy.futurePlanKey && (
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              {t("platformSettings.card.futureIntegrationPlan", {
                ns: "pages",
              })}
            </p>
            <p className="mt-1 text-sm text-ink">
              {t(`platformSettings.platforms.${strategy.futurePlanKey}`, {
                ns: "pages",
              })}
            </p>
          </div>
        )}

        {submitError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              {t("platformSettings.card.saveErrorTitle", { ns: "pages" })}
            </p>
            <p className="mt-1">{submitError}</p>
          </div>
        )}

        {!submitError && savedAt && !isDirty && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {t("platformSettings.card.saved", { ns: "pages" })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {t("platformSettings.card.footerNote", { ns: "pages" })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || submitting}
            >
              {t("platformSettings.actions.reset", { ns: "pages" })}
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
            {setting.platform !== "youtube" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled
                title={t("platformSettings.actions.comingLater", {
                  ns: "pages",
                })}
              >
                {t("platformSettings.actions.connectComingLater", {
                  ns: "pages",
                })}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
}
