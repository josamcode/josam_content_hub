import { PlatformIcon } from "../../../components/ui/PlatformIcon";
import { cn } from "../../../lib/cn";
import { formatPlatform } from "../utils";

const TONES = {
  youtube: "bg-rose-50 text-rose-700 border-rose-200",
  instagram: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  facebook: "bg-sky-50 text-sky-700 border-sky-200",
  tiktok: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export function PlatformBadge({ platform, className }) {
  const tone = TONES[platform] || "bg-canvas text-ink border-border";
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-fit self-start items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        tone,
        className
      )}
      title={formatPlatform(platform)}
    >
      <PlatformIcon platform={platform} className="h-3.5 w-3.5 shrink-0" />
      {formatPlatform(platform)}
    </span>
  );
}
