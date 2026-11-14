import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamById } from "@/data/exams";
import { ResultView } from "@/components/ResultView";

interface ResultPageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export const metadata: Metadata = {
  title: "Résultat",
};

export default function ResultPage({ params }: ResultPageProps) {
  return (
    <Suspense fallback={<ResultSkeleton />}>
      <ResultContent params={params} />
    </Suspense>
  );
}

async function ResultContent({ params }: ResultPageProps) {
  const { id, attemptId } = await params;
  const exam = getExamById(id);
  if (!exam) notFound();
  return <ResultView exam={exam} attemptId={attemptId} />;
}

function ResultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-4 w-36" />
      <div className="skeleton mt-4 h-9 w-2/3" />
      <div className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_1fr]">
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
      <div className="skeleton mt-3 h-40 rounded-2xl" />
    </div>
  );
}
