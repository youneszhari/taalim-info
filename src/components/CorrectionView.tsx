import Link from "next/link";
import type { Exam } from "@/types/exam";
import { getExamMeta } from "@/lib/exam-meta";
import { CorrectionBrowser } from "./CorrectionBrowser";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  LayersIcon,
  ListChecksIcon,
  PlayIcon,
  TimerIcon,
} from "./Icons";

export function CorrectionView({ exam }: { exam: Exam }) {
  const meta = getExamMeta(exam);
  const parts = Array.from(
    new Set(exam.questions.map((question) => question.partTitle)),
  ).map((partTitle) => ({
    title: partTitle,
    count: exam.questions.filter(
      (question) => question.partTitle === partTitle,
    ).length,
  }));
  const hours = Math.floor(exam.durationMinutes / 60);
  const minutes = exam.durationMinutes % 60;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        Tableau de bord
      </Link>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-accent">
            <ListChecksIcon size={12} /> Corrigé complet
          </span>
          <span className="badge">
            {exam.category === "officiel" ? "Officiel" : "Blanc"}
          </span>
          <span className="badge">{meta.session}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          {exam.title}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.8rem] leading-relaxed text-muted">
          Les {exam.totalQuestions} questions avec la bonne réponse,
          l&apos;explication détaillée et le piège à éviter. Naviguez question
          par question avec la palette, sans quitter la page. Aucune réponse
          n&apos;est demandée et aucune tentative n&apos;est enregistrée.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link href={`/exam/${exam.id}`} className="btn btn-primary">
            <PlayIcon size={14} />
            Passer l&apos;examen
          </Link>
          <span className="badge">
            <TimerIcon size={11} /> {hours} h {String(minutes).padStart(2, "0")}
          </span>
          <span className="badge">
            <BookOpenIcon size={11} /> {exam.totalQuestions} questions
          </span>
          <span className="badge">
            <LayersIcon size={11} /> {parts.length} parties
          </span>
          <span className="badge">Coefficient {exam.coefficient}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {parts.map((part) => (
            <span
              key={part.title}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-[0.66rem] font-medium text-muted"
            >
              {part.title.replace(/^PARTIE\s+\d+\s*:\s*/i, "")}
              <span className="ml-1.5 text-muted-2">({part.count})</span>
            </span>
          ))}
        </div>
      </header>

      <CorrectionBrowser exam={exam} />
    </div>
  );
}
