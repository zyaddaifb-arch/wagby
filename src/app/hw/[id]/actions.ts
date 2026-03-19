'use server'

import { createClient } from '@/utils/supabase/server'

export async function getHomeworkByShareCode(shareCode: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('homeworks')
    .select(`
      id, title, teacher_id, is_published,
      randomize_questions,
      randomize_answers,
      layout,
      time_limit,
      max_attempts,
      total_students,
      profiles (full_name, settings),
      questions (id, question_text, option_a, option_b, option_c, option_d, order_index, explanation, question_type, image_url, points)
    `)
    .eq('share_code', shareCode.trim().toUpperCase())
    .filter('questions.order_index', 'gte', 0)
    .single()

  if (error || !data || !data.is_published) {
    return null
  }

  // Sort questions by order_index
  const questions = (data.questions as Record<string, unknown>[]).sort((a, b) => Number(a.order_index) - Number(b.order_index)).map((q) => ({
    id: String(q.id),
    question_text: String(q.question_text),
    options: [String(q.option_a), String(q.option_b), String(q.option_c), String(q.option_d)],
    explanation: q.explanation ? String(q.explanation) : null,
    question_type: (q.question_type as 'multiple_choice' | 'true_false' | 'essay') || 'multiple_choice',
    image_url: q.image_url ? String(q.image_url) : null,
    points: typeof q.points === 'number' ? q.points : 1,
  }))

  return {
    id: data.id,
    title: data.title,
    teacherName: (data.profiles as any)?.full_name,
    settings: {
      ...(data.profiles as any)?.settings?.homework,
      ...(data.profiles as any)?.settings?.privacy,
      randomizeQuestions: data.randomize_questions ?? (data.profiles as any)?.settings?.homework?.randomizeQuestions,
      randomizeAnswers: data.randomize_answers ?? (data.profiles as any)?.settings?.homework?.randomizeAnswers,
      layout: data.layout ?? (data.profiles as any)?.settings?.homework?.layout ?? 'wizard',
      timeLimit: data.time_limit,
      maxAttempts: data.max_attempts,
      totalStudents: data.total_students,
    },
    questions: questions,
    totalQuestions: questions.length
  }
}

export async function getAttemptCount(homeworkId: string, phone: string, name: string) {
  const supabase = await createClient()
  let query = supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('homework_id', homeworkId)

  if (phone && phone.trim()) {
    query = query.eq('student_phone', phone.trim())
  } else {
    query = query.eq('student_name', name.trim())
  }

  const { count, error } = await query

  if (error) return 0
  return count || 0
}

export type SubmissionInput = {
  shareCode: string;
  studentName: string;
  studentPhone: string;
  parentPhone?: string;
  answers: { questionId: string; selectedIndex?: number; answerText?: string }[];
  duration?: number;
}

export async function submitHomework(data: SubmissionInput) {
  const supabase = await createClient()

  // 1. Fetch homework and questions to validate answers
  const cleanShareCode = data.shareCode.trim().toUpperCase()
  const cleanStudentName = data.studentName.trim()
  const cleanStudentPhone = data.studentPhone?.trim() || ''
  const cleanParentPhone = data.parentPhone?.trim() || null

  const { data: hw, error: hwError } = await supabase
    .from('homeworks')
    .select(`
      id, 
      is_published, 
      max_attempts, 
      profiles (settings), 
      questions (id, correct_answer, order_index, question_type, points)
    `)
    .eq('share_code', cleanShareCode)
    .filter('questions.order_index', 'gte', 0)
    .single()

  if (hwError || !hw || !hw.is_published) {
    if (hwError) console.error('[submitHomework] Fetch error:', hwError)
    return { error: 'الواجب غير موجود أو غير منشور' }
  }

  const optionMap = ['a', 'b', 'c', 'd']
  let totalScore = 0

  // Check answers
  const answersData = data.answers.map(ans => {
    const question = (hw.questions as any[]).find(q => q.id === ans.questionId)
    
    let isCorrect = false
    let selectedOption: string | null = null
    let textAnswer: string | null = null
    let imageUrls: string[] = []
    let pointsAwarded: number | null = null;

    if (question?.question_type === 'essay') {
      try {
        const essayData = JSON.parse(ans.answerText || '{}');
        textAnswer = essayData.text || '';
        if (essayData.imageUrl) imageUrls = [essayData.imageUrl];
      } catch {
        textAnswer = ans.answerText || '';
      }
      selectedOption = null; // Important: set to NULL to avoid constraint violation
      isCorrect = false; // Graded manually later
      pointsAwarded = null; // Pending grading
    } else if (ans.selectedIndex !== undefined) {
      selectedOption = optionMap[ans.selectedIndex]
      isCorrect = question ? question.correct_answer === selectedOption : false
      
      const qPoints = question?.points || 1;
      if (isCorrect) {
        pointsAwarded = qPoints;
        totalScore += qPoints;
      } else {
        pointsAwarded = 0;
      }
    }

    return {
      question_id: ans.questionId,
      selected_option: selectedOption,
      is_correct: isCorrect,
      text_answer: textAnswer,
      image_urls: imageUrls,
      points_awarded: pointsAwarded
    }
  })

  // 2. Check for attempt limit again (server-side safety)
  const currentAttempts = await getAttemptCount(hw.id, cleanStudentPhone, cleanStudentName);
  
  // Settings can be on the homework or profile
  const mergedSettings = {
    ...(hw.profiles as any)?.settings?.homework,
    ...(hw.profiles as any)?.settings?.privacy,
  };
  
  const maxAllowed = mergedSettings?.maxAttempts ?? hw.max_attempts ?? 1;

  if (maxAllowed > 0 && currentAttempts >= maxAllowed) {
    const identifyStr = cleanStudentPhone ? `برقم الهاتف هذا (${cleanStudentPhone})` : `بهذا الاسم (${cleanStudentName})`;
    return { error: `لقد استنفدت جميع المحاولات المتاحة لهذا الواجب (${maxAllowed} محاولات) ${identifyStr}.` };
  }

  // 3. Insert Submission and Answers atomically using RPC
  const { data: submissionId, error: subError } = await supabase.rpc('submit_homework_secure', {
    p_homework_id: hw.id,
    p_student_name: cleanStudentName,
    p_student_phone: cleanStudentPhone,
    p_score: totalScore,
    p_total_questions: hw.questions.length,
    p_answers: answersData,
    p_duration: data.duration || 0,
    p_parent_phone: cleanParentPhone
  })

  if (subError) {
    console.error('[submitHomework] RPC Error:', subError);
    if (subError.code === '23505') {
       const identifyStr = cleanStudentPhone ? `بنفس رقم الهاتف (${cleanStudentPhone})` : `بنفس الاسم (${cleanStudentName})`;
       return { error: `لقد قمت بتسليم هذا الواجب مسبقاً ${identifyStr}.` }
    }
    return { error: subError.message }
  }

  return { success: true, submissionId }
}

export async function getSubmissionResult(submissionId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      homeworks (title, teacher_id, profiles(full_name))
    `)
    .eq('id', submissionId)
    .single()

  if (error || !data) return null

  // Fetch ranking
  const { data: rankings } = await supabase
    .from('submissions')
    .select('id, score')
    .eq('homework_id', data.homework_id)
    .order('score', { ascending: false })
    .order('submitted_at', { ascending: true })

  let rank = 0
  if (rankings) {
    rank = rankings.findIndex(r => r.id === submissionId) + 1
  }

  return {
    ...data,
    rank,
    totalStudents: rankings?.length || 1,
    homeworkTitle: String((data.homeworks as unknown as Record<string, unknown>).title),
    teacherName: String(((data.homeworks as unknown as Record<string, unknown>).profiles as unknown as Record<string, unknown>).full_name),
    answers: await supabase
      .from('answers')
      .select(`
        *,
        questions (
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          question_type,
          image_url,
          points
        )
      `)
      .eq('submission_id', submissionId)
      .then(res => res.data || [])
  }
}
