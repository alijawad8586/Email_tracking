'use server'

import { redirect } from 'next/navigation'
import { getAnonSupabaseClient, getServiceSupabaseClient } from '@/lib/db/client'
import { clearSession, createSession, getCurrentSession } from '@/lib/auth/session'

export interface ActionResult {
  success: boolean
  error?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message.startsWith('Missing ') || message.includes('NEXTAUTH_SECRET')) {
    return `Server is not configured: ${message}`
  }
  console.error('Auth action error:', error)
  return 'Something went wrong. Please try again.'
}

export async function signUpWithPassword(email: string, password: string, fullName: string): Promise<ActionResult> {
  const cleanEmail = email.trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail)) return { success: false, error: 'Please enter a valid email address' }
  if (password.length < 8) return { success: false, error: 'Password must be at least 8 characters' }

  try {
    const supabase = getServiceSupabaseClient()
    const name = fullName.trim().slice(0, 100) || null

    const { data, error } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })
    if (error || !data.user) {
      if (error?.message.toLowerCase().includes('already')) {
        return { success: false, error: 'An account with this email already exists. Please sign in.' }
      }
      throw error ?? new Error('Failed to create user')
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: data.user.id, email: cleanEmail, full_name: name })
    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id)
      throw profileError
    }

    await createSession(data.user.id, cleanEmail, null)
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyError(error) }
  }
}

export async function signInWithPassword(email: string, password: string): Promise<ActionResult> {
  const cleanEmail = email.trim().toLowerCase()
  if (!EMAIL_RE.test(cleanEmail) || !password) {
    return { success: false, error: 'Please enter your email and password' }
  }

  try {
    const { data, error } = await getAnonSupabaseClient().auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    if (error && error.status !== 400) {
      console.error('Supabase sign-in error:', error)
      return { success: false, error: 'Could not reach the sign-in service. Check the server configuration.' }
    }
    if (error || !data.user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const supabase = getServiceSupabaseClient()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, google_id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (!profile) {
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({ id: data.user.id, email: cleanEmail })
      if (insertError) throw insertError
    }

    await createSession(data.user.id, cleanEmail, profile?.google_id ?? null)
    return { success: true }
  } catch (error) {
    return { success: false, error: friendlyError(error) }
  }
}

export async function logout(): Promise<void> {
  await clearSession()
  redirect('/login')
}

export async function disconnectGmail(): Promise<ActionResult> {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Not signed in' }

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
    return { success: false, error: friendlyError(error) }
  }
}
