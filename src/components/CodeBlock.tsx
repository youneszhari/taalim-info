"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./Icons";

const LANGUAGE_LABELS: Record<string, string> = {
  c: "C",
  cpp: "C++",
  csharp: "C#",
  css: "CSS",
  excel: "Excel",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  pascal: "Pascal",
  php: "PHP",
  python: "Python",
  sql: "SQL",
  text: "Texte",
  txt: "Texte",
  typescript: "TypeScript",
  ts: "TypeScript",
};

interface CodeBlockProps {
  language?: string;
  code: string;
  label?: string;
}

export function CodeBlock({ language = "text", code, label }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const lines = code.replace(/\r\n?/g, "\n").split("\n");
  const displayLanguage =
    LANGUAGE_LABELS[language.toLowerCase()] ??
    (language ? language.toUpperCase() : "Code");

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Le presse-papiers peut être indisponible (contexte non sécurisé).
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-code-bg shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-code-surface px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            <span className="h-2 w-2 rounded-full bg-white/15" />
            <span className="h-2 w-2 rounded-full bg-white/10" />
          </span>
          <span className="truncate font-mono text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            {label ?? displayLanguage}
          </span>
        </div>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[0.65rem] font-medium text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
          aria-label="Copier le code"
        >
          {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-max py-3 font-mono text-[12.5px] leading-6 text-code-text">
          {lines.map((line, index) => (
            <div key={index} className="flex min-h-6">
              <span
                className="w-11 shrink-0 select-none border-r border-white/5 pr-3 text-right text-[0.65rem] text-code-muted"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="whitespace-pre px-4">
                {line.length > 0 ? line : " "}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
