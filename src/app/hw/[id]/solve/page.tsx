import React from 'react';
import { getHomeworkByShareCode } from '../actions';
import { notFound, redirect } from 'next/navigation';
import { SolveQuizClient } from './SolveQuizClient';

export default async function StudentSolvePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ name?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const shareCode = resolvedParams.id;
  const studentName = resolvedSearch.name;
  
  if (!studentName) {
    redirect(`/hw/${shareCode}`);
  }

  const hw = await getHomeworkByShareCode(shareCode);
  
  if (!hw || hw.questions.length === 0) {
    notFound();
  }

  return <SolveQuizClient shareCode={shareCode} studentName={studentName} questions={hw.questions} />;
}
