import { renderInline } from "./RichText";

interface MarkdownTableProps {
  markdown: string;
}

type Alignment = "left" | "center" | "right";

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseTable(markdown: string): {
  header: string[];
  alignments: Alignment[];
  rows: string[][];
} | null {
  const lines = markdown
    .replace(/\r\n?/g, "\n")
    .trim()
    .split("\n")
    .filter((line) => line.trim().startsWith("|"));
  if (lines.length < 2) return null;

  const header = splitRow(lines[0]);
  const separator = splitRow(lines[1]);
  const alignments: Alignment[] = separator.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
  const rows = lines.slice(2).map(splitRow);
  return { header, alignments, rows };
}

export function MarkdownTable({ markdown }: MarkdownTableProps) {
  const table = parseTable(markdown);
  if (!table) {
    return (
      <pre className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-4 text-xs">
        {markdown}
      </pre>
    );
  }

  const { header, alignments, rows } = table;
  const alignClass = (index: number) =>
    alignments[index] === "center"
      ? "text-center"
      : alignments[index] === "right"
        ? "text-right"
        : "text-left";

  return (
    <div className="md-table-wrap">
      <table className="md-table">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th key={index} className={alignClass(index)}>
                {cell ? renderInline(cell, `th-${index}`) : "—"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {header.map((_, cellIndex) => (
                <td key={cellIndex} className={alignClass(cellIndex)}>
                  {renderInline(
                    row[cellIndex] ?? "",
                    `td-${rowIndex}-${cellIndex}`,
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
