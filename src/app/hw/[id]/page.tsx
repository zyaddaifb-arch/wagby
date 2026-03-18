import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import styles from '../student.module.css';
import { getHomeworkByShareCode } from './actions';
import { StudentStartForm } from './StudentStartForm';

export default async function StudentStartPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ error?: string; phone?: string; name?: string }>
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const shareCode = resolvedParams.id;
  
  const hw = await getHomeworkByShareCode(shareCode);
  
  if (!hw) {
    return (
      <div className={styles.cardContainer}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
           <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>الواجب غير موجود</h2>
           <p>تأكد من الرابط الصحيح من معلمك.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cardContainer}>
      <div className={styles.brand}>
        <div className={styles.brandLogo}>واجبي</div>
        <h1 className={styles.brandTitle}>{hw.title}</h1>
        <p className={styles.brandSubtitle}>أستاذ {hw.teacherName} • {hw.totalQuestions} أسئلة</p>
      </div>

      <div className={styles.glassCard}>
        <StudentStartForm 
          shareCode={shareCode} 
          initialName={resolvedSearch.name}
          initialPhone={resolvedSearch.phone}
          error={resolvedSearch.error}
          settings={hw.settings}
        />
      </div>
    </div>
  );
}
