import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { exchangeAuthCode, getGoogleUserInfo, storeGmailTokens } from '@/lib/auth/google-oauth'
import { getGoogleRedirectUri, getOrigin } from '@/lib/auth/origin'
import { createSession, getCurrentSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const origin = getOrigin(request)
  const params = request.nextUrl.searchParams
  const state = params.get('state')
  const savedState = request.cookies.get('oauth-state')?.value
  const mode = state?.startsWith('connect.') ? 'connect' : 'login'
  const backTo = mode === 'connect' ? '/settings' : '/login'

  const finish = (path: string) => {
    const response = NextResponse.redirect(`${origin}${path}`)
    response.cookies.delete('oauth-state')
    return response
  }
  const fail = (message: string) => finish(`${backTo}?error=${encodeURIComponent(message)}`)

  if (params.get('error')) {
    return fail(params.get('error') === 'access_denied' ? 'Google access was cancelled' : 'Google sign-in failed')
  }

  const code = params.get('code')
  if (!code || !state || !savedState || state !== savedState) {
    return fail('Sign-in session expired. Please try again.')
  }

  try {
    const tokens = await exchangeAuthCode(code, getGoogleRedirectUri(request))
    const info = await getGoogleUserInfo(tokens.accessToken)
    const supabase = getServiceSupabaseClient()

    if (mode === 'connect') {
      const session = await getCurrentSession()
      if (!session) return finish('/login')
      await storeGmailTokens(session.userId, tokens)
      return finish('/settings?connected=1')
    }

    if (!info.emailVerified) return fail('Your Google email address is not verified')

    const email = info.email.toLowerCase()
    const columns = 'id, email, google_id'
    let { data: profile } = await supabase
      .from('user_profiles')
      .select(columns)
      .eq('google_id', info.googleId)
      .maybeSingle()
    if (!profile) {
      ;({ data: profile } = await supabase.from('user_profiles').select(columns).eq('email', email).maybeSingle())
    }

    if (!profile) {
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: info.name },
      })

      let userId = created?.user?.id
      if (!userId && createError) {
        const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
        userId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id
      }
      if (!userId) throw createError ?? new Error('Failed to create user')

      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: userId,
        email,
        google_id: info.googleId,
        full_name: info.name,
        avatar_url: info.picture,
      })
      if (insertError) throw insertError
      profile = { id: userId, email, google_id: info.googleId }
    } else if (!profile.google_id) {
      await supabase
        .from('user_profiles')
        .update({ google_id: info.googleId, avatar_url: info.picture })
        .eq('id', profile.id)
    }

    await storeGmailTokens(profile.id, tokens)
    await createSession(profile.id, profile.email, profile.google_id ?? info.googleId)
    return finish('/dashboard')
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return fail('Google sign-in failed. Please try again.')
  }
}
