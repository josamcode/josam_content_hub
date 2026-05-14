import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { LanguageSwitcher } from "./LanguageSwitcher";

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

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
  const { t } = useTranslation("common");
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

  const studioLabel = user?.name
    ? t("studio", { name: user.name })
    : t("defaultStudio");

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-surface/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="hidden text-[11px] uppercase tracking-[0.18em] text-muted md:inline">
          {t("workspace")}
        </span>
        <span className="hidden h-3 w-px bg-border md:inline" />
        <span className="text-sm text-ink">{studioLabel}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          as={Link}
          to="/content/new"
          variant="primary"
          size="sm"
          aria-label={t("createNewContent")}
        >
          <PlusIcon />
          <span className="hidden sm:inline">{t("newContent")}</span>
        </Button>

        <span className="hidden items-center gap-2 rounded-full border border-border bg-canvas px-3 py-1 text-[11px] text-muted lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("allSystemsCalm")}
        </span>

        <LanguageSwitcher className="hidden sm:inline-flex" />

        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-label={t("openAccountMenu")}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 rounded-full border border-border bg-surface px-1 sm:px-2 py-1 text-sm transition hover:bg-canvas",
              menuOpen && "bg-canvas"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-medium text-canvas">
              {getInitials(user?.name)}
            </span>
            <span className="hidden pe-1 text-ink sm:inline">
              {user?.name || t("account")}
            </span>
          </button>

          {menuOpen && (
            <div
              className="absolute inset-e-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              role="menu"
            >
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-sm text-ink">{user?.name}</p>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <div className="flex flex-col gap-2 p-2">
                <div className="sm:hidden">
                  <LanguageSwitcher />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  {t("signOut")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
