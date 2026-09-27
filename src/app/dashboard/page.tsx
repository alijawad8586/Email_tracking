export const dynamic = 'force-dynamic'

'use client'

import { useEffect, useState } from 'react'
import { getCurrentSession } from '@/server/actions/auth'
import Link from 'next/link'

interface SessionToken {
  userId: string
  email: string
}

export default function Dashboard() {
  const [session, setSession] = useState<SessionToken | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSession = async () => {
      try {
        const currentSession = await getCurrentSession()
        setSession(currentSession)
      } catch (error) {
        console.error('Error loading session:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSession()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not authenticated</p>
          <Link href="/login" className="text-blue-600 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold">EmailTrack</h1>
          <p className="text-sm text-gray-400 mt-1">{session.email}</p>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          <Link href="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition bg-gray-800">
            Dashboard
          </Link>
          <Link href="/emails" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            Inbox
          </Link>
          <Link href="/leads" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            Leads
          </Link>
          <Link href="/followups" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            Follow-ups
          </Link>
          <Link href="/settings" className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            Settings
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4 w-64">
          <form
            action={async () => {
              'use server'
              const { logout } = await import('@/server/actions/auth')
              await logout()
            }}
          >
            <button type="submit" className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm">
              Logout
            </button>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <p className="text-sm text-gray-600">Email Lead Tracker</p>
        </div>
        <div className="p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
          <p className="text-gray-600 mb-8">Welcome!</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Total Leads</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Emails Received</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Replies Sent</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600">Follow-ups Due</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">0</div>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 border-2 border-blue-200 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Get Started</h2>
            <p className="text-gray-700 mb-6">Connect your Gmail account to start tracking leads and managing emails.</p>
            <Link href="/settings" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
              Connect Gmail
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
