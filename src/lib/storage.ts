import type { ExamSession, Attempt, Preferences } from "@/types/quiz";

const PREFIX = "taalim.v1";
const KEYS = {
  preferences: `${PREFIX}.preferences`,
  attempts: `${PREFIX}.attempts`,
  sessions: `${PREFIX}.sessions`,
} as const;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJSON<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota dépassé ou stockage désactivé : l'application reste utilisable.
  }
}

/* ------------------------------ Préférences ----------------------------- */

export function loadPreferences(): Partial<Preferences> {
  const value = readJSON<Partial<Preferences>>(KEYS.preferences, {});
  return value && typeof value === "object" ? value : {};
}

export function savePreferences(preferences: Preferences): void {
  writeJSON(KEYS.preferences, preferences);
}

/* ------------------------------- Tentatives ----------------------------- */

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const attempt = value as Partial<Attempt>;
  return (
    typeof attempt.id === "string" &&
    typeof attempt.examId === "string" &&
    typeof attempt.examTitle === "string" &&
    typeof attempt.submittedAt === "number" &&
    typeof attempt.score === "number" &&
    typeof attempt.correctCount === "number" &&
    !!attempt.answers &&
    typeof attempt.answers === "object" &&
    Array.isArray(attempt.partStats)
  );
}

export function loadAttempts(): Attempt[] {
  const value = readJSON<unknown>(KEYS.attempts, []);
  if (!Array.isArray(value)) return [];
  return value.filter(isAttempt);
}

export function saveAttempts(attempts: Attempt[]): void {
  writeJSON(KEYS.attempts, attempts);
}

export function addAttempt(attempt: Attempt): Attempt[] {
  const attempts = loadAttempts();
  attempts.push(attempt);
  saveAttempts(attempts);
  return attempts;
}

export function deleteAttempt(attemptId: string): Attempt[] {
  const attempts = loadAttempts().filter((attempt) => attempt.id !== attemptId);
  saveAttempts(attempts);
  return attempts;
}

export function getAttemptById(attemptId: string): Attempt | undefined {
  return loadAttempts().find((attempt) => attempt.id === attemptId);
}

export function attemptsForExam(examId: string): Attempt[] {
  return loadAttempts()
    .filter((attempt) => attempt.examId === examId)
    .sort((a, b) => a.submittedAt - b.submittedAt);
}

/* ----------------------------- Sessions en cours ------------------------ */

export function loadSessions(): Record<string, ExamSession> {
  const value = readJSON<unknown>(KEYS.sessions, {});
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const sessions: Record<string, ExamSession> = {};
  for (const [examId, session] of Object.entries(
    value as Record<string, ExamSession>,
  )) {
    if (
      session &&
      typeof session === "object" &&
      session.examId === examId &&
      typeof session.remainingSeconds === "number" &&
      !!session.answers
    ) {
      sessions[examId] = session;
    }
  }
  return sessions;
}

export function getSession(examId: string): ExamSession | undefined {
  return loadSessions()[examId];
}

export function saveSession(session: ExamSession): void {
  const sessions = loadSessions();
  sessions[session.examId] = session;
  writeJSON(KEYS.sessions, sessions);
}

export function deleteSession(examId: string): void {
  const sessions = loadSessions();
  delete sessions[examId];
  writeJSON(KEYS.sessions, sessions);
}

/* ------------------------------- Import/Export -------------------------- */

export function importAttempts(
  incoming: unknown,
  existing: Attempt[],
): { attempts: Attempt[]; imported: number; skipped: number } {
  const list = Array.isArray(incoming)
    ? incoming
    : incoming &&
        typeof incoming === "object" &&
        Array.isArray((incoming as { attempts?: unknown }).attempts)
      ? (incoming as { attempts: unknown[] }).attempts
      : null;

  if (!list) {
    return { attempts: existing, imported: 0, skipped: 0 };
  }

  const known = new Set(existing.map((attempt) => attempt.id));
  const merged = [...existing];
  let imported = 0;
  let skipped = 0;

  for (const item of list) {
    if (!isAttempt(item) || known.has(item.id)) {
      skipped += 1;
      continue;
    }
    known.add(item.id);
    merged.push(item);
    imported += 1;
  }

  merged.sort((a, b) => a.submittedAt - b.submittedAt);
  saveAttempts(merged);
  return { attempts: merged, imported, skipped };
}
