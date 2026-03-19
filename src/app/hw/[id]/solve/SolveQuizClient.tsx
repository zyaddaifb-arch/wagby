'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from '../../student.module.css';
import { submitHomework, type SubmissionInput } from '../actions';
import { playSound } from '@/utils/audio';
import { ImageUploader } from '@/app/dashboard/create/ImageUploader';

// Provide a quick check if a question is answered
const isQuestionAnswered = (
  qId: string, 
  qType: string, 
  answersState: Record<string, any>, 
  essayState: Record<string, any>
) => {
  if (qType === 'essay') {
    return !!(essayState[qId]?.text || essayState[qId]?.imageUrl);
  }
  return answersState[qId] !== undefined;
};

export function SolveQuizClient({ 
  shareCode, 
  studentName, 
  studentPhone,
  parentPhone,
  questions,
  settings
}: { 
  shareCode: string; 
  studentName: string; 
  studentPhone: string;
  parentPhone: string;
  questions: { 
    id: string, 
    question_text: string, 
    options: string[],
    question_type: 'multiple_choice' | 'true_false' | 'essay',
    image_url: string | null
  }[];
  settings?: {
    randomizeQuestions?: boolean;
    randomizeAnswers?: boolean;
    layout?: 'wizard' | 'scroll';
    timeLimit?: number | null;
  };
}) {
  const router = useRouter();
  
  const [processedQuestions, setProcessedQuestions] = useState<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Fisher-Yates Shuffle Algorithm
  const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // 1. Process and shuffle questions ONLY on the client to ensure unique per-student experience
  // and prevent hydration mismatches.
  React.useEffect(() => {
    let qs = questions.map((q) => {
      let displayOptions = q.options.map((text, idx) => ({ text, originalIndex: idx }));
      
      if (q.question_type === 'true_false') {
        displayOptions = displayOptions.slice(0, 2);
      } else {
        displayOptions = displayOptions.filter(opt => opt.text.trim() !== '');
      }

      // Shuffle options if setting is enabled
      if (settings?.randomizeAnswers && q.question_type !== 'true_false') {
        displayOptions = shuffleArray(displayOptions);
      }

      return {
        ...q,
        displayOptions
      };
    });

    // Shuffle questions if setting is enabled
    if (settings?.randomizeQuestions) {
      qs = shuffleArray(qs);
    }

    setProcessedQuestions(qs);
    setIsReady(true);
  }, [questions, settings]);

  const isWizard = settings?.layout !== 'scroll';
  
  // State for Wizard mode
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Unified State for multiple choice questions (mapping questionId to selected original index)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  
  // State for Essay questions
  const [essayAnswers, setEssayAnswers] = useState<Record<string, { text?: string; imageUrl?: string | null }>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Timer states
  const [startTime] = useState(Date.now());
  const [timeLeft, setTimeLeft] = useState<number | null>(
    settings?.timeLimit ? settings.timeLimit * 60 : null
  );

  // Countdown effect
  React.useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      if (!isSubmitting) {
        handleSubmit(true);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting]);

  // Helper to format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLastQuestion = currentIndex === processedQuestions.length - 1;

  // Number of answered questions for progress
  const answeredCount = Object.keys(selectedAnswers).length + 
                        Object.keys(essayAnswers).filter(id => !!(essayAnswers[id]?.text || essayAnswers[id]?.imageUrl)).length;
  // Make sure progressPercent is between 0 and 100
  const progressPercent = Math.min(100, Math.round((answeredCount / (processedQuestions.length || 1)) * 100));

  const handleNext = () => {
    playSound('click');
    if (!isLastQuestion) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleOptionSelectWizard = (qId: string, originalIndex: number) => {
    playSound('click');
    setSelectedAnswers(prev => ({ ...prev, [qId]: originalIndex }));
  }

  const handleOptionSelectScroll = (qId: string, originalIndex: number) => {
    playSound('click');
    setSelectedAnswers(prev => ({ ...prev, [qId]: originalIndex }));
  }

  const handleSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    let missingCount = 0;
    const finalAnswers = processedQuestions.map((q) => {
      if (q.question_type === 'essay') {
         const ans = essayAnswers[q.id];
         if (!ans || (!ans.text && !ans.imageUrl)) {
             missingCount++;
             return null;
         }
         return { questionId: q.id, answerText: JSON.stringify(ans) };
      } else {
         const selectedIndex = selectedAnswers[q.id];
         if (selectedIndex === undefined) {
             missingCount++;
             return null;
         }
         return { questionId: q.id, selectedIndex };
      }
    }).filter(ans => ans !== null) as { questionId: string; selectedIndex?: number; answerText?: string }[];

    if (isWizard) {
      if (!isAutoSubmit && finalAnswers.length === 0) {
        setError('يرجى الإجابة على سؤال واحد على الأقل');
        playSound('pop');
        return;
      }
    } else {
      if (!isAutoSubmit && missingCount > 0) {
        setError('يرجى الإجابة على جميع الأسئلة قبل التسليم');
        playSound('pop');
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    if (!isAutoSubmit) playSound('pop');

    // Calculate duration in seconds
    const duration = Math.floor((Date.now() - startTime) / 1000);

    const input: SubmissionInput = {
      shareCode,
      studentName,
      studentPhone,
      parentPhone,
      answers: finalAnswers,
      duration
    };

    const result = await submitHomework(input);
    
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    } else {
      playSound('success');
      router.push(`/hw/${shareCode}/result?sub=${result.submissionId}`);
    }
  };

  if (!isReady) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
        <div style={{ width: '60px', height: '60px', border: '5px solid rgba(59, 130, 246, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>جاري تحضير الأسئلة...</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const question = isWizard ? processedQuestions[currentIndex] : null;

  const handleNavClick = (index: number, qId?: string) => {
    if (isWizard) {
      playSound('click');
      setCurrentIndex(index);
      // Optional: If navigating back, might want to restore selectedOption if it was answered 
      // but for simplicity, we just navigate to it. The state `wizardAnswers` tracks if they answered it.
    } else if (qId) {
      playSound('click');
      const element = document.getElementById(`q-${qId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  // Render the horizontal question navigation bar
  const renderQuestionNavBar = (mode: 'wizard' | 'scroll') => (
    <div className={styles.questionNavBar}>
      {processedQuestions.map((q, idx) => {
        const isCurrent = isWizard ? idx === currentIndex : false;
        const answered = isQuestionAnswered(q.id, q.question_type, selectedAnswers, essayAnswers);
        
        return (
          <button
            key={q.id}
            disabled={isSubmitting}
            className={`${styles.questionNavBtn} ${isCurrent ? styles.active : ''} ${answered ? styles.answered : ''}`}
            onClick={() => handleNavClick(idx, q.id)}
            aria-label={`الذهاب لسؤال ${idx + 1}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );

  // Wizard Mode UI
  if (isWizard && question) {
    return (
      <div className={styles.container}>
        <div className={styles.quizHeaderSticky}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={styles.questionCount} style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>
                السؤال {currentIndex + 1} من {processedQuestions.length}
              </span>
              {timeLeft !== null && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '6px 14px', 
                  backgroundColor: timeLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '12px',
                  color: timeLeft < 60 ? 'var(--danger)' : 'var(--primary)',
                  fontWeight: 900
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                {progressPercent}% تم الحل
              </span>
            </div>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBarFill}
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              {renderQuestionNavBar('wizard')}
            </div>
          </div>
        </div>

        <Card className={styles.quizCard}>
          <CardContent className={styles.quizCardContent}>
            {error && (
              <div className={styles.errorBox}>
                <div>{error}</div>
                {(error.includes('رقم الهاتف') || error.includes('المحاولات') || error.includes('الاسم')) && (
                  <Button 
                    variant="outline" 
                    className={styles.errorButton}
                    onClick={() => router.push(`/hw/${shareCode}?phone=${encodeURIComponent(studentPhone)}&name=${encodeURIComponent(studentName)}&error=${error.includes('المحاولات') ? 'limit_reached' : 'duplicate'}`)}
                  >
                    تعديل البيانات
                  </Button>
                )}
              </div>
            )}
            
            {question.image_url && (
              <div style={{ marginBottom: '2.5rem', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <img src={question.image_url} alt="صورة السؤال" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
            )}

            <h2 className={styles.questionText}>
              {question.question_text}
            </h2>

            {question.question_type === 'essay' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea
                  placeholder="اكتب إجابتك هنا..."
                  value={essayAnswers[question.id]?.text || ''}
                  onChange={(e) => setEssayAnswers(prev => ({ 
                    ...prev, 
                    [question.id]: { ...prev[question.id], text: e.target.value } 
                  }))}
                  style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', resize: 'vertical' }}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>إرفاق صورة (اختياري)</label>
                  <ImageUploader 
                    value={essayAnswers[question.id]?.imageUrl || null} 
                    onChange={(url) => setEssayAnswers(prev => ({ 
                      ...prev, 
                      [question.id]: { ...prev[question.id], imageUrl: url } 
                    }))} 
                  />
                </div>
              </div>
            ) : (
              <div className={styles.optionsGrid}>
                {question.displayOptions.map((opt: { text: string; originalIndex: number }, idx: number) => (
                  <label key={idx} className={styles.optionLabel}>
                    <input 
                      type="radio" 
                      name={`q-${question.id}`} 
                      className={styles.optionInput}
                      checked={selectedAnswers[question.id] === opt.originalIndex}
                      onChange={() => handleOptionSelectWizard(question.id, opt.originalIndex)}
                    />
                    <span className={styles.optionText}>{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            <div className={styles.wizardFooter}>
              <Button 
                variant="outline" 
                onClick={() => setCurrentIndex(prev => prev - 1)} 
                disabled={currentIndex === 0}
                className={styles.pagiBtn}
              >
                السابق
              </Button>
              <Button 
                onClick={currentIndex === processedQuestions.length - 1 ? () => handleSubmit() : handleNext} 
                className={styles.submitBtn}
              >
                {isSubmitting ? 'جاري التسليم...' : (currentIndex === processedQuestions.length - 1 ? 'تسليم الواجب' : 'السؤال التالي')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scroll Mode UI
  return (
    <div className={styles.scrollContainer}>
      <div className={styles.scrollHeader}>
        {timeLeft !== null && (
          <div className={styles.timerBadge}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
        <h1 className={styles.studentName}>{studentName}</h1>
        <p className={styles.scrollInstructions}>أجب على جميع الأسئلة ثم اضغط على زر التسليم في الأسفل</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {error && (
          <div className={styles.errorBox}>
            <div>{error}</div>
            {(error.includes('رقم الهاتف') || error.includes('المحاولات') || error.includes('الاسم')) && (
              <Button 
                variant="outline" 
                className={styles.errorButton}
                onClick={() => router.push(`/hw/${shareCode}?phone=${encodeURIComponent(studentPhone)}&name=${encodeURIComponent(studentName)}&error=${error.includes('المحاولات') ? 'limit_reached' : 'duplicate'}`)}
              >
                تعديل البيانات
              </Button>
            )}
          </div>
        )}
        
        <div style={{ marginTop: '1rem', marginBottom: '1rem', backgroundColor: 'var(--card)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '1rem', color: 'var(--foreground)' }}>أرقام الأسئلة للمراجعة والتنقل السريع:</h3>
          {renderQuestionNavBar('scroll')}
        </div>

        {processedQuestions.map((q, qIdx) => (
          <Card key={q.id} id={`q-${q.id}`} className={styles.scrollQuestionCard}>
            <div className={styles.scrollQuestionHeader}>
              <span className={styles.scrollQuestionNum}>سؤال {qIdx + 1}</span>
              {isQuestionAnswered(q.id, q.question_type, selectedAnswers, essayAnswers) && (
                <div className={styles.answeredBadge}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  تم الإجابة
                </div>
              )}
            </div>
            <CardContent className={styles.scrollCardContent}>
              {q.image_url && (
                <div className={styles.scrollQuestionImage}>
                  <img src={q.image_url} alt="صورة السؤال" />
                </div>
              )}
              <h2 className={styles.scrollQuestionText}>{q.question_text}</h2>
              {q.question_type === 'essay' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <textarea
                    placeholder="اكتب إجابتك هنا..."
                    value={essayAnswers[q.id]?.text || ''}
                    onChange={(e) => setEssayAnswers(prev => ({ 
                      ...prev, 
                      [q.id]: { ...prev[q.id], text: e.target.value } 
                    }))}
                    style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '1rem', resize: 'vertical' }}
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>إرفاق صورة (اختياري)</label>
                    <ImageUploader 
                      value={essayAnswers[q.id]?.imageUrl || null} 
                      onChange={(url) => setEssayAnswers(prev => ({ 
                        ...prev, 
                        [q.id]: { ...prev[q.id], imageUrl: url } 
                      }))} 
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.optionsGrid}>
                  {q.displayOptions.filter((o: { text: string; originalIndex: number }) => o.text.trim() !== '').map((opt: { text: string; originalIndex: number }, oIdx: number) => (
                    <label key={oIdx} className={styles.optionLabel}>
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        className={styles.optionInput}
                        checked={selectedAnswers[q.id] === opt.originalIndex}
                        onChange={() => handleOptionSelectScroll(q.id, opt.originalIndex)}
                      />
                      <span className={styles.optionText}>{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className={styles.scrollFooter}>
        <Button 
          size="lg" 
          onClick={() => handleSubmit()} 
          disabled={isSubmitting}
          className={styles.scrollSubmitBtn}
        >
          {isSubmitting ? 'جاري التسليم...' : 'إنهاء الواجب وتسليم الإجابات'}
        </Button>
      </div>
    </div>
  );
}
