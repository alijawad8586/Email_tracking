'use server'

import { getCurrentSession } from '@/lib/auth/session'
import { getServiceSupabaseClient } from '@/lib/db/client'

export interface ActionResult {
  success: boolean
  error?: string
}

export async function disconnectGmail(): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Workspace session not found. Please refresh the page.' }

  try {
    const { error } = await getServiceSupabaseClient()
      .from('user_profiles')
      .update({
        gmail_access_token_encrypted: null,
        gmail_refresh_token_encrypted: null,
        gmail_token_expires_at: null,
        gmail_connected: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.userId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Disconnect Gmail error:', error)
    return { success: false, error: 'Failed to disconnect Gmail' }
  }
}
