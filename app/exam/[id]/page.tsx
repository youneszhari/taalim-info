import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamById, exams } from "@/data/exams";
import { QuizRunner } from "@/components/QuizRunner";

interface ExamPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Examen",
};

export function generateStaticParams() {
  return exams.map((exam) => ({ id: exam.id }));
}

export default function ExamPage({ params }: ExamPageProps) {
  return (
    <Suspense fallback={<ExamSkeleton />}>
      <ExamContent params={params} />
    </Suspense>
  );
}

async function ExamContent({ params }: ExamPageProps) {
  const { id } = await params;
  const exam = getExamById(id);
  if (!exam) notFound();
  return <QuizRunner exam={exam} />;
}

function ExamSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <div className="card p-6 sm:p-8">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton mt-4 h-8 w-2/3" />
        <div className="skeleton mt-3 h-4 w-1/2" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="skeleton h-28 rounded-xl" />
          <div className="skeleton h-28 rounded-xl" />
        </div>
        <div className="skeleton mt-6 h-11 w-48 rounded-xl" />
      </div>
    </div>
  );
}
