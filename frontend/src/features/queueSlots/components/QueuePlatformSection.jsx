import { useState } from "react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/cn";
import { formatPlatform } from "../../../lib/format";
import { QueueSlotCard } from "./QueueSlotCard";
import { QueueSlotForm } from "./QueueSlotForm";

const PLATFORM_DOT = {
  youtube: "bg-rose-500",
  instagram: "bg-fuchsia-500",
  facebook: "bg-sky-500",
  tiktok: "bg-zinc-900",
};

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function QueuePlatformSection({ platform, slots }) {
  const [adding, setAdding] = useState(false);
  const dot = PLATFORM_DOT[platform] || "bg-muted";

  return (
    <Card padding="lg">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-white text-[12px] font-semibold leading-none",
              dot
            )}
          >
            {formatPlatform(platform).charAt(0)}
          </span>
          <div>
            <h2 className="font-display text-xl leading-tight text-ink">
              {formatPlatform(platform)}
            </h2>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              {slots.length} active {slots.length === 1 ? "slot" : "slots"}
            </p>
          </div>
        </div>

        {!adding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAdding(true)}
          >
            <PlusIcon />
            Add slot
          </Button>
        )}
      </header>

      {adding && (
        <div className="mt-4">
          <QueueSlotForm
            mode="create"
            defaultPlatform={platform}
            onCancel={() => setAdding(false)}
            onSuccess={() => setAdding(false)}
          />
        </div>
      )}

      {slots.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-canvas/40 px-4 py-6 text-center">
          <p className="text-sm text-muted">
            No slots for {formatPlatform(platform)} yet.
          </p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {slots.map((slot) => (
            <QueueSlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </Card>
  );
}
