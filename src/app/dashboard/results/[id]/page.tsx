import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './results.module.css';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { CopyLinkButton } from './CopyLinkButton';
import { WhatsAppShareButton } from './WhatsAppShareButton';
import { ResultsView } from './ResultsView';
import { Button } from '@/components/ui/Button';

export default async function TeacherResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const homeworkId = resolvedParams.id;
  
  const supabase = await createClient();
  const cookieStore = await cookies();
  const isMockUser = cookieStore.get('sb-test-bypass')?.value === 'true';
  const { data: { user } } = await supabase.auth.getUser();
  
  if(!user && !isMockUser) {
    redirect('/login');
  }

  // Fetch homework and its questions
  let hw = null;
  let questions: any[] = [];
  if (user) {
    const { data: hwData } = await supabase
      .from('homeworks')
      .select('*, questions(*)')
      .eq('id', homeworkId)
      .eq('teacher_id', user.id)
      .single();
    hw = hwData;
    questions = hwData?.questions || [];
  }

  // Safety for mock users
  if (!hw && isMockUser) {
    hw = {
      id: homeworkId,
      title: 'واجب تجريبي (Sample Results)',
      created_at: new Date().toISOString(),
      total_students: 10,
      is_published: true,
      share_code: 'SAMPLE'
    };
    questions = [
      { id: 'q1', question_text: 'ما هو حاصل جمع ٢+٢؟', correct_answer: 'a', option_a: '٤', option_b: '٥', option_c: '٦', option_d: '٣', order_index: 0 },
      { id: 'q2', question_text: 'ما هي عاصمة مصر؟', correct_answer: 'b', option_a: 'الإسكندرية', option_b: 'القاهرة', option_c: 'الجيزة', option_d: 'أسوان', order_index: 1 }
    ];
  }

  if (!hw) {
    notFound();
  }

  // Fetch submissions AND all answers for these submissions
  let submissions = [];
  let allAnswers: any[] = [];
  if (user) {
    const { data: subData } = await supabase
      .from('submissions')
      .select('*')
      .eq('homework_id', homeworkId)
      .order('score', { ascending: false });
    submissions = subData || [];

    if (submissions.length > 0) {
      const subIds = submissions.map(s => s.id);
      const { data: ansData } = await supabase
        .from('answers')
        .select('*')
        .in('submission_id', subIds);
      allAnswers = ansData || [];
    }
  } else if (isMockUser) {
    submissions = [
      { id: 's1', student_name: 'طالب ١', score: 2, total_questions: 2, created_at: new Date().toISOString(), submitted_at: new Date().toISOString() },
      { id: 's2', student_name: 'طالب ٢', score: 1, total_questions: 2, created_at: new Date().toISOString(), submitted_at: new Date().toISOString() }
    ];
    allAnswers = [
      { submission_id: 's1', question_id: 'q1', is_correct: true, selected_option: 'a' },
      { submission_id: 's1', question_id: 'q2', is_correct: true, selected_option: 'b' },
      { submission_id: 's2', question_id: 'q1', is_correct: true, selected_option: 'a' },
      { submission_id: 's2', question_id: 'q2', is_correct: false, selected_option: 'c' }
    ];
  }

  const sortedSubmissions = submissions || [];
  const solvedCount = sortedSubmissions.length;
  const totalStudents = hw.total_students || 0;
  const unsolvedCount = Math.max(0, totalStudents - solvedCount);
  
  // Calculate Stats
  const scores = sortedSubmissions.map(s => s.score || 0);
  
  const avgScore = solvedCount > 0 
    ? (scores.reduce((a, b) => a + b, 0) / solvedCount).toFixed(1) 
    : 0;
  const highestScore = solvedCount > 0 ? Math.max(...scores) : 0;
  const lowestScore = solvedCount > 0 ? Math.min(...scores) : 0;

  return (
    <div className={styles.container}>
      <div className={styles.topNav}>
        <Link href="/dashboard" className={styles.backLink}>
          <span>&rarr;</span> العودة للوحة التحكم
        </Link>
      </div>
      
      <div className={styles.headerSection}>
        <div className={styles.headerTop}>
          <h1 className={styles.pageTitle}>{hw.title}</h1>
          <div className={styles.headerActions}>
            {hw.is_published && hw.share_code && (
              <>
                <WhatsAppShareButton shareCode={hw.share_code} title={hw.title} />
                <CopyLinkButton shareCode={hw.share_code} />
              </>
            )}
            <Link href={`/dashboard/create?id=${hw.id}`}>
              <Button variant="outline" size="lg" className={styles.editBtn}>✏️ تعديل الواجب</Button>
            </Link>
          </div>
        </div>

        <div className={styles.statsStrip}>
          <div className={styles.statChip}>
            <span className={styles.statIcon}>📅</span>
            <span className={styles.statLabel}>تم الإنشاء:</span>
            <span className={styles.statValue}>{new Date(hw.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statIcon}>👥</span>
            <span className={styles.statLabel}>إجمالي الطلاب:</span>
            <span className={styles.statValue}>{totalStudents}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statIcon}>✅</span>
            <span className={styles.statLabel}>تم الحل:</span>
            <span className={styles.statValue} style={{ color: '#22c55e' }}>{solvedCount}</span>
          </div>
          <div className={styles.statChip}>
            <span className={styles.statIcon}>❌</span>
            <span className={styles.statLabel}>لم يحل:</span>
            <span className={styles.statValue} style={{ color: '#ef4444' }}>{unsolvedCount}</span>
          </div>
        </div>
      </div>

      <ResultsView 
        submissions={sortedSubmissions} 
        questions={questions}
        allAnswers={allAnswers}
        hwInfo={{
          unsolvedCount
        }}
      />
    </div>
  );
}
