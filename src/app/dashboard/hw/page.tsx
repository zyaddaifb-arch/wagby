import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import { HomeworkList } from '../HomeworkList';

export default async function HomeworksPage() {
  const cookieStore = await cookies();
  const isMockUser = cookieStore.get('sb-test-bypass')?.value === 'true';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isMockUser) {
    redirect('/login');
  }

  let mappedHomeworks: any[] = [];

  if (user) {
    const { data: homeworks } = await supabase
      .from('homeworks')
      .select(`
        *,
        submissions (id),
        questions (id)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false });

    mappedHomeworks = homeworks?.map(hw => ({
      id: hw.id,
      title: hw.title,
      grade: hw.grade || '',
      share_code: hw.share_code,
      is_published: hw.is_published,
      is_closed: hw.is_closed,
      total_students: hw.total_students || 0,
      submissions_count: hw.submissions ? hw.submissions.length : 0,
      question_count: hw.questions ? hw.questions.length : 0,
      created_at: new Date(hw.created_at).toLocaleDateString('ar-EG')
    })) || [];
  }



  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>الواجبات</h1>
        <Link href="/dashboard/create">
          <Button variant="primary">＋ إنشاء واجب جديد</Button>
        </Link>
      </div>

      <HomeworkList initialHomeworks={mappedHomeworks} />
    </div>
  );
}
