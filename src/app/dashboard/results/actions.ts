'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function gradeEssayAnswer(
  submissionId: string,
  questionId: string,
  isCorrect: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    // 1. Update the is_correct field in the answers table
    const { error: updateError } = await supabase
      .from('answers')
      .update({ is_correct: isCorrect })
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)

    if (updateError) throw new Error(updateError.message)

    // 2. Recalculate total score for the submission
    const { count: finalScore } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('submission_id', submissionId)
      .eq('is_correct', true)

    // 3. Update the submissions table
    const { error: subError } = await supabase
      .from('submissions')
      .update({ score: finalScore || 0 })
      .eq('id', submissionId)

    if (subError) throw new Error(subError.message)

    // 4. Find homework_id to revalidate specific results page
    const { data: subData } = await supabase
        .from('submissions')
        .select('homework_id')
        .eq('id', submissionId)
        .single()
    
    revalidatePath(`/dashboard/results`)
    if (subData) {
        revalidatePath(`/dashboard/results/${subData.homework_id}`)
    }

    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
