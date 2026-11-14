import Link from "next/link";
import { GraduationCapIcon } from "./Icons";

export function Footer() {
  return (
    <footer className="no-print border-t border-border bg-surface/50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent">
            <GraduationCapIcon size={13} />
          </span>
          <span>
            <strong className="font-semibold text-foreground">Taalim</strong> —
            Simulation d&apos;examens CRMEF Informatique
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <Link href="/" className="transition hover:text-foreground">
            Tableau de bord
          </Link>
          <Link href="/history" className="transition hover:text-foreground">
            Historique
          </Link>
          <span className="text-muted-2">
            Données 100 % locales · aucun serveur
          </span>
        </div>
      </div>
    </footer>
  );
}
