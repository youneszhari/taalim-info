"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCENT_COLORS } from "@/lib/exam-meta";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import {
  CheckIcon,
  ChevronDownIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayoutGridIcon,
  MoonIcon,
  PaletteIcon,
  SunIcon,
} from "./Icons";

export function Navbar() {
  const pathname = usePathname();
  const { theme, accent, setAccent, toggleTheme } = useTheme();
  const [accentOpen, setAccentOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const accentRef = useRef<HTMLDivElement>(null);

  // Le Navbar est hydraté séparément (PPR + usePathname). On force le premier
  // rendu client à correspondre au HTML serveur avant d'appliquer le thème
  // réellement chargé depuis localStorage.
  useEffect(() => {
    setMounted(true);
  }, []);

  const displayTheme = mounted ? theme : "light";
  const displayAccent = mounted ? accent : ACCENT_COLORS[0].value;

  useEffect(() => {
    if (!accentOpen) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        accentRef.current &&
        !accentRef.current.contains(event.target as Node)
      ) {
        setAccentOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccentOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accentOpen]);

  const isHistory = pathname === "/history";
  const isExams = pathname === "/" || pathname.startsWith("/exam");

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-lg"
          aria-label="Taalim — tableau de bord"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-contrast shadow-sm transition group-hover:scale-[1.03]">
            <GraduationCapIcon size={19} />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[0.95rem] font-bold tracking-tight">
              Taalim
            </span>
            <span className="mt-1 hidden truncate text-[0.62rem] font-medium uppercase tracking-[0.16em] text-muted sm:block">
              CRMEF Informatique
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Navigation principale">
          <Link
            href="/"
            className={cn(
              "btn btn-ghost px-2.5 py-2 text-[0.8rem]",
              isExams && "bg-surface-2 text-foreground",
            )}
            aria-current={isExams ? "page" : undefined}
          >
            <LayoutGridIcon size={16} />
            <span className="hidden sm:inline">Examens</span>
          </Link>
          <Link
            href="/history"
            className={cn(
              "btn btn-ghost px-2.5 py-2 text-[0.8rem]",
              isHistory && "bg-surface-2 text-foreground",
            )}
            aria-current={isHistory ? "page" : undefined}
          >
            <HistoryIcon size={16} />
            <span className="hidden sm:inline">Historique</span>
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <div className="relative" ref={accentRef}>
            <button
              type="button"
              onClick={() => setAccentOpen((open) => !open)}
              className="btn btn-secondary h-9 gap-2 px-2.5 text-[0.78rem]"
              aria-haspopup="dialog"
              aria-expanded={accentOpen}
              aria-label="Choisir la couleur d'accent"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-inner"
                style={{ backgroundColor: displayAccent }}
                aria-hidden="true"
              />
              <span className="hidden lg:inline">Accent</span>
              <ChevronDownIcon
                size={13}
                className={cn(
                  "hidden text-muted transition sm:block",
                  accentOpen && "rotate-180",
                )}
              />
            </button>

            {accentOpen ? (
              <div
                className="card-raised absolute right-0 top-full z-50 mt-2 w-72 animate-fade-up p-3.5 shadow-lg"
                role="dialog"
                aria-label="Couleur d'accent"
              >
                <div className="flex items-center gap-2 px-1 pb-3">
                  <PaletteIcon size={15} className="text-muted" />
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-muted">
                    Couleur d&apos;accent
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {ACCENT_COLORS.map((color) => {
                    const active =
                      displayAccent.toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setAccent(color.value)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left text-[0.78rem] font-medium transition hover:bg-surface-2",
                          active && "border-border bg-surface-2",
                        )}
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/10 text-white"
                          style={{ backgroundColor: color.value }}
                        >
                          {active ? <CheckIcon size={11} /> : null}
                        </span>
                        <span className="truncate">{color.name}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="my-3 h-px bg-border" />
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-surface-2">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-border"
                      style={{ backgroundColor: displayAccent }}
                    >
                      <input
                        type="color"
                        value={displayAccent}
                        onChange={(event) => setAccent(event.target.value)}
                        className="h-8 w-8 opacity-0"
                        aria-label="Couleur personnalisée"
                      />
                    </span>
                    <span className="text-[0.78rem] font-medium">
                      Personnalisée
                    </span>
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase text-muted">
                    {displayAccent}
                  </span>
                </label>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-secondary h-9 w-9 p-0"
            aria-label={
              displayTheme === "dark"
                ? "Passer en mode clair"
                : "Passer en mode sombre"
            }
            title={displayTheme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {displayTheme === "dark" ? (
              <SunIcon size={16} />
            ) : (
              <MoonIcon size={16} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
