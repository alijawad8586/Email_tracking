import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { refreshAccessToken } from '@/lib/auth/google-oauth'
import { decryptToken, encryptToken } from '@/lib/utils/encryption'

const COOKIE_NAME = 'auth-token'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export interface SessionToken {
  userId: string
  email: string
  googleId: string | null
  iat: number
  exp: number
}

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is not set')
    }
    return new TextEncoder().encode('dev-only-secret')
  }
  return new TextEncoder().encode(secret)
}

export async function createSession(userId: string, email: string, googleId: string | null) {
  const token = await new SignJWT({ userId, email, googleId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentSession(): Promise<SessionToken | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionToken
  } catch {
    return null
  }
}

export async function getGmailAccessToken(userId: string): Promise<string> {
  const supabase = getServiceSupabaseClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('gmail_access_token_encrypted, gmail_refresh_token_encrypted, gmail_token_expires_at')
    .eq('id', userId)
    .single()

  if (!profile?.gmail_access_token_encrypted) {
    throw new Error('Gmail not connected')
  }

  const expired = profile.gmail_token_expires_at && new Date(profile.gmail_token_expires_at) <= new Date()
  if (!expired) {
    return decryptToken(profile.gmail_access_token_encrypted)
  }

  if (!profile.gmail_refresh_token_encrypted) {
    throw new Error('Gmail session expired, please reconnect Gmail')
  }

  const refreshed = await refreshAccessToken(decryptToken(profile.gmail_refresh_token_encrypted))
  await supabase
    .from('user_profiles')
    .update({
      gmail_access_token_encrypted: encryptToken(refreshed.accessToken),
      gmail_token_expires_at: refreshed.expiresAt?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  return refreshed.accessToken
}
