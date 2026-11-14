import type { ReactNode } from "react";

interface RichTextProps {
  markdown: string;
  className?: string;
}

/**
 * Rendu Markdown léger, adapté aux énoncés et corrigés :
 * gras, italique, code inline, listes, titres, formules et paragraphes.
 * Les tableaux et blocs de code sont gérés séparément par QuestionContent.
 */
export function RichText({ markdown, className }: RichTextProps) {
  const blocks = parseBlocks(markdown);
  return (
    <div className={["rich-text", className].filter(Boolean).join(" ")}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullets"; items: Array<{ text: string; level: number }> }
  | { type: "numbers"; items: Array<{ text: string; level: number }> }
  | { type: "formula"; text: string };

function parseBlocks(markdown: string): Block[] {
  const normalized = markdown.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [];
  const lines = normalized.split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed || /^-{3,}$/.test(trimmed)) {
      index += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith("$$")) {
      const formulaLines: string[] = [];
      const firstPart = trimmed.slice(2);
      index += 1;

      if (firstPart.includes("$$")) {
        formulaLines.push(firstPart.split("$$")[0]);
      } else {
        formulaLines.push(firstPart);
        while (index < lines.length) {
          const nextLine = lines[index].trim();
          index += 1;
          if (nextLine.includes("$$")) {
            formulaLines.push(nextLine.split("$$")[0]);
            break;
          }
          formulaLines.push(nextLine);
        }
      }

      const text = normalizeMathExpression(formulaLines.join(" "));
      if (text) blocks.push({ type: "formula", text });
      continue;
    }

    const bullet = trimmed.match(/^(\s*)[-*+]\s+(.+)$/);
    if (bullet) {
      const items: Array<{ text: string; level: number }> = [];
      while (index < lines.length) {
        const match = lines[index].match(/^(\s*)[-*+]\s+(.+)$/);
        if (!match) break;
        const level = Math.min(3, Math.floor(match[1].length / 2));
        items.push({ text: match[2].trim(), level });
        index += 1;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    const numbered = trimmed.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      const items: Array<{ text: string; level: number }> = [];
      while (index < lines.length) {
        const match = lines[index].match(/^(\s*)(\d+)[.)]\s+(.+)$/);
        if (!match) break;
        const level = Math.min(3, Math.floor(match[1].length / 2));
        items.push({ text: match[3].trim(), level });
        index += 1;
      }
      blocks.push({ type: "numbers", items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index];
      const currentTrimmed = current.trim();
      if (
        !currentTrimmed ||
        /^-{3,}$/.test(currentTrimmed) ||
        /^(#{1,6})\s+/.test(currentTrimmed) ||
        currentTrimmed.startsWith("$$") ||
        /^(\s*)[-*+]\s+/.test(current) ||
        /^(\s*)\d+[.)]\s+/.test(current)
      ) {
        break;
      }
      paragraphLines.push(currentTrimmed.replace(/^>\s?/, ""));
      index += 1;
    }
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    }
  }

  return blocks;
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = block.level <= 2 ? "h2" : "h3";
      return (
        <Tag key={key} className="text-[0.85rem] font-bold uppercase tracking-wide text-muted">
          {renderInline(block.text, `h${key}`)}
        </Tag>
      );
    }
    case "bullets":
      return (
        <ul key={key}>
          {block.items.map((item, itemIndex) => (
            <li
              key={`${key}-${itemIndex}`}
              style={{ marginLeft: `${item.level * 0.9}rem` }}
            >
              {renderInline(item.text, `b${key}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
    case "numbers":
      return (
        <ol key={key}>
          {block.items.map((item, itemIndex) => (
            <li
              key={`${key}-${itemIndex}`}
              style={{ marginLeft: `${item.level * 0.9}rem` }}
            >
              {renderInline(item.text, `n${key}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
    case "formula":
      return (
        <div key={key} className="formula">
          {block.text}
        </div>
      );
    case "paragraph":
    default:
      return <p key={key}>{renderInline(block.text, `p${key}`)}</p>;
  }
}

const MATH_SYMBOLS: Record<string, string> = {
  rightarrow: "→",
  to: "→",
  leftarrow: "←",
  leftrightarrow: "↔",
  Rightarrow: "⇒",
  Leftarrow: "⇐",
  Leftrightarrow: "⇔",
  times: "×",
  div: "÷",
  pm: "±",
  mp: "∓",
  approx: "≈",
  neq: "≠",
  ne: "≠",
  leq: "≤",
  le: "≤",
  geq: "≥",
  ge: "≥",
  infty: "∞",
  cdot: "·",
  cdots: "…",
  ldots: "…",
  log: "log",
  ln: "ln",
  sin: "sin",
  cos: "cos",
  tan: "tan",
  pi: "π",
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  Delta: "Δ",
  mu: "µ",
  Omega: "Ω",
  ohm: "Ω",
};

function normalizeMathExpression(expression: string): string {
  let out = expression;

  out = out.replace(
    /\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g,
    (_match, body: string) => {
      const rows = body
        .split(/\\\\/)
        .map((row) =>
          row
            .split("&")
            .map((cell) => cell.trim())
            .filter(Boolean)
            .join("  "),
        )
        .join(" ; ");
      return `[ ${rows} ]`;
    },
  );

  out = out.replace(/\\begin\{[^}]+\}|\\end\{[^}]+\}/g, " ");
  out = out.replace(
    /\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
    "($1)/($2)",
  );
  // Certaines commandes sont imbriquées (ex. \mathbf{450\text{ Mo}}).
  // On les retire de l'intérieur vers l'extérieur.
  const formatting =
    /\\(?:text|mathbf|mathrm|mathit|textbf|operatorname)\s*\{([^{}]*)\}/g;
  for (let pass = 0; pass < 4; pass += 1) {
    out = out.replace(formatting, "$1");
  }
  out = out.replace(
    /\\([a-zA-Z]+)/g,
    (match, command: string) => MATH_SYMBOLS[command] ?? match,
  );
  out = out.replace(/\\[,;:!]/g, " ");

  return out
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMathText(text: string): string {
  return text
    .replace(/\$\$([\s\S]+?)\$\$/g, (_match, expression: string) =>
      normalizeMathExpression(expression),
    )
    .replace(/\$([^$\n]+?)\$/g, (_match, expression: string) =>
      normalizeMathExpression(expression),
    );
}

export function renderInline(rawText: string, prefix = "i"): ReactNode[] {
  const text = normalizeMathText(rawText);
  const nodes: ReactNode[] = [];
  const pattern =
    /(\*\*(?:[^*]|\*(?!\*))+?\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const tokenKey = `${prefix}-${index}`;
    index += 1;

    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={tokenKey}>
          {renderInline(token.slice(2, -2), `${tokenKey}-strong`)}
        </strong>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={tokenKey}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={tokenKey}>
          {renderInline(token.slice(1, -1), `${tokenKey}-em`)}
        </em>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        nodes.push(
          <a
            key={tokenKey}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline underline-offset-2"
          >
            {link[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
