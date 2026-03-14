import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import styles from '../../student.module.css';
import { getSubmissionResult } from '../actions';

import { getScoreColor, getScoreStatus } from '../../../../utils/format';

export default async function StudentResultPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ sub?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const submissionId = resolvedSearch.sub;

  if (!submissionId) {
    redirect(`/hw/${resolvedParams.id}`);
  }

  const result = await getSubmissionResult(submissionId);

  if (!result) {
    notFound();
  }

  const percentage = (result.score / result.total_questions) * 100;
  const scoreColor = getScoreColor(percentage);
  const statusLabel = getScoreStatus(percentage);

  // Parse answers for review
  const reviews = (result.answers as any[]).map(ans => {
    const q = ans.questions;
    if (!q) {
      return {
        questionText: 'تم حذف هذا السؤال من قبل المعلم',
        studentAnswer: ans.selected_option || 'بدون إجابة',
        correctAnswer: 'غير متوفر',
        isCorrect: ans.is_correct,
        explanation: 'البيانات الأصلية لهذا السؤال لم تعد متوفرة.'
      };
    }
    const options = [q.option_a, q.option_b, q.option_c, q.option_d];
    const optionMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    const correctIdx = optionMap[q.correct_answer];
    const studentIdx = optionMap[ans.selected_option];

    return {
      questionText: q.question_text,
      studentAnswer: options[studentIdx] || 'بدون إجابة',
      correctAnswer: options[correctIdx],
      isCorrect: ans.is_correct,
      explanation: q.explanation,
      imageUrl: q.image_url
    };
  });

  return (
    <div className={styles.cardContainer} style={{ paddingBottom: '5rem' }}>
      <Card>
        <CardContent style={{ padding: '3rem 2rem' }}>
          <div className={styles.resultCircle} style={{ borderColor: scoreColor, background: `${scoreColor}10` }}>
            <span className={styles.scoreValue} style={{ color: scoreColor }}>{result.score}</span>
            <span className={styles.scoreTotal}>من {result.total_questions}</span>
          </div>
          
          <h1 className={styles.resultTitle}>نتيجتك يا {result.student_name}</h1>
          <p className={styles.resultSubtitle}>
            {statusLabel === 'ممتاز' ? 'أحسنت! أداء ممتاز 🌟' : 
             statusLabel === 'جيد' ? 'عمل جيد! يمكنك التحسن أكثر 👍' : 
             'حاول مرة أخرى في المرات القادمة 💪'}
          </p>
          
          <div className={styles.rankingBox}>
            <div className={styles.rankingLabel}>ترتيبك الآن</div>
            <div className={styles.rankingPosition}>
              <span>{result.rank}</span>
              <small> من {result.totalStudents} {result.totalStudents > 10 ? 'طالباً' : 'طلاب'}</small>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <Link href={`/hw/${resolvedParams.id}`} style={{ width: '100%' }}>
              <Button size="lg" fullWidth variant="outline" style={{ fontWeight: '800' }}>
                🏠 العودة للرئيسية
              </Button>
            </Link>
          </div>
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
              تم تسليم إجاباتك بنجاح. يمكنك مراجعة إجاباتك بالأسفل.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review Section */}
      <div className={styles.reviewSection}>
        <h2 className={styles.reviewSectionTitle}>مراجعة الإجابات</h2>
        {reviews.map((rev, idx) => (
          <div key={idx} className={styles.reviewQuestionCard}>
            <div className={styles.reviewQuestionText}>{idx + 1}. {rev.questionText}</div>
            
            {rev.imageUrl && (
              <div style={{ margin: '1rem 0', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img src={rev.imageUrl} alt="صورة السؤال" style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }} />
              </div>
            )}

            <div className={`${styles.statusIndicator} ${rev.isCorrect ? styles.correct : styles.incorrect}`}>
              {rev.isCorrect ? '✅ إجابة صحيحة' : '❌ إجابة خاطئة'}
            </div>

            <div className={styles.answerGrid}>
              <div className={styles.answerBox}>
                <span className={styles.answerLabel}>إجابتك</span>
                <span className={styles.answerValue}>{rev.studentAnswer}</span>
              </div>
              {!rev.isCorrect && (
                <div className={styles.answerBox} style={{ borderColor: 'var(--success)' }}>
                  <span className={styles.answerLabel}>الإجابة الصحيحة</span>
                  <span className={styles.answerValue} style={{ color: 'var(--success)' }}>{rev.correctAnswer}</span>
                </div>
              )}
            </div>

            {!rev.isCorrect && rev.explanation && (
              <div className={styles.explanationBox}>
                <span className={styles.explanationTitle}>تفسير المعلم:</span>
                <div className={styles.explanationText}>{rev.explanation}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
