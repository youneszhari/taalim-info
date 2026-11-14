"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Exam } from "@/types/exam";
import type { Attempt } from "@/types/quiz";
import { getExamMeta } from "@/lib/exam-meta";
import { computePartStats } from "@/lib/scoring";
import { getAttemptById } from "@/lib/storage";
import { clamp, cn, formatDate, formatDuration, formatScore } from "@/lib/utils";
import { ReviewQuestion } from "./ReviewQuestion";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  HistoryIcon,
  LightbulbIcon,
  PlayIcon,
  TargetIcon,
  TrophyIcon,
  XCircleIcon,
} from "./Icons";

type FilterKey = "all" | "wrong" | "correct" | "unanswered" | "flagged";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Toutes" },
  { key: "wrong", label: "Mes erreurs" },
  { key: "correct", label: "Mes bonnes réponses" },
  { key: "unanswered", label: "Non répondues" },
  { key: "flagged", label: "Marquées" },
];

interface ResultViewProps {
  exam: Exam;
  attemptId: string;
}

export function ResultView({ exam, attemptId }: ResultViewProps) {
  const [attempt, setAttempt] = useState<Attempt | null | undefined>(undefined);
  const [filter, setFilter] = useState<FilterKey>("all");
  const meta = getExamMeta(exam);

  useEffect(() => {
    const found = getAttemptById(attemptId);
    setAttempt(found && found.examId === exam.id ? found : null);
  }, [attemptId, exam.id]);

  const partStats = useMemo(
    () => (attempt ? computePartStats(exam, attempt.answers) : []),
    [attempt, exam],
  );

  if (attempt === undefined) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton h-4 w-36" />
        <div className="skeleton mt-4 h-9 w-2/3" />
        <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (attempt === null) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <AlertTriangleIcon size={24} />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Tentative introuvable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Cette tentative n&apos;est plus disponible dans le stockage local de
          ce navigateur. Elle a peut-être été supprimée ou importée depuis un
          autre appareil.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/history" className="btn btn-secondary">
            <HistoryIcon size={15} />
            Voir l&apos;historique
          </Link>
          <Link href="/" className="btn btn-primary">
            Tableau de bord
            <ArrowRightIcon size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const retryCount = attempt.incorrectCount + attempt.unansweredCount;
  const total = exam.totalQuestions;
  const ringPercent = clamp(attempt.percentage, 0, 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ringPercent / 100);

  const counts: Record<FilterKey, number> = {
    all: total,
    wrong: attempt.incorrectCount,
    correct: attempt.correctCount,
    unanswered: attempt.unansweredCount,
    flagged: attempt.flagged.length,
  };

  const filtered = exam.questions.filter((question) => {
    const answer = attempt.answers[question.id];
    switch (filter) {
      case "wrong":
        return Boolean(answer) && answer !== question.correctAnswer;
      case "correct":
        return answer === question.correctAnswer;
      case "unanswered":
        return !answer;
      case "flagged":
        return attempt.flagged.includes(question.id);
      case "all":
      default:
        return true;
    }
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeftIcon size={14} />
          Tableau de bord
        </Link>
        <Link
          href="/history"
          className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
        >
          <HistoryIcon size={14} />
          Historique & progression
        </Link>
      </div>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-accent">Résultat de l&apos;examen</span>
            <span className="badge">{meta.session}</span>
            <span className="badge">
              {attempt.mode === "simulation" ? "Simulation" : "Révision"}
            </span>
            {attempt.negativeMarking ? (
              <span className="badge">Barème −0,25</span>
            ) : (
              <span className="badge">Sans pénalité</span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {exam.title}
          </h1>
          <p className="mt-1.5 text-[0.75rem] text-muted">
            Terminé le {formatDate(attempt.submittedAt)} ·{" "}
            {exam.totalQuestions} questions · coefficient {exam.coefficient}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {retryCount > 0 ? (
            <Link
              href={`/exam/${exam.id}/retry/${attempt.id}`}
              className="btn btn-primary"
            >
              <PlayIcon size={14} />
              Rejouer mes erreurs ({retryCount})
            </Link>
          ) : (
            <span className="btn btn-secondary cursor-default opacity-60">
              <CheckCircleIcon size={14} className="text-success" />
              Aucune erreur à rejouer
            </span>
          )}
          <Link href={`/exam/${exam.id}`} className="btn btn-secondary">
            <TargetIcon size={14} />
            Nouvelle tentative
          </Link>
        </div>
      </header>

      <section className="mt-5 grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="card relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative flex items-center justify-between gap-6">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Score final
              </p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-bold leading-none tracking-tighter sm:text-6xl">
                  {formatScore(attempt.score)}
                </span>
                <span className="pb-1.5 text-sm font-medium text-muted">
                  / {exam.totalQuestions}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="badge badge-accent">
                  <TrophyIcon size={11} />
                  Note {formatScore(attempt.note)} / 20
                </span>
                <span className="badge">
                  {Math.round(attempt.percentage)} % de réussite
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-muted">
                <ClockIcon size={13} />
                Temps mis : {formatDuration(attempt.timeSpentSeconds)}
              </p>
            </div>

            <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="var(--accent-color)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-[stroke-dashoffset] duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight">
                  {Math.round(ringPercent)}%
                </span>
                <span className="text-[0.55rem] font-semibold uppercase tracking-wide text-muted">
                  Réussite
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ResultStat
            label="Correctes"
            value={attempt.correctCount}
            total={total}
            icon={<CheckCircleIcon size={16} />}
            tone="success"
          />
          <ResultStat
            label="Incorrectes"
            value={attempt.incorrectCount}
            total={total}
            icon={<XCircleIcon size={16} />}
            tone="danger"
          />
          <ResultStat
            label="Non répondues"
            value={attempt.unansweredCount}
            total={total}
            icon={<CircleGlyph />}
            tone="neutral"
          />
          <ResultStat
            label="Marquées"
            value={attempt.flagged.length}
            total={total}
            icon={<FlagIcon size={15} />}
            tone="warning"
          />
        </div>
      </section>

      <section className="card mt-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-muted">
              Découpage par partie
            </p>
            <h2 className="mt-1 text-base font-bold tracking-tight">
              Points forts et points à consolider
            </h2>
          </div>
          <span className="text-[0.68rem] text-muted">
            {partStats.length} parties · {total} questions
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {partStats.map((part) => {
            const percent = Math.round((part.correct / part.total) * 100);
            const partNumber =
              part.partTitle.match(/PARTIE\s+(\d+)/i)?.[1] ?? "—";
            const title = part.partTitle.replace(
              /^PARTIE\s+\d+\s*:\s*/i,
              "",
            );
            return (
              <div
                key={part.partTitle}
                className="rounded-xl border border-border bg-surface-raised p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="badge px-2 py-0.5 text-[0.58rem]">
                    Partie {partNumber}
                  </span>
                  <span className="font-mono text-[0.68rem] font-semibold">
                    {percent} %
                  </span>
                </div>
                <p className="mt-2 truncate text-[0.78rem] font-semibold">
                  {title}
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-[0.65rem] text-muted">
                  {part.correct}/{part.total} correctes · {part.answered}{" "}
                  répondues
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="correction-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-accent">
              Correction complète
            </p>
            <h2
              id="correction-title"
              className="mt-1 text-xl font-bold tracking-tight"
            >
              Revue détaillée des 80 questions
            </h2>
            <p className="mt-1 text-[0.75rem] text-muted">
              Filtrez les questions pour cibler vos erreurs et vos points faibles.
            </p>
          </div>
          {retryCount > 0 ? (
            <Link
              href={`/exam/${exam.id}/retry/${attempt.id}`}
              className="btn btn-secondary text-[0.75rem]"
            >
              <PlayIcon size={13} />
              Rejouer les {retryCount} questions à revoir
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              aria-pressed={filter === item.key}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.68rem] font-semibold transition",
                filter === item.key
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border bg-surface-raised text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 font-mono text-[0.58rem]",
                  filter === item.key
                    ? "bg-background/60 text-accent"
                    : "bg-surface-2 text-muted",
                )}
              >
                {counts[item.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                {filter === "wrong" ? (
                  <CheckCircleIcon size={22} className="text-success" />
                ) : filter === "flagged" ? (
                  <FlagIcon size={20} />
                ) : (
                  <LightbulbIcon size={21} />
                )}
              </span>
              <h3 className="mt-3 text-sm font-bold">
                {filter === "wrong"
                  ? "Aucune erreur à afficher"
                  : filter === "flagged"
                    ? "Aucune question marquée"
                    : "Aucune question dans ce filtre"}
              </h3>
              <p className="mt-1 max-w-sm text-[0.75rem] leading-relaxed text-muted">
                {filter === "wrong"
                  ? "Toutes vos réponses sont correctes. Continuez sur cette lancée !"
                  : "Changez de filtre pour retrouver les questions correspondantes."}
              </p>
            </div>
          ) : (
            filtered.map((question) => (
              <ReviewQuestion
                key={question.id}
                question={question}
                answer={attempt.answers[question.id]}
                flagged={attempt.flagged.includes(question.id)}
              />
            ))
          )}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-2 border-t border-border pt-6">
        <Link href="/history" className="btn btn-secondary">
          <HistoryIcon size={15} />
          Voir tout l&apos;historique
        </Link>
        <Link href={`/exam/${exam.id}`} className="btn btn-primary">
          <TargetIcon size={15} />
          Recommencer cet examen
        </Link>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  total,
  icon,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  icon: ReactNode;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
  const toneClasses = {
    success: "border-success-border bg-success-soft text-success",
    danger: "border-danger-border bg-danger-soft text-danger",
    warning: "border-warning-border bg-warning-soft text-warning",
    neutral: "border-border bg-surface-2 text-muted",
  } as const;

  return (
    <div className="card flex flex-col justify-between p-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border",
            toneClasses[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="pb-0.5 text-[0.65rem] text-muted">/ {total}</span>
      </div>
    </div>
  );
}

function CircleGlyph() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
