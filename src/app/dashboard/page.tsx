import Link from 'next/link'
import AppShell from '@/components/app-shell'

export const dynamic = 'force-dynamic'

const STATS = ['Total Leads', 'Emails Received', 'Replies Sent', 'Follow-ups Due']

export default function Dashboard() {
  return (
    <AppShell active="dashboard">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome!</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {STATS.map((label) => (
          <div key={label} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600">{label}</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
        <p className="text-gray-700 mb-6">Connect your Gmail account to start tracking leads and managing emails.</p>
        <Link
          href="/settings"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Connect Gmail
        </Link>
      </div>
    </AppShell>
  )
}
