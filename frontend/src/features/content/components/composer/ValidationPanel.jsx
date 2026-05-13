import { cn } from "../../../../lib/cn";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
      <path d="m12 3 10 18H2L12 3z" />
    </svg>
  );
}

export function ValidationPanel({ result, source }) {
  if (!result) return null;

  const sourceLabel =
    source === "patch"
      ? "Backend blocked the save"
      : source === "validate"
        ? "Validation result"
        : null;

  if (result.valid) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon />
        </span>
        <div>
          <p className="font-medium">Looks good — ready to ship.</p>
          {sourceLabel && (
            <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-700/80">
              {sourceLabel}
            </p>
          )}
        </div>
      </div>
    );
  }

  const tone =
    source === "patch"
      ? "border-danger/30 bg-danger/5 text-ink"
      : "border-amber-200 bg-amber-50 text-amber-900";
  const iconTone =
    source === "patch"
      ? "bg-danger text-canvas"
      : "bg-amber-500 text-white";

  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", tone)}>
      <div className="flex items-start gap-3">
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", iconTone)}>
          <AlertIcon />
        </span>
        <div className="flex-1">
          <p className="font-medium">
            {source === "patch"
              ? "Can't mark this as ready yet"
              : "A few things need attention"}
          </p>
          {sourceLabel && (
            <p className="text-[11px] uppercase tracking-[0.16em] opacity-70">
              {sourceLabel}
            </p>
          )}
          {Array.isArray(result.warnings) && result.warnings.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {result.warnings.map((warning) => (
                <li key={`${warning.field}-${warning.message}`}>
                  <span className="font-medium capitalize">{warning.field}</span>
                  {" — "}
                  <span>{warning.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
