#!/usr/bin/env node
/**
 * sync-exams.mjs
 * ---------------------------------------------------------------------------
 * Convertit les 6 examens Markdown CRMEF Informatique en JSON structurés.
 *
 * Sources : les fichiers .md existants, jamais modifiés.
 * Sorties : src/data/exams/{officiel-2025,officiel-2024,officiel-2023,
 *           blanc-1,blanc-2,blanc-3}.json + src/data/exams/index.ts
 *
 * Usage : npm run sync-exams
 * ---------------------------------------------------------------------------
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "..");
const outDir = path.join(projectRoot, "src", "data", "exams");

const FALLBACK_TRAP =
  "**Aucun piège spécifique signalé :** Le corrigé officiel ne mentionne pas de piège particulier pour cette question. Relis attentivement l'énoncé et élimine les choix manifestement faux avant de valider.";

const EXAMS = [
  {
    id: "officiel-2025",
    title: "Examen Officiel 2025",
    year: "2025",
    category: "officiel",
    candidates: [
      "Examens Officiels Spécialité Informatique/2025.md",
      "examen_specialite_informatique_2025.md",
      "Examen_Specialite_Informatique_2025.md",
    ],
  },
  {
    id: "officiel-2024",
    title: "Examen Officiel 2024",
    year: "2024",
    category: "officiel",
    candidates: [
      "Examens Officiels Spécialité Informatique/2024.md",
      "examen_specialite_informatique_2024.md",
      "Examen_Specialite_Informatique_2024.md",
    ],
  },
  {
    id: "officiel-2023",
    title: "Examen Officiel 2023",
    year: "2023",
    category: "officiel",
    candidates: [
      "Examens Officiels Spécialité Informatique/2023.md",
      "examen_specialite_informatique_2023.md",
      "Examen_Specialite_Informatique_2023.md",
    ],
  },
  {
    id: "blanc-1",
    title: "Examen Blanc 1",
    category: "blanc",
    candidates: [
      "Examens Blancs Spécialité Informatique/Examen Blanc 1.md",
      "Examen Blanc 1.md",
    ],
  },
  {
    id: "blanc-2",
    title: "Examen Blanc 2",
    category: "blanc",
    candidates: [
      "Examens Blancs Spécialité Informatique/Examen Blanc 2.md",
      "Examen Blanc 2.md",
    ],
  },
  {
    id: "blanc-3",
    title: "Examen Blanc 3",
    category: "blanc",
    candidates: [
      "Examens Blancs Spécialité Informatique/Examen Blanc 3.md",
      "Examen Blanc 3.md",
    ],
  },
];

/* ----------------------------- Helpers ---------------------------------- */

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

function findSource(exam) {
  for (const rel of exam.candidates) {
    const absolute = path.join(workspaceRoot, rel);
    if (existsSync(absolute)) return absolute;
  }
  fail(
    `Source introuvable pour ${exam.id}. Chemins essayés :\n` +
      exam.candidates.map((c) => `  - ${path.join(workspaceRoot, c)}`).join("\n"),
  );
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return data;
}

function cleanPartName(raw) {
  return raw
    .replace(/\s*\(Q\s*\d+\s*à\s*Q\s*\d+\)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

/** Remplace les blocs de code par des placeholders et les collecte. */
function extractCodeBlocks(fragment) {
  const blocks = [];
  const text = fragment.replace(
    /^```([^\n`]*)\n([\s\S]*?)^```[ \t]*$/gm,
    (_full, language, code) => {
      blocks.push({
        language: String(language || "text").trim() || "text",
        code: String(code).replace(/\n$/, ""),
      });
      return `\n\n{{CODE_${blocks.length - 1}}}\n\n`;
    },
  );
  return { text, blocks };
}

/** Détecte le premier tableau Markdown hors blocs de code. */
function extractTable(fragment) {
  const lines = fragment.split("\n");
  const isSeparator = (line) =>
    /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
  const isRow = (line) => /^\s*\|/.test(line);

  for (let i = 0; i < lines.length - 1; i += 1) {
    if (!isRow(lines[i]) || !isSeparator(lines[i + 1])) continue;
    let end = i + 2;
    while (end < lines.length && isRow(lines[end])) end += 1;
    const tableMarkdown = lines.slice(i, end).join("\n").trim();
    const text = [
      ...lines.slice(0, i),
      "{{TABLE}}",
      ...lines.slice(end),
    ].join("\n");
    return { text, tableMarkdown };
  }
  return { text: fragment, tableMarkdown: undefined };
}

function stripChoiceSection(fragment) {
  const firstChoice = fragment.search(/^-\s+\*\*A\)\*\*/m);
  if (firstChoice === -1) fail("Aucun choix A) trouvé dans une question.");
  return fragment.slice(0, firstChoice);
}

function parseChoices(fragment) {
  const choices = [];
  const regex = /^-\s+\*\*([A-E])\)\*\*[ \t]*(.*)$/gm;
  let match;
  while ((match = regex.exec(fragment)) !== null) {
    choices.push({ key: match[1], text: match[2].trim() });
  }
  return choices;
}

function unquote(lines) {
  return lines.map((line) => line.replace(/^>\s?/, ""));
}

function parseAnswerBlock(body) {
  const success = body.match(/^> \[!success\][^\n]*$/m);
  if (!success) fail("Bloc de correction [!success] manquant.");

  const rawLines = body.slice(success.index).split("\n");
  const answerLines = [];
  for (const line of rawLines) {
    const trimmed = line.trim();
    if (trimmed === "---") break;
    if (/^#\s+.*PARTIE/i.test(trimmed)) break;
    answerLines.push(line);
  }

  const lines = unquote(answerLines);
  const answerIndex = lines.findIndex(
    (line) => /✅/.test(line) && /Réponse correcte/i.test(line),
  );
  if (answerIndex === -1) fail("Ligne « Réponse correcte » manquante.");

  const answerLine = lines[answerIndex].trim();
  const letterMatch = answerLine.match(/Réponse correcte\s*:\s*([A-E])\b/i);
  if (!letterMatch) fail(`Lettre de réponse illisible : ${answerLine}`);

  const correctAnswerRaw = answerLine
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();

  let explanationStart = lines.findIndex((line) =>
    /Explication simple/i.test(line),
  );
  const trapStart = lines.findIndex((line) => /⚠️/.test(line));

  if (explanationStart === -1) explanationStart = answerIndex + 1;

  const explanationEnd =
    trapStart === -1 ? lines.length : Math.max(trapStart, explanationStart);

  const explanationLines = lines
    .slice(explanationStart, explanationEnd)
    .map((line, index) =>
      index === 0
        ? line.replace(
            /^\s*[*-]?\s*\*\*Explication simple(?:\s*\([^)]*\))?\s*:\*\*\s*/i,
            "",
          )
        : line,
    );

  let explanation = explanationLines.join("\n").trim();
  explanation = explanation.replace(/^\n+|\n+$/g, "");

  let trapOrTip = "";
  if (trapStart !== -1) {
    trapOrTip = lines
      .slice(trapStart)
      .join("\n")
      .replace(/^\s*[*-]\s*/, "")
      .replace(/^\*\*\s*⚠️\s*/, "**")
      .replace(/^\s*⚠️\s*/, "")
      .replace(/\s+$/g, "")
      .trim();
  }
  if (!trapOrTip) trapOrTip = FALLBACK_TRAP;

  if (!explanation) {
    explanation = `La bonne réponse officielle est **${letterMatch[1]}**. Reporte-toi au choix correspondant et vérifie chaque étape du raisonnement.`;
  }

  return {
    correctAnswer: letterMatch[1],
    correctAnswerRaw,
    explanation,
    trapOrTip,
    usedTrapFallback: trapStart === -1,
  };
}

function cleanPrompt(text) {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*---\s*$/gm, "")
    .replace(/^\n+|\n+$/g, "")
    .trim();
}

/* --------------------------- Exam parsing ------------------------------- */

function parseExam(config) {
  const sourcePath = findSource(config);
  const raw = normalizeNewlines(readFileSync(sourcePath, "utf8"));
  const frontmatter = parseFrontmatter(raw);

  const partMatches = [
    ...raw.matchAll(/^#\s+.*?PARTIE\s+(\d+)\s*:\s*(.+?)\s*$/gim),
  ].map((match) => ({
    index: match.index ?? 0,
    number: Number(match[1]),
    title: `PARTIE ${Number(match[1])} : ${cleanPartName(match[2])}`,
  }));
  if (partMatches.length === 0) fail(`${config.id} : aucune partie détectée.`);

  const questionMatches = [
    ...raw.matchAll(/^### Question\s+(\d+)\s*$/gm),
  ];
  if (questionMatches.length !== 80) {
    fail(
      `${config.id} : ${questionMatches.length} questions détectées au lieu de 80.`,
    );
  }

  const questions = [];
  let fallbackTrapCount = 0;

  for (let i = 0; i < questionMatches.length; i += 1) {
    const match = questionMatches[i];
    const id = Number(match[1]);
    const bodyStart = (match.index ?? 0) + match[0].length;
    const bodyEnd =
      i + 1 < questionMatches.length
        ? (questionMatches[i + 1].index ?? raw.length)
        : raw.length;
    const body = raw.slice(bodyStart, bodyEnd);

    const part = [...partMatches]
      .reverse()
      .find((candidate) => candidate.index < (match.index ?? 0));
    if (!part) fail(`${config.id} Q${id} : partie introuvable.`);

    const choices = parseChoices(body);
    if (config.id === "officiel-2023" && choices.length === 4) {
      choices.push({
        key: "E",
        text: "Aucune de ces réponses n'est juste",
      });
    }
    if (choices.length !== 5) {
      fail(
        `${config.id} Q${id} : ${choices.length} choix détectés (attendu : 5).`,
      );
    }
    const keys = choices.map((choice) => choice.key).join("");
    if (keys !== "ABCDE") {
      fail(`${config.id} Q${id} : clés de choix inattendues (${keys}).`);
    }
    if (choices.some((choice) => !choice.text)) {
      fail(`${config.id} Q${id} : un choix possède un texte vide.`);
    }

    const questionFragment = stripChoiceSection(body);
    const noCode = extractCodeBlocks(questionFragment);
    const noTable = extractTable(noCode.text);
    const prompt = cleanPrompt(noTable.text);

    const answer = parseAnswerBlock(body);
    if (answer.usedTrapFallback) fallbackTrapCount += 1;
    if (!choices.some((choice) => choice.key === answer.correctAnswer)) {
      fail(
        `${config.id} Q${id} : la réponse ${answer.correctAnswer} n'existe pas parmi les choix.`,
      );
    }

    const question = {
      id,
      partTitle: part.title,
      prompt,
      choices,
      correctAnswer: answer.correctAnswer,
      correctAnswerRaw: answer.correctAnswerRaw,
      explanation: answer.explanation,
      trapOrTip: answer.trapOrTip,
    };
    if (noCode.blocks.length > 0) question.codeBlocks = noCode.blocks;
    if (noTable.tableMarkdown) question.tableMarkdown = noTable.tableMarkdown;

    questions.push(question);
  }

  questions.sort((a, b) => a.id - b.id);
  for (let i = 0; i < questions.length; i += 1) {
    if (questions[i].id !== i + 1) {
      fail(`${config.id} : numérotation des questions non séquentielle.`);
    }
  }

  // Contexte partagé (ex. « Questions 27 à 30 — Schéma Relationnel »).
  const contextMatches = [
    ...raw.matchAll(/^###\s+Questions?\s+(\d+)\s+à\s+(\d+)\s+—\s*(.+)\s*$/gm),
  ];
  let contextCount = 0;
  for (const contextMatch of contextMatches) {
    const from = Number(contextMatch[1]);
    const to = Number(contextMatch[2]);
    const start = contextMatch.index ?? 0;
    const nextQuestion = raw.indexOf("\n### Question", start);
    const nextPartMatch = raw.slice(start).match(/^#\s+.*?PARTIE/m);
    const nextPart = nextPartMatch
      ? start + (nextPartMatch.index ?? 0)
      : raw.length;
    const end = Math.min(
      nextQuestion === -1 ? raw.length : nextQuestion,
      nextPart,
      raw.length,
    );
    const block = raw.slice(start, end).trim();
    if (!block) continue;
    let applied = 0;
    for (const question of questions) {
      if (question.id >= from && question.id <= to) {
        question.prompt = `${block}\n\n${question.prompt}`.trim();
        applied += 1;
      }
    }
    if (applied === 0) {
      console.warn(
        `  ! Contexte « Q${from}–Q${to} » sans question correspondante.`,
      );
    }
    contextCount += 1;
  }

  const exam = {
    id: config.id,
    title: config.title,
    ...(config.year ? { year: config.year } : {}),
    category: config.category,
    subject: frontmatter.matiere || "Spécialité Informatique",
    durationMinutes: 240,
    coefficient: 20,
    totalQuestions: questions.length,
    questions,
  };

  validateExam(exam, fallbackTrapCount);
  return { exam, sourcePath, fallbackTrapCount, contextCount };
}

/* ----------------------------- Validation ------------------------------- */

function validateExam(exam, fallbackTrapCount) {
  if (exam.questions.length !== 80) {
    fail(`${exam.id} : ${exam.questions.length} questions au lieu de 80.`);
  }
  if (exam.totalQuestions !== 80) fail(`${exam.id} : totalQuestions ≠ 80.`);

  const answerCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const question of exam.questions) {
    if (!question.partTitle) fail(`${exam.id} Q${question.id} : partie vide.`);
    if (!question.prompt) fail(`${exam.id} Q${question.id} : énoncé vide.`);
    if (!question.explanation)
      fail(`${exam.id} Q${question.id} : explication vide.`);
    if (!question.trapOrTip)
      fail(`${exam.id} Q${question.id} : piège vide.`);
    if (question.choices.length !== 5)
      fail(`${exam.id} Q${question.id} : choix incomplets.`);
    if (!question.choices.some((c) => c.key === question.correctAnswer))
      fail(`${exam.id} Q${question.id} : réponse hors choix.`);
    if (question.codeBlocks) {
      for (const block of question.codeBlocks) {
        if (!block.code.trim())
          fail(`${exam.id} Q${question.id} : bloc de code vide.`);
      }
    }
    if (question.tableMarkdown !== undefined && !question.tableMarkdown.trim())
      fail(`${exam.id} Q${question.id} : tableau vide.`);
    answerCounts[question.correctAnswer] += 1;
  }

  exam.questions.forEach((q) => {
    q.prompt = q.prompt.replace(/\n{3,}/g, "\n\n").trim();
    q.explanation = q.explanation.replace(/\n{3,}/g, "\n\n").trim();
    q.trapOrTip = q.trapOrTip.replace(/\n{3,}/g, "\n\n").trim();
  });

  exam._stats = {
    fallbackTrapCount,
    answerCounts,
    codeBlockCount: exam.questions.reduce(
      (total, q) => total + (q.codeBlocks?.length ?? 0),
      0,
    ),
    tableCount: exam.questions.filter((q) => q.tableMarkdown).length,
    parts: [...new Set(exam.questions.map((q) => q.partTitle))],
  };
}

/* ------------------------------- Output --------------------------------- */

function writeIndex(exams) {
  const imports = exams
    .map(
      (exam) =>
        `import ${exam.id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())} from "./${exam.id}.json";`,
    )
    .join("\n");
  const names = exams.map((exam) =>
    exam.id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase()),
  );

  const content = `// AUTO-GENERATED by scripts/sync-exams.mjs — do not edit by hand.
import type { Exam } from "@/types/exam";
${imports}

export const exams = [
${names.map((name) => `  ${name},`).join("\n")}
] as unknown as Exam[];

export const officialExams = exams.filter((exam) => exam.category === "officiel");
export const mockExams = exams.filter((exam) => exam.category === "blanc");

export function getExamById(id: string): Exam | undefined {
  return exams.find((exam) => exam.id === id);
}

export function getExamIndex(id: string): number {
  return exams.findIndex((exam) => exam.id === id);
}
`;

  writeFileSync(path.join(outDir, "index.ts"), content, "utf8");
}

function main() {
  mkdirSync(outDir, { recursive: true });

  console.log("\n━ Conversion des 6 examens Markdown → JSON ━\n");

  const parsed = [];
  for (const config of EXAMS) {
    const result = parseExam(config);
    parsed.push(result);

    const { exam, sourcePath, fallbackTrapCount, contextCount } = result;
    const outputPath = path.join(outDir, `${exam.id}.json`);
    const stats = exam._stats;
    delete exam._stats;
    writeFileSync(outputPath, `${JSON.stringify(exam, null, 2)}\n`, "utf8");

    console.log(`✓ ${exam.id}.json`);
    console.log(
      `  source      : ${path.relative(workspaceRoot, sourcePath)}`,
    );
    console.log(
      `  questions   : ${exam.questions.length} | parties : ${stats.parts.length} | contextes : ${contextCount}`,
    );
    console.log(
      `  code        : ${stats.codeBlockCount} bloc(s) | tableaux : ${stats.tableCount} | pièges fallback : ${fallbackTrapCount}`,
    );
    console.log(
      `  réponses    : A=${stats.answerCounts.A} B=${stats.answerCounts.B} C=${stats.answerCounts.C} D=${stats.answerCounts.D} E=${stats.answerCounts.E}`,
    );
    console.log(`  fichier     : ${path.relative(projectRoot, outputPath)}\n`);
  }

  // Réécrit le JSON sans le champ _stats (déjà supprimé avant écriture).
  // Vérification finale sur les fichiers réellement écrits.
  let totalQuestions = 0;
  for (const { exam } of parsed) {
    const filePath = path.join(outDir, `${exam.id}.json`);
    const written = JSON.parse(readFileSync(filePath, "utf8"));
    if (written.questions.length !== 80) {
      fail(`${path.basename(filePath)} : relecture ≠ 80 questions.`);
    }
    totalQuestions += written.questions.length;
  }

  writeIndex(parsed.map(({ exam }) => exam));

  console.log("━ Vérification finale ━\n");
  for (const { exam } of parsed) {
    const filePath = path.join(outDir, `${exam.id}.json`);
    const written = JSON.parse(readFileSync(filePath, "utf8"));
    const complete = written.questions.filter(
      (q) =>
        q.id &&
        q.prompt &&
        q.choices?.length === 5 &&
        q.correctAnswer &&
        q.explanation &&
        q.trapOrTip,
    ).length;
    console.log(
      `  ${written.id.padEnd(14)} ${String(written.questions.length).padStart(3)} questions · ${String(complete).padStart(3)} complètes`,
    );
  }
  console.log(
    `\n✓ ${totalQuestions} questions converties au total (6 × 80).`,
  );
  console.log(`✓ Index généré : ${path.relative(projectRoot, path.join(outDir, "index.ts"))}\n`);
}

main();
