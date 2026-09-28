import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl, isGoogleConfigured } from '@/lib/auth/google-oauth'
import { getGoogleRedirectUri, getOrigin } from '@/lib/auth/origin'
import { getCurrentSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

// Starts "Continue with Google" to connect Gmail to the current workspace
export async function GET(request: NextRequest) {
  const origin = getOrigin(request)

  if (!isGoogleConfigured()) {
    const message = 'Google is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the deployment settings.'
    return NextResponse.redirect(`${origin}/settings?error=${encodeURIComponent(message)}`)
  }

  if (!(await getCurrentSession())) {
    return NextResponse.redirect(`${origin}/api/guest?next=/settings`)
  }

  const state = randomUUID()
  const response = NextResponse.redirect(generateAuthUrl(getGoogleRedirectUri(request), state))
  response.cookies.set('oauth-state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
