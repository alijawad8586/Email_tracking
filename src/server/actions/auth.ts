'use server'

import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { generateAuthUrl, handleGoogleCallback, getGoogleUserInfo, refreshAccessToken } from '@/lib/auth/google-oauth'
import { getServiceSupabaseClient } from '@/lib/db/client'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'change-me')

export interface SessionToken {
  userId: string
  email: string
  googleId: string
  iat: number
  exp: number
}

/**
 * Generate JWT session token
 */
async function generateSessionToken(userId: string, email: string, googleId: string): Promise<string> {
  const jwt = await new SignJWT({ userId, email, googleId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)

  return jwt
}

/**
 * Verify JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionToken | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    const payload = verified.payload as unknown as SessionToken
    return payload
  } catch (error) {
    return null
  }
}

/**
 * Get current session
 */
export async function getCurrentSession(): Promise<SessionToken | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  return verifySessionToken(token)
}

/**
 * Get Google login URL
 */
export async function getGoogleLoginUrl(): Promise<string> {
  return generateAuthUrl()
}

/**
 * Handle Google OAuth callback - kept for reference
 */
export async function handleGoogleOAuthCallback(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    // OAuth handling is done in the API route
    return {
      success: true,
    }
  } catch (error) {
    console.error('OAuth callback error:', error)
    return {
      success: false,
      error: 'Failed to process Google OAuth callback',
    }
  }
}

/**
 * Login with Google (to be called from the callback)
 */
export async function loginWithGoogle(code: string) {
  const supabase = getServiceSupabaseClient()

  try {
    // Exchange code for tokens and get user info
    const result = await handleGoogleCallback(code, '')

    // Get the user profile we just created
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', result.email)
      .single()

    if (profileError || !profile) {
      throw new Error('Failed to create user profile')
    }

    // Generate session JWT
    const sessionToken = await generateSessionToken(profile.id, profile.email, profile.google_id)

    // Set secure HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })

    return {
      success: true,
      userId: profile.id,
    }
  } catch (error) {
    console.error('Login error:', error)
    throw error
  }
}

/**
 * Demo login: no verification, any email creates a session cookie
 */
export async function demoLogin(email: string): Promise<{ success: boolean; error?: string }> {
  const clean = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { success: false, error: 'Please enter a valid email address' }
  }

  const token = await generateSessionToken('demo-user', clean, 'demo')
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return { success: true }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

/**
 * Refresh Gmail access token if expired
 */
export async function refreshGmailToken(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getServiceSupabaseClient()

  try {
    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('gmail_refresh_token_encrypted, gmail_token_expires_at')
      .eq('id', userId)
      .single()

    if (error || !profile?.gmail_refresh_token_encrypted) {
      return {
        success: false,
        error: 'No Gmail connection found',
      }
    }

    // Check if token is expired
    const expiresAt = new Date(profile.gmail_token_expires_at)
    if (expiresAt > new Date()) {
      return { success: true }
    }

    // Refresh the token
    const { decryptToken } = await import('@/lib/utils/encryption')
    const refreshToken = decryptToken(profile.gmail_refresh_token_encrypted)

    const { accessToken, expiresAt: newExpiresAt } = await refreshAccessToken(refreshToken)

    // Update database
    const { encryptToken } = await import('@/lib/utils/encryption')
    const encryptedAccessToken = encryptToken(accessToken)

    await supabase
      .from('user_profiles')
      .update({
        gmail_access_token_encrypted: encryptedAccessToken,
        gmail_token_expires_at: newExpiresAt?.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return { success: true }
  } catch (error) {
    console.error('Error refreshing Gmail token:', error)
    return {
      success: false,
      error: 'Failed to refresh Gmail connection',
    }
  }
}

/**
 * Get Gmail access token (with auto-refresh if expired)
 */
export async function getGmailAccessToken(userId: string): Promise<string> {
  const supabase = getServiceSupabaseClient()

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('gmail_access_token_encrypted, gmail_token_expires_at')
    .eq('id', userId)
    .single()

  if (error || !profile?.gmail_access_token_encrypted) {
    throw new Error('Gmail not connected')
  }

  // Check if token is expired
  const expiresAt = new Date(profile.gmail_token_expires_at)
  if (expiresAt <= new Date()) {
    // Refresh token
    await refreshGmailToken(userId)

    // Get the new token
    const { data: updated } = await supabase
      .from('user_profiles')
      .select('gmail_access_token_encrypted')
      .eq('id', userId)
      .single()

    if (!updated?.gmail_access_token_encrypted) {
      throw new Error('Failed to refresh Gmail token')
    }

    const { decryptToken } = await import('@/lib/utils/encryption')
    return decryptToken(updated.gmail_access_token_encrypted)
  }

  // Decrypt and return the access token
  const { decryptToken } = await import('@/lib/utils/encryption')
  return decryptToken(profile.gmail_access_token_encrypted)
}
