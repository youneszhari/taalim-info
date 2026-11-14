"use client";

import { useEffect, useRef, useState } from "react";
import type { Exam } from "@/types/exam";
import { cn } from "@/lib/utils";
import { ReviewQuestion } from "./ReviewQuestion";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  RotateIcon,
} from "./Icons";

export function CorrectionBrowser({ exam }: { exam: Exam }) {
  const [current, setCurrent] = useState(0);
  const questionRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  const total = exam.questions.length;
  const question = exam.questions[current];

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }
    questionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [current]);

  function goTo(index: number) {
    setCurrent(Math.max(0, Math.min(total - 1, index)));
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0">
        <div ref={questionRef} className="scroll-mt-24">
          <ReviewQuestion
            question={question}
            flagged={false}
            showUserAnswer={false}
          />

          <nav
            className="mt-4 flex items-center justify-between gap-2"
            aria-label="Navigation entre les questions corrigées"
          >
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="btn btn-secondary h-9"
            >
              <ArrowLeftIcon size={14} />
              Précédente
            </button>

            <span className="font-mono text-[0.68rem] text-muted">
              {current + 1} / {total}
            </span>

            {current === total - 1 ? (
              <button
                type="button"
                onClick={() => goTo(0)}
                className="btn btn-primary h-9"
              >
                <RotateIcon size={14} />
                Revenir au début
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo(current + 1)}
                className="btn btn-primary h-9"
              >
                Suivante
                <ArrowRightIcon size={14} />
              </button>
            )}
          </nav>
        </div>

        <div className="mt-4 lg:hidden">
          <CorrectionPalette
            exam={exam}
            current={current}
            onSelect={goTo}
          />
        </div>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
        <CorrectionPalette exam={exam} current={current} onSelect={goTo} />
      </aside>
    </div>
  );
}

function CorrectionPalette({
  exam,
  current,
  onSelect,
}: {
  exam: Exam;
  current: number;
  onSelect: (index: number) => void;
}) {
  const total = exam.questions.length;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-muted">
          Palette des questions
        </h2>
        <span className="font-mono text-[0.62rem] text-muted">
          {current + 1}/{total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.62rem] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
          Question actuelle
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-border bg-surface-raised" />
          Corrigé disponible
        </span>
      </div>

      <div
        className="mt-4 grid grid-cols-8 gap-1.5"
        role="group"
        aria-label="Naviguer dans les questions corrigées"
      >
        {exam.questions.map((question, index) => {
          const isCurrent = index === current;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Question ${question.id} — ${
                isCurrent ? "question actuelle" : "corrigé disponible"
              }`}
              aria-current={isCurrent ? "true" : undefined}
              className={cn(
                "flex h-8 items-center justify-center rounded-md border text-[0.64rem] font-semibold transition hover:-translate-y-0.5",
                isCurrent
                  ? "border-accent bg-accent text-accent-contrast shadow-sm"
                  : "border-border bg-surface-raised text-muted hover:border-border-strong hover:text-foreground",
              )}
            >
              {question.id}
            </button>
          );
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[0.62rem] leading-relaxed text-muted-2">
        Sélectionnez une question pour afficher immédiatement son corrigé,
        sans quitter la page.
      </p>
    </div>
  );
}
