'use client';

import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import styles from '../app/hw/student.module.css';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  imageUrl: string | null;
}

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  questions: Question[];
}

export function PreviewModal({ isOpen, onClose, title, questions }: PreviewModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!isOpen || questions.length === 0) return null;

  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleNext = () => {
    if (question.type === 'essay' || selected !== null) {
      if (!isLastQuestion) {
        setCurrentQuestion(prev => prev + 1);
        setSelected(null);
        setShowExplanation(false);
      } else {
        // Reset or close on last
        onClose();
        setCurrentQuestion(0);
        setSelected(null);
        setShowExplanation(false);
      }
    }
  };

  const handleOptionSelect = (index: number) => {
    setSelected(index);
    if (index !== question.correctOption && question.explanation) {
      setShowExplanation(true);
    } else {
      setShowExplanation(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'var(--background)',
        borderRadius: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '2rem'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: 'var(--muted)',
            border: 'none',
            borderRadius: '50%',
            width: '2.5rem',
            height: '2.5rem',
            fontSize: '1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800 }}>معاينة الواجب (نسخة تجريبية)</span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.25rem' }}>{title}</h2>
        </div>

        <div className={styles.quizHeader}>
          <div className={styles.questionCount}>
            السؤال {currentQuestion + 1} من {questions.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ 
          width: '100%', 
          height: '6px', 
          backgroundColor: 'var(--border)', 
          borderRadius: '1rem', 
          marginBottom: '2rem',
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
          <CardContent style={{ padding: '2rem' }}>
            {question.imageUrl && (
              <div style={{ marginBottom: '1.5rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <img 
                  src={question.imageUrl} 
                  alt="صورة السؤال" 
                  style={{ width: '100%', maxHeight: '350px', objectFit: 'contain', backgroundColor: '#f8fafc' }} 
                />
              </div>
            )}

            <h2 className={styles.questionText} style={{ fontSize: '1.25rem' }}>{question.text}</h2>
            
            {question.type === 'essay' ? (
              <div style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '1rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                [مساحة إجابة الطالب (نص أو صورة)]
              </div>
            ) : (
              <div className={styles.optionsGrid}>
                {question.options.map((option, index) => {
                  if (question.type === 'true_false' && index > 1) return null;
                  if (!option && question.type === 'multiple_choice') return null;
                  
                  return (
                    <label key={index} className={styles.optionLabel}>
                      <input 
                        type="radio" 
                        name="preview-option" 
                        className={styles.optionInput} 
                        checked={selected === index}
                        onChange={() => handleOptionSelect(index)}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {showExplanation && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1.25rem', 
                backgroundColor: 'rgba(251, 191, 36, 0.1)', 
                borderRadius: '0.75rem', 
                border: '1px solid rgba(251, 191, 36, 0.3)',
                fontSize: '0.9rem',
                color: 'var(--foreground)'
              }}>
                <div style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💡</span> تفسير الإجابة:
                </div>
                {question.explanation || 'لا يوجد تفسير متاح لهذا السؤال.'}
              </div>
            )}

            <div style={{ marginTop: '2rem' }}>
              <Button 
                onClick={handleNext} 
                disabled={question.type !== 'essay' && selected === null}
                variant="primary"
                fullWidth
              >
                {isLastQuestion ? 'إغلاق المعاينة' : 'السؤال التالي ←'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
