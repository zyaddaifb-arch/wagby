'use client';
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { getScoreColor } from '@/utils/format';
import styles from './results.module.css';
import { Button } from '@/components/ui/Button';

type Question = {
  id: string;
  question_text: string;
  correct_answer: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order_index: number;
  explanation?: string;
};

type Answer = {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option: string;
  is_correct: boolean;
};

type Submission = {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  submitted_at: string;
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

  // Sorting and Ranking
  const ranked = useMemo(() =>
    [...submissions].sort((a, b) => b.score - a.score || new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    let result = [...ranked];
    if (search) {
      result = result.filter(s =>
        s.student_name.toLowerCase().includes(search.toLowerCase())
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
      const correctCount = answersForQ.filter(a => a.is_correct).length;
      const totalAnswers = answersForQ.length;
      const successPct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
      return { ...q, successPct, totalAnswers };
    });
  }, [sortedQuestions, allAnswers]);

  const hardestQuestion = useMemo(() => {
    if (questionStats.length === 0 || submissions.length === 0) return null;
    return [...questionStats].sort((a, b) => a.successPct - b.successPct)[0];
  }, [questionStats, submissions.length]);

  const top3 = ranked.slice(0, 3);
  const totalSubs = submissions.length;
  const avgPct = totalSubs > 0
    ? Math.round(submissions.reduce((sum, s) => sum + (s.score / s.total_questions) * 100, 0) / totalSubs)
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
                  const pct = Math.round((s.score / s.total_questions) * 100);
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
                        {s.score} / {s.total_questions}
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
                  const pct = Math.round((s.score / s.total_questions) * 100);
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
                        <div className={styles.cardName}>{s.student_name}</div>
                        <div className={styles.cardTime}>{new Date(s.submitted_at).toLocaleDateString('ar-EG')}</div>
                      </div>
                      <div className={styles.cardScore}>
                        <span style={{ color: scoreColor }}>{s.score}</span>
                        <span className={styles.cardScoreSlash}>/</span>
                        <span>{s.total_questions}</span>
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
                  <span className={styles.modalScore} style={{ color: getScoreColor((selectedStudent.score / selectedStudent.total_questions) * 100) }}>
                    الدرجة: {selectedStudent.score} / {selectedStudent.total_questions}
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
                    <span className={styles.ansStatus} style={{ color: item.answer?.is_correct ? '#22c55e' : '#ef4444' }}>
                      {item.answer?.is_correct ? '✅ صحيح' : '❌ خطأ'}
                    </span>
                  </div>
                  <p className={styles.ansText}>{item.question.question_text}</p>
                  
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

                  {!item.answer?.is_correct && (
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
