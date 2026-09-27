import { OAuth2Client } from 'google-auth-library'
import { getServiceSupabaseClient } from '@/lib/db/client'
import { encryptToken } from '@/lib/utils/encryption'

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  throw new Error('Google OAuth environment variables not configured')
}

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
]

/**
 * Generate Google OAuth authorization URL
 */
export function generateAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent',
  })
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    }
  } catch (error) {
    console.error('Error exchanging auth code:', error)
    throw new Error('Failed to exchange authorization code')
  }
}

/**
 * Get user info from Google
 */
export async function getGoogleUserInfo(accessToken: string) {
  try {
    oauth2Client.setCredentials({
      access_token: accessToken,
    })

    const response = await oauth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
    })

    const userInfo = response.data as {
      id: string
      email: string
      name?: string
      picture?: string
    }

    return {
      googleId: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || null,
      picture: userInfo.picture || null,
    }
  } catch (error) {
    console.error('Error getting Google user info:', error)
    throw new Error('Failed to get user info from Google')
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    })

    const { credentials } = await oauth2Client.refreshAccessToken()

    return {
      accessToken: credentials.access_token!,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    throw new Error('Failed to refresh access token')
  }
}

/**
 * Handle OAuth callback and create user in database
 */
export async function handleGoogleCallback(code: string, userId: string) {
  const supabase = getServiceSupabaseClient()

  try {
    // Exchange code for tokens
    const { accessToken, refreshToken, expiresAt } = await exchangeAuthCode(code)

    // Get user info
    const userInfo = await getGoogleUserInfo(accessToken)

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(accessToken)
    const encryptedRefreshToken = refreshToken ? encryptToken(refreshToken) : null

    // Create or update user profile
    const { error: upsertError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          google_id: userInfo.googleId,
          email: userInfo.email,
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          gmail_access_token_encrypted: encryptedAccessToken,
          gmail_refresh_token_encrypted: encryptedRefreshToken,
          gmail_token_expires_at: expiresAt,
          gmail_connected: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
        }
      )

    if (upsertError) {
      throw upsertError
    }

    return {
      success: true,
      email: userInfo.email,
      accessToken,
    }
  } catch (error) {
    console.error('Error handling Google callback:', error)
    throw error
  }
}
