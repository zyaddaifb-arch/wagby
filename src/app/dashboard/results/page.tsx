import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import styles from './results.module.css';

export default async function ResultsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: homeworks } = await supabase
    .from('homeworks')
    .select(`
      *,
      submissions (count)
    `)
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  const totalSubmissions = homeworks?.reduce((acc, hw) => acc + (hw.submissions?.[0]?.count || 0), 0) || 0;
  const publishedHomeworks = homeworks?.filter(hw => hw.is_published).length || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>نتائج الواجبات</h1>
          <p className={styles.pageSubtitle}>تتبع أداء طلابك وحلل نتائج الاختبارات بدقة.</p>
        </div>
      </header>

      {/* Summary Stats Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>📝</div>
          <div className={styles.statCardValue}>{homeworks?.length || 0}</div>
          <div className={styles.statCardLabel}>إجمالي الواجبات</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>✅</div>
          <div className={styles.statCardValue}>{publishedHomeworks}</div>
          <div className={styles.statCardLabel}>واجبات منشورة</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>👥</div>
          <div className={styles.statCardValue}>{totalSubmissions}</div>
          <div className={styles.statCardLabel}>تسليمات الطلاب</div>
        </div>
        <div className={styles.statCard} style={{ borderColor: 'var(--accent)', background: 'rgba(14, 165, 233, 0.05)' }}>
          <div className={styles.statCardIcon}>✨</div>
          <div className={styles.statCardValue}>{(totalSubmissions / (homeworks?.length || 1)).toFixed(1)}</div>
          <div className={styles.statCardLabel}>متوسط التفاعل</div>
        </div>
      </div>

      <div className={styles.hwCardsGrid} style={{ marginTop: '1rem' }}>
        {homeworks?.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem 2rem', background: 'var(--card)', borderRadius: '1.5rem', border: '1px dashed var(--border)' }}>
             <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📊</div>
             <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>لا توجد نتائج لعرضها بعد</h3>
             <p style={{ color: 'var(--muted-foreground)', marginTop: '0.5rem' }}>بمجرد أن يبدأ الطلاب في حل الواجبات، ستظهر النتائج هنا.</p>
          </div>
        ) : (
          homeworks?.map((hw) => (
            <Card key={hw.id} className={styles.hwCard}>
              <CardContent className={styles.hwCardHeader}>
                <div className={styles.hwCardMeta}>
                   <span className={hw.is_published ? styles.statusBadge + ' ' + styles.published : styles.statusBadge + ' ' + styles.draft}>
                     {hw.is_published ? '🟢 منشور' : '⚫ مسودة'}
                   </span>
                   {hw.grade && <span className={styles.gradeBadge}>{hw.grade}</span>}
                </div>
                <h3 className={styles.hwCardTitle}>{hw.title}</h3>
                <p className={styles.hwCardDate}>تم الإنشاء في {new Date(hw.created_at).toLocaleDateString('ar-EG')}</p>
              </CardContent>
              
              <div className={styles.hwCardStats}>
                <div className={styles.hwCardStat}>
                  <span className={styles.hwCardStatValue}>{hw.submissions?.[0]?.count || 0}</span>
                  <span className={styles.hwCardStatLabel}>تسليمة</span>
                </div>
                <div className={styles.hwCardStat}>
                  <span className={styles.hwCardStatValue}>{hw.total_students || '∞'}</span>
                  <span className={styles.hwCardStatLabel}>طالب متوقع</span>
                </div>
                <div className={styles.hwCardStat} style={{ borderLeft: 'none' }}>
                  <span className={styles.hwCardStatValue}>
                    {hw.total_students > 0 ? Math.round(((hw.submissions?.[0]?.count || 0) / hw.total_students) * 100) : 0}%
                  </span>
                  <span className={styles.hwCardStatLabel}>نسبة الحل</span>
                </div>
              </div>

              <div className={styles.hwCardActionsRow} style={{ borderBottom: 'none' }}>
                <Link href={`/dashboard/results/${hw.id}`} style={{ width: '100%' }}>
                  <Button variant="primary" fullWidth size="lg">📊 عرض التفاصيل الكاملة</Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
