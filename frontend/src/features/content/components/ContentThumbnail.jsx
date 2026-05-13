import { cn } from "../../../lib/cn";

function pickPalette(seed = "") {
  const palettes = [
    { bg: "#2F4A3F", ink: "#E6ECE3" },
    { bg: "#3A3A39", ink: "#F7F4EC" },
    { bg: "#7B4B2A", ink: "#FBF1E4" },
    { bg: "#345070", ink: "#E7EEF6" },
    { bg: "#553A6B", ink: "#EFE7F4" },
    { bg: "#1F2F2A", ink: "#D7E2DA" },
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return palettes[hash % palettes.length];
}

export function ContentThumbnail({ title, category, className }) {
  const palette = pickPalette(`${title || ""}|${category || ""}`);
  const initials = (title || "Untitled")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative isolate flex aspect-[16/9] w-full items-end overflow-hidden rounded-t-2xl",
        className
      )}
      style={{ backgroundColor: palette.bg, color: palette.ink }}
      aria-hidden="true"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      />
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl"
        style={{ backgroundColor: palette.ink }}
      />
      <div className="relative flex w-full items-end justify-between p-4">
        <span className="font-display text-3xl leading-none">
          {initials || "—"}
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] opacity-70">
          Draft cover
        </span>
      </div>
    </div>
  );
}
