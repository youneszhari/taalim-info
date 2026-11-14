"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { exams } from "@/data/exams";
import { getExamMeta } from "@/lib/exam-meta";
import { deleteAttempt, importAttempts, loadAttempts } from "@/lib/storage";
import type { Attempt, HistoryExport, QuizMode } from "@/types/quiz";
import {
  cn,
  formatDate,
  formatDuration,
  formatScore,
} from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { ScoreChart } from "./ScoreChart";
import { StatCard } from "./StatCard";
import {
  ArrowLeftIcon,
  BarChartIcon,
  CheckCircleIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  HistoryIcon,
  PlayIcon,
  RotateIcon,
  TargetIcon,
  TimerIcon,
  TrashIcon,
  TrophyIcon,
  UploadIcon,
  XIcon,
} from "./Icons";

type Notice = {
  tone: "success" | "danger" | "neutral";
  message: string;
};

type ModeFilter = "all" | QuizMode;

function retryCount(attempt: Attempt): number {
  return attempt.incorrectCount + attempt.unansweredCount;
}

function sortRecent(attempts: Attempt[]): Attempt[] {
  return [...attempts].sort((a, b) => b.submittedAt - a.submittedAt);
}

export function HistoryView() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [examFilter, setExamFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<Attempt | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAttempts(sortRecent(loadAttempts()));
  }, []);

  const allAttempts = useMemo(() => attempts ?? [], [attempts]);

  const filtered = useMemo(
    () =>
      sortRecent(
        allAttempts.filter((attempt) => {
          const matchesExam =
            examFilter === "all" || attempt.examId === examFilter;
          const matchesMode =
            modeFilter === "all" || attempt.mode === modeFilter;
          return matchesExam && matchesMode;
        }),
      ),
    [allAttempts, examFilter, modeFilter],
  );

  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return {
        count: 0,
        best: undefined as Attempt | undefined,
        averageScore: 0,
        averageNote: 0,
        totalSeconds: 0,
      };
    }
    const best = filtered.reduce((current, attempt) =>
      attempt.score > current.score ? attempt : current,
    );
    const totalScore = filtered.reduce(
      (total, attempt) => total + attempt.score,
      0,
    );
    const totalNote = filtered.reduce(
      (total, attempt) => total + attempt.note,
      0,
    );
    const totalSeconds = filtered.reduce(
      (total, attempt) => total + attempt.timeSpentSeconds,
      0,
    );
    return {
      count: filtered.length,
      best,
      averageScore: totalScore / filtered.length,
      averageNote: totalNote / filtered.length,
      totalSeconds,
    };
  }, [filtered]);

  const isFiltered = examFilter !== "all" || modeFilter !== "all";

  function resetFilters() {
    setExamFilter("all");
    setModeFilter("all");
  }

  function exportHistory() {
    if (allAttempts.length === 0) return;
    const payload: HistoryExport = {
      app: "taalim-quiz",
      version: 1,
      exportedAt: Date.now(),
      attempts: sortRecent(allAttempts),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `taalim-historique-${date}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setNotice({
      tone: "success",
      message: `${allAttempts.length} tentative${allAttempts.length > 1 ? "s" : ""} exportée${allAttempts.length > 1 ? "s" : ""} au format JSON.`,
    });
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      if (file.size > 8 * 1024 * 1024) {
        setNotice({
          tone: "danger",
          message: "Fichier trop volumineux (8 Mo maximum).",
        });
        return;
      }
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const result = importAttempts(parsed, allAttempts);

      if (result.imported === 0 && result.skipped === 0) {
        setNotice({
          tone: "danger",
          message:
            "Aucune tentative valide trouvée. Vérifiez qu'il s'agit bien d'un export Taalim.",
        });
        return;
      }

      setAttempts(sortRecent(result.attempts));
      setNotice({
        tone: result.imported > 0 ? "success" : "neutral",
        message:
          result.imported > 0
            ? `${result.imported} tentative${result.imported > 1 ? "s" : ""} importée${result.imported > 1 ? "s" : ""}${result.skipped > 0 ? ` (${result.skipped} doublon${result.skipped > 1 ? "s" : ""} ou entrée${result.skipped > 1 ? "s" : ""} invalide${result.skipped > 1 ? "s" : ""} ignoré${result.skipped > 1 ? "s" : ""})` : ""}.`
            : "Toutes les tentatives de ce fichier sont déjà présentes dans votre historique.",
      });
    } catch {
      setNotice({
        tone: "danger",
        message:
          "Impossible de lire ce fichier JSON. Vérifiez qu'il s'agit d'un export valide.",
      });
    }
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const updated = deleteAttempt(pendingDelete.id);
    setAttempts(sortRecent(updated));
    setPendingDelete(null);
    setNotice({
      tone: "neutral",
      message: "Tentative supprimée de l'historique local.",
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        Tableau de bord
      </Link>

      <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge badge-accent">
              <HistoryIcon size={12} /> Historique local
            </span>
            <span className="badge">100 % dans ce navigateur</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Historique &amp; progression
          </h1>
          <p className="mt-1.5 max-w-2xl text-[0.8rem] leading-relaxed text-muted">
            Retrouvez toutes vos tentatives, comparez vos scores et rejouez
            uniquement les questions qui vous ont posé problème.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary"
          >
            <UploadIcon size={15} />
            Importer
          </button>
          <button
            type="button"
            onClick={exportHistory}
            disabled={!attempts || allAttempts.length === 0}
            className="btn btn-primary"
          >
            <DownloadIcon size={15} />
            Exporter
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
            aria-label="Importer un historique JSON"
          />
        </div>
      </header>

      {notice ? (
        <div
          role="status"
          className={cn(
            "mt-5 flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-[0.78rem]",
            notice.tone === "success"
              ? "border-success-border bg-success-soft text-success"
              : notice.tone === "danger"
                ? "border-danger-border bg-danger-soft text-danger"
                : "border-border bg-surface-2 text-muted",
          )}
        >
          <div className="flex items-start gap-2">
            {notice.tone === "success" ? (
              <CheckCircleIcon size={16} className="mt-0.5 shrink-0" />
            ) : notice.tone === "danger" ? (
              <XIcon size={16} className="mt-0.5 shrink-0" />
            ) : (
              <HistoryIcon size={16} className="mt-0.5 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 rounded-md p-0.5 opacity-70 transition hover:opacity-100"
            aria-label="Masquer le message"
          >
            <XIcon size={14} />
          </button>
        </div>
      ) : null}

      {attempts === null ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-28 rounded-2xl" />
          ))}
          <div className="skeleton h-72 rounded-2xl sm:col-span-2 lg:col-span-4" />
        </div>
      ) : allAttempts.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <HistoryIcon size={25} />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight">
            Aucune tentative enregistrée
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Passez un premier examen pour voir apparaître ici votre score, votre
            temps de travail et l&apos;évolution de votre progression.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/#examens" className="btn btn-primary">
              <PlayIcon size={14} />
              Choisir un examen
            </Link>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
            >
              <UploadIcon size={14} />
              Importer un historique
            </button>
          </div>
          <p className="mt-5 max-w-md text-[0.68rem] leading-relaxed text-muted-2">
            Astuce : un export JSON peut être réimporté sur un autre navigateur
            pour retrouver vos tentatives.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={isFiltered ? "Tentatives filtrées" : "Tentatives"}
              value={stats.count}
              hint={`${allAttempts.length} au total dans l'historique`}
              icon={<BarChartIcon size={17} />}
            />
            <StatCard
              label="Meilleur score"
              value={
                stats.best ? (
                  <>
                    {formatScore(stats.best.score)}
                    <span className="ml-1 text-xs font-medium text-muted">
                      /80
                    </span>
                  </>
                ) : (
                  "—"
                )
              }
              hint={
                stats.best
                  ? `Note ${formatScore(stats.best.note)} / 20`
                  : "Aucune tentative"
              }
              icon={<TrophyIcon size={17} />}
              accent
            />
            <StatCard
              label="Score moyen"
              value={
                stats.count > 0 ? (
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
                stats.count > 0
                  ? `Note moyenne ${formatScore(stats.averageNote)} / 20`
                  : "—"
              }
              icon={<TargetIcon size={17} />}
            />
            <StatCard
              label="Temps cumulé"
              value={
                stats.totalSeconds > 0
                  ? formatDuration(stats.totalSeconds)
                  : "—"
              }
              hint={
                stats.count > 0
                  ? `Sur ${stats.count} tentative${stats.count > 1 ? "s" : ""}`
                  : "Chronomètre et pauses inclus"
              }
              icon={<TimerIcon size={17} />}
            />
          </section>

          <section className="card mt-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-muted">
                  Courbe d&apos;évolution
                </p>
                <h2 className="mt-1 text-base font-bold tracking-tight">
                  Vos scores, tentative après tentative
                </h2>
              </div>
              <span className="badge">
                <BarChartIcon size={11} />
                {filtered.length} point{filtered.length > 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-4">
              <ScoreChart attempts={filtered} />
            </div>
            <p className="mt-2 text-[0.66rem] text-muted">
              Chaque point correspond à une tentative. Survolez un point pour
              afficher sa date et son score.
            </p>
          </section>

          <section className="mt-8" aria-labelledby="attempts-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.13em] text-accent">
                  Toutes les tentatives
                </p>
                <h2
                  id="attempts-title"
                  className="mt-1 text-xl font-bold tracking-tight"
                >
                  {filtered.length} tentative{filtered.length > 1 ? "s" : ""}
                  {isFiltered ? " correspondante" : ""}
                  {isFiltered && filtered.length > 1 ? "s" : ""}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="exam-filter">
                  Filtrer par examen
                </label>
                <select
                  id="exam-filter"
                  value={examFilter}
                  onChange={(event) => setExamFilter(event.target.value)}
                  className="input h-9 w-auto min-w-40 py-0 text-[0.75rem]"
                >
                  <option value="all">Tous les examens</option>
                  <optgroup label="Examens officiels">
                    {exams
                      .filter((exam) => exam.category === "officiel")
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Examens blancs">
                    {exams
                      .filter((exam) => exam.category === "blanc")
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.title}
                        </option>
                      ))}
                  </optgroup>
                </select>

                <label className="sr-only" htmlFor="mode-filter">
                  Filtrer par mode
                </label>
                <select
                  id="mode-filter"
                  value={modeFilter}
                  onChange={(event) =>
                    setModeFilter(event.target.value as ModeFilter)
                  }
                  className="input h-9 w-auto py-0 text-[0.75rem]"
                >
                  <option value="all">Tous les modes</option>
                  <option value="simulation">Simulation</option>
                  <option value="revision">Révision</option>
                </select>

                {isFiltered ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-ghost h-9 px-2.5 text-[0.72rem]"
                  >
                    <RotateIcon size={13} />
                    Réinitialiser
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="card flex flex-col items-center px-6 py-12 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                    <HistoryIcon size={22} />
                  </span>
                  <h3 className="mt-3 text-sm font-bold">
                    Aucune tentative ne correspond à ces filtres
                  </h3>
                  <p className="mt-1 max-w-sm text-[0.75rem] leading-relaxed text-muted">
                    Changez d&apos;examen ou de mode pour retrouver vos autres
                    tentatives.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="btn btn-secondary mt-4"
                  >
                    <RotateIcon size={14} />
                    Voir toutes les tentatives
                  </button>
                </div>
              ) : (
                filtered.map((attempt) => (
                  <AttemptRow
                    key={attempt.id}
                    attempt={attempt}
                    onDelete={() => setPendingDelete(attempt)}
                  />
                ))
              )}
            </div>
          </section>

          <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <HistoryIcon size={17} />
              </span>
              <p className="max-w-xl text-[0.72rem] leading-relaxed text-muted">
                Vos tentatives sont stockées uniquement dans ce navigateur.
                Pensez à exporter régulièrement votre historique avant de
                vider les données du site.
              </p>
            </div>
            <button
              type="button"
              onClick={exportHistory}
              className="btn btn-secondary shrink-0"
            >
              <DownloadIcon size={14} />
              Sauvegarder l&apos;historique
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer cette tentative ?"
        description={
          pendingDelete ? (
            <div className="space-y-1.5">
              <p>
                <strong className="text-foreground">
                  {pendingDelete.examTitle}
                </strong>{" "}
                · {formatDate(pendingDelete.submittedAt)}
              </p>
              <p>
                Score {formatScore(pendingDelete.score)}/80 — note{" "}
                {formatScore(pendingDelete.note)}/20.
              </p>
              <p>Cette action est définitive et ne peut pas être annulée.</p>
            </div>
          ) : null
        }
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function AttemptRow({
  attempt,
  onDelete,
}: {
  attempt: Attempt;
  onDelete: () => void;
}) {
  const exam = exams.find((item) => item.id === attempt.examId);
  const meta = exam ? getExamMeta(exam) : undefined;
  const errors = retryCount(attempt);
  const answered = (exam?.totalQuestions ?? 80) - attempt.unansweredCount;
  const total = exam?.totalQuestions ?? 80;

  return (
    <article className="card p-4 transition hover:border-border-strong sm:p-4.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                attempt.examCategory === "officiel"
                  ? "badge badge-accent"
                  : "badge"
              }
            >
              {attempt.examCategory === "officiel" ? "Officiel" : "Blanc"}
            </span>
            <h3 className="truncate text-[0.92rem] font-bold tracking-tight">
              {attempt.examTitle}
            </h3>
            <span className="badge">
              {attempt.mode === "simulation" ? "Simulation" : "Révision"}
            </span>
            {attempt.negativeMarking ? (
              <span className="badge">−0,25 / erreur</span>
            ) : (
              <span className="badge">Sans pénalité</span>
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] text-muted">
            <span>{formatDate(attempt.submittedAt)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon size={11} />
              {formatDuration(attempt.timeSpentSeconds)}
            </span>
            {meta ? (
              <>
                <span aria-hidden="true">·</span>
                <span>{meta.session}</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:justify-end">
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1 sm:justify-end">
              <span className="text-2xl font-bold leading-none tracking-tight">
                {formatScore(attempt.score)}
              </span>
              <span className="text-[0.68rem] font-medium text-muted">
                /{total}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[0.66rem] text-muted sm:justify-end">
              <span className="badge badge-accent px-1.5 py-0.5 text-[0.56rem]">
                Note {formatScore(attempt.note)}/20
              </span>
              <span>{Math.round(attempt.percentage)} %</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-success-border bg-success-soft px-2.5 py-2">
          <div className="text-[0.9rem] font-bold text-success">
            {attempt.correctCount}
          </div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Correctes
          </div>
        </div>
        <div className="rounded-lg border border-danger-border bg-danger-soft px-2.5 py-2">
          <div className="text-[0.9rem] font-bold text-danger">
            {attempt.incorrectCount}
          </div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Incorrectes
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 px-2.5 py-2">
          <div className="text-[0.9rem] font-bold">
            {attempt.unansweredCount}
          </div>
          <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
            Sans réponse
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.66rem] text-muted">
          {answered}/{total} répondues
          {attempt.flagged.length > 0
            ? ` · ${attempt.flagged.length} marquée${attempt.flagged.length > 1 ? "s" : ""}`
            : ""}
          {errors > 0
            ? ` · ${errors} question${errors > 1 ? "s" : ""} à revoir`
            : " · sans erreur"}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/exam/${attempt.examId}/result/${attempt.id}`}
            className="btn btn-secondary h-8 px-2.5 text-[0.7rem]"
          >
            <EyeIcon size={13} />
            Correction
          </Link>
          {errors > 0 ? (
            <Link
              href={`/exam/${attempt.examId}/retry/${attempt.id}`}
              className="btn btn-secondary h-8 px-2.5 text-[0.7rem]"
            >
              <PlayIcon size={12} />
              Rejouer les erreurs
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="btn btn-ghost h-8 w-8 p-0 text-muted hover:text-danger"
            aria-label={`Supprimer la tentative du ${formatDate(attempt.submittedAt)}`}
            title="Supprimer cette tentative"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
