"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChoiceKey, Exam, ExamQuestion } from "@/types/exam";
import type { Attempt } from "@/types/quiz";
import { getExamMeta } from "@/lib/exam-meta";
import { getAttemptById } from "@/lib/storage";
import { cn, formatDate, formatScore } from "@/lib/utils";
import { AnswerChoice } from "./AnswerChoice";
import { QuestionContent } from "./QuestionContent";
import { RichText, renderInline } from "./RichText";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  HistoryIcon,
  LightbulbIcon,
  RotateIcon,
  TargetIcon,
  TrophyIcon,
  XCircleIcon,
} from "./Icons";

interface RetryEntry {
  answer: ChoiceKey | null;
  checked: boolean;
}

interface RetryViewProps {
  exam: Exam;
  attemptId: string;
}

export function RetryView({ exam, attemptId }: RetryViewProps) {
  const [attempt, setAttempt] = useState<Attempt | null | undefined>(undefined);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<number, RetryEntry>>({});
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  const meta = getExamMeta(exam);

  useEffect(() => {
    const found = getAttemptById(attemptId);
    setAttempt(found && found.examId === exam.id ? found : null);
    setLoadedId(attemptId);
    setEntries({});
    setCurrent(0);
    setFinished(false);
  }, [attemptId, exam.id]);

  const questions = useMemo(() => {
    if (!attempt) return [];
    return exam.questions.filter((question) => {
      const answer = attempt.answers[question.id];
      return !answer || answer !== question.correctAnswer;
    });
  }, [attempt, exam.questions]);

  const total = questions.length;
  const verifiedCount = questions.reduce(
    (count, question) => count + (entries[question.id]?.checked ? 1 : 0),
    0,
  );
  const correctCount = questions.reduce((count, question) => {
    const entry = entries[question.id];
    return count +
      (entry?.checked && entry.answer === question.correctAnswer ? 1 : 0);
  }, 0);
  const persistentErrors = verifiedCount - correctCount;

  const safeIndex = total === 0 ? 0 : Math.min(current, total - 1);
  const currentQuestion = questions[safeIndex];
  const currentEntry = currentQuestion
    ? entries[currentQuestion.id]
    : undefined;
  const currentChecked = Boolean(currentEntry?.checked);

  const percentage =
    verifiedCount > 0 ? Math.round((correctCount / verifiedCount) * 100) : 0;

  if (loadedId !== attemptId || attempt === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton mt-4 h-9 w-2/3" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="skeleton h-96 rounded-2xl" />
          <div className="skeleton hidden h-72 rounded-2xl lg:block" />
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

  if (total === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href={`/exam/${exam.id}/result/${attempt.id}`}
          className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeftIcon size={14} />
          Retour aux résultats
        </Link>

        <div className="card mt-5 flex flex-col items-center px-6 py-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
            <TrophyIcon size={25} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            Aucune erreur à rejouer
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Toutes vos réponses étaient correctes lors de cette tentative.
            Continuez avec un autre examen ou une nouvelle tentative complète
            pour consolider vos acquis.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              href={`/exam/${exam.id}/result/${attempt.id}`}
              className="btn btn-secondary"
            >
              <ArrowLeftIcon size={14} />
              Voir la correction
            </Link>
            <Link href={`/exam/${exam.id}`} className="btn btn-primary">
              <TargetIcon size={14} />
              Nouvelle tentative complète
            </Link>
          </div>
        </div>
      </div>
    );
  }

  function selectChoice(key: ChoiceKey) {
    if (!currentQuestion || currentChecked) return;
    setEntries((previous) => ({
      ...previous,
      [currentQuestion.id]: { answer: key, checked: false },
    }));
  }

  function checkCurrent() {
    if (!currentQuestion || !currentEntry?.answer) return;
    setEntries((previous) => ({
      ...previous,
      [currentQuestion.id]: {
        answer: previous[currentQuestion.id]?.answer ?? null,
        checked: true,
      },
    }));
  }

  function passCurrent() {
    if (!currentQuestion || currentChecked) return;
    setEntries((previous) => ({
      ...previous,
      [currentQuestion.id]: { answer: null, checked: true },
    }));
    advance();
  }

  function advance() {
    if (safeIndex < total - 1) setCurrent(safeIndex + 1);
    else setFinished(true);
  }

  function goTo(index: number) {
    setFinished(false);
    setCurrent(Math.max(0, Math.min(total - 1, index)));
  }

  function restart() {
    setEntries({});
    setCurrent(0);
    setFinished(false);
  }

  function finish() {
    setFinished(true);
  }

  const correctChoice = currentQuestion?.choices.find(
    (choice) => choice.key === currentQuestion.correctAnswer,
  );
  const originalAnswer = currentQuestion
    ? attempt.answers[currentQuestion.id]
    : undefined;
  const originalChoice = currentQuestion?.choices.find(
    (choice) => choice.key === originalAnswer,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link
        href={`/exam/${exam.id}/result/${attempt.id}`}
        className="inline-flex items-center gap-1.5 text-[0.73rem] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeftIcon size={14} />
        Retour aux résultats
      </Link>

      <header className="mt-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-accent">
            <RotateIcon size={12} /> Rejeu des erreurs
          </span>
          <span className="badge">{meta.session}</span>
          <span className="badge">
            Tentative du {formatDate(attempt.submittedAt)}
          </span>
          <span className="badge">Score initial {formatScore(attempt.score)}/80</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Reprenez uniquement vos erreurs
        </h1>
        <p className="mt-1.5 max-w-2xl text-[0.8rem] leading-relaxed text-muted">
          {total} question{total > 1 ? "s" : ""} incorrecte{total > 1 ? "s" : ""}{" "}
          ou non répondue{total > 1 ? "s" : ""} lors de votre tentative. Chaque
          vérification affiche immédiatement la correction, l&apos;explication
          et le piège associé.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{
                width: `${total > 0 ? (verifiedCount / total) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[0.65rem] text-muted">
            {verifiedCount}/{total} vérifiée{verifiedCount > 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          {finished ? (
            <div className="card animate-fade-up p-5 sm:p-7">
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-2xl",
                    persistentErrors === 0 && verifiedCount === total
                      ? "bg-success-soft text-success"
                      : "bg-accent-soft text-accent",
                  )}
                >
                  {persistentErrors === 0 && verifiedCount === total ? (
                    <TrophyIcon size={25} />
                  ) : (
                    <TargetIcon size={25} />
                  )}
                </span>
                <p className="mt-4 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">
                  Bilan du rejeu
                </p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight">
                  {correctCount} / {total}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  bonnes réponses sur les questions rejouées
                  {verifiedCount > 0 ? ` · ${percentage} % de réussite` : ""}
                </p>
                <p className="mt-2 max-w-md text-[0.75rem] leading-relaxed text-muted">
                  {verifiedCount < total
                    ? `Vous avez vérifié ${verifiedCount} question${verifiedCount > 1 ? "s" : ""} sur ${total}. Les ${total - verifiedCount} restantes n'ont pas été revues.`
                    : persistentErrors === 0
                      ? "Toutes les erreurs de votre tentative initiale sont maintenant corrigées. Excellent travail !"
                      : `${persistentErrors} erreur${persistentErrors > 1 ? "s" : ""} persiste${persistentErrors > 1 ? "nt" : ""}. Relisez les explications puis rejouez ce rejeu pour les ancrer.`}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-success-border bg-success-soft p-3 text-center">
                  <div className="text-xl font-bold text-success">
                    {correctCount}
                  </div>
                  <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
                    Correctes
                  </div>
                </div>
                <div className="rounded-xl border border-danger-border bg-danger-soft p-3 text-center">
                  <div className="text-xl font-bold text-danger">
                    {persistentErrors}
                  </div>
                  <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
                    Erreurs
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-center">
                  <div className="text-xl font-bold">{total - verifiedCount}</div>
                  <div className="text-[0.6rem] font-medium uppercase tracking-wide text-muted">
                    Restantes
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Détail des questions rejouées
                </p>
                <div className="mt-2.5 grid grid-cols-8 gap-1.5 sm:grid-cols-10">
                  {questions.map((question, index) => {
                    const entry = entries[question.id];
                    const status = !entry?.checked
                      ? "pending"
                      : entry.answer === question.correctAnswer
                        ? "correct"
                        : "wrong";
                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() => goTo(index)}
                        className={cn(
                          "flex h-8 items-center justify-center rounded-md border text-[0.64rem] font-semibold transition hover:-translate-y-0.5",
                          status === "correct" &&
                            "border-success-border bg-success-soft text-success",
                          status === "wrong" &&
                            "border-danger-border bg-danger-soft text-danger",
                          status === "pending" &&
                            "border-border bg-surface-raised text-muted",
                        )}
                        title={`Question ${question.id} — ${
                          status === "correct"
                            ? "correcte"
                            : status === "wrong"
                              ? "erreur"
                              : "non vérifiée"
                        }`}
                      >
                        {question.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={restart}
                  className="btn btn-primary"
                >
                  <RotateIcon size={14} />
                  Rejouer ces erreurs
                </button>
                <Link
                  href={`/exam/${exam.id}/result/${attempt.id}`}
                  className="btn btn-secondary"
                >
                  <ArrowLeftIcon size={14} />
                  Retour aux résultats
                </Link>
                <Link href={`/exam/${exam.id}`} className="btn btn-secondary">
                  <TargetIcon size={14} />
                  Nouvelle tentative complète
                </Link>
              </div>

              <p className="mt-4 text-center text-[0.64rem] text-muted-2">
                Ce rejeu est un entraînement ciblé : il n&apos;est pas enregistré
                dans votre historique.
              </p>
            </div>
          ) : (
            <div className="card animate-fade-up p-4 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-accent max-w-full truncate">
                      {currentQuestion.partTitle}
                    </span>
                    <span className="badge">
                      Rejeu {safeIndex + 1}/{total}
                    </span>
                    <span className="text-[0.68rem] font-medium text-muted">
                      Question {currentQuestion.id} sur {exam.totalQuestions}
                    </span>
                  </div>
                </div>
                <span className="badge">
                  <ClockIcon size={11} />
                  Correction immédiate
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5">
                <p className="text-[0.65rem] text-muted">
                  Lors de votre tentative initiale :{" "}
                  {originalAnswer ? (
                    <strong className="text-foreground">
                      {originalAnswer} — {originalChoice?.text ?? "réponse"}
                    </strong>
                  ) : (
                    <strong className="text-foreground">aucune réponse</strong>
                  )}
                </p>
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
                aria-label="Choix de réponse pour le rejeu"
              >
                {currentQuestion.choices.map((choice) => (
                  <AnswerChoice
                    key={choice.key}
                    choice={choice}
                    selected={
                      Boolean(currentEntry?.answer) &&
                      currentEntry?.answer === choice.key
                    }
                    correctAnswer={currentQuestion.correctAnswer}
                    reveal={currentChecked}
                    onSelect={currentChecked ? undefined : selectChoice}
                  />
                ))}
              </div>

              {currentChecked && currentEntry ? (
                <RetryFeedback
                  question={currentQuestion}
                  entry={currentEntry}
                  correctChoiceText={correctChoice?.text}
                />
              ) : null}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => goTo(safeIndex - 1)}
                  disabled={safeIndex === 0}
                  className="btn btn-secondary h-9"
                >
                  <ArrowLeftIcon size={14} />
                  Précédente
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {!currentChecked ? (
                    <>
                      <button
                        type="button"
                        onClick={passCurrent}
                        className="btn btn-ghost h-9"
                      >
                        Passer
                      </button>
                      <button
                        type="button"
                        onClick={checkCurrent}
                        disabled={!currentEntry?.answer}
                        className="btn btn-primary h-9"
                      >
                        <CheckCircleIcon size={14} />
                        Vérifier ma réponse
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={advance}
                      className="btn btn-primary h-9"
                    >
                      {safeIndex === total - 1
                        ? "Voir le bilan"
                        : "Question suivante"}
                      <ArrowRightIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 lg:hidden">
            <RetryPalette
              questions={questions}
              entries={entries}
              currentIndex={safeIndex}
              onSelect={goTo}
              verifiedCount={verifiedCount}
              total={total}
              onFinish={finish}
              disabled={verifiedCount === 0}
            />
          </div>
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
          <RetryPalette
            questions={questions}
            entries={entries}
            currentIndex={safeIndex}
            onSelect={goTo}
            verifiedCount={verifiedCount}
            total={total}
            onFinish={finish}
            disabled={verifiedCount === 0}
          />
        </aside>
      </div>
    </div>
  );
}

function RetryPalette({
  questions,
  entries,
  currentIndex,
  onSelect,
  verifiedCount,
  total,
  onFinish,
  disabled,
}: {
  questions: ExamQuestion[];
  entries: Record<number, RetryEntry>;
  currentIndex: number;
  onSelect: (index: number) => void;
  verifiedCount: number;
  total: number;
  onFinish: () => void;
  disabled: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-muted">
          Questions du rejeu
        </h2>
        <span className="font-mono text-[0.62rem] text-muted">
          {total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.62rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-success-border bg-success-soft" />{" "}
          Correcte
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-danger-border bg-danger-soft" />{" "}
          Erreur
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface-raised" />{" "}
          À revoir
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-6 gap-1.5"
        role="group"
        aria-label="Naviguer dans les questions du rejeu"
      >
        {questions.map((question, index) => {
          const entry = entries[question.id];
          const isCurrent = index === currentIndex;
          const status = !entry?.checked
            ? "pending"
            : entry.answer === question.correctAnswer
              ? "correct"
              : "wrong";
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Question ${question.id} — ${
                status === "correct"
                  ? "correcte"
                  : status === "wrong"
                    ? "erreur"
                    : "non vérifiée"
              }`}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-md border text-[0.64rem] font-semibold transition hover:border-border-strong",
                status === "correct" &&
                  "border-success-border bg-success-soft text-success",
                status === "wrong" &&
                  "border-danger-border bg-danger-soft text-danger",
                status === "pending" &&
                  "border-border bg-surface-raised text-muted hover:text-foreground",
                isCurrent &&
                  "z-10 ring-2 ring-accent ring-offset-2 ring-offset-surface",
              )}
            >
              {question.id}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[0.65rem] text-muted">
        <span>
          <strong className="text-foreground">{verifiedCount}</strong>/{total}{" "}
          vérifiées
        </span>
        <span>
          <strong className="text-foreground">{total - verifiedCount}</strong>{" "}
          restantes
        </span>
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={disabled}
        className="btn btn-secondary mt-3 w-full"
      >
        <TrophyIcon size={14} />
        Voir le bilan
      </button>

      <p className="mt-3 text-[0.62rem] leading-relaxed text-muted-2">
        Entraînement ciblé, non enregistré dans l&apos;historique.
      </p>
    </div>
  );
}

function RetryFeedback({
  question,
  entry,
  correctChoiceText,
}: {
  question: ExamQuestion;
  entry: RetryEntry;
  correctChoiceText?: string;
}) {
  const isCorrect = entry.answer === question.correctAnswer;
  const isUnanswered = !entry.answer;

  return (
    <div className="mt-5 animate-fade-up space-y-3 border-t border-border pt-5">
      <div
        className={cn(
          "rounded-xl border px-3.5 py-3",
          isCorrect
            ? "border-success-border bg-success-soft"
            : isUnanswered
              ? "border-border bg-surface-2"
              : "border-danger-border bg-danger-soft",
        )}
      >
        <div className="flex items-start gap-2.5">
          {isCorrect ? (
            <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-success" />
          ) : isUnanswered ? (
            <CircleIcon size={18} className="mt-0.5 shrink-0 text-muted" />
          ) : (
            <XCircleIcon size={18} className="mt-0.5 shrink-0 text-danger" />
          )}
          <div>
            <p
              className={cn(
                "text-[0.82rem] font-bold",
                isCorrect
                  ? "text-success"
                  : isUnanswered
                    ? "text-foreground"
                    : "text-danger",
              )}
            >
              {isCorrect
                ? "Bonne réponse !"
                : isUnanswered
                  ? "Question passée"
                  : "Réponse incorrecte"}
            </p>
            <p className="mt-1 text-[0.73rem] leading-relaxed text-muted">
              {isUnanswered ? (
                <>
                  Aucune réponse sélectionnée. La bonne réponse était{" "}
                  <strong className="text-foreground">
                    {question.correctAnswer}
                  </strong>
                  {correctChoiceText
                    ? ` — ${correctChoiceText.replace(/[`*]/g, "")}`
                    : ""}
                  .
                </>
              ) : isCorrect ? (
                <>
                  Vous avez retrouvé la bonne réponse{" "}
                  <strong className="text-foreground">
                    {question.correctAnswer}
                  </strong>
                  .
                </>
              ) : (
                <>
                  Votre réponse :{" "}
                  <strong className="text-foreground">{entry.answer}</strong> ·
                  Bonne réponse :{" "}
                  <strong className="text-foreground">
                    {question.correctAnswer}
                  </strong>
                  {correctChoiceText ? (
                    <>
                      {" "}
                      —{" "}
                      <span className="text-foreground">
                        {renderInline(correctChoiceText, "retry-correct")}
                      </span>
                    </>
                  ) : null}
                </>
              )}
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
        <RichText
          markdown={question.explanation}
          className="mt-2 text-[0.84rem]"
        />
      </div>

      <div className="trap-box">
        <div className="flex items-center gap-2">
          <AlertTriangleIcon size={15} className="text-warning" />
          <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-warning">
            Piège à éviter / Astuce Concours
          </h3>
        </div>
        <RichText markdown={question.trapOrTip} className="mt-2 text-[0.84rem]" />
      </div>
    </div>
  );
}
