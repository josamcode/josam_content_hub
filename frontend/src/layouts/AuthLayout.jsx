import { APP_NAME } from "../lib/constants";

export function AuthLayout({ children }) {
  return (
    <div className="relative grid min-h-screen grid-cols-1 bg-canvas text-ink lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-ink text-canvas lg:flex lg:flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.85) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-accent/40 blur-[140px]"
        />

        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-canvas/20 bg-canvas/5">
              <span className="font-display text-lg leading-none">J</span>
            </div>
            <div>
              <p className="font-display text-base leading-tight">{APP_NAME}</p>
              <p className="text-[10px] uppercase tracking-[0.22em] text-canvas/50">
                Studio
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-[11px] uppercase tracking-[0.22em] text-canvas/60">
              Phase 2.1 — App Shell
            </p>
            <h2 className="mt-4 font-display text-4xl leading-[1.1]">
              A calmer way to plan, write, and ship content.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-canvas/70">
              Your private studio for ideas, drafts, schedules and reminders — without the noise of a generic dashboard.
            </p>
          </div>

          <div className="text-[11px] uppercase tracking-[0.22em] text-canvas/40">
            Private workspace · Single user
          </div>
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
