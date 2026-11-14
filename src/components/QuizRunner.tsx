"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ChoiceKey, Exam, ExamQuestion } from "@/types/exam";
import type { ExamSession, QuizMode } from "@/types/quiz";
import { getExamMeta } from "@/lib/exam-meta";
import { buildAttempt } from "@/lib/scoring";
import {
  addAttempt,
  deleteSession,
  getSession,
  saveSession,
} from "@/lib/storage";
import { clamp, cn, formatTimer } from "@/lib/utils";
import { AnswerChoice } from "./AnswerChoice";
import { ConfirmDialog } from "./ConfirmDialog";
import { QuestionContent } from "./QuestionContent";
import { QuestionPalette } from "./QuestionPalette";
import { RichText } from "./RichText";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  EyeIcon,
  FlagIcon,
  LightbulbIcon,
  PauseIcon,
  PlayIcon,
  RotateIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XCircleIcon,
} from "./Icons";

type DialogKind = "none" | "submit" | "restart" | "replace";

interface QuizRunnerProps {
  exam: Exam;
}

export function QuizRunner({ exam }: QuizRunnerProps) {
  const router = useRouter();
  const meta = getExamMeta(exam);
  const [loading, setLoading] = useState(true);
  const [storedSession, setStoredSession] = useState<ExamSession | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<QuizMode>("simulation");
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [dialog, setDialog] = useState<DialogKind>("none");

  const finishingRef = useRef(false);
  const lastTickRef = useRef(0);
  const sessionRef = useRef<ExamSession | null>(null);
  const questionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = getSession(exam.id);
    setStoredSession(saved ?? null);
    setLoading(false);
  }, [exam.id]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const closeDialog = useCallback(() => setDialog("none"), []);

  const createSession = useCallback(
    (nextMode: QuizMode, nextNegativeMarking: boolean) => {
      const now = Date.now();
      const durationSeconds = exam.durationMinutes * 60;
      const fresh: ExamSession = {
        examId: exam.id,
        mode: nextMode,
        negativeMarking: nextNegativeMarking,
        answers: {},
        flagged: [],
        checked: {},
        currentIndex: 0,
        remainingSeconds: durationSeconds,
        durationSeconds,
        startedAt: now,
        updatedAt: now,
        isPaused: false,
      };
      finishingRef.current = false;
      deleteSession(exam.id);
      saveSession(fresh);
      sessionRef.current = fresh;
      setSession(fresh);
      setStoredSession(null);
      setActive(true);
      setDialog("none");
    },
    [exam.durationMinutes, exam.id],
  );

  const resumeSession = useCallback(() => {
    if (!storedSession) return;
    const now = Date.now();
    const adjusted: ExamSession = { ...storedSession };
    if (!adjusted.isPaused) {
      const elapsed = Math.max(
        0,
        Math.floor((now - adjusted.updatedAt) / 1000),
      );
      adjusted.remainingSeconds = Math.max(
        0,
        adjusted.remainingSeconds - elapsed,
      );
    }
    adjusted.currentIndex = clamp(
      adjusted.currentIndex,
      0,
      exam.totalQuestions - 1,
    );
    adjusted.updatedAt = now;
    finishingRef.current = false;
    saveSession(adjusted);
    sessionRef.current = adjusted;
    setSession(adjusted);
    setStoredSession(null);
    setActive(true);
  }, [exam.totalQuestions, storedSession]);

  const updateSession = useCallback(
    (updater: (previous: ExamSession) => ExamSession) => {
      setSession((previous) => {
        if (!previous) return previous;
        return { ...updater(previous), updatedAt: Date.now() };
      });
    },
    [],
  );

  const currentQuestion: ExamQuestion | undefined = session
    ? exam.questions[session.currentIndex]
    : undefined;

  const selectAnswer = useCallback(
    (key: ChoiceKey) => {
      const question = sessionRef.current
        ? exam.questions[sessionRef.current.currentIndex]
        : undefined;
      if (!question) return;
      updateSession((previous) => {
        const answers = { ...previous.answers, [question.id]: key };
        const checked = { ...previous.checked };
        delete checked[question.id];
        return { ...previous, answers, checked };
      });
    },
    [exam.questions, updateSession],
  );

  const clearAnswer = useCallback(() => {
    const question = sessionRef.current
      ? exam.questions[sessionRef.current.currentIndex]
      : undefined;
    if (!question) return;
    updateSession((previous) => {
      const answers = { ...previous.answers };
      delete answers[question.id];
      const checked = { ...previous.checked };
      delete checked[question.id];
      return { ...previous, answers, checked };
    });
  }, [exam.questions, updateSession]);

  const toggleFlag = useCallback(() => {
    const question = sessionRef.current
      ? exam.questions[sessionRef.current.currentIndex]
      : undefined;
    if (!question) return;
    updateSession((previous) => {
      const flagged = previous.flagged.includes(question.id)
        ? previous.flagged.filter((id) => id !== question.id)
        : [...previous.flagged, question.id];
      return { ...previous, flagged };
    });
  }, [exam.questions, updateSession]);

  const goTo = useCallback(
    (index: number) => {
      updateSession((previous) => ({
        ...previous,
        currentIndex: clamp(index, 0, exam.totalQuestions - 1),
      }));
    },
    [exam.totalQuestions, updateSession],
  );

  const checkAnswer = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const question = exam.questions[current.currentIndex];
    if (!question || !current.answers[question.id]) return;
    updateSession((previous) => ({
      ...previous,
      checked: { ...previous.checked, [question.id]: true },
    }));
  }, [exam.questions, updateSession]);

  const togglePause = useCallback(() => {
    const now = Date.now();
    updateSession((previous) => ({
      ...previous,
      isPaused: !previous.isPaused,
      updatedAt: now,
    }));
    lastTickRef.current = now;
  }, [updateSession]);

  const finishExam = useCallback(() => {
    const current = sessionRef.current;
    if (!current || finishingRef.current) return;
    finishingRef.current = true;
    const attempt = buildAttempt(exam, current, Date.now());
    addAttempt(attempt);
    deleteSession(exam.id);
    setActive(false);
    setSession(null);
    setStoredSession(null);
    setDialog("none");
    router.push(`/exam/${exam.id}/result/${attempt.id}`);
  }, [exam, router]);

  /* ------------------------------ Minuteur ------------------------------ */

  const paused = session?.isPaused ?? true;
  const sessionExamId = session?.examId;

  useEffect(() => {
    if (!active || paused || !sessionExamId) return;
    const current = sessionRef.current;
    if (!current) return;

    const now = Date.now();
    const catchUp = Math.max(
      0,
      Math.floor((now - current.updatedAt) / 1000),
    );
    if (catchUp > 1) {
      setSession((previous) =>
        previous
          ? {
              ...previous,
              remainingSeconds: Math.max(
                0,
                previous.remainingSeconds - catchUp,
              ),
              updatedAt: now,
            }
          : previous,
      );
    }
    lastTickRef.current = now;

    const interval = window.setInterval(() => {
      const tickNow = Date.now();
      const elapsed = Math.floor((tickNow - lastTickRef.current) / 1000);
      if (elapsed < 1) return;
      lastTickRef.current += elapsed * 1000;
      setSession((previous) => {
        if (!previous || previous.isPaused) return previous;
        const remaining = Math.max(0, previous.remainingSeconds - elapsed);
        if (remaining === previous.remainingSeconds) return previous;
        return { ...previous, remainingSeconds: remaining, updatedAt: tickNow };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [active, paused, sessionExamId]);

  useEffect(() => {
    if (!active || !session || finishingRef.current) return;
    saveSession(session);
  }, [active, session]);

  const remainingSeconds = session?.remainingSeconds;

  useEffect(() => {
    if (
      active &&
      remainingSeconds !== undefined &&
      remainingSeconds <= 0 &&
      !finishingRef.current
    ) {
      finishExam();
    }
  }, [active, remainingSeconds, finishExam]);

  useEffect(() => {
    if (!active || !session) return;
    questionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    // On ne veut défiler que lorsque l'index change, pas à chaque mise à jour
    // du chrono ou des réponses.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, session?.currentIndex]);

  /* --------------------------- Raccourcis clavier ----------------------- */

  useEffect(() => {
    if (!active || !session || dialog !== "none" || session.isPaused) return;

    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      const letter = event.key.toUpperCase();
      const letterMap: Record<string, ChoiceKey> = {
        A: "A",
        B: "B",
        C: "C",
        D: "D",
        E: "E",
        "1": "A",
        "2": "B",
        "3": "C",
        "4": "D",
        "5": "E",
      };
      if (letterMap[letter]) {
        event.preventDefault();
        selectAnswer(letterMap[letter]);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo((sessionRef.current?.currentIndex ?? 0) + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo((sessionRef.current?.currentIndex ?? 0) - 1);
      } else if (letter === "F") {
        event.preventDefault();
        toggleFlag();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, dialog, goTo, selectAnswer, session, toggleFlag]);

  /* -------------------------------- Rendu ------------------------------- */

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <div className="card p-6 sm:p-8">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton mt-4 h-8 w-2/3" />
          <div className="skeleton mt-3 h-4 w-1/2" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-28 rounded-xl" />
            <div className="skeleton h-28 rounded-xl" />
          </div>
          <div className="skeleton mt-6 h-11 w-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!active || !session || !currentQuestion) {
    return (
      <QuizIntro
        exam={exam}
        meta={meta}
        storedSession={storedSession}
        mode={mode}
        negativeMarking={negativeMarking}
        onModeChange={setMode}
        onNegativeMarkingChange={setNegativeMarking}
        onResume={resumeSession}
        onRestart={() => setDialog("restart")}
        onStart={() => {
          if (storedSession) setDialog("replace");
          else createSession(mode, negativeMarking);
        }}
        dialogs={
          <>
            <ConfirmDialog
              open={dialog === "restart"}
              title="Recommencer l'examen ?"
              description="La session en cours sera supprimée. Cette action est irréversible."
              confirmLabel="Recommencer"
              tone="danger"
              onConfirm={() => {
                deleteSession(exam.id);
                setStoredSession(null);
                setDialog("none");
              }}
              onCancel={closeDialog}
            />
            <ConfirmDialog
              open={dialog === "replace"}
              title="Démarrer une nouvelle tentative ?"
              description="La session en cours sera remplacée par une nouvelle tentative configurée avec le mode choisi."
              confirmLabel="Démarrer"
              tone="danger"
              onConfirm={() => createSession(mode, negativeMarking)}
              onCancel={closeDialog}
            />
          </>
        }
      />
    );
  }

  const isRevision = session.mode === "revision";
  const answer = session.answers[currentQuestion.id];
  const checked = Boolean(session.checked[currentQuestion.id]);
  const isCorrect = answer === currentQuestion.correctAnswer;
  const isFlagged = session.flagged.includes(currentQuestion.id);
  const correctChoice = currentQuestion.choices.find(
    (choice) => choice.key === currentQuestion.correctAnswer,
  );
  const answeredCount = Object.keys(session.answers).length;
  const positionPercent =
    ((session.currentIndex + 1) / exam.totalQuestions) * 100;
  const timerTone =
    session.remainingSeconds <= 300
      ? "text-danger"
      : session.remainingSeconds <= 1800
        ? "text-warning"
        : "text-foreground";

  return (
    <div className="min-h-screen">
      <div className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/"
                className="btn btn-ghost h-8 w-8 shrink-0 p-0"
                aria-label="Retour au tableau de bord"
                title="Retour au tableau de bord"
              >
                <ArrowLeftIcon size={16} />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-[0.8rem] font-semibold">
                  {exam.title}
                </p>
                <p className="truncate text-[0.62rem] text-muted">
                  {meta.session} ·{" "}
                  {isRevision ? "Mode révision" : "Mode simulation"} ·{" "}
                  {session.negativeMarking ? "Barème négatif" : "Sans pénalité"}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-1.5",
                  session.isPaused && "opacity-60",
                )}
              >
                <ClockIcon size={14} className={timerTone} />
                <span
                  className={cn(
                    "font-mono text-[0.8rem] font-semibold tabular-nums",
                    timerTone,
                  )}
                >
                  {formatTimer(session.remainingSeconds)}
                </span>
              </div>
              <button
                type="button"
                onClick={togglePause}
                className="btn btn-secondary h-8 w-8 p-0"
                aria-label={
                  session.isPaused ? "Reprendre le chronomètre" : "Mettre en pause"
                }
                title={session.isPaused ? "Reprendre" : "Pause"}
              >
                {session.isPaused ? (
                  <PlayIcon size={14} />
                ) : (
                  <PauseIcon size={14} />
                )}
              </button>
              <button
                type="button"
                onClick={() => setDialog("submit")}
                className="btn btn-primary h-8 px-3 text-[0.72rem]"
              >
                <CheckIcon size={14} />
                <span className="hidden sm:inline">Terminer</span>
              </button>
            </div>
          </div>
          <div className="h-1 overflow-hidden bg-surface-2">
            <div
              className="h-full bg-accent transition-[width] duration-300"
              style={{ width: `${positionPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:px-8 lg:py-8">
        <div className="min-w-0">
          {session.isPaused ? (
            <div className="card animate-fade-up p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                <PauseIcon size={24} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                Session en pause
              </h1>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Le chronomètre est suspendu et votre progression est
                sauvegardée. Reprenez quand vous êtes prêt.
              </p>
              <div className="mx-auto mt-5 w-fit rounded-xl border border-border bg-surface-2 px-5 py-3 font-mono text-3xl font-semibold tabular-nums">
                {formatTimer(session.remainingSeconds)}
              </div>
              <button
                type="button"
                onClick={togglePause}
                className="btn btn-primary mt-5"
              >
                <PlayIcon size={15} />
                Reprendre la session
              </button>
            </div>
          ) : (
            <div
              ref={questionRef}
              className="card animate-fade-up scroll-mt-36 p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-accent max-w-full truncate">
                      {currentQuestion.partTitle}
                    </span>
                    <span className="text-[0.68rem] font-medium text-muted">
                      Question {currentQuestion.id} sur {exam.totalQuestions}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleFlag}
                  className={cn(
                    "btn h-8 px-2.5 text-[0.7rem]",
                    isFlagged
                      ? "border-warning-border bg-warning-soft text-warning"
                      : "btn-secondary",
                  )}
                  aria-pressed={isFlagged}
                  title={
                    isFlagged
                      ? "Retirer le marquage"
                      : "Marquer cette question pour révision"
                  }
                >
                  <FlagIcon size={13} />
                  <span className="hidden sm:inline">
                    {isFlagged ? "Marquée" : "Marquer"}
                  </span>
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{
                      width: `${((session.currentIndex + 1) / exam.totalQuestions) * 100}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[0.62rem] text-muted">
                  {answeredCount}/{exam.totalQuestions} répondues
                </span>
              </div>

              <div className="mt-5">
                <QuestionContent
                  question={currentQuestion}
                  promptClassName="text-[0.98rem] sm:text-base"
                />
              </div>

              <div
                className="mt-5 space-y-2"
                role="group"
                aria-label="Choix de réponse"
              >
                {currentQuestion.choices.map((choice) => (
                  <AnswerChoice
                    key={choice.key}
                    choice={choice}
                    selected={answer === choice.key}
                    correctAnswer={currentQuestion.correctAnswer}
                    reveal={checked}
                    onSelect={checked ? undefined : selectAnswer}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[0.65rem] text-muted">
                  Touches A–E ou 1–5 · flèches ← → · F pour marquer
                </p>
                <button
                  type="button"
                  onClick={clearAnswer}
                  disabled={!answer}
                  className="btn btn-ghost h-7 px-2 text-[0.68rem]"
                >
                  Effacer mon choix
                </button>
              </div>

              {isRevision ? (
                <div className="mt-5 border-t border-border pt-5">
                  {!checked ? (
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3.5 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-2.5">
                        <EyeIcon
                          size={16}
                          className="mt-0.5 shrink-0 text-accent"
                        />
                        <p className="text-[0.75rem] leading-relaxed text-muted">
                          Mode révision : vérifiez votre réponse pour afficher
                          immédiatement la correction et l&apos;explication.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={checkAnswer}
                        disabled={!answer}
                        className="btn btn-primary h-9 shrink-0 px-3.5 text-[0.75rem]"
                      >
                        <CheckCircleIcon size={14} />
                        Vérifier ma réponse
                      </button>
                    </div>
                  ) : answer ? (
                    <RevisionFeedback
                      question={currentQuestion}
                      answer={answer}
                      isCorrect={isCorrect}
                      correctChoiceText={correctChoice?.text}
                    />
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 p-3.5">
                  <ShieldCheckIcon
                    size={16}
                    className="mt-0.5 shrink-0 text-muted"
                  />
                  <p className="text-[0.73rem] leading-relaxed text-muted">
                    Mode simulation : les corrections restent masquées jusqu&apos;à
                    la validation finale. Vos réponses sont sauvegardées
                    automatiquement.
                  </p>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => goTo(session.currentIndex - 1)}
                  disabled={session.currentIndex === 0}
                  className="btn btn-secondary h-9"
                >
                  <ArrowLeftIcon size={14} />
                  Précédente
                </button>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[0.65rem] text-muted">
                    {currentQuestion.id}/{exam.totalQuestions}
                  </span>
                  <button
                    type="button"
                    onClick={() => goTo(session.currentIndex + 1)}
                    disabled={session.currentIndex === exam.totalQuestions - 1}
                    className="btn btn-secondary h-9"
                  >
                    Suivante
                    <ArrowRightIcon size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 lg:hidden">
            <QuestionPalette
              total={exam.totalQuestions}
              currentIndex={session.currentIndex}
              answers={session.answers}
              flagged={session.flagged}
              onSelect={goTo}
              onFinish={() => setDialog("submit")}
            />
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-36 lg:block lg:h-fit">
          <QuestionPalette
            total={exam.totalQuestions}
            currentIndex={session.currentIndex}
            answers={session.answers}
            flagged={session.flagged}
            onSelect={goTo}
            onFinish={() => setDialog("submit")}
          />
        </aside>
      </div>

      <ConfirmDialog
        open={dialog === "submit"}
        title="Terminer l'examen ?"
        description={
          <div className="space-y-2">
            <p>
              Vous avez répondu à{" "}
              <strong className="text-foreground">{answeredCount}</strong>{" "}
              question{answeredCount > 1 ? "s" : ""} sur {exam.totalQuestions}.
              {answeredCount < exam.totalQuestions
                ? ` ${exam.totalQuestions - answeredCount} question${exam.totalQuestions - answeredCount > 1 ? "s restent" : " reste"} sans réponse.`
                : " Toutes les questions ont une réponse."}
            </p>
            <p>
              {isRevision
                ? "Votre score et la correction complète seront calculés immédiatement."
                : "Les corrections seront révélées sur la page de résultats."}
            </p>
          </div>
        }
        confirmLabel="Terminer et voir le résultat"
        onConfirm={finishExam}
        onCancel={closeDialog}
      />
    </div>
  );
}

/* ----------------------------- Sous-composants -------------------------- */

interface QuizIntroProps {
  exam: Exam;
  meta: ReturnType<typeof getExamMeta>;
  storedSession: ExamSession | null;
  mode: QuizMode;
  negativeMarking: boolean;
  onModeChange: (mode: QuizMode) => void;
  onNegativeMarkingChange: (value: boolean) => void;
  onResume: () => void;
  onRestart: () => void;
  onStart: () => void;
  dialogs: ReactNode;
}

function QuizIntro({
  exam,
  meta,
  storedSession,
  mode,
  negativeMarking,
  onModeChange,
  onNegativeMarkingChange,
  onResume,
  onRestart,
  onStart,
  dialogs,
}: QuizIntroProps) {
  const answeredCount = storedSession
    ? Object.keys(storedSession.answers).length
    : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        Retour au tableau de bord
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="badge badge-accent">
          {exam.category === "officiel" ? "Examen officiel" : "Examen blanc"}
        </span>
        <span className="badge">{meta.session}</span>
        <span className="badge">{exam.totalQuestions} questions</span>
        <span className="badge">4 h</span>
        <span className="badge">Coefficient {exam.coefficient}</span>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
        {exam.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        {meta.tagline}. Choisissez votre mode de travail, puis lancez la
        session. Toutes vos réponses et le temps restant sont sauvegardés
        automatiquement dans ce navigateur.
      </p>

      {storedSession ? (
        <div className="mt-6 rounded-2xl border border-accent/25 bg-accent-soft p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/70 text-accent">
                <ClockIcon size={18} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-bold">Session en cours</h2>
                  <span className="badge badge-accent">
                    {storedSession.isPaused ? "En pause" : "Chronomètre actif"}
                  </span>
                </div>
                <p className="mt-1 text-[0.73rem] text-muted">
                  Question {storedSession.currentIndex + 1}/{exam.totalQuestions}{" "}
                  · {answeredCount} réponse{answeredCount > 1 ? "s" : ""} ·{" "}
                  {storedSession.mode === "simulation"
                    ? "Simulation"
                    : "Révision"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {formatTimer(storedSession.remainingSeconds)}
              </span>
              <span className="text-[0.62rem] text-muted">temps restant</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full rounded-full bg-accent"
                style={{
                  width: `${(answeredCount / exam.totalQuestions) * 100}%`,
                }}
              />
            </div>
            <span className="font-mono text-[0.62rem] text-muted">
              {Math.round((answeredCount / exam.totalQuestions) * 100)} %
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onResume} className="btn btn-primary">
              <PlayIcon size={14} />
              Reprendre la session
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="btn btn-secondary"
            >
              <RotateIcon size={14} />
              Recommencer à zéro
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <SparklesIcon size={15} className="text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-muted">
              Configurer la tentative
            </h2>
          </div>

          <fieldset className="mt-4">
            <legend className="text-[0.78rem] font-semibold">
              Mode de travail
            </legend>
            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <ModeOption
                active={mode === "simulation"}
                icon={<ShieldCheckIcon size={18} />}
                title="Simulation Concours"
                description="Corrections masquées jusqu'à la soumission finale. Chronomètre de 4 h."
                onClick={() => onModeChange("simulation")}
              />
              <ModeOption
                active={mode === "revision"}
                icon={<BookOpenIcon size={18} />}
                title="Révision / Entraînement"
                description="Vérification immédiate de chaque réponse, avec explication et piège."
                onClick={() => onModeChange("revision")}
              />
            </div>
          </fieldset>

          <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-border bg-surface-2 p-3.5">
            <div>
              <p className="text-[0.8rem] font-semibold">
                Barème négatif
              </p>
              <p className="mt-0.5 text-[0.68rem] leading-relaxed text-muted">
                +1 par bonne réponse, 0 si vide, −0,25 par réponse fausse.
                Désactivez pour un entraînement sans pénalité.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={negativeMarking}
              aria-label="Activer le barème négatif"
              onClick={() => onNegativeMarkingChange(!negativeMarking)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full border transition",
                negativeMarking
                  ? "border-accent bg-accent"
                  : "border-border bg-surface",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-all",
                  negativeMarking ? "left-[1.45rem]" : "left-0.5",
                )}
                style={{ height: "1.125rem", width: "1.125rem" }}
              />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.68rem] leading-relaxed text-muted">
              {storedSession
                ? "Démarrer une nouvelle tentative remplacera la session en cours."
                : "80 questions · 240 minutes · sauvegarde automatique."}
            </p>
            <button
              type="button"
              onClick={onStart}
              className="btn btn-primary h-10 shrink-0 px-5"
            >
              <PlayIcon size={14} />
              {storedSession
                ? "Démarrer une nouvelle tentative"
                : "Démarrer l'examen"}
            </button>
          </div>
        </div>

        <aside className="card h-fit p-4 sm:p-5">
          <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted">
            Règles de la session
          </h2>
          <ul className="mt-3 space-y-3 text-[0.73rem] leading-relaxed text-muted">
            <li className="flex gap-2.5">
              <ClockIcon size={15} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <strong className="text-foreground">240 minutes</strong> au
                total, avec pause et reprise. Le temps restant est enregistré.
              </span>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheckIcon
                size={15}
                className="mt-0.5 shrink-0 text-accent"
              />
              <span>
                <strong className="text-foreground">Sauvegarde</strong> après
                chaque clic et chaque seconde du chronomètre.
              </span>
            </li>
            <li className="flex gap-2.5">
              <FlagIcon size={15} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <strong className="text-foreground">Marquez</strong> une
                question d&apos;un drapeau pour y revenir avant de terminer.
              </span>
            </li>
            <li className="flex gap-2.5">
              <AlertTriangleIcon
                size={15}
                className="mt-0.5 shrink-0 text-accent"
              />
              <span>
                <strong className="text-foreground">Sans backend :</strong> vos
                données restent dans ce navigateur et peuvent être exportées.
              </span>
            </li>
          </ul>
        </aside>
      </div>

      {dialogs}
    </div>
  );
}

function ModeOption({
  active,
  icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-full flex-col rounded-xl border p-3.5 text-left transition",
        active
          ? "border-accent bg-accent-soft shadow-sm"
          : "border-border bg-surface-raised hover:border-border-strong hover:bg-surface-2",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          active ? "bg-accent text-accent-contrast" : "bg-surface-2 text-muted",
        )}
      >
        {icon}
      </span>
      <span className="mt-2.5 text-[0.82rem] font-semibold">{title}</span>
      <span className="mt-1 text-[0.68rem] leading-relaxed text-muted">
        {description}
      </span>
      <span className="mt-3 flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wide">
        <span
          className={cn(
            "flex h-3.5 w-3.5 items-center justify-center rounded-full border",
            active ? "border-accent bg-accent" : "border-border",
          )}
        >
          {active ? (
            <CheckIcon size={9} className="text-accent-contrast" />
          ) : null}
        </span>
        {active ? "Sélectionné" : "Choisir"}
      </span>
    </button>
  );
}

function RevisionFeedback({
  question,
  answer,
  isCorrect,
  correctChoiceText,
}: {
  question: ExamQuestion;
  answer: ChoiceKey;
  isCorrect: boolean;
  correctChoiceText?: string;
}) {
  return (
    <div className="animate-fade-up space-y-3">
      <div
        className={
          isCorrect ? "answer-box-correct" : "answer-box-wrong"
        }
      >
        <div className="flex items-start gap-2.5">
          {isCorrect ? (
            <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-success" />
          ) : (
            <XCircleIcon size={18} className="mt-0.5 shrink-0 text-danger" />
          )}
          <div>
            <p
              className={cn(
                "text-[0.82rem] font-bold",
                isCorrect ? "text-success" : "text-danger",
              )}
            >
              {isCorrect ? "Bonne réponse !" : "Réponse incorrecte"}
            </p>
            <p className="mt-1 text-[0.73rem] leading-relaxed text-muted">
              Votre réponse : <strong className="text-foreground">{answer}</strong>
              {!isCorrect ? (
                <>
                  {" "}
                  · Bonne réponse :{" "}
                  <strong className="text-foreground">
                    {question.correctAnswer}
                  </strong>
                  {correctChoiceText
                    ? ` — ${correctChoiceText.replace(/[`*]/g, "")}`
                    : ""}
                </>
              ) : null}
            </p>
          </div>
        </div>
      </div>

      <div className="explanation-box">
        <div className="flex items-center gap-2">
          <LightbulbIcon size={15} className="text-accent" />
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted">
            Explication détaillée
          </h3>
        </div>
        <RichText markdown={question.explanation} className="mt-2 text-[0.82rem]" />
      </div>

      <div className="trap-box">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon size={15} className="text-warning" />
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-warning">
            Piège à éviter / Astuce Concours
          </h3>
        </div>
        <RichText markdown={question.trapOrTip} className="mt-2 text-[0.82rem]" />
      </div>
    </div>
  );
}
