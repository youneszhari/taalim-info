export type ChoiceKey = "A" | "B" | "C" | "D" | "E";

export interface ExamChoice {
  key: ChoiceKey;
  text: string;
}

export interface ExamCodeBlock {
  language: string;
  code: string;
}

export interface ExamQuestion {
  id: number;
  partTitle: string;
  prompt: string;
  codeBlocks?: ExamCodeBlock[];
  tableMarkdown?: string;
  choices: ExamChoice[];
  correctAnswer: string;
  correctAnswerRaw: string;
  explanation: string;
  trapOrTip: string;
}

export interface Exam {
  id: string;
  title: string;
  year?: string;
  category: "officiel" | "blanc" | "lecon";
  subject: string;
  durationMinutes: number;
  coefficient: number;
  totalQuestions: number;
  questions: ExamQuestion[];
}
