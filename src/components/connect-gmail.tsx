'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { disconnectGmail } from '@/server/actions/auth'

export default function ConnectGmail({ connected, googleReady }: { connected: boolean; googleReady: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = () =>
    startTransition(async () => {
      const result = await disconnectGmail()
      if (result.success) router.refresh()
      else setError(result.error || 'Failed to disconnect')
    })

  return (
    <div>
      {connected && (
        <p className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> Gmail connected
        </p>
      )}

      <div className="flex gap-4 items-center">
        <button onClick={() => setOpen(true)} className="text-blue-600 hover:text-blue-700 font-medium">
          {connected ? 'Reconnect Gmail' : 'Connect Gmail'}
        </button>
        {connected && (
          <button
            onClick={handleDisconnect}
            disabled={pending}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Disconnect
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect your Gmail</h3>
            <p className="text-sm text-gray-600 mb-5">
              Sign in with Google and allow access to read and send emails. You can disconnect at any time.
            </p>
            {googleReady ? (
              <a
                href="/api/auth/google?mode=connect"
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Continue with Google
              </a>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Google is not configured on this server yet (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing).
              </p>
            )}
            <button onClick={() => setOpen(false)} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
