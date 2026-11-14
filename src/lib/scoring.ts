import type { Exam } from "@/types/exam";
import type {
  AnswerMap,
  Attempt,
  ExamSession,
  PartStat,
} from "@/types/quiz";
import { round2 } from "./utils";

const NEGATIVE_PENALTY = 0.25;

export interface ScoreResult {
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  score: number;
  note: number;
  percentage: number;
}

export function scoreAnswers(
  exam: Exam,
  answers: AnswerMap,
  negativeMarking: boolean,
): ScoreResult {
  let correctCount = 0;
  let incorrectCount = 0;

  for (const question of exam.questions) {
    const answer = answers[question.id];
    if (!answer) continue;
    if (answer === question.correctAnswer) {
      correctCount += 1;
    } else {
      incorrectCount += 1;
    }
  }

  const unansweredCount =
    exam.totalQuestions - correctCount - incorrectCount;
  const score = round2(
    correctCount -
      (negativeMarking ? incorrectCount * NEGATIVE_PENALTY : 0),
  );

  return {
    correctCount,
    incorrectCount,
    unansweredCount,
    score,
    note: round2(score / (exam.totalQuestions / 20)),
    percentage: round2((score / exam.totalQuestions) * 100),
  };
}

export function computePartStats(exam: Exam, answers: AnswerMap): PartStat[] {
  const map = new Map<string, PartStat>();

  for (const question of exam.questions) {
    const current = map.get(question.partTitle) ?? {
      partTitle: question.partTitle,
      total: 0,
      correct: 0,
      answered: 0,
      incorrect: 0,
    };
    current.total += 1;
    const answer = answers[question.id];
    if (answer) {
      current.answered += 1;
      if (answer === question.correctAnswer) current.correct += 1;
      else current.incorrect += 1;
    }
    map.set(question.partTitle, current);
  }

  return [...map.values()];
}

export function buildAttempt(
  exam: Exam,
  session: ExamSession,
  submittedAt: number,
): Attempt {
  const answers = { ...session.answers };
  const result = scoreAnswers(exam, answers, session.negativeMarking);
  const flagged = [...new Set(session.flagged)].sort((a, b) => a - b);
  const timeSpentSeconds = Math.max(
    0,
    Math.min(
      session.durationSeconds,
      session.durationSeconds - session.remainingSeconds,
    ),
  );

  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${submittedAt.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    examId: exam.id,
    examTitle: exam.title,
    examCategory: exam.category,
    mode: session.mode,
    negativeMarking: session.negativeMarking,
    startedAt: session.startedAt,
    submittedAt,
    timeSpentSeconds,
    answers,
    flagged,
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    unansweredCount: result.unansweredCount,
    flaggedCount: flagged.length,
    score: result.score,
    note: result.note,
    percentage: result.percentage,
    partStats: computePartStats(exam, answers),
  };
}

export function getAttemptQuestionIds(attempt: Attempt): number[] {
  return Object.keys(attempt.answers)
    .map(Number)
    .sort((a, b) => a - b);
}
