import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { useManualCompletePublish } from "../hooks/useManualCompletePublish";

const urlSchema = z
  .string()
  .trim()
  .max(2048, "URL is too long")
  .refine(
    (val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid URL or leave empty" }
  )
  .optional();

const formSchema = z.object({
  platformPostUrl: urlSchema,
});

export function ManualCompleteForm({ platformPostId, scheduleId, className }) {
  const { t } = useTranslation(["common", "pages"]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { platformPostUrl: "" },
  });

  const mutation = useManualCompletePublish({
    onSuccess: () => {
      setError(null);
      setSuccess(true);
    },
    onError: (err) => {
      setSuccess(false);
      setError(
        extractErrorMessage(
          err,
          t("reminders.manualComplete.errorFallback", { ns: "pages" })
        )
      );
    },
  });

  const onSubmit = async (values) => {
    setError(null);
    setSuccess(false);
    await mutation.mutateAsync({
      platformPostId,
      scheduleId,
      platformPostUrl: values.platformPostUrl?.trim() || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Input
          label={t("reminders.manualComplete.platformUrl", { ns: "pages" })}
          type="url"
          placeholder="https://www.tiktok.com/@you/video/..."
          hint={t("reminders.manualComplete.urlHint", { ns: "pages" })}
          error={errors.platformPostUrl?.message}
          {...register("platformPostUrl")}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={mutation.isPending}
        >
          {mutation.isPending
            ? t("saving", { ns: "common" })
            : t("reminders.manualComplete.submit", { ns: "pages" })}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            {t("reminders.manualComplete.errorTitle", { ns: "pages" })}
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {t("reminders.manualComplete.success", { ns: "pages" })}
        </div>
      )}
    </form>
  );
}
