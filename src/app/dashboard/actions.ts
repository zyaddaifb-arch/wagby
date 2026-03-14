'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteHomework(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    // 1. Delete associated submissions first
    const { error: subError } = await supabase
      .from('submissions')
      .delete()
      .eq('homework_id', id)
    
    if (subError) throw new Error(`Failed to delete submissions: ${subError.message}`)

    // 2. Delete associated questions
    const { error: qError } = await supabase
      .from('questions')
      .delete()
      .eq('homework_id', id)
    
    if (qError) throw new Error(`Failed to delete questions: ${qError.message}`)

    // 3. Finally delete the homework
    const { error: hwError } = await supabase
      .from('homeworks')
      .delete()
      .eq('id', id)
      .eq('teacher_id', user.id)

    if (hwError) throw new Error(`Failed to delete homework: ${hwError.message}`)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/hw')
    return { success: true }
  } catch (err: any) {
    console.error('Delete error:', err)
    return { success: false, error: err.message }
  }
}

export async function toggleClosed(id: string, currentStatus: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('homeworks')
    .update({ is_closed: !currentStatus })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

function generateShareCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function publishHomework(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: hw } = await supabase.from('homeworks').select('share_code').eq('id', id).single()
  const shareCode = hw?.share_code || generateShareCode()

  const { error } = await supabase
    .from('homeworks')
    .update({ 
       is_published: true, 
       share_code: shareCode,
       published_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, shareCode }
}

export async function convertToDraft(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('homeworks')
    .update({ 
       is_published: false,
       published_at: null 
    })
    .eq('id', id)
    .eq('teacher_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/hw')
  return { success: true }
}
