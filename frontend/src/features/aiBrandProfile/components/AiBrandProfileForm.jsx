import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Textarea } from "../../../components/ui/Textarea";
import { extractErrorMessage } from "../../../lib/axios";
import { ArrayFieldEditor } from "./ArrayFieldEditor";
import { PlatformInstructionsEditor } from "./PlatformInstructionsEditor";
import { useUpdateAiBrandProfile } from "../hooks/useUpdateAiBrandProfile";

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function objectsEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object") return false;
  if (!a || !b) return a === b;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function buildInitialForm(profile) {
  if (!profile) return null;
  return {
    audience: profile.audience || "",
    tone: profile.tone || "",
    language: profile.language || "",
    contentGoal: profile.contentGoal || "",
    ctaStyle: profile.ctaStyle || "",
    forbiddenWords: Array.isArray(profile.forbiddenWords) ? [...profile.forbiddenWords] : [],
    hashtagBank: Array.isArray(profile.hashtagBank) ? [...profile.hashtagBank] : [],
    servicesToPromote: Array.isArray(profile.servicesToPromote) ? [...profile.servicesToPromote] : [],
    courseTopics: Array.isArray(profile.courseTopics) ? [...profile.courseTopics] : [],
    platformInstructions: profile.platformInstructions
      ? { ...profile.platformInstructions }
      : { youtube: "", instagram: "", facebook: "", tiktok: "" },
  };
}

function formsEqual(a, b) {
  if (!a || !b) return a === b;
  return (
    a.audience === b.audience &&
    a.tone === b.tone &&
    a.language === b.language &&
    a.contentGoal === b.contentGoal &&
    a.ctaStyle === b.ctaStyle &&
    arraysEqual(a.forbiddenWords, b.forbiddenWords) &&
    arraysEqual(a.hashtagBank, b.hashtagBank) &&
    arraysEqual(a.servicesToPromote, b.servicesToPromote) &&
    arraysEqual(a.courseTopics, b.courseTopics) &&
    objectsEqual(a.platformInstructions, b.platformInstructions)
  );
}

function buildPayload(form) {
  return {
    audience: form.audience.trim() || null,
    tone: form.tone.trim() || null,
    language: form.language.trim() || null,
    contentGoal: form.contentGoal.trim() || null,
    ctaStyle: form.ctaStyle.trim() || null,
    forbiddenWords: form.forbiddenWords,
    hashtagBank: form.hashtagBank,
    servicesToPromote: form.servicesToPromote,
    courseTopics: form.courseTopics,
    platformInstructions: {
      youtube: form.platformInstructions.youtube || "",
      instagram: form.platformInstructions.instagram || "",
      facebook: form.platformInstructions.facebook || "",
      tiktok: form.platformInstructions.tiktok || "",
    },
  };
}

function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg leading-tight text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
    </div>
  );
}

export function AiBrandProfileForm({ profile, onProfileUpdated }) {
  const { t } = useTranslation(["common", "pages"]);
  const [form, setForm] = useState(() => buildInitialForm(profile));
  const [savedAt, setSavedAt] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setForm(buildInitialForm(profile));
  }, [profile]);

  const initial = useMemo(() => buildInitialForm(profile), [profile]);
  const isDirty = useMemo(() => !formsEqual(form, initial), [form, initial]);

  const mutation = useUpdateAiBrandProfile({
    onSuccess: (data) => {
      setSavedAt(Date.now());
      setSubmitError(null);
      if (onProfileUpdated) onProfileUpdated(data);
    },
    onError: (error) => {
      setSubmitError(
        extractErrorMessage(
          error,
          t("aiBrandProfile.error.fallback", { ns: "pages", defaultValue: "We couldn't save the profile." })
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

  function handlePlatformInstructions(value) {
    setForm((prev) => ({ ...prev, platformInstructions: value }));
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
    setForm(buildInitialForm(profile));
    setSavedAt(null);
    setSubmitError(null);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* Main profile section */}
      <Card padding="lg">
        <SectionHeader
          title={t("aiBrandProfile.sections.profile.title", { defaultValue: "Brand profile" })}
          description={t("aiBrandProfile.sections.profile.description", {
            defaultValue: "Core writing identity that shapes every future AI-generated caption, title, and description.",
          })}
        />

        <div className="flex flex-col gap-4">
          <Textarea
            label={t("aiBrandProfile.fields.audience.label", { defaultValue: "Audience" })}
            rows={2}
            placeholder={t("aiBrandProfile.fields.audience.placeholder", { defaultValue: "" })}
            hint={t("aiBrandProfile.fields.audience.hint", { defaultValue: "" })}
            value={form.audience}
            onChange={(e) => handleField("audience", e.target.value)}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Textarea
              label={t("aiBrandProfile.fields.tone.label", { defaultValue: "Tone" })}
              rows={2}
              placeholder={t("aiBrandProfile.fields.tone.placeholder", { defaultValue: "" })}
              value={form.tone}
              onChange={(e) => handleField("tone", e.target.value)}
            />
            <Input
              label={t("aiBrandProfile.fields.language.label", { defaultValue: "Language" })}
              placeholder={t("aiBrandProfile.fields.language.placeholder", { defaultValue: "" })}
              value={form.language}
              onChange={(e) => handleField("language", e.target.value)}
            />
          </div>

          <Textarea
            label={t("aiBrandProfile.fields.contentGoal.label", { defaultValue: "Content goal" })}
            rows={2}
            placeholder={t("aiBrandProfile.fields.contentGoal.placeholder", { defaultValue: "" })}
            value={form.contentGoal}
            onChange={(e) => handleField("contentGoal", e.target.value)}
          />

          <Textarea
            label={t("aiBrandProfile.fields.ctaStyle.label", { defaultValue: "CTA style" })}
            rows={2}
            placeholder={t("aiBrandProfile.fields.ctaStyle.placeholder", { defaultValue: "" })}
            value={form.ctaStyle}
            onChange={(e) => handleField("ctaStyle", e.target.value)}
          />
        </div>
      </Card>

      {/* Lists section */}
      <Card padding="lg">
        <SectionHeader
          title={t("aiBrandProfile.sections.lists.title", { defaultValue: "Lists & banks" })}
          description={t("aiBrandProfile.sections.lists.description", {
            defaultValue: "Words, hashtags, services, and topics the AI should know about.",
          })}
        />

        <div className="flex flex-col gap-5">
          <ArrayFieldEditor
            label={t("aiBrandProfile.fields.forbiddenWords.label", { defaultValue: "Forbidden words" })}
            hint={t("aiBrandProfile.fields.forbiddenWords.hint", { defaultValue: "" })}
            placeholder={t("aiBrandProfile.fields.forbiddenWords.placeholder", { defaultValue: "" })}
            value={form.forbiddenWords}
            onChange={(val) => handleField("forbiddenWords", val)}
          />

          <ArrayFieldEditor
            label={t("aiBrandProfile.fields.hashtagBank.label", { defaultValue: "Hashtag bank" })}
            hint={t("aiBrandProfile.fields.hashtagBank.hint", { defaultValue: "" })}
            placeholder={t("aiBrandProfile.fields.hashtagBank.placeholder", { defaultValue: "" })}
            value={form.hashtagBank}
            onChange={(val) => handleField("hashtagBank", val)}
          />

          <ArrayFieldEditor
            label={t("aiBrandProfile.fields.servicesToPromote.label", { defaultValue: "Services to promote" })}
            hint={t("aiBrandProfile.fields.servicesToPromote.hint", { defaultValue: "" })}
            placeholder={t("aiBrandProfile.fields.servicesToPromote.placeholder", { defaultValue: "" })}
            value={form.servicesToPromote}
            onChange={(val) => handleField("servicesToPromote", val)}
          />

          <ArrayFieldEditor
            label={t("aiBrandProfile.fields.courseTopics.label", { defaultValue: "Course topics" })}
            hint={t("aiBrandProfile.fields.courseTopics.hint", { defaultValue: "" })}
            placeholder={t("aiBrandProfile.fields.courseTopics.placeholder", { defaultValue: "" })}
            value={form.courseTopics}
            onChange={(val) => handleField("courseTopics", val)}
          />
        </div>
      </Card>

      {/* Platform instructions section */}
      <Card padding="lg">
        <SectionHeader
          title={t("aiBrandProfile.sections.platformInstructions.title", { defaultValue: "Platform instructions" })}
          description={t("aiBrandProfile.sections.platformInstructions.description", {
            defaultValue: "Per-platform guidance for future AI metadata generation.",
          })}
        />

        <PlatformInstructionsEditor
          value={form.platformInstructions}
          onChange={handlePlatformInstructions}
        />
      </Card>

      {/* Errors and success */}
      {submitError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("aiBrandProfile.error.saveTitle", { ns: "pages", defaultValue: "Couldn't save" })}
          </p>
          <p className="mt-1 text-sm text-ink">{submitError}</p>
        </div>
      )}

      {!submitError && savedAt && !isDirty && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {t("aiBrandProfile.actions.saved", { ns: "pages", defaultValue: "Saved." })}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {isDirty ? (
          <Badge tone="warning">
            {t("aiBrandProfile.actions.unsavedChanges", { ns: "pages", defaultValue: "Unsaved changes" })}
          </Badge>
        ) : (
          <span className="text-[11px] text-muted">
            {t("aiBrandProfile.actions.allSaved", { ns: "pages", defaultValue: "All changes saved" })}
          </span>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || submitting}
          >
            {t("revert", { ns: "common" })}
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
  );
}
