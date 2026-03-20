'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { playSound } from '@/utils/audio';
import styles from './dashboard.module.css';
import { deleteHomework, toggleClosed, publishHomework, convertToDraft } from './actions';
import { PreviewModal } from '@/components/PreviewModal';
import { getHomeworkById } from './create/actions';

type Homework = {
  id: string;
  title: string;
  grade?: string;
  share_code: string | null;
  is_published: boolean;
  is_closed: boolean;
  total_students: number;
  submissions_count: number;
  created_at: string;
  question_count: number;
};

interface HomeworkListProps {
  initialHomeworks: Homework[];
}

const ITEMS_PER_PAGE = 9;

export function HomeworkList({ initialHomeworks }: HomeworkListProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const gradeFilter = searchParams.get('grade');

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [homeworks, setHomeworks] = useState(initialHomeworks);
  const [toast, setToast] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ title: string, questions: any[] } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, gradeFilter]);

  const filteredHomeworks = useMemo(() => {
    return homeworks.filter((hw) => {
      const matchesSearch = hw.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = 
        activeFilter === 'all' || 
        (activeFilter === 'published' && hw.is_published && !hw.is_closed) ||
        (activeFilter === 'draft' && !hw.is_published) ||
        (activeFilter === 'closed' && hw.is_closed);
      
      const matchesGrade = !gradeFilter || 
                          (gradeFilter === 'عام' ? (!hw.grade || hw.grade === 'عام') : hw.grade === gradeFilter);
      
      return matchesSearch && matchesFilter && matchesGrade;
    });
  }, [homeworks, search, activeFilter, gradeFilter]);

  const paginatedHomeworks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHomeworks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHomeworks, currentPage]);

  const totalPages = Math.ceil(filteredHomeworks.length / ITEMS_PER_PAGE);

  const handleCopyLink = (shareCode: string) => {
    const url = `${window.location.origin}/hw/${shareCode}`;
    navigator.clipboard.writeText(url);
    setToast('تم نسخ الرابط بنجاح! ✅');
    playSound('success');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الواجب؟ لا يمكن التراجع عن هذه الخطوة.')) return;
    
    setDeletingId(id);
    playSound('pop');
    try {
      const result = await deleteHomework(id);
      if (result.success) {
        // Immediately remove from local state (optimistic update)
        setHomeworks(prev => prev.filter(hw => hw.id !== id));
        setExpandedId(null);
        setToast('تم حذف الواجب بنجاح. 🗑️');
        // Sync with server cache
        router.refresh();
      } else {
        alert('فشل حذف الواجب: ' + (result.error || 'خطأ غير معروف'));
      }
    } catch (err) {
      alert('حدث خطأ أثناء الحذف، يرجى المحاولة مرة أخرى.');
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    playSound('pop');
    const result = await publishHomework(id);
    if (result.success) {
      setHomeworks(prev => prev.map(hw => hw.id === id ? { ...hw, is_published: true, share_code: result.shareCode } : hw));
      setToast('تم نشر الواجب بنجاح! الرابط جاهز للمشاركة.');
    } else {
      alert('فشل نشر الواجب: ' + result.error);
    }
  };

  const handleToggleClosed = async (hw: Homework) => {
    playSound('click');
    const result = await toggleClosed(hw.id, hw.is_closed);
    if (result.success) {
      setHomeworks(prev => prev.map(h => h.id === hw.id ? { ...h, is_closed: !hw.is_closed } : h));
      setToast(hw.is_closed ? 'تم فتح الواجب مرة أخرى.' : 'تم إغلاق الواجب.');
    }
  };

  const handleConvertToDraft = async (id: string) => {
    playSound('pop');
    const result = await convertToDraft(id);
    if (result.success) {
      setHomeworks(prev => prev.map(hw => hw.id === id ? { ...hw, is_published: false } : hw));
      setToast('تم تحويل الواجب إلى مسودة. 🌑');
    } else {
      alert('فشل التحويل لمسودة: ' + result.error);
    }
  };

  const handleWhatsApp = (shareCode: string, title: string) => {
    const url = `${window.location.origin}/hw/${shareCode}`;
    const message = `أهلاً بك! يمكنك الآن حل واجب "${title}" عبر الرابط التالي: \n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const handlePreview = async (id: string, title: string) => {
    playSound('click');
    setIsPreviewLoading(true);
    try {
      const hw = await getHomeworkById(id);
      if (hw && hw.questions) {
          const mappedQuestions = (hw.questions as any[]).sort((a,b)=>Number(a.order_index) - Number(b.order_index)).map(q => {
            const options = [
              String(q.option_a), String(q.option_b), String(q.option_c), String(q.option_d),
              String(q.option_e || ''), String(q.option_f || ''), String(q.option_g || ''), String(q.option_h || '')
            ];
            const qMap: Record<string, number> = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7 };
            
            // Parse multiple correct options
            const correctOptions = q.correct_answer === 'essay' 
              ? [] 
              : (q.correct_answer || '').split(',').map((s: string) => qMap[s.trim()]).filter((idx: number | undefined) => idx !== undefined);

            return {
                id: String(q.id),
                text: String(q.question_text),
                options,
                correctOptions,
                explanation: q.explanation ? String(q.explanation) : '',
                type: (q.question_type as 'multiple_choice' | 'true_false' | 'essay') || 'multiple_choice',
                imageUrl: q.image_url ? String(q.image_url) : null
            };
          });
        setPreviewData({ title, questions: mappedQuestions });
      } else {
        alert('فشل في تحميل أسئلة الواجب.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تحميل المعاينة.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const statusClass = (hw: Homework) => hw.is_closed ? styles.closed : hw.is_published ? styles.published : styles.draft;
  const statusLabel = (hw: Homework) => hw.is_closed ? '🔴 مغلق' : hw.is_published ? '🟢 منشور' : '⚫ مسودة';

  const uniqueGrades = useMemo(() => {
    const grades = homeworks.map(h => h.grade || 'عام');
    return ['all', ...Array.from(new Set(grades))];
  }, [homeworks]);

  const handleGradeFilter = (grade: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (grade === 'all') {
      params.delete('grade');
    } else {
      params.set('grade', grade);
    }
    router.push(`/dashboard/hw?${params.toString()}`);
  };

  return (
    <div className={styles.container}>
      {toast && (
        <div 
          className={styles.toast} 
          id="toast-notification" 
          role="status" 
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      {/* Search and Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Input
            placeholder="البحث في الواجبات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'published', label: 'منشور' },
            { id: 'draft', label: 'مسودة' },
            { id: 'closed', label: 'مغلق' },
          ].map((f) => (
            <button
              key={f.id}
              className={`${styles.filterBtn} ${activeFilter === f.id ? styles.active : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grade Filter Bar */}
      <div className={styles.hwFilterSection}>
        <div className={styles.filterLabel}>
          <span>🎓</span> تصفية حسب الصف الدراسي:
        </div>
        <div className={styles.gradeChips}>
          {uniqueGrades.map((grade) => (
            <button
              key={grade}
              className={`${styles.gradeChip} ${(grade === 'all' && !gradeFilter) || grade === gradeFilter ? styles.active : ''}`}
              onClick={() => handleGradeFilter(grade)}
            >
              {grade === 'all' ? 'جميع الصفوف' : grade}
            </button>
          ))}
        </div>
      </div>

      {paginatedHomeworks.length === 0 ? (
        <div className={styles.emptyState}>
          {activeFilter === 'draft' ? (
            <>
              <div className={styles.emptyIcon}>🌑</div>
              <h2 className={styles.emptyTitle}>لا توجد مسودات</h2>
              <p className={styles.emptyText}>لم تقم بتحويل أي واجب لمسودة بعد.</p>
            </>
          ) : activeFilter === 'closed' ? (
            <>
              <div className={styles.emptyIcon}>🔒</div>
              <h2 className={styles.emptyTitle}>لا توجد واجبات مغلقة</h2>
              <p className={styles.emptyText}>كل واجباتك مفتوحة حالياً للحل.</p>
            </>
          ) : (
            <>
              <div className={styles.emptyIcon}>📝</div>
              <h2 className={styles.emptyTitle}>لا يوجد واجبات بعد</h2>
              <p className={styles.emptyText}>ابدأ بإنشاء أول واجب الآن وشاركه مع طلابك في دقائق.</p>
              <Link href="/dashboard/create">
                <Button variant="primary" size="lg">أنشئ أول واجب الآن</Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className={styles.hwCardsGrid}>
          {paginatedHomeworks.map((hw) => (
            <div key={hw.id} className={styles.hwCard}>
              {/* Card Header */}
              <div className={styles.hwCardHeader}>
                <div className={styles.hwCardMeta}>
                  <span className={`${styles.statusBadge} ${statusClass(hw)}`}>
                    {statusLabel(hw)}
                  </span>
                  {hw.grade && (
                    <span className={styles.gradeBadge}>{hw.grade}</span>
                  )}
                </div>
                <h3 className={styles.hwCardTitle}>{hw.title}</h3>
                <p className={styles.hwCardDate}>
                  {(hw.created_at ? new Date(hw.created_at) : new Date()).toLocaleDateString('ar-EG')} · {hw.question_count} أسئلة
                </p>
              </div>

              {/* Stats */}
              <div className={styles.hwCardStats}>
                <div className={styles.hwCardStat}>
                  <span className={styles.hwCardStatValue}>{hw.submissions_count}</span>
                  <span className={styles.hwCardStatLabel}>حل</span>
                </div>
                <div className={styles.hwCardStat}>
                  <span className={styles.hwCardStatValue}>{hw.total_students || '∞'}</span>
                  <span className={styles.hwCardStatLabel}>طالب</span>
                </div>
                <div className={styles.hwCardStat}>
                  <span className={styles.hwCardStatValue}>{hw.question_count}</span>
                  <span className={styles.hwCardStatLabel}>سؤال</span>
                </div>
              </div>

              {/* Primary Actions - Directly Visible */}
              <div className={styles.hwCardActionsRow}>
                {hw.is_published ? (
                  <>
                    <Link 
                      href={`/dashboard/results/${hw.id}`} 
                      className={styles.hwPrimaryBtn}
                      id={`hw-results-${hw.id}`}
                    >
                      📊 النتائج
                    </Link>
                    {hw.share_code && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleCopyLink(hw.share_code!)}
                        id={`hw-copy-${hw.id}`}
                      >
                        📋 نسخ الرابط
                      </Button>
                    )}
                  </>
                ) : (
                  <Button 
                    variant="primary" 
                    fullWidth 
                    size="sm" 
                    onClick={() => handlePublish(hw.id)}
                    id={`hw-publish-${hw.id}`}
                  >
                    🚀 نشر الواجب الآن
                  </Button>
                )}
              </div>

              {/* Toggle Secondary Details */}
              <button
                className={styles.hwCardToggle}
                onClick={() => setExpandedId(expandedId === hw.id ? null : hw.id)}
                id={`hw-toggle-${hw.id}`}
              >
                {expandedId === hw.id ? '▲ إخفاء الخيارات الإضافية' : '▼ المزيد من الخيارات'}
              </button>

              {/* Actions - Expanded Secondary */}
              {expandedId === hw.id && (
                <div className={styles.hwCardActions}>
                  <Link href={`/dashboard/create?id=${hw.id}`} className={styles.hwAction} id={`hw-edit-${hw.id}`}>
                    <span>✏️</span> تعديل البيانات
                  </Link>
                  <button 
                    onClick={() => handlePreview(hw.id, hw.title)} 
                    className={styles.hwAction} 
                    id={`hw-preview-${hw.id}`}
                    disabled={isPreviewLoading}
                  >
                    <span>👁️</span> {isPreviewLoading ? 'جاري التحميل...' : 'معاينة الواجب'}
                  </button>
                  {hw.is_published ? (
                    <button onClick={() => handleConvertToDraft(hw.id)} className={styles.hwAction} id={`hw-draft-${hw.id}`}>
                      <span>🌑</span> تحويل لمسودة
                    </button>
                  ) : (
                    <button onClick={() => handlePublish(hw.id)} className={styles.hwAction} id={`hw-publish-opt-${hw.id}`}>
                      <span>🚀</span> نشر الواجب الآن
                    </button>
                  )}
                  {hw.is_published && hw.share_code && (
                    <button onClick={() => handleWhatsApp(hw.share_code!, hw.title)} className={styles.hwAction} id={`hw-wa-${hw.id}`}>
                      <span>📲</span> إرسال واتساب
                    </button>
                  )}
                  <button 
                    onClick={() => handleToggleClosed(hw)} 
                    className={`${styles.hwAction} ${hw.is_closed ? styles.hwActionSuccess : styles.hwActionWarn}`}
                    id={`hw-close-${hw.id}`}
                  >
                    <span>{hw.is_closed ? '🔓' : '🔒'}</span> {hw.is_closed ? 'فتح للحل' : 'إغلاق الحل'}
                  </button>
                  <button 
                    onClick={() => handleDelete(hw.id)} 
                    className={`${styles.hwAction} ${styles.hwActionDanger}`}
                    id={`hw-delete-${hw.id}`}
                    disabled={deletingId === hw.id}
                  >
                    <span>{deletingId === hw.id ? '⏳' : '🗑️'}</span>
                    {deletingId === hw.id ? 'جاري الحذف...' : 'حذف الواجب'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button 
            variant="outline" 
            disabled={currentPage === 1} 
            onClick={() => { setCurrentPage(prev => prev - 1); playSound('click'); }}
          >
            السابق
          </Button>
          <span style={{ fontWeight: 700 }}>{currentPage} من {totalPages}</span>
          <Button 
            variant="outline" 
            disabled={currentPage === totalPages} 
            onClick={() => { setCurrentPage(prev => prev + 1); playSound('click'); }}
          >
            التالي
          </Button>
        </div>
      )}
      
      {previewData && (
        <PreviewModal 
          isOpen={!!previewData} 
          onClose={() => setPreviewData(null)} 
          title={previewData.title} 
          questions={previewData.questions} 
        />
      )}
    </div>
  );
}
