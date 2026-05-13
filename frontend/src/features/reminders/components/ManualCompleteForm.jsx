import { useState } from "react";
import { useForm } from "react-hook-form";
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
        extractErrorMessage(err, "We couldn't mark this as published just now.")
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
          label="Platform post URL"
          type="url"
          placeholder="https://www.tiktok.com/@you/video/…"
          hint="Optional — paste the live URL if you have it."
          error={errors.platformPostUrl?.message}
          {...register("platformPostUrl")}
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={mutation.isPending}
        >
          {mutation.isPending ? "Saving" : "Mark as published"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Couldn't mark as published
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Marked as published. Moving this reminder to <strong>Done</strong>…
        </div>
      )}
    </form>
  );
}
