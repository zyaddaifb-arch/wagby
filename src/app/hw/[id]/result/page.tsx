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

  const totalPoints = (result.answers as any[]).reduce((sum, ans) => sum + (ans.questions?.points || 1), 0);
  const percentage = totalPoints > 0 ? (result.score / totalPoints) * 100 : 0;
  const scoreColor = getScoreColor(percentage);
  const statusLabel = getScoreStatus(percentage);
  const isPendingGrading = result.status === 'pending_grading';

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
    
    let studentAnswer = 'بدون إجابة';
    let correctAnswer = 'غير متوفر';
    let studentImageUrl = null;
    
    if (q.question_type === 'essay') {
      try {
        const parsed = JSON.parse(ans.selected_option || '{}');
        studentAnswer = parsed.text || (parsed.imageUrl ? 'إجابة مرفقة كصورة' : 'بدون إجابة');
        studentImageUrl = parsed.imageUrl || null;
        correctAnswer = 'يتم التقييم من قبل المعلم';
      } catch (e) {
        studentAnswer = ans.selected_option || 'بدون إجابة';
        correctAnswer = 'يتم التقييم من قبل المعلم';
      }
    } else {
      const correctIdx = optionMap[q.correct_answer];
      const studentIdx = optionMap[ans.selected_option];
      studentAnswer = options[studentIdx] || 'بدون إجابة';
      correctAnswer = options[correctIdx] || 'غير متوفر';
    }

    return {
      questionText: q.question_text,
      questionType: q.question_type,
      studentAnswer,
      studentImageUrl,
      correctAnswer,
      isCorrect: ans.is_correct,
      explanation: q.explanation,
      imageUrl: q.image_url,
      points: q.points || 1,
      pointsAwarded: ans.points_awarded
    };
  });

  return (
    <div className={styles.resultContainer}>
      <Card>
        <CardContent className={styles.resultCardContent}>
          <div className={styles.resultCircle} style={{ borderColor: scoreColor, background: `${scoreColor}10` }}>
            <span className={styles.scoreValue} style={{ color: scoreColor }}>{result.score}</span>
            <span className={styles.scoreTotal}>من {totalPoints}</span>
          </div>
          
          <h1 className={styles.resultTitle}>نتيجتك يا {result.student_name}</h1>
          <p className={styles.resultSubtitle}>
            {isPendingGrading 
              ? 'أحسنت تسليم الواجب! يوجد أسئلة مقالية قيد التصحيح من قبل المعلم ⏳'
              : statusLabel === 'ممتاز' ? 'أحسنت! أداء ممتاز 🌟' : 
                statusLabel === 'جيد' ? 'عمل جيد! يمكنك التحسن أكثر 👍' : 
                'حاول مرة أخرى في المرات القادمة 💪'}
          </p>
          
          <div className={styles.rankingBox}>
            <div className={styles.rankingFlex}>
              <div>
                <div className={styles.rankingLabel}>ترتيبك الآن</div>
                <div className={styles.rankingPosition}>
                  <span>{result.rank}</span>
                  <small> من {result.totalStudents} {result.totalStudents > 10 ? 'طالباً' : 'طلاب'}</small>
                </div>
              </div>
              
              {result.duration > 0 && (
                <div className={styles.timeSpent}>
                  <div className={styles.rankingLabel}>الوقت المستغرق</div>
                  <div className={styles.timeValue}>
                    <span className={styles.timeIcon}>⏱️</span>
                    <span>{Math.floor(result.duration / 60)}:{(result.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.buttonWrapper}>
            <Link href={`/hw/${resolvedParams.id}`} style={{ width: '100%' }}>
              <Button size="lg" fullWidth variant="outline" style={{ fontWeight: '800' }}>
                🏠 العودة للرئيسية
              </Button>
            </Link>
          </div>
          
          <div className={styles.successNote}>
            <p>
              {isPendingGrading ? (
                <span style={{ color: '#f59e0b', fontWeight: 800 }}>⚠️ هذه الدرجة مؤقتة بانتظار تصحيح المعلم للأسئلة المقالية للحصول على الدرجة النهائية.</span>
              ) : (
                'تم حفظ إجاباتك ونتيجتك بنجاح. يمكنك مراجعة الإجابات بالأسفل.'
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Answer Review Section */}
      <div className={styles.reviewSection}>
        <h2 className={styles.reviewSectionTitle}>مراجعة الإجابات</h2>
        {reviews.map((rev, idx) => (
          <div key={idx} className={styles.reviewQuestionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className={styles.reviewQuestionText}>{idx + 1}. {rev.questionText}</div>
              <div style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 800 }}>
                {rev.points} درجات
              </div>
            </div>
            
            {rev.imageUrl && (
              <div className={styles.reviewImageWrapper}>
                <img src={rev.imageUrl} alt="صورة السؤال" className={styles.reviewImage} />
              </div>
            )}

            {rev.questionType !== 'essay' || rev.pointsAwarded !== null ? (
              <div className={`${styles.statusIndicator} ${rev.pointsAwarded > 0 ? styles.correct : styles.incorrect}`}>
                {rev.pointsAwarded > 0 ? `✅ حصلت على ${rev.pointsAwarded} / ${rev.points}` : `❌ حصلت على 0 / ${rev.points}`}
              </div>
            ) : (
              <div className={styles.statusIndicator} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 800 }}>
                📝 قيد التصحيح ({rev.points} درجات)
              </div>
            )}

            <div className={styles.answerGrid}>
              <div className={styles.answerBox}>
                <span className={styles.answerLabel}>إجابتك</span>
                <span className={styles.answerValue}>{rev.studentAnswer}</span>
                {rev.studentImageUrl && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img src={rev.studentImageUrl} alt="صورة إجابة الطالب" style={{ maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid var(--border)' }} />
                  </div>
                )}
              </div>
              {rev.questionType !== 'essay' && !rev.isCorrect && (
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

      {/* Marketing Section */}
      <div className={styles.marketingBanner}>
        <p className={styles.marketingText}>
          تم إنشاء هذا الواجب بكل حب باستخدام منصة <Link href="/" className={styles.marketingLink}>واجبي</Link> 🚀
        </p>
        <div className={styles.marketingAction}>
          <p className={styles.marketingText}>
            هل أنت معلم؟ <Link href="/" className={styles.marketingCTA}>أنشئ حسابك الآن وجربها مجاناً</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
