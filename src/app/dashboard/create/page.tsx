"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import styles from './create.module.css';
import { playSound } from '../../../utils/audio';
import { saveHomework, getHomeworkById } from './actions';
import { ImageUploader } from './ImageUploader';
import { PreviewModal } from '../../../components/PreviewModal';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
  type: 'multiple_choice' | 'true_false';
  imageUrl: string | null;
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
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', options: ['', '', '', ''], correctOption: -1, explanation: '', type: 'multiple_choice', imageUrl: null }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [error, setError] = useState<string | null>(null);
  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [showPreview, setShowPreview] = useState(false);
  
  useEffect(() => {
    async function fetchHomework() {
      if (!editId) return;
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
          if (hw.questions && hw.questions.length > 0) {
              const mappedQuestions = (hw.questions as Record<string, unknown>[]).sort((a,b)=>Number(a.order_index) - Number(b.order_index)).map(q => {
                  const options = [String(q.option_a), String(q.option_b), String(q.option_c), String(q.option_d)];
                  const qMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
                  return {
                      id: String(q.id),
                      text: String(q.question_text),
                      options,
                      correctOption: qMap[String(q.correct_answer)] ?? 0,
                      explanation: q.explanation ? String(q.explanation) : '',
                      type: (q.question_type as 'multiple_choice' | 'true_false') || 'multiple_choice',
                      imageUrl: q.image_url ? String(q.image_url) : null
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

  const addQuestion = () => {
    playSound('click');
    setQuestions([
      ...questions,
      { id: Date.now().toString(), text: '', options: ['', '', '', ''], correctOption: -1, explanation: '', type: 'multiple_choice', imageUrl: null }
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

  const setCorrectOption = (qId: string, optIndex: number) => {
    playSound('click');
    setQuestions(questions.map(q => q.id === qId ? { ...q, correctOption: optIndex } : q));
  };

  const updateExplanation = (id: string, explanation: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, explanation } : q));
  };

  const updateQuestionType = (id: string, type: 'multiple_choice' | 'true_false') => {
    playSound('click');
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (type === 'true_false') {
          return { ...q, type, options: ['صح', 'خطأ', '', ''], correctOption: -1 };
        }
        return { ...q, type, options: ['', '', '', ''], correctOption: -1 };
      }
      return q;
    }));
  };

  const updateImageUrl = (id: string, imageUrl: string | null) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, imageUrl } : q));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        setError('يرجى إدخال عنوان الواجب');
        return;
      }
    }
    if (currentStep === 2) {
       // basic validation for questions: skip empty trailing questions/options
      for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.text.trim()) return setError(`السؤال ${i + 1} يفتقر إلى النص`);
          if (q.correctOption === -1) return setError(`السؤال ${i + 1}: يرجى اختيار الإجابة الصحيحة`);
          
          // Verify at least one option is filled
          const filledOptions = q.options.filter(opt => opt.trim() !== '');
          if (q.type === 'multiple_choice' && filledOptions.length < 2) return setError(`السؤال ${i + 1}: يرجى إدخال خيارين على الأقل`);
          
          // Ensure the selected correct option is not an empty string
          if (!q.options[q.correctOption].trim()) return setError(`السؤال ${i + 1}: الإجابة المختارة فارغة`);
      }
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
        questions
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
          label="أقصى عدد من المحاولات" 
          type="number"
          placeholder="مثال: 1" 
          value={maxAttempts}
          onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
          min={1}
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
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.formContent}>
      <div className={styles.questionsList}>
        {questions.map((q, qIndex) => (
          <Card key={q.id} className={styles.questionCard}>
            <CardHeader className={styles.qHeader}>
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
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '800', color: 'var(--foreground)', opacity: 0.8, display: 'block', marginBottom: '0.5rem' }}>صورة السؤال (اختياري)</label>
                <ImageUploader 
                  value={q.imageUrl} 
                  onChange={(url) => updateImageUrl(q.id, url)} 
                />
              </div>

              <Input 
                id={`q-text-${qIndex}`}
                placeholder="مثال: ما وحدة القوة في النظام الدولي؟" 
                className={styles.qTextInput}
                value={q.text}
                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                required
                label="نص السؤال"
              />
              
              <div className={styles.optionsList}>
                {q.options.map((optText, oIndex) => {
                  if (q.type === 'true_false' && oIndex > 1) return null;
                  return (
                    <div key={oIndex} className={styles.optionRow}>
                      <input 
                        type="radio" 
                        name={`correct-${q.id}`} 
                        className={styles.radioInput}
                        checked={q.correctOption === oIndex}
                        onChange={() => setCorrectOption(q.id, oIndex)}
                        title="اختر كإجابة صحيحة"
                      />
                      <Input 
                        placeholder={q.type === 'true_false' ? (oIndex === 0 ? 'صح' : 'خطأ') : `الخيار ${oIndex + 1}`} 
                        className={styles.optionInput} 
                        value={optText}
                        onChange={(e) => updateOptionText(q.id, oIndex, e.target.value)}
                        required
                        disabled={q.type === 'true_false'}
                      />
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--muted-foreground)' }}>تفسير الإجابة الصحيحة / ملاحظات إضافية (اختياري)</label>
                <textarea 
                  placeholder="سيظهر هذا التفسير للطالب عند الإجابة بشكل خاطئ..." 
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

      <Button 
        variant="outline" 
        className={styles.addQuestionBtn} 
        onClick={addQuestion}
        onMouseEnter={() => playSound('pop')}
        fullWidth
        type="button"
      >
        + إضافة سؤال
      </Button>
    </div>
  );

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

            {currentStep < 3 ? (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button id="btn-preview" variant="outline" onClick={() => setShowPreview(true)}>🔍 معاينة</Button>
                <Button id="btn-next" variant="primary" onClick={nextStep}>التالي</Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <Button id="btn-save-draft" variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>حفظ كمسودة</Button>
                <Button 
                  id="btn-publish"
                  variant="primary" 
                  className={styles.publishBtn} 
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                >
                  {isSaving ? 'جاري النشر...' : 'نشر الواجب'}
                </Button>
              </div>
            )}
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
