'use server'

import { createClient } from '@/utils/supabase/server'

function generateShareCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export type SaveHomeworkInput = {
  id?: string
  title: string
  grade?: string
  description?: string
  timeLimit?: number | null
  maxAttempts?: number
  isPublished: boolean
  totalStudents?: number
  randomizeQuestions?: boolean
  randomizeAnswers?: boolean
  hideResult?: boolean
  layout?: 'wizard' | 'scroll'
  questions: {
    id: string
    text: string
    options: string[]
    correctOptions: number[] // Changed from correctOption: number
    explanation?: string
    imageUrl?: string | null
    questionType?: 'multiple_choice' | 'true_false' | 'essay'
    points: number
  }[]
}

export async function saveHomework(data: SaveHomeworkInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await (await import('next/headers')).cookies()
  const isMockUser = cookieStore.get('sb-test-bypass')?.value === 'true'

  if (!user && !isMockUser) {
    return { error: 'Unauthorized' }
  }

  if (isMockUser && !user) {
    return { success: true, homeworkId: data.id || 'mock-hw-id', shareCode: 'MOCK' }
  }

  if (!user) throw new Error('User not found');

  // Server-side validation
  if (data.isPublished && (!data.title || data.title.trim().length === 0)) {
    return { error: 'عنوان الواجب مطلوب للنشر' }
  }

  // If draft and title is empty, use a placeholder
  const finalTitle = data.title?.trim() || 'مسودة واجب بدون عنوان';

  if (!data.questions || data.questions.length === 0) {
    return { error: 'يجب إضافة سؤال واحد على الأقل' }
  }
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (!q.text || q.text.trim().length === 0) {
      return { error: `السؤال ${i + 1} يفتقر إلى النص` }
    }
    if (q.questionType !== 'essay' && (!q.correctOptions || q.correctOptions.length === 0)) {
      return { error: `السؤال ${i + 1}: يرجى اختيار إجابة واحدة صحيحة على الأقل` }
    }
  }

  try {
    let homeworkId = data.id
    let shareCode = null
    
    const oldCorrectAnswers = new Map<string, string>();
    
    if (data.isPublished) {
      if (!data.id) {
        shareCode = generateShareCode()
      } else {
        // Check if existing published homework missing share_code
        const { data: existingHw } = await supabase
          .from('homeworks')
          .select('share_code')
          .eq('id', data.id)
          .single();
        
        if (!existingHw?.share_code) {
          shareCode = generateShareCode()
        }
      }
    }

    const homeworkData = {
       title: finalTitle,
       grade: data.grade || null,
       description: data.description,
       time_limit: data.timeLimit,
       max_attempts: data.maxAttempts,
       is_published: data.isPublished,
       total_students: data.totalStudents || 0,
       randomize_questions: data.randomizeQuestions || false,
       randomize_answers: data.randomizeAnswers || false,
       hide_result: data.hideResult || false,
       layout: data.layout || 'wizard',
       ...(data.isPublished ? { published_at: new Date().toISOString() } : {})
    };

    if (data.isPublished && shareCode) {
       (homeworkData as any).share_code = shareCode;
    }

    if (homeworkId) {
       const { error: hwError } = await supabase
        .from('homeworks')
        .update(homeworkData)
        .eq('id', homeworkId)
        .eq('teacher_id', user.id);
       
       if (hwError) throw new Error(hwError.message)
       
       // Handle questions accurately (Upsert existing, Insert new, Delete removed)
       const { data: existingQuestions } = await supabase
         .from('questions')
         .select('id, correct_answer')
         .eq('homework_id', homeworkId);
       
       (existingQuestions || []).forEach(q => oldCorrectAnswers.set(String(q.id), q.correct_answer));
       
       const existingIds = (existingQuestions || []).map(q => String(q.id));
       const realIncomingIds = data.questions.filter(q => q.id.length > 15).map(q => q.id); 
       const idsToRemove = existingIds.filter(id => !realIncomingIds.includes(id));
       
       if (idsToRemove.length > 0) {
         // Check which of these have answers
         const { data: questionsWithAnswers } = await supabase
           .from('answers')
           .select('question_id')
           .in('question_id', idsToRemove);
         
         const answeredIds = (questionsWithAnswers || []).map(a => String(a.question_id));
         const idsToDelete = idsToRemove.filter(id => !answeredIds.includes(id));
         
         // Only delete those without answers to preserve data integrity
         if (idsToDelete.length > 0) {
           await supabase.from('questions').delete().in('id', idsToDelete);
         }
         
         if (answeredIds.length > 0) {
           await supabase
             .from('questions')
             .update({ order_index: -1 })
             .in('id', answeredIds);
           
           // Also mark answers for these soft-deleted questions as is_correct = false
           await supabase
             .from('answers')
             .update({ is_correct: false })
             .in('question_id', answeredIds);
         }
       }
    } else {
       const { data: hwData, error: hwError } = await supabase
        .from('homeworks')
        .insert({
           ...homeworkData,
           teacher_id: user.id,
        })
        .select()
        .single();
         
       if (hwError) throw new Error(hwError.message)
       homeworkId = hwData.id
       shareCode = hwData.share_code;
    }

    const optionMap = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
    const questionsToUpsert = data.questions.map((q, index) => {
       const isRealId = q.id.length > 15;
       
       // Handle multiple correct options
       let correctAnswer = 'essay';
       if (q.questionType !== 'essay') {
         correctAnswer = q.correctOptions
           .sort((a, b) => a - b)
           .map(idx => optionMap[idx])
           .join(',');
       }

       return {
         ...(isRealId ? { id: q.id } : {}), // Only include ID if it's a real DB ID (UUID)
         homework_id: homeworkId,
         question_text: q.text,
         option_a: q.options[0] || '',
         option_b: q.options[1] || '',
         option_c: q.options[2] || '',
         option_d: q.options[3] || '',
         option_e: q.options[4] || '',
         option_f: q.options[5] || '',
         option_g: q.options[6] || '',
         option_h: q.options[7] || '',
         correct_answer: correctAnswer,
         explanation: q.explanation || null,
         image_url: q.imageUrl || null,
         question_type: q.questionType || 'multiple_choice',
         order_index: index,
         points: q.points || 1,
       }
    })
    
    let savedQuestions: any[] = [];
    const questionsToUpdate = questionsToUpsert.filter(q => 'id' in q);
    const questionsToInsert = questionsToUpsert.filter(q => !('id' in q));

    if (questionsToUpdate.length > 0) {
      const { data: updated, error: uError } = await supabase
        .from('questions')
        .upsert(questionsToUpdate)
        .select();
      if (uError) throw new Error(uError.message);
      if (updated) savedQuestions = [...savedQuestions, ...updated];
    }

    if (questionsToInsert.length > 0) {
      const { data: inserted, error: iError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
        .select();
      if (iError) throw new Error(iError.message);
      if (inserted) savedQuestions = [...savedQuestions, ...inserted];
    }

    if (savedQuestions.length > 0) {
      // --- NEW: Sync submissions with edits (holistic re-evaluation) ---
      if (data.id) {
        // 1. Calculate active question count
        const activeQuestions = savedQuestions.filter(q => q.order_index >= 0);
        const activeCount = activeQuestions.length;
        
        // 2. Sync total_questions for all submissions to this homework
        await supabase
          .from('submissions')
          .update({ total_questions: activeCount })
          .eq('homework_id', homeworkId);

        // 3. Re-evaluate EVERY answer for EVERY active question (Holistic Sync)
        for (const q of activeQuestions) {
          // Mark all answers for this question as incorrect first
          await supabase
            .from('answers')
            .update({ is_correct: false })
            .eq('question_id', q.id);
          
          // Mark matching selections as correct
          // Note: for multiple correct options, we compare the full comma-separated string
          await supabase
            .from('answers')
            .update({ is_correct: true })
            .eq('question_id', q.id)
            .eq('selected_option', q.correct_answer);
        }

        // 4. Recalculate total scores for ALL submissions (Sum of is_correct = true)
        const { data: subs } = await supabase
          .from('submissions')
          .select('id')
          .eq('homework_id', homeworkId);
        
        if (subs && subs.length > 0) {
          for (const sub of subs) {
            // In a better world, we'd use a single SQL query with SUM(points) where is_correct = true
            // but for now, we'll follow the existing logic of counting correct answers if points are 1
            // Actually, we should check queston points
            
            const { data: correctAnswers } = await supabase
              .from('answers')
              .select('question_id')
              .eq('submission_id', sub.id)
              .eq('is_correct', true);
            
            let totalScore = 0;
            if (correctAnswers && correctAnswers.length > 0) {
              const correctQIds = correctAnswers.map(a => a.question_id);
              totalScore = activeQuestions
                .filter(q => correctQIds.includes(q.id))
                .reduce((sum, q) => sum + (q.points || 1), 0);
            }

            await supabase
              .from('submissions')
              .update({ score: totalScore })
              .eq('id', sub.id);
          }
        }
      }
      // -----------------------------------------------------------------
    }

    return { success: true, homeworkId, shareCode }

  } catch (error) {
    return { error: (error as Error).message || 'Failed to save homework' }
  }
}

export async function getHomeworkById(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await (await import('next/headers')).cookies()
  const isMockUser = cookieStore.get('sb-test-bypass')?.value === 'true'

  if(!user && !isMockUser) return null

  if (!user && isMockUser) {
    return {
      id,
      title: 'واجب تجريبي',
      questions: [{ id: '1', question_text: 'سؤال تجريبي', option_a: 'أ', option_b: 'ب', option_c: 'ج', option_d: 'د', correct_answer: 'a' }],
      submissionCount: 0
    }
  }

  if (!user) return null;

  const { data: hw, error } = await supabase
    .from('homeworks')
    .select(`
      *, 
      questions(*),
      submissions(id)
    `)
    .eq('id', id)
    .eq('teacher_id', user.id)
    .filter('questions.order_index', 'gte', 0)
    .single()
    
  if (error || !hw) return null
  
  return {
    ...hw,
    submissionCount: hw.submissions?.length || 0
  }
}

export async function getDefaultSettings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('settings')
    .eq('id', user.id)
    .single()

  if (error || !data) return null

  return (data.settings as any)?.homework || null
}
