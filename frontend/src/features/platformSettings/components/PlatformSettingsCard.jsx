import { useEffect, useMemo, useState } from "react";

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
  const strategy = PLATFORM_STRATEGY[setting.platform] || {
    name: setting.platform,
    summary: null,
    currentStatus: null,
    statusTone: "neutral",
    futurePlan: null,
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

  const mutation = useUpdatePlatformSetting(setting.platform, {
    onSuccess: () => {
      setSavedAt(Date.now());
      setSubmitError(null);
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(error, "We couldn't save these settings.")
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
            {strategy.currentStatus && (
              <Badge tone={strategy.statusTone || "neutral"}>
                {strategy.currentStatus}
              </Badge>
            )}
            <Badge tone={form.isEnabled ? "success" : "neutral"}>
              {form.isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          {strategy.summary && (
            <p className="mt-1 text-sm text-muted">{strategy.summary}</p>
          )}
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <div className="rounded-xl border border-border bg-canvas/40 px-4 py-3">
          <Toggle
            label="Enabled"
            description="Show this platform in content workflows."
            checked={form.isEnabled}
            onChange={(event) =>
              handleField("isEnabled", event.target.checked)
            }
            showStateLabel
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Select
            label="Default publish mode"
            options={PUBLISH_MODE_OPTIONS}
            value={form.defaultPublishMode}
            onChange={(event) =>
              handleField("defaultPublishMode", event.target.value)
            }
            hint="Stored only — used as default by future workflows."
          />
          <Input
            label="Title template"
            placeholder="Optional title template"
            value={form.titleTemplate}
            onChange={(event) =>
              handleField("titleTemplate", event.target.value)
            }
          />
        </div>

        {showAutoWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Auto publishing is not active yet. This value is stored for future
            integration.
          </div>
        )}

        <TagInput
          label="Default hashtags"
          value={form.defaultHashtags}
          onChange={(next) => handleField("defaultHashtags", next)}
          prefix="#"
          placeholder="Type a hashtag and press Enter"
          maxTags={30}
        />

        <TagInput
          label="Default tags"
          value={form.defaultTags}
          onChange={(next) => handleField("defaultTags", next)}
          placeholder="Type a tag and press Enter"
          maxTags={30}
        />

        <Textarea
          label="Caption template"
          rows={3}
          placeholder="Default caption template…"
          value={form.captionTemplate}
          onChange={(event) =>
            handleField("captionTemplate", event.target.value)
          }
        />

        <Textarea
          label="Description template"
          rows={3}
          placeholder="Default description template…"
          value={form.descriptionTemplate}
          onChange={(event) =>
            handleField("descriptionTemplate", event.target.value)
          }
        />

        <Textarea
          label="Notes"
          rows={2}
          placeholder="Private notes for this platform"
          value={form.notes}
          onChange={(event) => handleField("notes", event.target.value)}
        />

        {strategy.futurePlan && (
          <div className="rounded-xl border border-border bg-surface p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
              Future integration plan
            </p>
            <p className="mt-1 text-sm text-ink">{strategy.futurePlan}</p>
          </div>
        )}

        {submitError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
              Couldn't save
            </p>
            <p className="mt-1">{submitError}</p>
          </div>
        )}

        {!submitError && savedAt && !isDirty && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Saved.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Defaults &amp; templates only · no OAuth yet
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty || submitting}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!isDirty || submitting}
            >
              {submitting ? "Saving" : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="Coming later"
            >
              Connect · coming later
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
