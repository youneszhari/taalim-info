import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamById } from "@/data/exams";
import { RetryView } from "@/components/RetryView";

interface RetryPageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export const metadata: Metadata = {
  title: "Rejeu des erreurs",
};

export default function RetryPage({ params }: RetryPageProps) {
  return (
    <Suspense fallback={<RetrySkeleton />}>
      <RetryContent params={params} />
    </Suspense>
  );
}

async function RetryContent({ params }: RetryPageProps) {
  const { id, attemptId } = await params;
  const exam = getExamById(id);
  if (!exam) notFound();
  return <RetryView exam={exam} attemptId={attemptId} />;
}

function RetrySkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-4 h-9 w-2/3" />
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton hidden h-72 rounded-2xl lg:block" />
      </div>
    </div>
  );
}
