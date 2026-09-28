'use server'

import { revalidatePath } from 'next/cache'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { getCurrentSession } from '@/lib/auth/session'
import { decryptToken, encryptToken } from '@/lib/utils/encryption'
import { assertPublicHttpsUrl } from '@/lib/net/safe-url'

export interface IntegrationResult {
  success: boolean
  error?: string
  message?: string
}

const AUTH_TYPES = ['bearer', 'header', 'query', 'none'] as const
type AuthType = (typeof AUTH_TYPES)[number]
const MAX_INTEGRATIONS = 20

export async function addIntegration(input: {
  name: string
  baseUrl: string
  authType: string
  authName: string
  apiKey: string
  notes: string
}): Promise<IntegrationResult> {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Not signed in' }

  const name = input.name.trim()
  const authType = input.authType as AuthType
  const authName = input.authName.trim()
  const apiKey = input.apiKey.trim()

  if (!name || name.length > 100) return { success: false, error: 'Name is required (max 100 characters)' }
  if (!AUTH_TYPES.includes(authType)) return { success: false, error: 'Invalid authentication type' }
  if (authType !== 'none' && !apiKey) return { success: false, error: 'API key is required' }
  if ((authType === 'header' || authType === 'query') && !authName) {
    return { success: false, error: 'Header / parameter name is required' }
  }
  if (authType === 'header' && !/^[A-Za-z0-9-]+$/.test(authName)) {
    return { success: false, error: 'Header name may only contain letters, numbers and dashes' }
  }

  try {
    const url = await assertPublicHttpsUrl(input.baseUrl.trim())
    const supabase = getServiceSupabaseClient()

    const { count } = await supabase
      .from('api_integrations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', session.userId)
    if ((count ?? 0) >= MAX_INTEGRATIONS) {
      return { success: false, error: `You can add up to ${MAX_INTEGRATIONS} integrations` }
    }

    const { error } = await supabase.from('api_integrations').insert({
      user_id: session.userId,
      name,
      base_url: url.toString(),
      auth_type: authType,
      auth_name: authType === 'header' || authType === 'query' ? authName : null,
      api_key_encrypted: authType === 'none' ? null : encryptToken(apiKey),
      notes: input.notes.trim().slice(0, 500) || null,
    })
    if (error) throw error

    revalidatePath('/integrations')
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save integration' }
  }
}

export async function deleteIntegration(id: string): Promise<IntegrationResult> {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Not signed in' }

  const { error } = await getServiceSupabaseClient()
    .from('api_integrations')
    .delete()
    .eq('id', id)
    .eq('user_id', session.userId)
  if (error) return { success: false, error: 'Failed to delete integration' }

  revalidatePath('/integrations')
  return { success: true }
}

export async function testIntegration(id: string): Promise<IntegrationResult> {
  const session = await getCurrentSession()
  if (!session) return { success: false, error: 'Not signed in' }

  const supabase = getServiceSupabaseClient()
  const { data: row } = await supabase
    .from('api_integrations')
    .select('base_url, auth_type, auth_name, api_key_encrypted')
    .eq('id', id)
    .eq('user_id', session.userId)
    .maybeSingle()
  if (!row) return { success: false, error: 'Integration not found' }

  let status: string
  try {
    const url = await assertPublicHttpsUrl(row.base_url)
    const headers: Record<string, string> = { Accept: 'application/json' }
    const key = row.api_key_encrypted ? decryptToken(row.api_key_encrypted) : ''
    if (row.auth_type === 'bearer') headers.Authorization = `Bearer ${key}`
    if (row.auth_type === 'header' && row.auth_name) headers[row.auth_name] = key
    if (row.auth_type === 'query' && row.auth_name) url.searchParams.set(row.auth_name, key)

    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    })
    status = `HTTP ${response.status}`
  } catch (error) {
    status = error instanceof Error && error.name === 'TimeoutError' ? 'Timed out' : 'Connection failed'
  }

  await supabase
    .from('api_integrations')
    .update({ last_test_status: status, last_tested_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', session.userId)

  revalidatePath('/integrations')
  return { success: true, message: status }
}
