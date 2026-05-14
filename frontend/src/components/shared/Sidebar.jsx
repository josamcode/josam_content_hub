import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

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
  workflow: (
    <>
      <rect x="3" y="4" width="5" height="16" rx="1.5" />
      <rect x="10" y="4" width="5" height="10" rx="1.5" />
      <rect x="17" y="4" width="4" height="7" rx="1.5" />
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
  categoryDefaults: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <path d="M17 16l2 2 3-3" />
    </>
  ),
};

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard", enabled: true },
  { to: "/content", label: "Content Library", icon: "library", enabled: true },
  { to: "/workflow", label: "Workflow", icon: "workflow", enabled: true },
  { to: "/content/new", label: "Create Content", icon: "create", enabled: true },
  { to: "/calendar", label: "Calendar", icon: "calendar", enabled: true },
  { to: "/reminders", label: "Reminders", icon: "reminders", enabled: true },
  { to: "/queue", label: "Queue Settings", icon: "queue", enabled: true },
  { to: "/platforms", label: "Platform Settings", icon: "platform", enabled: true },
  { to: "/category-defaults", label: "Category Defaults", icon: "categoryDefaults", enabled: true },
  { to: "/publish-logs", label: "Publish Logs", icon: "logs", enabled: true },
];

const WORKSPACE_COUNT = 6;

function NavItem({ item }) {
  const location = useLocation();
  const iconNode = <Icon path={ICONS[item.icon]} />;
  const isContentSection =
    item.to === "/content" &&
    location.pathname.startsWith("/content/") &&
    location.pathname !== "/content/new";

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
          isActive || isContentSection
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
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-5 pt-6 pb-4">
          <div className="flex h-8 w-auto items-center justify-center">
            <img src='/logo.png' alt="Logo" className="h-full" />
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
          {NAV.slice(0, WORKSPACE_COUNT).map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          <div className="mt-4 px-2 pt-2 pb-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Configuration
          </div>
          {NAV.slice(WORKSPACE_COUNT).map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="border-t border-border px-5 py-4">
          <p className="text-[11px] leading-relaxed text-muted">
            You're using a focused, calm space made for shipping content — not chasing dashboards.
          </p>
        </div>
      </aside>

      <MobileBottomNav />
    </>
  );
}

const MOBILE_PRIMARY_KEYS = ["/dashboard", "/content", "/calendar", "/reminders"];

function getMobileBuckets() {
  const enabled = NAV.filter((item) => item.enabled);
  const byKey = new Map(enabled.map((item) => [item.to, item]));
  const primary = MOBILE_PRIMARY_KEYS
    .map((key) => byKey.get(key))
    .filter(Boolean);
  const primarySet = new Set(primary.map((item) => item.to));
  const more = enabled.filter((item) => !primarySet.has(item.to));
  return { primary, more };
}

function MoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M6 18 18 6" />
    </svg>
  );
}

function isLibraryActive(pathname) {
  if (pathname === "/content") return true;
  return (
    pathname.startsWith("/content/") && pathname !== "/content/new"
  );
}

function MobileTile({ item, isActive, onClick }) {
  return (
    <NavLink
      to={item.to}
      end
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={({ isActive: linkActive }) => {
        const active = isActive ?? linkActive;
        return cn(
          "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium leading-none transition",
          active ? "text-ink" : "text-muted hover:text-ink"
        );
      }}
    >
      {({ isActive: linkActive }) => {
        const active = isActive ?? linkActive;
        return (
          <>
            <span
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition",
                active
                  ? "bg-ink text-canvas"
                  : "bg-transparent text-muted group-hover:text-ink"
              )}
            >
              <Icon path={ICONS[item.icon]} />
            </span>
            <span className={cn(active ? "text-ink" : "text-muted")}>
              {item.label.split(" ")[0]}
            </span>
          </>
        );
      }}
    </NavLink>
  );
}

function MobileMoreTile({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={active}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium leading-none transition",
        active ? "text-ink" : "text-muted hover:text-ink"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl transition",
          active ? "bg-ink text-canvas" : "bg-transparent text-muted"
        )}
      >
        <MoreIcon />
      </span>
      <span className={cn(active ? "text-ink" : "text-muted")}>More</span>
    </button>
  );
}

function MobileMoreSheet({ items, open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close more menu"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="More navigation"
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-[0_-20px_40px_rgba(20,20,20,0.18)]",
          "transition-transform duration-250 ease-out",
          "pb-[max(env(safe-area-inset-bottom),0.75rem)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="flex justify-center pt-2">
          <span
            aria-hidden="true"
            className="h-1 w-10 rounded-full bg-border"
          />
        </div>
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              Quick jump
            </p>
            <h2 className="font-display text-lg leading-tight text-ink">More</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-canvas text-muted transition hover:bg-canvas/70 hover:text-ink"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm transition",
                  isActive
                    ? "border-ink/30 bg-ink text-canvas"
                    : "bg-canvas/50 text-ink hover:border-ink/15 hover:bg-canvas"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isActive ? "bg-canvas/15 text-canvas" : "bg-surface text-ink"
                    )}
                  >
                    <Icon path={ICONS[item.icon]} />
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRightIcon />
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { primary, more } = getMobileBuckets();

  // Close the sheet whenever we navigate.
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const moreActive = more.some((item) => location.pathname === item.to);

  const computeTileActive = (item) => {
    if (item.to === "/content") return isLibraryActive(location.pathname);
    return location.pathname === item.to;
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 flex items-stretch gap-1 border-t border-border bg-surface/95 px-2 pt-2 backdrop-blur md:hidden",
          "pb-[max(env(safe-area-inset-bottom),0.5rem)]",
          "shadow-[0_-8px_24px_rgba(20,20,20,0.06)]"
        )}
      >
        {primary.map((item) => (
          <MobileTile
            key={item.to}
            item={item}
            isActive={computeTileActive(item)}
          />
        ))}
        {more.length > 0 && (
          <MobileMoreTile
            active={moreActive || moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          />
        )}
      </nav>

      <MobileMoreSheet
        items={more}
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
      />
    </>
  );
}
