import { OAuth2Client } from 'google-auth-library'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { encryptToken } from '@/lib/utils/encryption'

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
]

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
}

function getClient(redirectUri?: string): OAuth2Client {
  if (!isGoogleConfigured()) {
    throw new Error('Google sign-in is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing)')
  }
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, redirectUri)
}

export function generateAuthUrl(redirectUri: string, state: string): string {
  return getClient(redirectUri).generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
    state,
  })
}

export async function exchangeAuthCode(code: string, redirectUri: string) {
  const { tokens } = await getClient(redirectUri).getToken(code)
  if (!tokens.access_token) {
    throw new Error('No access token received from Google')
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  }
}

export async function getGoogleUserInfo(accessToken: string) {
  const client = getClient()
  client.setCredentials({ access_token: accessToken })
  const response = await client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' })
  const info = response.data as {
    id: string
    email: string
    verified_email?: boolean
    name?: string
    picture?: string
  }
  return {
    googleId: info.id,
    email: info.email,
    emailVerified: info.verified_email === true,
    name: info.name || null,
    picture: info.picture || null,
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const client = getClient()
  client.setCredentials({ refresh_token: refreshToken })
  const { credentials } = await client.refreshAccessToken()
  return {
    accessToken: credentials.access_token!,
    expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
  }
}

export async function storeGmailTokens(
  userId: string,
  tokens: { accessToken: string; refreshToken: string | null; expiresAt: Date | null }
) {
  const update: Record<string, unknown> = {
    gmail_access_token_encrypted: encryptToken(tokens.accessToken),
    gmail_token_expires_at: tokens.expiresAt?.toISOString() ?? null,
    gmail_connected: true,
    updated_at: new Date().toISOString(),
  }
  if (tokens.refreshToken) {
    update.gmail_refresh_token_encrypted = encryptToken(tokens.refreshToken)
  }

  const { error } = await getServiceSupabaseClient().from('user_profiles').update(update).eq('id', userId)
  if (error) throw error
}
