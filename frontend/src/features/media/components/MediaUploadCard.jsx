import { useRef, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { extractErrorMessage } from "../../../lib/axios";
import { cn } from "../../../lib/cn";
import { useUploadMedia } from "../hooks/useUploadMedia";
import { formatFileSize } from "../lib/mediaFormat";

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m6 10 6-6 6 6" />
      <path d="M4 20h16" />
    </svg>
  );
}

function matchesAccept(file, accept) {
  if (!accept || accept === "*") return true;
  if (!file?.type) return true;
  const groups = accept.split(",").map((part) => part.trim().toLowerCase());
  return groups.some((rule) => {
    if (rule === "*") return true;
    if (rule.endsWith("/*")) {
      const prefix = rule.slice(0, -1);
      return file.type.toLowerCase().startsWith(prefix);
    }
    return file.type.toLowerCase() === rule;
  });
}

export function MediaUploadCard({
  contentItemId,
  type,
  title,
  description,
  accept,
  hint,
  iconTone = "neutral",
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState(null);
  const [pickedFile, setPickedFile] = useState(null);

  const mutation = useUploadMedia(
    { contentItemId },
    {
      onSuccess: () => {
        setError(null);
        setPickedFile(null);
        if (inputRef.current) inputRef.current.value = "";
      },
      onError: (err) => {
        setError(
          extractErrorMessage(err, "We couldn't upload that file just now.")
        );
      },
    }
  );

  const handlePick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!matchesAccept(file, accept)) {
      setError(
        accept?.startsWith("video")
          ? "Please select a video file."
          : accept?.startsWith("image")
            ? "Please select an image file."
            : "That file type isn't accepted here."
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setPickedFile(file);
    mutation.mutate({ file, type });
  };

  const isUploading = mutation.isPending;
  const accentClass =
    iconTone === "accent"
      ? "bg-accent-soft text-accent"
      : iconTone === "rose"
        ? "bg-rose-50 text-rose-700"
        : "bg-canvas text-ink";

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 transition",
        isUploading && "opacity-95"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            accentClass
          )}
        >
          <UploadIcon />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-base text-ink">{title}</h3>
          {description && (
            <p className="text-sm text-muted">{description}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          {hint}
        </p>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handlePick}
          loading={isUploading}
          disabled={isUploading}
        >
          {isUploading ? "Uploading" : "Choose file"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {isUploading && pickedFile && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-canvas/60 px-3 py-2 text-xs text-muted">
          <Spinner size="sm" />
          <span className="truncate">
            Uploading <span className="text-ink">{pickedFile.name}</span>
            {pickedFile.size ? ` · ${formatFileSize(pickedFile.size)}` : ""}
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-ink">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-danger">
            Upload failed
          </p>
          <p className="mt-1">{error}</p>
        </div>
      )}
    </div>
  );
}
