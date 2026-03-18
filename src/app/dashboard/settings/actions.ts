'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type UserSettings = {
  homework: {
    showResult: 'immediate' | 'hidden'
    showCorrectAnswers: boolean
    showRanking: boolean
    allowMultipleAttempts: boolean
    maxAttempts: number
    randomizeQuestions: boolean
    randomizeAnswers: boolean
    layout: 'wizard' | 'scroll'
  }
  privacy: {
    requirePhone: boolean
    optionalParentPhone: boolean
  }
}

export async function updateProfile(data: {
  fullName: string
  phoneNumber: string
  subject: string
  settings: UserSettings
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      phone_number: data.phoneNumber,
      subject: data.subject,
      settings: data.settings
    })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function updatePassword(password: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  if (password.length < 6) {
    return { error: 'يجب أن لا تقل كلمة المرور عن 6 أحرف' }
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) return { error: error.message }

  return { success: true }
}

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  try {
    // 1. Get all homework IDs
    const { data: homeworks } = await supabase
      .from('homeworks')
      .select('id')
      .eq('teacher_id', user.id)

    const hwIds = homeworks?.map(h => h.id) || []

    if (hwIds.length > 0) {
      // 2. Get all submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select('id')
        .in('homework_id', hwIds)
      
      const subIds = submissions?.map(s => s.id) || []

      // 3. Delete answers (linked to teacher's submissions)
      if (subIds.length > 0) {
        await supabase.from('answers').delete().in('submission_id', subIds)
      }

      // 4. Delete submissions
      await supabase.from('submissions').delete().in('homework_id', hwIds)

      // 5. Get all questions
      const { data: questions } = await supabase
        .from('questions')
        .select('id')
        .in('homework_id', hwIds)
      
      const qIds = questions?.map(q => q.id) || []

      // 6. Delete answers (linked to teacher's questions - extra safety)
      if (qIds.length > 0) {
        await supabase.from('answers').delete().in('question_id', qIds)
      }

      // 7. Delete questions
      await supabase.from('questions').delete().in('homework_id', hwIds)

      // 8. Delete homeworks
      await supabase.from('homeworks').delete().eq('teacher_id', user.id)
    }

    // 9. Delete profile
    await supabase.from('profiles').delete().eq('id', user.id)

    // 10. Sign out
    await supabase.auth.signOut()

    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'حدث خطأ أثناء حذف الحساب' }
  }
}
