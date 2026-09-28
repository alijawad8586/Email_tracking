import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthCode, storeGmailTokens } from '@/lib/auth/google-oauth'
import { getGoogleRedirectUri, getOrigin } from '@/lib/auth/origin'
import { getCurrentSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const origin = getOrigin(request)
  const params = request.nextUrl.searchParams

  const finish = (query: string) => {
    const response = NextResponse.redirect(`${origin}/settings?${query}`)
    response.cookies.delete('oauth-state')
    return response
  }
  const fail = (message: string) => finish(`error=${encodeURIComponent(message)}`)

  if (params.get('error')) {
    return fail(params.get('error') === 'access_denied' ? 'Google access was cancelled' : 'Google connection failed')
  }

  const code = params.get('code')
  const state = params.get('state')
  const savedState = request.cookies.get('oauth-state')?.value
  if (!code || !state || !savedState || state !== savedState) {
    return fail('Connection session expired. Please try again.')
  }

  const session = await getCurrentSession()
  if (!session) return fail('Workspace session not found. Please try again.')

  try {
    const tokens = await exchangeAuthCode(code, getGoogleRedirectUri(request))
    await storeGmailTokens(session.userId, tokens)
    return finish('connected=1')
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return fail('Google connection failed. Please try again.')
  }
}
