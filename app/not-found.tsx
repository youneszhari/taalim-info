import Link from "next/link";
import { ArrowRightIcon, HomeIcon, LayoutGridIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-accent">
        Erreur 404
      </span>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
        Page introuvable
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        La page demandée n&apos;existe pas ou a été déplacée. Revenez au tableau
        de bord pour choisir un examen ou consulter votre historique.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          <HomeIcon size={15} />
          Tableau de bord
        </Link>
        <Link href="/history" className="btn btn-secondary">
          <LayoutGridIcon size={15} />
          Historique
          <ArrowRightIcon size={14} />
        </Link>
      </div>
    </div>
  );
}
