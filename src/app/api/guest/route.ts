import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getOrigin } from '@/lib/auth/origin'
import { createSession, getCurrentSession } from '@/lib/auth/session'
import { getServiceSupabaseClient } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

const ALLOWED_NEXT = ['/dashboard', '/emails', '/leads', '/followups', '/integrations', '/settings']

// Gives every new browser its own private workspace, so no login screen is needed.
export async function GET(request: NextRequest) {
  const origin = getOrigin(request)
  const requested = request.nextUrl.searchParams.get('next') || '/dashboard'
  const next = ALLOWED_NEXT.includes(requested) ? requested : '/dashboard'

  if (await getCurrentSession()) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  try {
    const supabase = getServiceSupabaseClient()
    const email = `guest-${randomUUID()}@guest.invalid`

    const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true })
    if (error || !data.user) throw error ?? new Error('Failed to create workspace')

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({ id: data.user.id, email, full_name: 'Guest' })
    if (profileError) {
      await supabase.auth.admin.deleteUser(data.user.id)
      throw profileError
    }

    await createSession(data.user.id, email, null)
    return NextResponse.redirect(`${origin}${next}`)
  } catch (error) {
    console.error('Guest workspace error:', error)
    const detail =
      error instanceof Error && (error.message.startsWith('Missing ') || error.message.includes('NEXTAUTH_SECRET'))
        ? `Server is not configured: ${error.message}`
        : 'Could not create your workspace. Check the Supabase environment variables on the server.'
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>Setup needed</title><body style="font-family:sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem"><h1>Setup needed</h1><p>${detail}</p><p><a href="/dashboard">Try again</a></p></body>`,
      { status: 500, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }
}
