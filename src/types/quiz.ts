import type { ChoiceKey } from "./exam";

export type QuizMode = "simulation" | "revision";
export type ThemeMode = "light" | "dark";

export interface Preferences {
  theme: ThemeMode;
  accent: string;
}

/** Réponses enregistrées : une clé absente = question non répondue. */
export type AnswerMap = Record<number, ChoiceKey>;

export interface ExamSession {
  examId: string;
  mode: QuizMode;
  negativeMarking: boolean;
  answers: AnswerMap;
  flagged: number[];
  checked: Record<number, boolean>;
  currentIndex: number;
  remainingSeconds: number;
  durationSeconds: number;
  startedAt: number;
  updatedAt: number;
  isPaused: boolean;
}

export interface PartStat {
  partTitle: string;
  total: number;
  correct: number;
  answered: number;
  incorrect: number;
}

export interface Attempt {
  id: string;
  examId: string;
  examTitle: string;
  examCategory: "officiel" | "blanc" | "lecon";
  mode: QuizMode;
  negativeMarking: boolean;
  startedAt: number;
  submittedAt: number;
  timeSpentSeconds: number;
  answers: AnswerMap;
  flagged: number[];
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  flaggedCount: number;
  score: number;
  note: number;
  percentage: number;
  partStats: PartStat[];
}

export interface HistoryExport {
  app: "taalim-quiz";
  version: 1;
  exportedAt: number;
  attempts: Attempt[];
}
