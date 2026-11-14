import type { ExamQuestion } from "@/types/exam";
import { CodeBlock } from "./CodeBlock";
import { MarkdownTable } from "./MarkdownTable";
import { RichText } from "./RichText";

interface QuestionContentProps {
  question: ExamQuestion;
  className?: string;
  promptClassName?: string;
}

const PLACEHOLDER = /(\{\{CODE_\d+\}\}|\{\{TABLE\}\})/g;

export function QuestionContent({
  question,
  className,
  promptClassName,
}: QuestionContentProps) {
  const parts = question.prompt.split(PLACEHOLDER);
  const referencedCodes = new Set(
    parts
      .map((fragment) => {
        const match = fragment.match(/^\{\{CODE_(\d+)\}\}$/);
        return match ? Number(match[1]) : null;
      })
      .filter((value): value is number => value !== null),
  );

  const hasTablePlaceholder = parts.includes("{{TABLE}}");

  const nodes = parts
    .map((fragment, index) => {
      const codeMatch = fragment.match(/^\{\{CODE_(\d+)\}\}$/);
      if (codeMatch) {
        const codeIndex = Number(codeMatch[1]);
        const block = question.codeBlocks?.[codeIndex];
        if (!block) return null;
        return (
          <CodeBlock
            key={`code-${codeIndex}`}
            language={block.language}
            code={block.code}
          />
        );
      }
      if (fragment === "{{TABLE}}") {
        if (!question.tableMarkdown) return null;
        return (
          <MarkdownTable
            key={`table-${index}`}
            markdown={question.tableMarkdown}
          />
        );
      }
      if (!fragment.trim()) return null;
      return (
        <RichText
          key={`text-${index}`}
          markdown={fragment}
          className={promptClassName}
        />
      );
    })
    .filter(Boolean);

  const leftoverCodes = (question.codeBlocks ?? [])
    .map((block, index) => ({ block, index }))
    .filter(({ index }) => !referencedCodes.has(index));

  const leftoverTable = question.tableMarkdown && !hasTablePlaceholder;

  return (
    <div className={["space-y-3.5", className].filter(Boolean).join(" ")}>
      {nodes}
      {leftoverCodes.map(({ block, index }) => (
        <CodeBlock
          key={`leftover-code-${index}`}
          language={block.language}
          code={block.code}
        />
      ))}
      {leftoverTable ? (
        <MarkdownTable markdown={question.tableMarkdown as string} />
      ) : null}
    </div>
  );
}
