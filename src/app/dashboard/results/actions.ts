'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function gradeEssayAnswer(
  submissionId: string,
  questionId: string,
  pointsAwarded: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    // 1. Update the is_correct and points_awarded fields in the answers table
    const { error: updateError } = await supabase
      .from('answers')
      .update({ is_correct: pointsAwarded > 0, points_awarded: pointsAwarded })
      .eq('submission_id', submissionId)
      .eq('question_id', questionId)

    if (updateError) throw new Error(updateError.message)

    // 2. Recalculate total score for the submission by summing points_awarded
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('points_awarded')
      .eq('submission_id', submissionId)

    const finalScore = allAnswers?.reduce((sum, a) => sum + (a.points_awarded || 0), 0) || 0;
    const pendingCount = allAnswers?.filter(a => a.points_awarded === null).length || 0;
    const finalStatus = pendingCount > 0 ? 'pending_grading' : 'completed';

    // 3. Update the submissions table
    const { error: subError } = await supabase
      .from('submissions')
      .update({ score: finalScore, status: finalStatus })
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
