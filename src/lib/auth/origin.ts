import type { NextRequest } from 'next/server'

// Public origin of the running app (works behind Vercel's proxy)
export function getOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!host) return request.nextUrl.origin
  const proto = request.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export function getGoogleRedirectUri(request: NextRequest): string {
  return `${getOrigin(request)}/api/auth/google/callback`
}
