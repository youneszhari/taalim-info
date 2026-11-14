"use client";

import { useId } from "react";
import type { Attempt } from "@/types/quiz";
import { formatDate, formatScore } from "@/lib/utils";

interface ScoreChartProps {
  attempts: Attempt[];
}

const WIDTH = 820;
const HEIGHT = 250;
const PADDING = { top: 18, right: 18, bottom: 30, left: 38 };

export function ScoreChart({ attempts }: ScoreChartProps) {
  const gradientId = `chart-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ordered = [...attempts].sort(
    (a, b) => a.submittedAt - b.submittedAt,
  );

  if (ordered.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-muted">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
          </svg>
        </div>
        <p className="mt-3 text-sm font-semibold">Pas encore de courbe</p>
        <p className="mt-1 max-w-xs text-[0.72rem] leading-relaxed text-muted">
          Terminez un examen pour voir l&apos;évolution de vos scores tentative
          après tentative.
        </p>
      </div>
    );
  }

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const xFor = (index: number) =>
    ordered.length === 1
      ? PADDING.left + plotWidth / 2
      : PADDING.left + (index / (ordered.length - 1)) * plotWidth;
  const yFor = (score: number) =>
    PADDING.top +
    plotHeight -
    (Math.max(0, Math.min(80, score)) / 80) * plotHeight;

  const points = ordered.map((attempt, index) => ({
    x: xFor(index),
    y: yFor(attempt.score),
    attempt,
    index,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    PADDING.top + plotHeight
  } L ${points[0].x} ${PADDING.top + plotHeight} Z`;

  const labelStep = Math.max(1, Math.ceil(ordered.length / 10));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full min-w-[34rem]"
        role="img"
        aria-label="Courbe d'évolution des scores sur 80"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 20, 40, 60, 80].map((value) => {
          const y = yFor(value);
          return (
            <g key={value}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeDasharray={value === 0 ? undefined : "3 5"}
                strokeWidth="1"
              />
              <text
                x={PADDING.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="var(--muted-2)"
                fontSize="9"
                fontFamily="var(--app-font-mono)"
              >
                {value}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent-color)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point) => (
          <g key={point.attempt.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="var(--surface-raised)"
              stroke="var(--accent-color)"
              strokeWidth="2"
            >
              <title>
                {formatDate(point.attempt.submittedAt)} —{" "}
                {formatScore(point.attempt.score)}/80
              </title>
            </circle>
            {point.index % labelStep === 0 ||
            point.index === points.length - 1 ? (
              <text
                x={point.x}
                y={HEIGHT - 8}
                textAnchor="middle"
                fill="var(--muted-2)"
                fontSize="8.5"
                fontFamily="var(--app-font-mono)"
              >
                {point.index + 1}
              </text>
            ) : null}
          </g>
        ))}

        <text
          x={WIDTH - PADDING.right}
          y={PADDING.top + 10}
          textAnchor="end"
          fill="var(--muted-2)"
          fontSize="9"
          fontFamily="var(--app-font-mono)"
        >
          score /80
        </text>
      </svg>
    </div>
  );
}
