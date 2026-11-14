"use client";

import type { ChoiceKey, ExamChoice } from "@/types/exam";
import { cn } from "@/lib/utils";
import { CheckIcon, CircleIcon, XIcon } from "./Icons";
import { renderInline } from "./RichText";

interface AnswerChoiceProps {
  choice: ExamChoice;
  selected?: boolean;
  correctAnswer?: string;
  reveal?: boolean;
  disabled?: boolean;
  onSelect?: (key: ChoiceKey) => void;
  compact?: boolean;
}

export function AnswerChoice({
  choice,
  selected = false,
  correctAnswer,
  reveal = false,
  disabled = false,
  onSelect,
  compact = false,
}: AnswerChoiceProps) {
  const isCorrect = reveal && choice.key === correctAnswer;
  const isWrong = reveal && selected && !isCorrect;
  const isSelected = selected && !reveal;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(choice.key)}
      disabled={disabled || !onSelect}
      aria-pressed={selected}
      className={cn(
        "choice group/choice",
        compact ? "gap-3 rounded-lg px-3 py-2.5" : "px-3.5 py-3 sm:px-4",
        isSelected && "choice-selected",
        isCorrect && "choice-correct",
        isWrong && "choice-wrong",
        reveal && !selected && !isCorrect && "choice-muted",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-[0.72rem] font-bold transition",
          "border-border bg-surface-2 text-muted",
          isSelected && "border-accent bg-accent text-accent-contrast",
          isCorrect && "border-success bg-success text-white",
          isWrong && "border-danger bg-danger text-white",
        )}
        aria-hidden="true"
      >
        {isCorrect ? (
          <CheckIcon size={14} />
        ) : isWrong ? (
          <XIcon size={14} />
        ) : (
          choice.key
        )}
      </span>

      <span className="min-w-0 flex-1 text-left text-[0.875rem] leading-relaxed">
        <span className="flex flex-wrap items-center gap-2">
          <span>{renderInline(choice.text, `choice-${choice.key}`)}</span>
          {isCorrect ? (
            <span className="badge badge-success px-1.5 py-0.5 text-[0.55rem]">
              Bonne réponse
            </span>
          ) : null}
          {selected ? (
            <span
              className={cn(
                "badge px-1.5 py-0.5 text-[0.55rem]",
                isCorrect ? "badge-success" : isWrong ? "badge-danger" : "badge-accent",
              )}
            >
              Votre réponse
            </span>
          ) : null}
        </span>
      </span>

      <span className="mt-1 shrink-0 text-muted" aria-hidden="true">
        {isCorrect ? (
          <CheckIcon size={15} className="text-success" />
        ) : isWrong ? (
          <XIcon size={15} className="text-danger" />
        ) : (
          <CircleIcon size={14} className="opacity-0 group-hover/choice:opacity-40" />
        )}
      </span>
    </button>
  );
}
