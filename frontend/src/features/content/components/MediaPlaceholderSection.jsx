import { Badge } from "../../../components/ui/Badge";

function FrameIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="1.5" />
      <path d="m21 17-5-5-7 7" />
    </svg>
  );
}

export function MediaPlaceholderSection() {
  return (
    <div className="flex items-start gap-4">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-canvas text-muted"
      >
        <FrameIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base text-ink">Media</h3>
          <Badge tone="neutral">Coming in a later phase</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          Thumbnails, b-roll and final cuts will live here. For now, keep your
          assets in your usual file storage and link them from the Notes field.
        </p>
      </div>
    </div>
  );
}
