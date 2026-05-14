import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/hooks/useAuth";

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "JS";
}

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted md:inline">
          Workspace
        </span>
        <span className="hidden h-3 w-px bg-border md:inline" />
        <span className="text-sm text-ink">
          {user?.name ? `${user.name}'s studio` : "JoSam Studio"}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-[11px] text-muted sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          All systems calm
        </span>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label="Open account menu"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1 text-sm transition hover:bg-canvas",
              menuOpen && "bg-canvas"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-canvas">
              {getInitials(user?.name)}
            </span>
            <span className="hidden pr-1 text-ink sm:inline">
              {user?.name || "Account"}
            </span>
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              role="menu"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm text-ink">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
