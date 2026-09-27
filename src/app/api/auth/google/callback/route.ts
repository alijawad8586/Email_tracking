import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { handleGoogleCallback } from '@/lib/auth/google-oauth'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'change-me')

async function generateSessionToken(userId: string, email: string, googleId: string): Promise<string> {
  const jwt = await new SignJWT({ userId, email, googleId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)

  return jwt
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_auth_code', request.url))
  }

  const supabase = getServiceSupabaseClient()

  try {
    // We need to get a new user ID or use the one from state
    // For now, we'll create a temporary user in Supabase Auth first

    // Get user info from Google to use as email
    const { exchangeAuthCode, getGoogleUserInfo } = await import('@/lib/auth/google-oauth')
    const { accessToken, refreshToken, expiresAt } = await exchangeAuthCode(code)
    const userInfo = await getGoogleUserInfo(accessToken)

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userInfo.email,
      email_confirm: true,
      user_metadata: {
        google_id: userInfo.googleId,
        full_name: userInfo.name,
        avatar_url: userInfo.picture,
      },
    })

    let userId = authData?.user?.id

    // If user already exists, get their ID from profiles
    if (!userId) {
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', userInfo.email)
        .single()

      userId = existingUser?.id
    }

    if (!userId) {
      throw new Error('Failed to create or find user')
    }

    // Now handle the Google callback to store encrypted tokens
    await handleGoogleCallback(code, userId)

    // Generate session token
    const sessionToken = await generateSessionToken(userId, userInfo.email, userInfo.googleId)

    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url))
  }
}
