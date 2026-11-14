"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { exams, mockExams, officialExams } from "@/data/exams";
import { getExamMeta } from "@/lib/exam-meta";
import { loadAttempts, loadSessions } from "@/lib/storage";
import type { Attempt, ExamSession } from "@/types/quiz";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  GraduationCapIcon,
  HistoryIcon,
  LayersIcon,
  PercentIcon,
  PlayIcon,
  SparklesIcon,
  TargetIcon,
  TimerIcon,
  TrophyIcon,
  ZapIcon,
} from "@/components/Icons";
import { ExamCard } from "./ExamCard";
import { StatCard } from "./StatCard";
import { formatDuration, formatScore, formatTimer } from "@/lib/utils";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function partDistribution(sessionExam: (typeof exams)[number]) {
  const counts = new Map<string, number>();
  for (const question of sessionExam.questions) {
    counts.set(question.partTitle, (counts.get(question.partTitle) ?? 0) + 1);
  }
  return [...counts.entries()].map(([title, count]) => ({
    title: title.replace(/^PARTIE\s+\d+\s*:\s*/i, ""),
    count,
  }));
}

export function Dashboard() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [sessions, setSessions] = useState<Record<string, ExamSession>>({});

  useEffect(() => {
    setAttempts(loadAttempts());
    setSessions(loadSessions());
  }, []);

  const ready = attempts !== null;
  const allAttempts = useMemo(() => attempts ?? [], [attempts]);

  const stats = useMemo(() => {
    const scores = allAttempts.map((attempt) => attempt.score);
    const bestScore =
      scores.length > 0 ? Math.max(...scores) : undefined;
    const averageScore = average(scores);
    const totalSeconds = allAttempts.reduce(
      (total, attempt) => total + attempt.timeSpentSeconds,
      0,
    );
    return {
      count: allAttempts.length,
      bestScore,
      averageScore,
      totalSeconds,
    };
  }, [allAttempts]);

  const activeSessions = useMemo(
    () =>
      Object.values(sessions)
        .filter((session) => session.remainingSeconds > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt),
    [sessions],
  );

  const latestSession = activeSessions[0];
  const latestExam = latestSession
    ? exams.find((exam) => exam.id === latestSession.examId)
    : undefined;
  const heroExam = officialExams[0];
  const distribution = partDistribution(heroExam);
  const totalForDistribution = distribution.reduce(
    (total, part) => total + part.count,
    0,
  );

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="surface-grid pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent-soft blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.35fr_1fr] lg:px-8 lg:py-20">
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge badge-accent">
                <SparklesIcon size={12} />
                Concours CRMEF · Spécialité Informatique
              </span>
              <span className="badge">6 examens · 480 questions</span>
            </div>
            <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-[3.3rem]">
              Révisez l&apos;épreuve.
              <br />
              <span className="text-muted">Maîtrisez chaque question.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Trois examens officiels du ministère et trois examens blancs,
              convertis intégralement. Entraînez-vous en conditions réelles,
              corrigez au fur et à mesure et suivez votre progression — sans
              compte, sans serveur.
            </p>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              {latestSession && latestExam ? (
                <Link
                  href={`/exam/${latestSession.examId}`}
                  className="btn btn-primary h-11 px-5"
                >
                  <PlayIcon size={15} />
                  Reprendre — question {latestSession.currentIndex + 1}
                  <ArrowRightIcon size={15} />
                </Link>
              ) : (
                <Link
                  href={`/exam/${heroExam.id}`}
                  className="btn btn-primary h-11 px-5"
                >
                  <PlayIcon size={15} />
                  Commencer une simulation
                  <ArrowRightIcon size={15} />
                </Link>
              )}
              <Link
                href="/history"
                className="btn btn-secondary h-11 px-5"
              >
                <HistoryIcon size={15} />
                Mon historique
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[0.72rem] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleIcon size={13} className="text-success" />
                Correction détaillée
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleIcon size={13} className="text-success" />
                Sauvegarde automatique
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircleIcon size={13} className="text-success" />
                100 % dans votre navigateur
              </span>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:80ms]">
            <div className="card-raised relative overflow-hidden p-5 shadow-lg sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    Aperçu de l&apos;épreuve
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-5xl font-bold leading-none tracking-tighter">
                      80
                    </span>
                    <span className="pb-1 text-xs font-medium text-muted">
                      questions QCM
                    </span>
                  </div>
                </div>
                <span className="badge badge-accent">Officiel</span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-surface-2 p-2.5">
                  <ClockIcon size={14} className="text-muted" />
                  <div className="mt-2 text-sm font-bold">240 min</div>
                  <div className="text-[0.6rem] text-muted">Chronomètre</div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-2.5">
                  <TargetIcon size={14} className="text-muted" />
                  <div className="mt-2 text-sm font-bold">20</div>
                  <div className="text-[0.6rem] text-muted">Coefficient</div>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-2.5">
                  <PercentIcon size={14} className="text-muted" />
                  <div className="mt-2 text-sm font-bold">−0,25</div>
                  <div className="text-[0.6rem] text-muted">Par erreur</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-[0.62rem] font-medium text-muted">
                  <span>Répartition des parties</span>
                  <span>{totalForDistribution} questions</span>
                </div>
                <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-surface-2">
                  {distribution.map((part, index) => (
                    <div
                      key={part.title}
                      className="h-full border-r border-background/60 last:border-0"
                      style={{
                        width: `${(part.count / totalForDistribution) * 100}%`,
                        backgroundColor: "var(--accent-color)",
                        opacity: 1 - index * 0.24,
                      }}
                      title={`${part.title} — ${part.count} questions`}
                    />
                  ))}
                </div>
                <div className="mt-3 grid gap-2">
                  {distribution.map((part, index) => (
                    <div
                      key={part.title}
                      className="flex items-center justify-between gap-3 text-[0.7rem]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: "var(--accent-color)",
                            opacity: 1 - index * 0.24,
                          }}
                        />
                        <span className="truncate text-muted">{part.title}</span>
                      </span>
                      <span className="font-mono text-[0.65rem] text-muted">
                        {part.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-[0.67rem] text-muted">
                <ZapIcon size={13} className="shrink-0 text-accent" />
                <span>
                  Mode <strong className="text-foreground">Simulation</strong> ou{" "}
                  <strong className="text-foreground">Révision</strong> au choix.
                </span>
              </div>
            </div>
            <div className="absolute -bottom-3 -left-3 hidden h-16 w-16 rounded-2xl border border-border bg-surface-raised p-2 shadow-md sm:flex sm:items-center sm:justify-center">
              <GraduationCapIcon size={26} className="text-accent" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <section aria-labelledby="stats-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                Vue d&apos;ensemble
              </p>
              <h2
                id="stats-title"
                className="mt-1 text-lg font-bold tracking-tight"
              >
                Votre progression
              </h2>
            </div>
            <span className="hidden text-[0.7rem] text-muted sm:block">
              Données enregistrées localement
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Examens passés"
              value={ready ? stats.count : "—"}
              hint={
                ready
                  ? `${stats.count > 1 ? "tentatives enregistrées" : "tentative enregistrée"}`
                  : "Chargement local…"
              }
              icon={<BookOpenIcon size={17} />}
            />
            <StatCard
              label="Meilleur score"
              value={
                ready ? (
                  stats.bestScore !== undefined ? (
                    <>
                      {formatScore(stats.bestScore)}
                      <span className="ml-1 text-xs font-medium text-muted">
                        /80
                      </span>
                    </>
                  ) : (
                    "—"
                  )
                ) : (
                  "—"
                )
              }
              hint={
                ready && stats.bestScore !== undefined
                  ? `Note ${formatScore(stats.bestScore / 4)} / 20`
                  : "Votre record personnel"
              }
              icon={<TrophyIcon size={17} />}
              accent
            />
            <StatCard
              label="Score moyen"
              value={
                ready && stats.count > 0 ? (
                  <>
                    {formatScore(stats.averageScore)}
                    <span className="ml-1 text-xs font-medium text-muted">
                      /80
                    </span>
                  </>
                ) : (
                  "—"
                )
              }
              hint={
                ready && stats.count > 0
                  ? `${Math.round((stats.averageScore / 80) * 100)} % de réussite en moyenne`
                  : "Sur l'ensemble des tentatives"
              }
              icon={<TargetIcon size={17} />}
            />
            <StatCard
              label="Temps d'entraînement"
              value={
                ready && stats.totalSeconds > 0
                  ? formatDuration(stats.totalSeconds)
                  : "—"
              }
              hint={
                ready && stats.count > 0
                  ? `Cumulé sur ${stats.count} ${stats.count > 1 ? "sessions" : "session"}`
                  : "Chronomètre et pauses inclus"
              }
              icon={<TimerIcon size={17} />}
            />
          </div>
        </section>

        {ready && activeSessions.length > 0 ? (
          <section className="mt-10" aria-labelledby="resume-title">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">
                  En cours
                </p>
                <h2
                  id="resume-title"
                  className="mt-1 text-xl font-bold tracking-tight"
                >
                  Reprendre là où vous vous êtes arrêté
                </h2>
              </div>
              <span className="badge badge-accent">
                {activeSessions.length} session
                {activeSessions.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {activeSessions.map((session) => {
                const exam = exams.find((item) => item.id === session.examId);
                if (!exam) return null;
                const meta = getExamMeta(exam);
                const answered = Object.keys(session.answers).length;
                const progress = Math.round(
                  (answered / exam.totalQuestions) * 100,
                );
                return (
                  <Link
                    key={session.examId}
                    href={`/exam/${exam.id}`}
                    className="card group flex min-w-0 items-center gap-4 p-4 transition hover:border-border-strong hover:shadow-md"
                  >
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                      <span className="text-sm font-bold">{progress}%</span>
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background bg-accent text-[0.5rem] font-bold text-accent-contrast">
                        <PlayIcon size={7} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {exam.title}
                        </p>
                        <span className="badge px-1.5 py-0.5 text-[0.55rem]">
                          {session.mode === "simulation"
                            ? "Simulation"
                            : "Révision"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[0.7rem] text-muted">
                        {meta.session} · Question {session.currentIndex + 1}/80 ·{" "}
                        {answered} répondue{answered > 1 ? "s" : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[0.62rem] text-muted">
                          {formatTimer(session.remainingSeconds)}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRightIcon
                      size={16}
                      className="shrink-0 text-muted transition group-hover:text-accent"
                    />
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section id="examens" className="mt-12 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.65rem] font-semibold text-accent">
                  01
                </span>
                <span className="h-px w-8 bg-border" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Épreuves officielles
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Examens Officiels du Ministère
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-muted">
                Les sujets des sessions 2025, 2024 et 2023, avec corrigés
                détaillés et pièges à éviter.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge">
                <LayersIcon size={12} /> 3 examens
              </span>
              <span className="badge">240 questions</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {officialExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                attempts={allAttempts.filter(
                  (attempt) => attempt.examId === exam.id,
                )}
                session={sessions[exam.id]}
                ready={ready}
              />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.65rem] font-semibold text-accent">
                  02
                </span>
                <span className="h-px w-8 bg-border" />
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Simulations
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Examens Blancs
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-muted">
                Trois sujets complets de simulation, conçus pour couvrir tous
                les domaines du concours.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge">
                <LayersIcon size={12} /> 3 examens
              </span>
              <span className="badge">240 questions</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mockExams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                attempts={allAttempts.filter(
                  (attempt) => attempt.examId === exam.id,
                )}
                session={sessions[exam.id]}
                ready={ready}
              />
            ))}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <ZapIcon size={20} />
              </span>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Continuez sur votre lancée
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                  Chaque tentative est conservée dans votre navigateur. Rejouez
                  uniquement vos erreurs, comparez vos scores et identifiez les
                  parties à consolider.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link href="/history" className="btn btn-secondary">
                <HistoryIcon size={15} />
                Voir l&apos;historique
              </Link>
              <Link href="#examens" className="btn btn-primary">
                Choisir un examen
                <ArrowRightIcon size={15} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
