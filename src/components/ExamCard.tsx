"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Exam } from "@/types/exam";
import type { Attempt, ExamSession } from "@/types/quiz";
import { getExamMeta } from "@/lib/exam-meta";
import { deleteSession } from "@/lib/storage";
import { clamp, formatDate, formatScore, formatTimer } from "@/lib/utils";
import {
  ArrowRightIcon,
  ClockIcon,
  HistoryIcon,
  ListChecksIcon,
  RotateIcon,
  TargetIcon,
} from "./Icons";

interface ExamCardProps {
  exam: Exam;
  attempts: Attempt[];
  session?: ExamSession;
  ready: boolean;
}

export function ExamCard({ exam, attempts, session, ready }: ExamCardProps) {
  const router = useRouter();
  const meta = getExamMeta(exam);
  const sorted = [...attempts].sort((a, b) => a.submittedAt - b.submittedAt);
  const best = sorted.reduce<Attempt | undefined>(
    (current, attempt) =>
      !current || attempt.score > current.score ? attempt : current,
    undefined,
  );
  const last = sorted[sorted.length - 1];
  const bestPercent = best
    ? clamp((best.correctCount / exam.totalQuestions) * 100, 0, 100)
    : 0;
  const answered = session ? Object.keys(session.answers).length : 0;

  function restart() {
    deleteSession(exam.id);
    router.push(`/exam/${exam.id}`);
  }

  return (
    <article className="card group relative flex h-full flex-col overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <span className={exam.category === "officiel" ? "badge badge-accent" : "badge"}>
          {exam.category === "officiel" ? "Officiel" : "Blanc"}
        </span>
        <span className="text-right text-[0.68rem] font-medium text-muted">
          {meta.session}
        </span>
      </div>

      <h3 className="mt-3 text-[1.05rem] font-bold leading-tight tracking-tight">
        {exam.title}
      </h3>
      <p className="mt-1.5 min-h-8 text-[0.73rem] leading-relaxed text-muted">
        {meta.tagline}
      </p>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface-raised py-2.5 text-center">
        <div>
          <div className="text-sm font-bold">{exam.totalQuestions}</div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Questions
          </div>
        </div>
        <div>
          <div className="text-sm font-bold">4 h</div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Durée
          </div>
        </div>
        <div>
          <div className="text-sm font-bold">{exam.coefficient}</div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Coeff.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.09em] text-muted">
            <TargetIcon size={11} /> Meilleur
          </div>
          <div className="mt-1.5 text-base font-bold tracking-tight">
            {ready && best ? (
              <>
                {formatScore(best.score)}
                <span className="ml-0.5 text-[0.65rem] font-medium text-muted">
                  /80
                </span>
              </>
            ) : (
              <span className="text-muted-2">—</span>
            )}
          </div>
          <div className="mt-0.5 text-[0.62rem] text-muted">
            {ready && best ? `Note ${formatScore(best.note)}/20` : "Pas encore tenté"}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.09em] text-muted">
            <ClockIcon size={11} /> Dernier
          </div>
          <div className="mt-1.5 text-base font-bold tracking-tight">
            {ready && last ? (
              <>
                {formatScore(last.score)}
                <span className="ml-0.5 text-[0.65rem] font-medium text-muted">
                  /80
                </span>
              </>
            ) : (
              <span className="text-muted-2">—</span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[0.62rem] text-muted">
            {ready && last ? formatDate(last.submittedAt) : "Aucune tentative"}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[0.62rem] text-muted">
          <span>Réussite</span>
          <span className="font-mono">{Math.round(bestPercent)} %</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${bestPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-4">
        {session ? (
          <div className="mb-3 rounded-xl border border-accent/25 bg-accent-soft p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[0.68rem] font-semibold text-accent">
                <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
                Session en cours
              </span>
              <span className="font-mono text-[0.65rem] text-muted">
                {formatTimer(session.remainingSeconds)}
              </span>
            </div>
            <p className="mt-1.5 text-[0.7rem] text-muted">
              Question {session.currentIndex + 1}/{exam.totalQuestions} ·{" "}
              {answered} réponse{answered > 1 ? "s" : ""} ·{" "}
              {session.mode === "simulation" ? "Simulation" : "Révision"}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${(answered / exam.totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Link
            href={`/exam/${exam.id}`}
            className="btn btn-primary min-w-0 flex-1"
          >
            {session
              ? "Reprendre"
              : attempts.length > 0
                ? "Nouvelle tentative"
                : "Commencer"}
            <ArrowRightIcon size={15} />
          </Link>

          <Link
            href={`/exam/${exam.id}/correction`}
            className="btn btn-secondary shrink-0 px-3"
            aria-label={`Voir les 80 questions corrigées — ${exam.title}`}
            title="Voir les 80 questions corrigées"
          >
            <ListChecksIcon size={15} />
            <span className="hidden sm:inline">Corrigé</span>
          </Link>

          {session ? (
            <button
              type="button"
              onClick={restart}
              className="btn btn-secondary shrink-0 px-3"
              aria-label={`Recommencer ${exam.title}`}
              title="Recommencer à zéro"
            >
              <RotateIcon size={15} />
            </button>
          ) : attempts.length > 0 ? (
            <Link
              href="/history"
              className="btn btn-secondary shrink-0 px-3"
              aria-label="Voir l'historique"
              title="Voir l'historique"
            >
              <HistoryIcon size={15} />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
