import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth/session'
import { logout } from '@/server/actions/auth'

const NAV = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'emails', href: '/emails', label: 'Inbox' },
  { key: 'leads', href: '/leads', label: 'Leads' },
  { key: 'followups', href: '/followups', label: 'Follow-ups' },
  { key: 'integrations', href: '/integrations', label: 'API Integrations' },
  { key: 'settings', href: '/settings', label: 'Settings' },
]

export type NavKey = (typeof NAV)[number]['key']

export default async function AppShell({ active, children }: { active: NavKey; children: React.ReactNode }) {
  const session = await getCurrentSession()
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">EmailTrack</h1>
          <p className="text-sm text-gray-400 mt-1 break-all">{session.email}</p>
        </div>
        <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`block px-4 py-2 rounded-lg hover:bg-gray-800 transition ${
                item.key === active ? 'bg-gray-800' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="border-t border-gray-800 p-4">
          <button type="submit" className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm">
            Logout
          </button>
        </form>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  )
}
