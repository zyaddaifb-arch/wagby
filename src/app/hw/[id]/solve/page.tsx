import React from 'react';
import { getHomeworkByShareCode } from '../actions';
import { notFound, redirect } from 'next/navigation';
import { SolveQuizClient } from './SolveQuizClient';

export default async function StudentSolvePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ name?: string, phone?: string, parentPhone?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const shareCode = resolvedParams.id;
  const studentName = resolvedSearch.name;
  const studentPhone = resolvedSearch.phone || '';
  const parentPhone = resolvedSearch.parentPhone || '';
  
  const hw = await getHomeworkByShareCode(shareCode);
  
  if (!hw || hw.questions.length === 0) {
    notFound();
  }

  const isPhoneRequired = hw.settings?.requirePhone !== false;
  if (!studentName || (isPhoneRequired && !studentPhone)) {
    redirect(`/hw/${shareCode}`);
  }

  // Check for attempt limit
  const { getAttemptCount } = await import('../actions');
  const attemptCount = await getAttemptCount(hw.id, studentPhone, studentName);
  const maxAttempts = hw.settings?.maxAttempts ?? 1; // Default to 1 if not specified

  // 0 means unlimited attempts
  if (maxAttempts > 0 && attemptCount >= maxAttempts) {
    redirect(`/hw/${shareCode}?error=limit_reached&phone=${encodeURIComponent(studentPhone)}&name=${encodeURIComponent(studentName)}`);
  }

  return (
    <SolveQuizClient 
      shareCode={shareCode} 
      studentName={studentName} 
      studentPhone={studentPhone} 
      parentPhone={parentPhone}
      questions={hw.questions} 
      settings={hw.settings} 
    />
  );
}
