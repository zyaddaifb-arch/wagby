'use client';
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getScoreColor } from '@/utils/format';
import styles from './results.module.css';
import { Button } from '@/components/ui/Button';
import { gradeEssayAnswer } from '../actions';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  question_type?: string;
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
  explanation?: string;
  points?: number;
};

type Answer = {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
  points_awarded?: number | null;
  text_answer?: string | null;
  image_urls?: string[] | null;
};

type Submission = {
  id: string;
  student_name: string;
  student_phone?: string;
  parent_phone?: string;
  score: number;
  total_questions: number;
  submitted_at: string;
  duration?: number;
};

interface ResultsViewProps {
  submissions: Submission[];
  questions: Question[];
  allAnswers: Answer[];
  hwInfo: {
    unsolvedCount: number;
  };
}

function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = Math.round((score / total) * 100);
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = getScoreColor(pct);
  return (
    <div className={styles.scoreRing}>
      <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className={styles.scoreRingLabel} style={{ color }}>
        <span className={styles.scoreRingPct}>{pct}%</span>
      </div>
    </div>
  );
}

export function ResultsView({ submissions, questions, allAnswers, hwInfo }: ResultsViewProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('score_desc');
  const [selectedStudent, setSelectedStudent] = useState<Submission | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradesParams, setGradesParams] = useState<Record<string, number>>({});
  const router = useRouter();

  const isPendingGrading = (subId: string) => {
    const subAnswers = allAnswers.filter(a => a.submission_id === subId);
    return subAnswers.some(a => {
      const q = questions.find(q => q.id === a.question_id);
      return q?.question_type === 'essay' && (a.points_awarded === null || a.points_awarded === undefined);
    });
  };

  const handleGrade = async (subId: string, qId: string, pointsAwarded: number) => {
    setIsGrading(true);
    try {
      const res = await gradeEssayAnswer(subId, qId, pointsAwarded);
      if (res.success) {
        // The page will revalidate, but we might want to update local state too or just refresh
        router.refresh();
      } else {
        alert('فشل في رصد الدرجة: ' + res.error);
      }
    } catch (err) {
      alert('حدث خطأ أثناء رصد الدرجة.');
    } finally {
      setIsGrading(false);
    }
  };

  // Sorting and Ranking
  const hwTotalPoints = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.points || 1), 0);
  }, [questions]);

  const ranked = useMemo(() =>
    [...submissions].sort((a, b) => b.score - a.score || new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    let result = [...ranked];
    if (search) {
      result = result.filter(s =>
        s.student_name.toLowerCase().includes(search.toLowerCase()) ||
        s.student_phone?.includes(search) ||
        s.parent_phone?.includes(search)
      );
    }
    if (sortBy === 'score_asc') {
      result = [...result].sort((a, b) => a.score - b.score);
    } else if (sortBy === 'name_asc') {
      result = [...result].sort((a, b) => a.student_name.localeCompare(b.student_name, 'ar'));
    } else if (sortBy === 'time_desc') {
      result = [...result].sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
    }
    return result;
  }, [ranked, search, sortBy]);

  // Question Statistics
  const sortedQuestions = useMemo(() => 
    [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions]
  );

  const questionStats = useMemo(() => {
    return sortedQuestions.map(q => {
      const answersForQ = allAnswers.filter(a => a.question_id === q.id);
      const totalAnswers = answersForQ.length;
      
      let successPct = 0;
      if (q.question_type === 'essay') {
        const gradedAnswers = answersForQ.filter(a => a.points_awarded !== null && a.points_awarded !== undefined);
        const totalPointsAwarded = gradedAnswers.reduce((sum, a) => sum + (a.points_awarded || 0), 0);
        const maxPossible = gradedAnswers.length * (q.points || 1);
        successPct = maxPossible > 0 ? Math.round((totalPointsAwarded / maxPossible) * 100) : 0;
      } else {
        const correctCount = answersForQ.filter(a => a.is_correct).length;
        successPct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
      }

      return { ...q, successPct, totalAnswers };
    });
  }, [sortedQuestions, allAnswers]);

  const hardestQuestion = useMemo(() => {
    if (questionStats.length === 0 || submissions.length === 0) return null;
    return [...questionStats].sort((a, b) => a.successPct - b.successPct)[0];
  }, [questionStats, submissions.length]);

  const top3 = ranked.slice(0, 3);
  const totalSubs = submissions.length;
  const avgPct = totalSubs > 0 && hwTotalPoints > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.score / hwTotalPoints) * 100, 0) / totalSubs)
    : 0;

  const studentAnswers = useMemo(() => {
    if (!selectedStudent) return [];
    return sortedQuestions.map(q => {
      const ans = allAnswers.find(a => a.submission_id === selectedStudent.id && a.question_id === q.id);
      return { question: q, answer: ans };
    });
  }, [selectedStudent, sortedQuestions, allAnswers]);

  if (submissions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <h2 className={styles.emptyTitle}>لم يحل أي طالب الواجب بعد</h2>
        <p className={styles.emptyText}>شارك رابط الواجب مع طلابك لتبدأ في رؤية نتائجهم هنا.</p>
      </div>
    );
  }

  const medalColors: Record<number, { border: string; bg: string; badge: string; label: string }> = {
    0: { border: '#fbbf24', bg: 'rgba(251,191,36,0.08)', badge: '#fbbf24', label: '🥇' },
    1: { border: '#94a3b8', bg: 'rgba(148,163,184,0.06)', badge: '#94a3b8', label: '🥈' },
    2: { border: '#b45309', bg: 'rgba(180,83,9,0.08)', badge: '#cd7f32', label: '🥉' },
  };

  const getOptionLabel = (q: Question, key: string) => {
    if (key === 'a') return q.option_a;
    if (key === 'b') return q.option_b;
    if (key === 'c') return q.option_c;
    if (key === 'd') return q.option_d;
    return 'غير معروف';
  };

  return (
    <div className={styles.resultsRoot}>

      {/* ── Summary Section ── */}
      <div className={styles.quickStats}>
        <div className={styles.qStat}>
          <span className={styles.qStatVal}>{totalSubs}</span>
          <span className={styles.qStatLabel}>تم الحل</span>
        </div>
        <div className={styles.qStat}>
          <span className={styles.qStatVal}>{hwInfo.unsolvedCount}</span>
          <span className={styles.qStatLabel}>لم يحل بعد</span>
        </div>
        <div className={styles.qStat}>
          <span className={styles.qStatVal} style={{ color: getScoreColor(avgPct) }}>{avgPct}%</span>
          <span className={styles.qStatLabel}>متوسط الدرجات</span>
        </div>
        <div className={styles.qStat}>
          <span className={styles.qStatVal}>{questions.length}</span>
          <span className={styles.qStatLabel}>عدد الأسئلة</span>
        </div>
        {hardestQuestion && (
          <div className={`${styles.qStat} ${styles.hardestStat}`}>
            <span className={styles.qStatVal} style={{ color: '#ef4444' }}>{hardestQuestion.successPct}%</span>
            <span className={styles.qStatLabel}>أصعب سؤال (#{questionStats.findIndex(q => q.id === hardestQuestion.id) + 1})</span>
          </div>
        )}
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          {/* ── Question Insights ── */}
          <div className={styles.insightsSection}>
            <h3 className={styles.sectionTitle}>📊 تحليل الأسئلة</h3>
            <div className={styles.insightsList}>
              {questionStats.map((q, idx) => (
                <div key={q.id} className={styles.insightItem}>
                  <div className={styles.insightInfo}>
                    <span className={styles.insightNumber}>سؤال {idx + 1}</span>
                    <span className={styles.insightText}>{q.question_text.length > 40 ? q.question_text.substring(0, 40) + '...' : q.question_text}</span>
                  </div>
                  <div className={styles.insightBarContainer}>
                    <div className={styles.insightBar} style={{ width: `${q.successPct}%`, backgroundColor: getScoreColor(q.successPct) }} />
                    <span className={styles.insightPct}>{q.successPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Podium (Top 3) ── */}
          {top3.length >= 1 && (
            <div className={styles.podiumSection}>
              <h3 className={styles.sectionTitle}>🏆 لوحة الشرف</h3>
              <div className={styles.podiumGrid}>
                {[1, 0, 2].map((idx) => {
                  const s = top3[idx];
                  if (!s) return null;
                  const m = medalColors[idx];
                  const pct = hwTotalPoints > 0 ? Math.round((s.score / hwTotalPoints) * 100) : 0;
                  return (
                    <div
                      key={s.id}
                      className={`${styles.podiumCard} ${idx === 0 ? styles.podiumFirst : ''}`}
                      style={{ borderColor: m.border, background: `linear-gradient(160deg, ${m.bg} 0%, var(--card) 60%)` }}
                    >
                      <div className={styles.podiumMedal}>{m.label}</div>
                      <div className={styles.podiumAvatar}>
                        {s.student_name.charAt(0)}
                      </div>
                      <div className={styles.podiumName}>{s.student_name}</div>
                      <div className={styles.podiumScore} style={{ color: getScoreColor(pct) }}>
                        {s.score} / {hwTotalPoints}
                      </div>
                      <div className={styles.podiumPct} style={{ color: getScoreColor(pct) }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.rightCol}>
          {/* ── Student Results List ── */}
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <h3 className={styles.sectionTitle}>👥 نتائج الطلاب</h3>
              <div className={styles.filterBar}>
                <Input
                  className={styles.miniSearch}
                  placeholder="ابحث..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  options={[
                    { label: 'الأعلى درجة', value: 'score_desc' },
                    { label: 'الأقل درجة', value: 'score_asc' },
                    { label: 'الاسم (أ-ي)', value: 'name_asc' },
                    { label: 'الأحدث', value: 'time_desc' },
                  ]}
                />
              </div>
            </div>

            <div className={styles.cardsGrid}>
              {filteredSubmissions.length === 0 ? (
                <div className={styles.noResults}>لا توجد نتائج تطابق بحثك</div>
              ) : (
                filteredSubmissions.map((s) => {
                  const pct = hwTotalPoints > 0 ? Math.round((s.score / hwTotalPoints) * 100) : 0;
                  const rank = ranked.findIndex(r => r.id === s.id) + 1;
                  const scoreColor = getScoreColor(pct);
                  const isTop = rank === 1;

                  return (
                    <div key={s.id} className={`${styles.studentCard} ${isTop ? styles.topStudent : ''}`} onClick={() => setSelectedStudent(s)}>
                      <div className={styles.cardRank}>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}</div>
                      <div className={styles.cardAvatar} style={{ background: `${scoreColor}22`, borderColor: `${scoreColor}55` }}>
                        <span style={{ color: scoreColor }}>{s.student_name.charAt(0)}</span>
                      </div>
                      <div className={styles.cardInfo}>
                        <div className={styles.cardName}>
                          {s.student_name}
                          {isPendingGrading(s.id) && (
                            <span className={styles.pendingBadge}>⏳ يحتاج تصحيح</span>
                          )}
                        </div>
                        <div className={styles.cardTime}>
                          <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.student_phone}</span>
                          {s.parent_phone && (
                            <span style={{ color: '#6366f1', fontWeight: 600, marginRight: '8px' }}> (لي أمر: {s.parent_phone})</span>
                          )} • {new Date(s.submitted_at).toLocaleDateString('ar-EG')}
                          {s.duration !== undefined && s.duration > 0 && (
                            <> • ⏱️ {Math.floor(s.duration / 60)}:{(s.duration % 60).toString().padStart(2, '0')}</>
                          )}
                        </div>
                      </div>
                      <div className={styles.cardScore}>
                        <span style={{ color: scoreColor }}>{s.score}</span>
                        <span className={styles.cardScoreSlash}>/</span>
                        <span>{hwTotalPoints}</span>
                      </div>
                      <div className={styles.cardAction}>
                        <span>👁️</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Student Detail Modal ── */}
      {selectedStudent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <h2>تفاصيل إجابة الطالب</h2>
                <div className={styles.modalSubHeader}>
                  <span className={styles.modalStudentName}>{selectedStudent.student_name}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, marginLeft: '1rem' }}>📱 {selectedStudent.student_phone}</span>
                  {selectedStudent.parent_phone && (
                    <span style={{ color: '#6366f1', fontWeight: 700, marginLeft: '1rem' }}>👨‍👩‍👧‍👦 {selectedStudent.parent_phone}</span>
                  )}
                  {selectedStudent.duration !== undefined && selectedStudent.duration > 0 && (
                    <span style={{ marginLeft: '1rem', color: 'var(--muted-foreground)', fontWeight: 700 }}>⏱️ {Math.floor(selectedStudent.duration / 60)}:{(selectedStudent.duration % 60).toString().padStart(2, '0')}</span>
                  )}
                  <span className={styles.modalScore} style={{ color: getScoreColor(hwTotalPoints > 0 ? (selectedStudent.score / hwTotalPoints) * 100 : 0) }}>
                    الدرجة: {selectedStudent.score} / {hwTotalPoints}
                  </span>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelectedStudent(null)}>✕</button>
            </div>
            
            <div className={styles.answersList}>
              {studentAnswers.map((item, idx) => (
                <div key={item.question.id} className={styles.answerItem}>
                  <div className={styles.answerQHead}>
                    <span className={styles.ansNum}>سؤال {idx + 1}</span>
                    {item.question.question_type === 'essay' ? (
                      <span className={styles.ansStatus} style={{ color: item.answer?.points_awarded !== null && item.answer?.points_awarded !== undefined ? '#22c55e' : '#f59e0b' }}>
                        {item.answer?.points_awarded !== null && item.answer?.points_awarded !== undefined ? `✅ مصحح (${item.answer.points_awarded}/${item.question.points || 1})` : '⏳ قيد التصحيح'}
                      </span>
                    ) : (
                      <span className={styles.ansStatus} style={{ color: item.answer?.is_correct ? '#22c55e' : '#ef4444' }}>
                        {item.answer?.is_correct ? '✅ صحيح' : '❌ خطأ'}
                      </span>
                    )}
                  </div>
                  <p className={styles.ansText}>{item.question.question_text}</p>
                  
                  {item.question.question_type === 'essay' ? (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>إجابة الطالب:</span>
                        {(() => {
                          const text = item.answer?.text_answer;
                          const images = item.answer?.image_urls || [];
                          
                          if (!text && images.length === 0) {
                            return <span style={{ color: 'var(--muted-foreground)' }}>بدون إجابة</span>;
                          }

                          return (
                            <div>
                              {text && <p style={{ whiteSpace: 'pre-wrap', marginBottom: images.length > 0 ? '1rem' : 0, color: 'var(--foreground)' }}>{text}</p>}
                              {images.map((img, i) => (
                                <img key={i} src={img} alt="صورة إجابة الطالب" style={{ maxWidth: '100%', borderRadius: '0.5rem', border: '1px solid var(--border)', marginTop: i > 0 ? '0.5rem' : 0 }} />
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--card)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600 }}>الدرجة:</span>
                        <Input 
                          type="number" 
                          min={0} 
                          max={item.question.points || 1} 
                          value={gradesParams[item.answer?.id || ''] !== undefined ? gradesParams[item.answer?.id || ''] : (item.answer?.points_awarded ?? '')}
                          onChange={(e) => setGradesParams({...gradesParams, [item.answer?.id || '']: Number(e.target.value)})}
                          style={{ width: '80px', textAlign: 'center' }}
                        />
                        <span style={{ color: 'var(--muted-foreground)' }}> / {item.question.points || 1}</span>
                        <Button 
                          size="sm" 
                          variant="primary"
                          onClick={() => handleGrade(selectedStudent.id, item.question.id, gradesParams[item.answer?.id || ''] !== undefined ? gradesParams[item.answer?.id || ''] : (item.answer?.points_awarded || 0))}
                          disabled={isGrading}
                          style={{ marginRight: 'auto' }}
                        >
                          {item.answer?.points_awarded !== null && item.answer?.points_awarded !== undefined ? 'تحديث الدرجة' : 'حفظ الدرجة'}
                        </Button>
                        {(item.answer?.points_awarded === null || item.answer?.points_awarded === undefined) && (
                          <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>⚠️ بانتظار تصحيحك</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.ansOptions}>
                      <div className={`${styles.ansOpt} ${item.answer?.is_correct === false && item.answer?.selected_option === 'a' ? styles.optWrong : ''} ${item.question.correct_answer === 'a' && item.answer?.is_correct === false ? styles.optCorrectInfo : ''} ${item.answer?.is_correct && item.answer?.selected_option === 'a' ? styles.optCorrect : ''}`}>
                        <span className={styles.optLetter}>أ</span> {item.question.option_a}
                      </div>
                      <div className={`${styles.ansOpt} ${item.answer?.is_correct === false && item.answer?.selected_option === 'b' ? styles.optWrong : ''} ${item.question.correct_answer === 'b' && item.answer?.is_correct === false ? styles.optCorrectInfo : ''} ${item.answer?.is_correct && item.answer?.selected_option === 'b' ? styles.optCorrect : ''}`}>
                        <span className={styles.optLetter}>ب</span> {item.question.option_b}
                      </div>
                      <div className={`${styles.ansOpt} ${item.answer?.is_correct === false && item.answer?.selected_option === 'c' ? styles.optWrong : ''} ${item.question.correct_answer === 'c' && item.answer?.is_correct === false ? styles.optCorrectInfo : ''} ${item.answer?.is_correct && item.answer?.selected_option === 'c' ? styles.optCorrect : ''}`}>
                        <span className={styles.optLetter}>ج</span> {item.question.option_c}
                      </div>
                      <div className={`${styles.ansOpt} ${item.answer?.is_correct === false && item.answer?.selected_option === 'd' ? styles.optWrong : ''} ${item.question.correct_answer === 'd' && item.answer?.is_correct === false ? styles.optCorrectInfo : ''} ${item.answer?.is_correct && item.answer?.selected_option === 'd' ? styles.optCorrect : ''}`}>
                        <span className={styles.optLetter}>د</span> {item.question.option_d}
                      </div>
                    </div>
                  )}

                  {item.question.question_type !== 'essay' && !item.answer?.is_correct && (
                    <div className={styles.correctionArea}>
                      <span className={styles.correctLabel}>الإجابة الصحيحة:</span>
                      <span className={styles.correctVal}>{getOptionLabel(item.question, item.question.correct_answer)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.modalFooter}>
              <Button onClick={() => setSelectedStudent(null)}>إغلاق</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
