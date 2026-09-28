import AppShell from '@/components/app-shell'
import IntegrationsManager, { type IntegrationRow } from '@/components/integrations-manager'
import { getCurrentSession } from '@/lib/auth/session'
import { getServiceSupabaseClient } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export default async function IntegrationsPage() {
  const session = await getCurrentSession()

  let integrations: IntegrationRow[] = []
  let loadError: string | null = null
  if (session) {
    try {
      const { data, error } = await getServiceSupabaseClient()
        .from('api_integrations')
        .select('id, name, base_url, auth_type, auth_name, notes, last_test_status, last_tested_at')
        .eq('user_id', session.userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      integrations = data ?? []
    } catch (error) {
      loadError = error instanceof Error && error.message.startsWith('Missing ')
        ? `Server is not configured: ${error.message}`
        : 'Could not load your integrations.'
    }
  }

  return (
    <AppShell active="integrations">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">API Integrations</h1>
      <p className="text-gray-600 mb-8">
        Connect any service that has an API. Keys are encrypted and never shown again after saving.
      </p>
      {loadError && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {loadError}
        </div>
      )}
      <IntegrationsManager integrations={integrations} />
    </AppShell>
  )
}
