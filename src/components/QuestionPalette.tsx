"use client";

import type { AnswerMap } from "@/types/quiz";
import { cn } from "@/lib/utils";
import { FlagIcon } from "./Icons";

interface QuestionPaletteProps {
  total: number;
  currentIndex: number;
  answers: AnswerMap;
  flagged: number[];
  onSelect: (index: number) => void;
  onFinish: () => void;
}

export function QuestionPalette({
  total,
  currentIndex,
  answers,
  flagged,
  onSelect,
  onFinish,
}: QuestionPaletteProps) {
  const answeredCount = Object.keys(answers).length;
  const flaggedSet = new Set(flagged);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-muted">
          Palette des questions
        </h2>
        <span className="font-mono text-[0.62rem] text-muted">
          {answeredCount}/{total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.62rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Répondue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-warning bg-warning-soft" />{" "}
          Marquée
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface-raised" />{" "}
          Vide
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-8 gap-1.5"
        role="group"
        aria-label="Aller à une question"
      >
        {Array.from({ length: total }, (_, index) => {
          const questionId = index + 1;
          const answered = Boolean(answers[questionId]);
          const isCurrent = index === currentIndex;
          const isFlagged = flaggedSet.has(questionId);
          return (
            <button
              key={questionId}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Question ${questionId}${answered ? ", répondue" : ", non répondue"}${isFlagged ? ", marquée" : ""}`}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "relative flex h-8 items-center justify-center rounded-md border text-[0.65rem] font-semibold transition",
                "focus-visible:z-10",
                answered
                  ? "border-accent bg-accent text-accent-contrast hover:brightness-105"
                  : "border-border bg-surface-raised text-muted hover:border-border-strong hover:text-foreground",
                isCurrent &&
                  "z-10 ring-2 ring-accent ring-offset-2 ring-offset-surface",
                isFlagged && "border-warning",
              )}
            >
              {questionId}
              {isFlagged ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-surface bg-warning"
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[0.65rem] text-muted">
        <div>
          <span className="font-semibold text-foreground">{answeredCount}</span>{" "}
          répondues
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <FlagIcon size={11} className="text-warning" />
            {flagged.length}
          </span>{" "}
          marquées
        </div>
      </div>

      <button
        type="button"
        onClick={onFinish}
        className="btn btn-primary mt-3 w-full"
      >
        Terminer l&apos;examen
      </button>
    </div>
  );
}
