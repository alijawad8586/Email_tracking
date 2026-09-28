import { headers } from 'next/headers'
import AppShell from '@/components/app-shell'
import ConnectGmail from '@/components/connect-gmail'
import { isGoogleConfigured } from '@/lib/auth/google-oauth'
import { getCurrentSession } from '@/lib/auth/session'
import { getServiceSupabaseClient } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const { error, connected } = await searchParams
  const session = await getCurrentSession()

  let gmailConnected = false
  if (session) {
    try {
      const { data } = await getServiceSupabaseClient()
        .from('user_profiles')
        .select('gmail_connected')
        .eq('id', session.userId)
        .maybeSingle()
      gmailConnected = Boolean(data?.gmail_connected)
    } catch {
      gmailConnected = false
    }
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https')
  const redirectUri = `${proto}://${host}/api/auth/google/callback`

  return (
    <AppShell active="settings">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      {connected && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          Gmail connected successfully.
        </div>
      )}
      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gmail Connection</h2>
          <ConnectGmail connected={gmailConnected} googleReady={isGoogleConfigured()} />
          <p className="mt-4 text-xs text-gray-500">
            Google Cloud redirect URI to authorize:
            <code className="block mt-1 p-2 bg-gray-100 rounded break-all text-gray-800">{redirectUri}</code>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Other API connections</h2>
          <p className="text-sm text-gray-600 mb-3">Connect any other service with its API key.</p>
          <a href="/integrations" className="text-blue-600 hover:text-blue-700 font-medium">
            Open API Integrations
          </a>
        </div>
      </div>
    </AppShell>
  )
}
