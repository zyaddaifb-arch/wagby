import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import styles from '../student.module.css';
import { getHomeworkByShareCode } from './actions';
import { StudentStartForm } from './StudentStartForm';

export default async function StudentStartPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
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
        <div className={styles.brandLogo}>ذاكرلي</div>
        <h1 className={styles.brandTitle}>{hw.title}</h1>
        <p className={styles.brandSubtitle}>أستاذ {hw.teacherName} • {hw.totalQuestions} أسئلة</p>
      </div>

      <Card>
        <CardContent>
           <StudentStartForm shareCode={shareCode} />
        </CardContent>
      </Card>
    </div>
  );
}
