import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl, isGoogleConfigured } from '@/lib/auth/google-oauth'
import { getGoogleRedirectUri, getOrigin } from '@/lib/auth/origin'
import { getCurrentSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('mode') === 'connect' ? 'connect' : 'login'
  const origin = getOrigin(request)
  const backTo = mode === 'connect' ? '/settings' : '/login'

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}${backTo}?error=${encodeURIComponent(message)}`)

  if (!isGoogleConfigured()) {
    return fail('Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the deployment settings.')
  }

  if (mode === 'connect' && !(await getCurrentSession())) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const state = `${mode}.${randomUUID()}`
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
