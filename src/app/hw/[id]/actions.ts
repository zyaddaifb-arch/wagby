'use server'

import { createClient } from '@/utils/supabase/server'

export async function getHomeworkByShareCode(shareCode: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('homeworks')
    .select(`
      id, title, teacher_id, is_published,
      profiles (full_name),
      questions (id, question_text, option_a, option_b, option_c, option_d, order_index, explanation, question_type, image_url)
    `)
    .eq('share_code', shareCode)
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
    question_type: (q.question_type as 'multiple_choice' | 'true_false') || 'multiple_choice',
    image_url: q.image_url ? String(q.image_url) : null,
  }))

  return {
    id: data.id,
    title: data.title,
    teacherName: data.profiles ? String(((data.profiles as unknown) as Record<string, unknown>).full_name) : 'Unknown',
    questions: questions,
    totalQuestions: questions.length
  }
}

export type SubmissionInput = {
  shareCode: string;
  studentName: string;
  answers: { questionId: string; selectedIndex: number }[];
}

export async function submitHomework(data: SubmissionInput) {
  const supabase = await createClient()

  // 1. Fetch homework and questions to validate answers
  const { data: hw, error: hwError } = await supabase
    .from('homeworks')
    .select(`id, is_published, questions(id, correct_answer, order_index)`)
    .eq('share_code', data.shareCode)
    .filter('questions.order_index', 'gte', 0)
    .single()

  if (hwError || !hw || !hw.is_published) {
    return { error: 'Homework not found or unpublished' }
  }

  const optionMap = ['a', 'b', 'c', 'd']
  let correctCount = 0

  // Check answers
  const answersData = data.answers.map(ans => {
    const question = (hw.questions as Record<string, unknown>[]).find(q => q.id === ans.questionId)
    const isCorrect = question && question.correct_answer === optionMap[ans.selectedIndex]
    if (isCorrect) correctCount++
    return {
      question_id: ans.questionId,
      selected_option: optionMap[ans.selectedIndex],
      is_correct: isCorrect
    }
  })

  // 2. Insert Submission
  // Note: RLS unique constraint on (homework_id, student_name) might fail here if duplicate
  const { data: subData, error: subError } = await supabase
    .from('submissions')
    .insert({
      homework_id: hw.id,
      student_name: data.studentName,
      score: correctCount,
      total_questions: hw.questions.length
    })
    .select()
    .single()

  if (subError) {
    // Check if it's unique constraint violation
    if (subError.code === '23505') {
       return { error: 'لقد قمت بتسليم هذا الواجب مسبقاً بنفس الاسم.' }
    }
    return { error: subError.message }
  }

  // 3. Insert Answers
  const finalAnswersData = answersData.map(a => ({
    submission_id: subData.id,
    question_id: a.question_id,
    selected_option: a.selected_option,
    is_correct: a.is_correct
  }))

  if (finalAnswersData.length > 0) {
    const { error: ansError } = await supabase.from('answers').insert(finalAnswersData)
    if (ansError) return { error: ansError.message }
  }

  return { success: true, submissionId: subData.id }
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
          image_url
        )
      `)
      .eq('submission_id', submissionId)
      .then(res => res.data || [])
  }
}
