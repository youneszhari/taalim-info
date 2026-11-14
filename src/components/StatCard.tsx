import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, hint, icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "card relative overflow-hidden p-4 sm:p-5",
        accent && "border-accent/25",
      )}
    >
      {accent ? (
        <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-accent-soft blur-2xl" />
      ) : null}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
            {label}
          </p>
          <div className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
            {value}
          </div>
          {hint ? (
            <div className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
              {hint}
            </div>
          ) : null}
        </div>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-muted",
            accent && "border-accent/20 bg-accent-soft text-accent",
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
