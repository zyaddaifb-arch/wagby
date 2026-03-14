'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from '../../student.module.css';
import { submitHomework, type SubmissionInput } from '../actions';
import { playSound } from '@/utils/audio';

export function SolveQuizClient({ 
  shareCode, 
  studentName, 
  questions 
}: { 
  shareCode: string; 
  studentName: string;
  questions: { 
    id: string, 
    question_text: string, 
    options: string[],
    question_type: 'multiple_choice' | 'true_false',
    image_url: string | null
  }[]
}) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedIndex: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleNext = () => {
    if (selected !== null) {
      playSound('click');
      setAnswers([
        ...answers,
        { questionId: questions[currentQuestion].id, selectedIndex: selected }
      ]);
      
      if (!isLastQuestion) {
        setCurrentQuestion(prev => prev + 1);
        setSelected(null);
      }
    }
  };

  const handleOptionSelect = (index: number) => {
    playSound('click');
    setSelected(index);
  }

  const handleSubmit = async () => {
    if (selected === null) return;
    
    setIsSubmitting(true);
    setError(null);
    playSound('pop');

    const finalAnswers = [
      ...answers,
      { questionId: questions[currentQuestion].id, selectedIndex: selected }
    ];

    const input: SubmissionInput = {
      shareCode,
      studentName,
      answers: finalAnswers
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

  const question = questions[currentQuestion];

  return (
    <div className={styles.cardContainer}>
      <div className={styles.quizHeader}>
        <div className={styles.questionCount}>
          السؤال {currentQuestion + 1} من {questions.length}
        </div>
        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>{studentName}</div>
      </div>

      {/* Progress Bar */}
      <div style={{ 
        width: '100%', 
        height: '6px', 
        backgroundColor: 'var(--border)', 
        borderRadius: '1rem', 
        marginBottom: '2.5rem',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${((currentQuestion + 1) / questions.length) * 100}%`, 
          height: '100%', 
          backgroundColor: 'var(--primary)',
          transition: 'width 0.4s ease'
        }} />
      </div>

      <Card>
        <CardContent style={{ padding: '2.5rem' }}>
          {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 700 }}>{error}</div>}
          
          {question.image_url && (
            <div style={{ marginBottom: '2rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img 
                src={question.image_url} 
                alt="صورة السؤال" 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#f8fafc' }} 
              />
            </div>
          )}

          <h2 className={styles.questionText}>{question.question_text}</h2>
          
          <div className={styles.optionsGrid}>
            {question.options.map((option, index) => {
              if (question.question_type === 'true_false' && index > 1) return null;
              if (!option && question.question_type === 'multiple_choice') return null; // Hide empty options in multiple choice
              
              return (
                <label key={index} className={styles.optionLabel}>
                  <input 
                    type="radio" 
                    name={`quiz-option-${question.id}`} 
                    className={styles.optionInput} 
                    checked={selected === index}
                    onChange={() => handleOptionSelect(index)}
                  />
                  <span className={styles.optionText}>{option}</span>
                </label>
              );
            })}
          </div>

          <div className={styles.quizFooter}>
            {!isLastQuestion ? (
              <Button 
                onClick={handleNext} 
                disabled={selected === null}
                variant="primary"
                size="lg"
                className={styles.actionBtn}
                fullWidth
              >
                السؤال التالي &larr;
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={selected === null || isSubmitting}
                variant="primary"
                size="lg"
                className={`${styles.actionBtn} ${styles.publishBtn}`}
                style={{ backgroundColor: 'var(--success)' }}
                fullWidth
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إنهاء وتصحيح الواجب'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
