import { NavLink } from "react-router-dom";

import { cn } from "../../lib/cn";
import { APP_NAME } from "../../lib/constants";

function Icon({ path, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-[18px] w-[18px]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {path}
    </svg>
  );
}

const ICONS = {
  dashboard: (
    <>
      <path d="M3 12 12 4l9 8" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  library: (
    <>
      <path d="M4 6h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V6Z" />
      <path d="M4 6V4h12" />
    </>
  ),
  create: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 3v4M16 3v4" />
    </>
  ),
  reminders: (
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  queue: (
    <>
      <path d="M4 7h16M4 12h10M4 17h16" />
    </>
  ),
  platform: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
    </>
  ),
  logs: (
    <>
      <path d="M6 4h9l4 4v12H6z" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </>
  ),
};

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", enabled: true },
  { to: "/content", label: "Content Library", icon: "library", enabled: true },
  { to: "/content/new", label: "Create Content", icon: "create", enabled: true },
  { to: "/calendar", label: "Calendar", icon: "calendar", enabled: true },
  { to: "/reminders", label: "Reminders", icon: "reminders", enabled: true },
  { to: "/queue", label: "Queue Settings", icon: "queue", enabled: true },
  { to: "/platform-settings", label: "Platform Settings", icon: "platform" },
  { to: "/publish-logs", label: "Publish Logs", icon: "logs" },
];

function NavItem({ item }) {
  const iconNode = <Icon path={ICONS[item.icon]} />;

  if (!item.enabled) {
    return (
      <div
        className={cn(
          "group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm",
          "cursor-not-allowed text-muted/70"
        )}
        aria-disabled="true"
        title="Available in a later phase"
      >
        <span className="flex items-center gap-3">
          <span className="text-muted/60">{iconNode}</span>
          <span>{item.label}</span>
        </span>
        <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted/70">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
          isActive
            ? "bg-ink text-canvas"
            : "text-ink/80 hover:bg-canvas hover:text-ink"
        )
      }
    >
      {iconNode}
      <span>{item.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center gap-2 px-5 pt-6 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-canvas">
          <span className="font-display text-base leading-none">J</span>
        </div>
        <div className="flex flex-col">
          <span className="font-display text-[15px] leading-tight text-ink">
            {APP_NAME}
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted">
            Studio
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
        <div className="px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          Workspace
        </div>
        {NAV.slice(0, 5).map((item) => (
          <NavItem key={item.to} item={item} />
        ))}

        <div className="mt-4 px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
          Configuration
        </div>
        {NAV.slice(5).map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-muted">
          You're using a focused, calm space made for shipping content — not chasing dashboards.
        </p>
      </div>
    </aside>
  );
}
