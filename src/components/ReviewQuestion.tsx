"use client";

import type { ChoiceKey, ExamQuestion } from "@/types/exam";
import { cn } from "@/lib/utils";
import { AnswerChoice } from "./AnswerChoice";
import { QuestionContent } from "./QuestionContent";
import { RichText, renderInline } from "./RichText";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CircleIcon,
  FlagIcon,
  LightbulbIcon,
  XCircleIcon,
} from "./Icons";

interface ReviewQuestionProps {
  question: ExamQuestion;
  answer?: ChoiceKey;
  flagged: boolean;
  /** Affiche le statut et la réponse de l'utilisateur (page de résultats). */
  showUserAnswer?: boolean;
}

export function ReviewQuestion({
  question,
  answer,
  flagged,
  showUserAnswer = true,
}: ReviewQuestionProps) {
  const isCorrect = answer === question.correctAnswer;
  const isUnanswered = !answer;
  const correctChoice = question.choices.find(
    (choice) => choice.key === question.correctAnswer,
  );
  const userChoice = question.choices.find((choice) => choice.key === answer);

  const correctAnswerCard = (
    <div className="rounded-xl border border-success-border bg-success-soft px-3.5 py-3">
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">
        Bonne réponse
      </p>
      <p className="mt-1 text-[0.8rem] font-semibold">
        {question.correctAnswer} —{" "}
        <span className="font-normal text-muted">
          {correctChoice
            ? renderInline(correctChoice.text, `correct-${question.id}`)
            : ""}
        </span>
      </p>
    </div>
  );

  return (
    <article className="card overflow-hidden" id={`question-${question.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface/60 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-accent">Question {question.id}</span>
          <span className="badge max-w-[16rem] truncate">
            {question.partTitle}
          </span>
          {flagged ? (
            <span className="badge badge-warning">
              <FlagIcon size={10} />
              Marquée
            </span>
          ) : null}
        </div>
        {showUserAnswer ? (
          <span
            className={cn(
              "badge",
              isCorrect
                ? "badge-success"
                : isUnanswered
                  ? "badge"
                  : "badge-danger",
            )}
          >
            {isCorrect ? (
              <CheckCircleIcon size={11} />
            ) : isUnanswered ? (
              <CircleIcon size={11} />
            ) : (
              <XCircleIcon size={11} />
            )}
            {isCorrect
              ? "Correcte"
              : isUnanswered
                ? "Non répondue"
                : "Incorrecte"}
          </span>
        ) : (
          <span className="badge badge-success">
            <CheckCircleIcon size={11} />
            Corrigé
          </span>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <QuestionContent
          question={question}
          promptClassName="text-[0.95rem] sm:text-base"
        />

        <div
          className="mt-5 space-y-2"
          role="group"
          aria-label={`Choix de la question ${question.id}`}
        >
          {question.choices.map((choice) => (
            <AnswerChoice
              key={choice.key}
              choice={choice}
              selected={answer === choice.key}
              correctAnswer={question.correctAnswer}
              reveal
              compact
            />
          ))}
        </div>

        {showUserAnswer ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div
              className={cn(
                "rounded-xl border px-3.5 py-3",
                isUnanswered
                  ? "border-border bg-surface-2"
                  : isCorrect
                    ? "border-success-border bg-success-soft"
                    : "border-danger-border bg-danger-soft",
              )}
            >
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">
                Votre réponse
              </p>
              <p className="mt-1 text-[0.8rem] font-semibold">
                {answer ? (
                  <>
                    {answer} —{" "}
                    <span className="font-normal text-muted">
                      {userChoice
                        ? renderInline(
                            userChoice.text,
                            `answer-${question.id}`,
                          )
                        : ""}
                    </span>
                  </>
                ) : (
                  <span className="text-muted">Aucune réponse</span>
                )}
              </p>
            </div>
            {correctAnswerCard}
          </div>
        ) : (
          <div className="mt-4">{correctAnswerCard}</div>
        )}

        <div className="mt-4 space-y-3">
          <div className="explanation-box">
            <div className="flex items-center gap-2">
              <LightbulbIcon size={15} className="text-accent" />
              <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-muted">
                Explication détaillée pas à pas
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
            <RichText
              markdown={question.trapOrTip}
              className="mt-2 text-[0.84rem]"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
