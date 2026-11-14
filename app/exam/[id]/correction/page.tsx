import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamById, exams } from "@/data/exams";
import { CorrectionView } from "@/components/CorrectionView";

interface CorrectionPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return exams.map((exam) => ({ id: exam.id }));
}

export async function generateMetadata({
  params,
}: CorrectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const exam = getExamById(id);
  return {
    title: exam ? `Corrigé — ${exam.title}` : "Corrigé",
  };
}

export default function CorrectionPage({ params }: CorrectionPageProps) {
  return (
    <Suspense fallback={<CorrectionSkeleton />}>
      <CorrectionContent params={params} />
    </Suspense>
  );
}

async function CorrectionContent({ params }: CorrectionPageProps) {
  const { id } = await params;
  const exam = getExamById(id);
  if (!exam) notFound();
  return <CorrectionView exam={exam} />;
}

function CorrectionSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="skeleton h-4 w-36" />
      <div className="skeleton mt-4 h-9 w-2/3" />
      <div className="skeleton mt-3 h-4 w-1/2" />
      <div className="skeleton mt-6 h-10 w-56 rounded-xl" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="skeleton h-[34rem] rounded-2xl" />
        <div className="skeleton hidden h-72 rounded-2xl lg:block" />
      </div>
    </div>
  );
}
