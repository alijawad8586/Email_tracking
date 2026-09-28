'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addIntegration, deleteIntegration, testIntegration } from '@/server/actions/integrations'

export interface IntegrationRow {
  id: string
  name: string
  base_url: string
  auth_type: string
  auth_name: string | null
  notes: string | null
  last_test_status: string | null
  last_tested_at: string | null
}

const EMPTY = { name: '', baseUrl: '', authType: 'bearer', authName: '', apiKey: '', notes: '' }

const inputClass =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:border-blue-500'

export default function IntegrationsManager({ integrations }: { integrations: IntegrationRow[] }) {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const result = await addIntegration(form)
      if (result.success) {
        setForm(EMPTY)
        setNotice('Integration saved. Your API key is stored encrypted.')
        router.refresh()
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  const runAction = (id: string, action: 'test' | 'delete') => {
    setError(null)
    setNotice(null)
    setBusyId(id)
    startTransition(async () => {
      const result = action === 'test' ? await testIntegration(id) : await deleteIntegration(id)
      if (!result.success) setError(result.error || 'Action failed')
      else if (result.message) setNotice(`Test result: ${result.message}`)
      setBusyId(null)
      router.refresh()
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg shadow p-6 space-y-4 h-fit">
        <h2 className="text-lg font-semibold text-gray-900">Add an API connection</h2>

        {error && (
          <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {notice && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{notice}</div>}

        <label className="block text-sm font-medium text-gray-700">
          Name
          <input required value={form.name} onChange={set('name')} placeholder="e.g. Stripe, HubSpot, My CRM" className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Base URL (https only)
          <input required type="url" value={form.baseUrl} onChange={set('baseUrl')} placeholder="https://api.example.com/v1" className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Authentication
          <select value={form.authType} onChange={set('authType')} className={`${inputClass} mt-1`}>
            <option value="bearer">Bearer token (Authorization header)</option>
            <option value="header">Custom header (e.g. X-API-Key)</option>
            <option value="query">Query parameter (e.g. ?api_key=)</option>
            <option value="none">No authentication</option>
          </select>
        </label>
        {(form.authType === 'header' || form.authType === 'query') && (
          <label className="block text-sm font-medium text-gray-700">
            {form.authType === 'header' ? 'Header name' : 'Parameter name'}
            <input required value={form.authName} onChange={set('authName')} placeholder={form.authType === 'header' ? 'X-API-Key' : 'api_key'} className={`${inputClass} mt-1`} />
          </label>
        )}
        {form.authType !== 'none' && (
          <label className="block text-sm font-medium text-gray-700">
            API key
            <input required type="password" autoComplete="off" value={form.apiKey} onChange={set('apiKey')} placeholder="Paste your API key" className={`${inputClass} mt-1`} />
          </label>
        )}
        <label className="block text-sm font-medium text-gray-700">
          Notes (optional)
          <textarea value={form.notes} onChange={set('notes')} rows={2} maxLength={500} className={`${inputClass} mt-1`} />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {pending && !busyId ? 'Saving...' : 'Save integration'}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your connections ({integrations.length})</h2>
        {integrations.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center border-2 border-dashed border-gray-300 text-gray-500">
            No API connections yet.
          </div>
        )}
        {integrations.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{item.name}</p>
                <p className="text-sm text-gray-600 break-all">{item.base_url}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Auth: {item.auth_type}
                  {item.auth_name ? ` (${item.auth_name})` : ''} · Key saved
                </p>
                {item.notes && <p className="text-sm text-gray-600 mt-2">{item.notes}</p>}
                {item.last_test_status && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last test: {item.last_test_status}
                    {item.last_tested_at ? ` · ${new Date(item.last_tested_at).toLocaleString()}` : ''}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0 text-sm">
                <button
                  onClick={() => runAction(item.id, 'test')}
                  disabled={pending}
                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                >
                  {busyId === item.id && pending ? 'Working...' : 'Test'}
                </button>
                <button
                  onClick={() => window.confirm(`Delete "${item.name}"?`) && runAction(item.id, 'delete')}
                  disabled={pending}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
