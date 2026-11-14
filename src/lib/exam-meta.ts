import type { Exam } from "@/types/exam";

export interface ExamMeta {
  session: string;
  shortLabel: string;
  tagline: string;
}

export const EXAM_META: Record<string, ExamMeta> = {
  "officiel-2025": {
    session: "Session Novembre 2025",
    shortLabel: "2025",
    tagline: "Développement · Systèmes & Réseaux · Logiciels",
  },
  "officiel-2024": {
    session: "Session Octobre 2024",
    shortLabel: "2024",
    tagline: "Logiciels · Développement · Réseaux & Systèmes",
  },
  "officiel-2023": {
    session: "Session 2023",
    shortLabel: "2023",
    tagline: "Développement · Système & Réseaux · Logiciels",
  },
  "blanc-1": {
    session: "Simulation complète",
    shortLabel: "Blanc 1",
    tagline: "Niveau concours · version anti-répétition",
  },
  "blanc-2": {
    session: "Simulation complète",
    shortLabel: "Blanc 2",
    tagline: "Tous domaines · entraînement intensif",
  },
  "blanc-3": {
    session: "Simulation complète",
    shortLabel: "Blanc 3",
    tagline: "Tous domaines · conditions réelles",
  },
};

export function getExamMeta(exam: Pick<Exam, "id" | "title">): ExamMeta {
  return (
    EXAM_META[exam.id] ?? {
      session: "Examen",
      shortLabel: exam.title,
      tagline: "80 questions QCM",
    }
  );
}

export const EXAM_IDS = [
  "officiel-2025",
  "officiel-2024",
  "officiel-2023",
  "blanc-1",
  "blanc-2",
  "blanc-3",
] as const;

export const ACCENT_COLORS = [
  { name: "Bleu Royal", value: "#2563EB" },
  { name: "Émeraude", value: "#10B981" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Ambre", value: "#F59E0B" },
  { name: "Rose Rubis", value: "#F43F5E" },
  { name: "Cyan", value: "#06B6D4" },
] as const;
