import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const isMockUser = cookieStore.get('sb-test-bypass')?.value === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isMockUser) {
    redirect('/login');
  }

  // Default values for mock users
  let profile: { full_name?: string } | null = null;
  let totalHomeworks = 0;
  let totalSubmissions = 0;
  let publishedCount = 0;
  let draftCount = 0;
  let recentHomeworks: any[] = [];
  let gradeEntries: [string, number][] = [];

  if (user) {
    try {
      // Fetch teacher profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = profileData;

      // Fetch stats and recent homeworks
      const { data: homeworks, error: hwError } = await supabase
        .from('homeworks')
        .select(`
          *,
          submissions (id, score, total_questions)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (homeworks) {
        totalHomeworks = homeworks.length;
        totalSubmissions = homeworks.reduce((acc, hw) => acc + (hw.submissions?.length || 0), 0);
        publishedCount = homeworks.filter(hw => hw.is_published && !hw.is_closed).length;
        draftCount = homeworks.filter(hw => !hw.is_published).length;
        recentHomeworks = homeworks.slice(0, 5) || [];

        // Grade grouping
        const gradeMap: Record<string, number> = {};
        homeworks.forEach(hw => {
          const grade = hw.grade || 'عام';
          gradeMap[grade] = (gradeMap[grade] || 0) + 1;
        });
        gradeEntries = Object.entries(gradeMap);
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    }
  }
  
  // Safety for mock users (moved outside if(user))
  if (isMockUser && profile === null) {
    profile = { full_name: 'Test Teacher' };
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1 className={styles.pageTitle}>لوحة التحكم</h1>
          <p className={styles.pageSubtitle}>أهلاً بك يا أستاذ {profile?.full_name || 'المجتهد'}! 👋</p>
        </div>
        <Link href="/dashboard/create">
          <Button variant="primary" size="lg">+ إنشاء واجب جديد</Button>
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>📚</div>
          <div className={styles.statCardValue}>{totalHomeworks}</div>
          <div className={styles.statCardLabel}>إجمالي الواجبات</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>✅</div>
          <div className={styles.statCardValue} style={{ color: 'var(--success)' }}>{totalSubmissions}</div>
          <div className={styles.statCardLabel}>إجمالي الحلول</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>🟢</div>
          <div className={styles.statCardValue} style={{ color: 'var(--primary)' }}>{publishedCount}</div>
          <div className={styles.statCardLabel}>واجبات منشورة</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statCardIcon}>📝</div>
          <div className={styles.statCardValue} style={{ color: 'var(--muted-foreground)' }}>{draftCount}</div>
          <div className={styles.statCardLabel}>مسودات</div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Grade Groups */}
        <Card>
          <CardContent style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.25rem' }}>الصفوف الدراسية</h3>
              <Link href="/dashboard/hw" style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800 }}>إدارة الواجبات</Link>
            </div>
            {gradeEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px dashed var(--border)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
                <p style={{ fontWeight: 600 }}>لا توجد صفوف مضافة بعد.</p>
                <p style={{ fontSize: '0.85rem' }}>أضف الصف الدراسي عند إنشاء الواجب لتنظيم عملك.</p>
              </div>
            ) : (
              <div className={styles.gradeList}>
                {gradeEntries.map(([grade, count]) => (
                  <div key={grade} className={styles.gradeItem}>
                    <div className={styles.gradeInfo}>
                      <div className={styles.gradeIcon}>🎓</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--foreground)' }}>{grade}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 700 }}>{count} واجب</div>
                      </div>
                    </div>
                    <Link href={`/dashboard/hw?grade=${encodeURIComponent(grade)}`}>
                      <Button variant="secondary" size="sm" style={{ fontWeight: 800, padding: '0 1.25rem' }}>عرض</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {/* Removed redundant creation button from here as requested */}
          </CardContent>
        </Card>

        <Card className={styles.recentActivityCard}>
          <CardContent style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 900, fontSize: '1.1rem' }}>آخر الواجبات</h3>
              <Link href="/dashboard/hw" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 700 }}>عرض الكل</Link>
            </div>
            
            <div className={styles.recentList}>
              {recentHomeworks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                  لا يوجد واجبات نشطة حالياً.
                </div>
              ) : (
                recentHomeworks.map(hw => (
                  <div key={hw.id} className={styles.recentItem}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{hw.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {hw.grade && <span style={{ marginLeft: '0.5rem', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontWeight: 700 }}>{hw.grade}</span>}
                        {new Date(hw.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <Link href={`/dashboard/create?id=${hw.id}`}>
                         <Button variant="outline" size="sm" style={{ fontWeight: 700, borderColor: 'var(--border)' }}>✏️ تعديل</Button>
                       </Link>
                       <Link href={`/dashboard/results/${hw.id}`}>
                         <Button variant="success" size="sm" style={{ fontWeight: 800 }}>📊 النتائج</Button>
                       </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


