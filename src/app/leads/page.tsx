import AppShell from '@/components/app-shell'

export const dynamic = 'force-dynamic'

export default function LeadsPage() {
  return (
    <AppShell active="leads">
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Leads</h1>
      <p className="text-gray-600 mb-8">Manage and track all your leads here.</p>
      <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No leads yet. Emails will be automatically converted to leads.</p>
      </div>
    </div>
    </AppShell>
  )
}
