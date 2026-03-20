"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import styles from './create.module.css';
import { playSound } from '../../../utils/audio';
import { saveHomework, getHomeworkById, getDefaultSettings } from './actions';
import { ImageUploader } from './ImageUploader';
import { PreviewModal } from '../../../components/PreviewModal';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptions: number[];
  explanation: string;
  type: 'multiple_choice' | 'true_false' | 'essay';
  imageUrl: string | null;
  points: number;
}

function CreateForm() {
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [maxAttempts, setMaxAttempts] = useState<number>(1);
  const [totalStudents, setTotalStudents] = useState<number | ''>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [hideResult, setHideResult] = useState(false);
  const [layout, setLayout] = useState<'wizard' | 'scroll'>('wizard');
  const [showPreview, setShowPreview] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [defaultPoints, setDefaultPoints] = useState(1);
  
  useEffect(() => {
    async function fetchHomework() {
      if (!editId) {
        // Fetch default settings for new homework
        try {
          const settings = await getDefaultSettings();
          if (settings) {
            setRandomizeQuestions(settings.randomizeQuestions ?? false);
            setRandomizeAnswers(settings.randomizeAnswers ?? false);
            setHideResult(settings.showResult === 'hidden');
            setLayout(settings.layout ?? 'wizard');
            setMaxAttempts(settings.maxAttempts ?? 1);
          }
        } catch (err) {
          console.error("Failed to fetch default settings:", err);
        }
        setIsLoading(false);
        return;
      }
      try {
        const hw = await getHomeworkById(editId);
        if (hw) {
          setTitle(hw.title);
          setGrade(hw.grade || '');
          setDescription(hw.description || '');
          setTimeLimit(hw.time_limit || '');
          setMaxAttempts(hw.max_attempts || 1);
          setTotalStudents(hw.total_students || '');
          setSubmissionCount(hw.submissionCount || 0);
          setRandomizeQuestions(hw.randomize_questions || false);
          setRandomizeAnswers(hw.randomize_answers || false);
          setHideResult(hw.hide_result || false);
          setLayout(hw.layout || 'wizard');
          if (hw.questions && hw.questions.length > 0) {
              const mappedQuestions = (hw.questions as Record<string, unknown>[]).sort((a,b)=>Number(a.order_index) - Number(b.order_index)).map(q => {
                  const options = [
                    String(q.option_a), String(q.option_b), String(q.option_c), String(q.option_d),
                    String((q as any).option_e || ''), String((q as any).option_f || ''), String((q as any).option_g || ''), String((q as any).option_h || '')
                  ];
                  const qMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7 };
                  
                  // Handle multiple correct options stored as comma-separated string
                  const correctAnswersStr = String(q.correct_answer || '');
                  const correctOptions = correctAnswersStr.includes(',') 
                    ? correctAnswersStr.split(',').filter(val => val in qMap).map(val => qMap[val])
                    : (correctAnswersStr in qMap ? [qMap[correctAnswersStr]] : []);

                  return {
                      id: String(q.id),
                      text: String(q.question_text),
                      options,
                      correctOptions: correctOptions.length > 0 ? correctOptions : (q.correct_answer === 'essay' ? [] : [qMap[String(q.correct_answer)] ?? 0]),
                      explanation: q.explanation ? String(q.explanation) : '',
                      type: (q.question_type as 'multiple_choice' | 'true_false' | 'essay') || 'multiple_choice',
                      imageUrl: q.image_url ? String(q.image_url) : null,
                      points: typeof q.points === 'number' ? q.points : 1
                  };
              });
              setQuestions(mappedQuestions);
          }
        }
      } catch(err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHomework();
  }, [editId]);

  const addQuestion = (type: 'multiple_choice' | 'true_false' | 'essay' = 'multiple_choice') => {
    playSound('click');
    let options = ['', '', '', '', '', '', '', ''];
    if (type === 'true_false') {
      options = ['صح', 'خطأ', '', '', '', '', '', ''];
    }
    
    setQuestions([
      ...questions,
      { id: Date.now().toString(), text: '', options, correctOptions: [], explanation: '', type, imageUrl: null, points: defaultPoints }
    ]);
  };

  const removeQuestion = (id: string) => {
    playSound('pop');
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestionText = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const updateQuestionPoints = (id: string, points: number) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, points } : q));
  };

  const updateOptionText = (qId: string, optIndex: number, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOptions = [...q.options];
        newOptions[optIndex] = text;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const toggleCorrectOption = (qId: string, optIndex: number) => {
    playSound('click');
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        if (q.type === 'true_false') {
          return { ...q, correctOptions: [optIndex] };
        }
        
        const isAlreadySelected = q.correctOptions.includes(optIndex);
        const newCorrectOptions = isAlreadySelected
          ? q.correctOptions.filter(idx => idx !== optIndex)
          : [...q.correctOptions, optIndex].sort((a, b) => a - b);
          
        return { ...q, correctOptions: newCorrectOptions };
      }
      return q;
    }));
  };

  const updateExplanation = (id: string, explanation: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, explanation } : q));
  };

  const updateQuestionType = (id: string, type: 'multiple_choice' | 'true_false' | 'essay') => {
    playSound('click');
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (type === 'true_false') {
          return { ...q, type, options: ['صح', 'خطأ', '', '', '', '', '', ''], correctOptions: [] };
        }
        return { ...q, type, options: ['', '', '', '', '', '', '', ''], correctOptions: [] };
      }
      return q;
    }));
  };

  const updateImageUrl = (id: string, imageUrl: string | null) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, imageUrl } : q));
  };

  const validateQuestionsData = (shouldScroll = true) => {
    const newQuestionErrors: Record<string, string> = {};
    let firstInvalidId: string | null = null;

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        let qError = '';

        if (!q.text.trim()) {
            qError = 'يرجى إدخال نص السؤال';
        } else if (q.type !== 'essay' && q.correctOptions.length === 0) {
            qError = 'يرجى اختيار إجابة واحدة صحيحة على الأقل';
        } else if (q.type !== 'essay') {
            const filledOptions = q.options.filter(opt => opt.trim() !== '');
            if (q.type === 'multiple_choice' && filledOptions.length < 2) {
                qError = 'يرجى إدخال خيارين على الأقل';
            } else {
                const hasEmptyCorrectOption = q.correctOptions.some(idx => !q.options[idx].trim());
                if (hasEmptyCorrectOption) {
                    qError = 'يوجد إجابة مختارة فارغة';
                }
            }
        }

        if (qError) {
            newQuestionErrors[q.id] = qError;
            if (!firstInvalidId) firstInvalidId = q.id;
        }
    }

    setQuestionErrors(newQuestionErrors);

    if (Object.keys(newQuestionErrors).length > 0) {
        setError('يرجى تصحيح الأخطاء في الأسئلة أدناه');
        if (firstInvalidId && shouldScroll) {
            setTimeout(() => {
                const element = document.getElementById(`question-card-${firstInvalidId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
        return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        setError('يرجى إدخال عنوان الواجب');
        return;
      }
    }
    if (currentStep === 2) {
      if (!validateQuestionsData()) return;
    }
    setError(null);
    setCurrentStep(prev => prev + 1);
    playSound('click');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    playSound('pop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (isPublished: boolean) => {
    setError(null);
    
    // 1. Validate Title
    if (!title.trim()) {
      setError('يرجى إدخال عنوان الواجب');
      if (currentStep !== 1) {
        setCurrentStep(1);
      }
      return;
    }

    // 2. Validate Questions
    if (!validateQuestionsData(currentStep === 2)) {
      if (currentStep !== 2) {
        setCurrentStep(2);
        // If we switched steps, we need to try scrolling AFTER elements mount
        setTimeout(() => validateQuestionsData(true), 200);
      }
      return;
    }

    setIsSaving(true);
    playSound('pop');
    
    const result = await saveHomework({
        id: editId || undefined,
        title,
        grade,
        description,
        timeLimit: timeLimit === '' ? null : timeLimit,
        maxAttempts,
        totalStudents: totalStudents === '' ? 0 : totalStudents,
        isPublished,
        randomizeQuestions,
        randomizeAnswers,
        hideResult,
        layout,
        questions: questions.map(q => ({
          ...q,
          questionType: q.type,
          correctOptions: q.correctOptions
        }))
    });

    if (result.error) {
        setError(result.error);
        setIsSaving(false);
    } else {
        playSound('success');
        // Navigate after a short delay to allow toast or sound to play
        setTimeout(() => {
          router.push('/dashboard/hw');
          router.refresh();
        }, 500);
    }
  };

  if (isLoading) {
      return <div style={{textAlign:'center', padding:'3rem'}}>جاري التحميل...</div>;
  }

  const renderStep1 = () => (
    <div className={styles.formContent}>
      <Input 
        id="input-title"
        label="عنوان الواجب" 
        placeholder="مثال: مراجعة الفصل الأول" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      {/* Grade Select */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--foreground)', opacity: 0.9 }}>الصف الدراسي (اختياري)</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          style={{
            height: '3.25rem',
            width: '100%',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--input-border)',
            backgroundColor: 'var(--input)',
            color: 'var(--foreground)',
            padding: '0 1.25rem',
            fontSize: '1rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease',
          }}
        >
          <option value="">-- بدون تصنيف --</option>
          <option value="الصف الأول الابتدائي">الصف الأول الابتدائي</option>
          <option value="الصف الثاني الابتدائي">الصف الثاني الابتدائي</option>
          <option value="الصف الثالث الابتدائي">الصف الثالث الابتدائي</option>
          <option value="الصف الرابع الابتدائي">الصف الرابع الابتدائي</option>
          <option value="الصف الخامس الابتدائي">الصف الخامس الابتدائي</option>
          <option value="الصف السادس الابتدائي">الصف السادس الابتدائي</option>
          <option value="الصف الأول الإعدادي">الصف الأول الإعدادي</option>
          <option value="الصف الثاني الإعدادي">الصف الثاني الإعدادي</option>
          <option value="الصف الثالث الإعدادي">الصف الثالث الإعدادي</option>
          <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
          <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
          <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>وصف الواجب (اختياري)</label>
        <textarea 
          placeholder="شرح بسيط للطلاب حول الواجب..." 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '0.75rem', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--border)', 
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
            minHeight: '100px',
            fontSize: '0.95rem'
          }}
        />
      </div>
      <div className={styles.limitsGrid}>
        <Input 
          label="الوقت المحدد (بالدقائق)" 
          type="number"
          placeholder="بدون وقت" 
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value === '' ? '' : parseInt(e.target.value))}
        />
        <Input 
          label="أقصى عدد من المحاولات (0 = غير محدود)" 
          type="number"
          placeholder="مثال: 1" 
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 0)}
          min={0}
        />
        <Input 
          label="عدد طلاب الفصل (المتوقع)" 
          type="number"
          placeholder="مثال: 30" 
          value={totalStudents}
          onChange={(e) => setTotalStudents(e.target.value === '' ? '' : parseInt(e.target.value))}
          min={0}
        />
      </div>

      {/* NEW: Improved Display Settings Box */}
      <div style={{ 
        marginTop: '2rem', 
        backgroundColor: 'rgba(255,255,255,0.02)', 
        borderRadius: '1.25rem',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          style={{ 
            padding: '1.25rem 1.75rem', 
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderBottom: isSettingsOpen ? '1px solid var(--border)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>إعدادات عرض الواجب وعشوائية الأسئلة</h3>
          </div>
          <div style={{ 
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
            transform: isSettingsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--muted-foreground)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {isSettingsOpen && (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <Input 
                label="الدرجة الافتراضية لكل سؤال" 
                type="number"
                placeholder="مثال: 1" 
                value={defaultPoints}
                onChange={(e) => setDefaultPoints(parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Randomize Questions Toggle */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderRadius: '1.25rem',
                backgroundColor: randomizeQuestions ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                border: '2px solid',
                borderColor: randomizeQuestions ? 'var(--primary)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: randomizeQuestions ? '0 10px 25px rgba(59, 130, 246, 0.1)' : 'none',
              }} 
              onClick={() => setRandomizeQuestions(!randomizeQuestions)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '12px', 
                  backgroundColor: randomizeQuestions ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                  color: randomizeQuestions ? 'white' : 'var(--muted-foreground)',
                  transition: 'all 0.3s'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: randomizeQuestions ? 'var(--primary)' : 'inherit' }}>عشوائية الأسئلة</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>تغيير الترتيب لكل طالب</span>
                </div>
              </div>
              <div style={{ 
                width: '52px', 
                height: '28px', 
                backgroundColor: randomizeQuestions ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
                borderRadius: '20px', 
                position: 'relative',
                transition: 'background-color 0.3s'
              }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%', 
                  position: 'absolute', 
                  top: '3px', 
                  right: randomizeQuestions ? '3px' : '27px',
                  transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>
            {/* Randomize Answers Toggle */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderRadius: '1.25rem',
                backgroundColor: randomizeAnswers ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
                border: '2px solid',
                borderColor: randomizeAnswers ? 'var(--primary)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: randomizeAnswers ? '0 10px 25px rgba(59, 130, 246, 0.1)' : 'none',
              }} 
              onClick={() => setRandomizeAnswers(!randomizeAnswers)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '12px', 
                  backgroundColor: randomizeAnswers ? 'var(--primary)' : 'rgba(0,0,0,0.1)',
                  color: randomizeAnswers ? 'white' : 'var(--muted-foreground)',
                  transition: 'all 0.3s'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: randomizeAnswers ? 'var(--primary)' : 'inherit' }}>عشوائية الإجابات</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>تغيير ترتيب (أ، ب، ج، د)</span>
                </div>
              </div>
              <div style={{ 
                width: '52px', 
                height: '28px', 
                backgroundColor: randomizeAnswers ? 'var(--primary)' : 'rgba(255,255,255,0.1)', 
                borderRadius: '20px', 
                position: 'relative',
                transition: 'background-color 0.3s'
              }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%', 
                  position: 'absolute', 
                  top: '3px', 
                  right: randomizeAnswers ? '3px' : '27px',
                  transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>

            {/* Hide Results Toggle */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '1.5rem',
                borderRadius: '1.25rem',
                backgroundColor: hideResult ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
                border: '2px solid',
                borderColor: hideResult ? 'var(--danger)' : 'var(--border)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: hideResult ? '0 10px 25px rgba(239, 68, 68, 0.1)' : 'none',
              }} 
              onClick={() => setHideResult(!hideResult)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '12px', 
                  backgroundColor: hideResult ? 'var(--danger)' : 'rgba(0,0,0,0.1)',
                  color: hideResult ? 'white' : 'var(--muted-foreground)',
                  transition: 'all 0.3s'
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: hideResult ? 'var(--danger)' : 'inherit' }}>إخفاء النتيجة</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>منع الطالب من رؤية الدرجة بعد الحل</span>
                </div>
              </div>
              <div style={{ 
                width: '52px', 
                height: '28px', 
                backgroundColor: hideResult ? 'var(--danger)' : 'rgba(255,255,255,0.1)', 
                borderRadius: '20px', 
                position: 'relative',
                transition: 'background-color 0.3s'
              }}>
                <div style={{ 
                  width: '22px', 
                  height: '22px', 
                  backgroundColor: 'white', 
                  borderRadius: '50%', 
                  position: 'absolute', 
                  top: '3px', 
                  right: hideResult ? '3px' : '27px',
                  transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }} />
              </div>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            backgroundColor: 'rgba(255,255,255,0.015)',
            padding: '2rem',
            borderRadius: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
               <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)' }}>
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
               </div>
               <label style={{ fontSize: '1.1rem', fontWeight: 900 }}>طريقة عرض الأسئلة للطالب</label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
               <button 
                  type="button"
                  onClick={() => setLayout('wizard')}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    border: '3px solid',
                    borderColor: layout === 'wizard' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: layout === 'wizard' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: layout === 'wizard' ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: layout === 'wizard' ? '0 15px 35px rgba(59, 130, 246, 0.2)' : 'none',
                    transform: layout === 'wizard' ? 'translateY(-4px)' : 'none'
                  }}
               >
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}><polyline points="9 18 15 12 9 6"/></svg>
                 <span>سؤال تلو الآخر</span>
                 <small style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 700 }}>نظام المعالج (Wizard)</small>
               </button>
               <button 
                  type="button"
                  onClick={() => setLayout('scroll')}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '1.25rem',
                    border: '3px solid',
                    borderColor: layout === 'scroll' ? 'var(--primary)' : 'var(--border)',
                    backgroundColor: layout === 'scroll' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)',
                    color: layout === 'scroll' ? 'var(--primary)' : 'var(--muted-foreground)',
                    fontWeight: 900,
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: layout === 'scroll' ? '0 15px 35px rgba(59, 130, 246, 0.2)' : 'none',
                    transform: layout === 'scroll' ? 'translateY(-4px)' : 'none'
                  }}
               >
                 <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '4px' }}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                 <span>جميع الأسئلة</span>
                 <small style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 700 }}>صفحة واحدة (Scroll)</small>
               </button>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);
    return (
    <div className={styles.formContent}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '1rem', border: '1px solid var(--primary)' }}>
         <h3 style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>إجمالي الدرجات</h3>
         <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{totalPoints}</div>
      </div>
      <div className={styles.questionsList}>
        {questions.map((q, qIndex) => (
          <Card key={q.id} id={`question-card-${q.id}`} className={`${styles.questionCard} ${questionErrors[q.id] ? styles.cardWithError : ''}`}>
            <CardHeader className={styles.qHeader} id={`question-header-${q.id}`}>
              <CardTitle className={styles.qTitle}>السؤال {qIndex + 1}</CardTitle>
              {questions.length > 1 && (
                <button 
                  onClick={() => removeQuestion(q.id)}
                  className={styles.removeBtn}
                  type="button"
                >
                  حذف
                </button>
              )}
            </CardHeader>
            <CardContent className={styles.qContent}>
              {questionErrors[q.id] && (
                <div className={styles.questionErrorAlert}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{questionErrors[q.id]}</span>
                </div>
              )}
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--foreground)', opacity: 0.8 }}>نوع السؤال</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        type="button" 
                        onClick={() => updateQuestionType(q.id, 'multiple_choice')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${q.type === 'multiple_choice' ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: q.type === 'multiple_choice' ? 'var(--primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                            color: q.type === 'multiple_choice' ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        اختيار من متعدد
                    </button>
                    <button 
                        type="button" 
                        onClick={() => updateQuestionType(q.id, 'true_false')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${q.type === 'true_false' ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: q.type === 'true_false' ? 'var(--primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                            color: q.type === 'true_false' ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        صح أو خطأ
                    </button>
                    <button 
                        type="button" 
                        onClick={() => updateQuestionType(q.id, 'essay')}
                        style={{
                            flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: `2px solid ${q.type === 'essay' ? 'var(--primary)' : 'var(--border)'}`,
                            backgroundColor: q.type === 'essay' ? 'var(--primary-light, rgba(59, 130, 246, 0.1))' : 'transparent',
                            color: q.type === 'essay' ? 'var(--primary)' : 'var(--muted-foreground)', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        مقالي / صورة
                    </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    id={`q-text-${qIndex}`}
                    placeholder="مثال: ما وحدة القوة في النظام الدولي؟" 
                    className={styles.qTextInput}
                    value={q.text}
                    onChange={(e) => updateQuestionText(q.id, e.target.value)}
                    required
                    label="نص السؤال"
                  />
                </div>
                <div style={{ width: '120px' }}>
                  <Input 
                    id={`q-points-${qIndex}`}
                    type="number"
                    min={1}
                    value={q.points}
                    onChange={(e) => updateQuestionPoints(q.id, parseInt(e.target.value) || 1)}
                    required
                    label="الدرجة"
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--foreground)', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>صورة السؤال (اختياري)</label>
                <ImageUploader 
                  value={q.imageUrl} 
                  onChange={(url) => updateImageUrl(q.id, url)} 
                />
              </div>
              
              {q.type === 'essay' ? (
                <div style={{ padding: '1.5rem', border: '2px dashed var(--border)', borderRadius: '1rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                  سيتم عرض مساحة نصية للطالب لكتابة الإجابة المقالية وإرفاق صورة (اختياري).
                </div>
              ) : (
                <div className={styles.optionsList}>
                  {q.options.map((optText, oIndex) => {
                    if (q.type === 'true_false' && oIndex > 1) return null;
                    
                    // Logic to decide if this option should be visible:
                    // 1. First 4 options are always visible for multiple choice
                    // 2. Options 5-8 are visible if they have text OR if the previous one has text
                    const isAlwaysVisible = oIndex < 4;
                    const isVisibleExtension = oIndex >= 4 && (optText.trim() !== '' || (oIndex > 0 && q.options[oIndex-1].trim() !== ''));
                    
                    if (q.type === 'multiple_choice' && !isAlwaysVisible && !isVisibleExtension) return null;

                    const isCorrect = q.correctOptions.includes(oIndex);
                    return (
                      <div key={oIndex} className={styles.optionRow}>
                         <div 
                          className={`${styles.radioInput} ${isCorrect ? styles.checked : ''}`}
                          onClick={() => toggleCorrectOption(q.id, oIndex)}
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: q.type === 'true_false' ? '50%' : '6px',
                            border: '2px solid var(--primary)',
                            backgroundColor: isCorrect ? 'var(--primary)' : 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isCorrect && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <Input 
                          id={`q-${q.id}-opt-${oIndex}`}
                          placeholder={q.type === 'true_false' ? (oIndex === 0 ? 'صح' : 'خطأ') : `الخيار ${oIndex + 1}`} 
                          className={styles.optionInput} 
                          value={optText}
                          onChange={(e) => updateOptionText(q.id, oIndex, e.target.value)}
                          required={oIndex < 2} // First 2 are usually required for multiple choice
                          disabled={q.type === 'true_false'}
                        />
                      </div>
                    );
                  })}
                  {q.type === 'multiple_choice' && q.options.filter(opt => opt.trim() !== '').length < 8 && (
                    <button 
                      type="button"
                      className={styles.addOptionBtn}
                      onClick={() => {
                        playSound('click');
                        const nextIndex = q.options.findIndex((opt, idx) => idx >= 4 && opt.trim() === '');
                        if (nextIndex !== -1) {
                          const nextInput = document.getElementById(`q-${q.id}-opt-${nextIndex}`);
                          if (nextInput) nextInput.focus();
                        }
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      إضافة خيار إضافي
                    </button>
                  )}
                  {q.type === 'multiple_choice' && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.75rem', marginRight: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>يمكنك اختيار أكثر من إجابة صحيحة</span>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>
                  {q.type === 'essay' ? 'ملاحظات تصحيح المعلم (اختياري)' : 'تفسير الإجابة الصحيحة / ملاحظات إضافية (اختياري)'}
                </label>
                <textarea 
                  placeholder={q.type === 'essay' ? 'أمثلة للإجابة المقبولة أو معايير التقييم...' : 'سيظهر هذا التفسير للطالب عند الإجابة بشكل خاطئ...'} 
                  value={q.explanation}
                  onChange={(e) => updateExplanation(q.id, e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    borderRadius: '0.5rem', 
                    border: '1px solid var(--border)', 
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    minHeight: '80px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <Button 
          variant="outline" 
          className={styles.addQuestionBtn} 
          onClick={() => addQuestion('multiple_choice')}
          onMouseEnter={() => playSound('pop')}
          style={{ flex: 1, minWidth: '200px' }}
          type="button"
        >
          + إضافة سؤال اختيار من متعدد
        </Button>
        <Button 
          variant="outline" 
          className={styles.addQuestionBtn} 
          onClick={() => addQuestion('true_false')}
          onMouseEnter={() => playSound('pop')}
          style={{ flex: 1, minWidth: '200px' }}
          type="button"
        >
          + إضافة سؤال صح أو خطأ
        </Button>
        <Button 
          variant="outline" 
          className={styles.addQuestionBtn} 
          onClick={() => addQuestion('essay')}
          onMouseEnter={() => playSound('pop')}
          style={{ flex: 1, minWidth: '200px' }}
          type="button"
        >
          + إضافة سؤال مقالي
        </Button>
      </div>
    </div>
  )};

  const renderStep3 = () => (
    <div className={styles.formContent}>
      <div className={styles.publishReview}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '0.5rem' }}>مراجعة الواجب</h3>
        <div className={styles.reviewItem}>
          <span className={styles.reviewLabel}>العنوان:</span>
          <span className={styles.reviewValue}>{title}</span>
        </div>
        <div className={styles.reviewItem}>
          <span className={styles.reviewLabel}>عدد الأسئلة:</span>
          <span className={styles.reviewValue}>{questions.length} أسئلة</span>
        </div>
        {timeLimit && (
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>الوقت المحدد:</span>
            <span className={styles.reviewValue}>{timeLimit} دقيقة</span>
          </div>
        )}
        <div className={styles.reviewItem}>
          <span className={styles.reviewLabel}>المحاولات:</span>
          <span className={styles.reviewValue}>{maxAttempts} محاولات</span>
        </div>
        
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0.5rem', border: '1px dashed var(--primary)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>
            بمجرد النشر، سيتمكن الطلاب من الوصول للواجب عبر الرابط.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>{editId ? 'تعديل الواجب' : 'إنشاء واجب جديد'}</h1>
      </div>

      <div className={styles.stepper}>
        <div className={`${styles.step} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}>
          <div className={styles.stepCircle}>1</div>
          <span className={styles.stepLabel}>المعلومات</span>
        </div>
        <div className={`${styles.step} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}>
          <div className={styles.stepCircle}>2</div>
          <span className={styles.stepLabel}>الأسئلة</span>
        </div>
        <div className={`${styles.step} ${currentStep >= 3 ? styles.active : ''}`}>
          <div className={styles.stepCircle}>3</div>
          <span className={styles.stepLabel}>النشر</span>
        </div>
      </div>

      <Card className={styles.mainCard}>
        <CardContent style={{ padding: 0 }}>
          {submissionCount > 0 && editId && (
            <div style={{
              margin: '1.5rem 2rem 0',
              padding: '1rem',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: 'var(--foreground)',
              fontWeight: 700
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              تنبيھ: ھذا الواجب يحتوي على {submissionCount} من النتائج السابقة. تعديل الأسئلة قد يؤثر على كيفية عرض النتائج القديمة.
            </div>
          )}
          {error && <div style={{color:'red', padding:'1rem 2rem 0', textAlign: 'center'}}>{error}</div>}
          
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          <div className={styles.wizardActions} style={{ padding: '0 2rem 2rem' }}>
            {currentStep > 1 ? (
              <Button id="btn-prev" variant="outline" onClick={prevStep}>السابق</Button>
            ) : (
              <Link href="/dashboard">
                <Button id="btn-cancel" variant="outline">إلغاء</Button>
              </Link>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {currentStep < 3 ? (
                <>
                  <Button id="btn-next" variant="primary" onClick={nextStep}>التالي</Button>
                </>
              ) : (
                <>
                  <Button id="btn-preview" variant="outline" onClick={() => setShowPreview(true)}>🔍 معاينة</Button>
                  <Button id="btn-save-draft" data-testid="save-draft-btn" variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>حفظ كمسودة</Button>
                  <Button 
                    id="btn-publish"
                    variant="primary" 
                    className={styles.publishBtn} 
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'جاري النشر...' : 'نشر الواجب'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <PreviewModal 
        isOpen={showPreview} 
        onClose={() => setShowPreview(false)} 
        title={title || 'واجب جديد'} 
        questions={questions} 
      />
    </div>
  );
}

export default function CreateHomeworkPage() {
    return (
        <Suspense fallback={<div style={{textAlign:'center', padding:'3rem'}}>جاري التحميل...</div>}>
            <CreateForm />
        </Suspense>
    )
}
